import { Component, Suspense, useEffect, useRef, useState } from 'react'
import type { ErrorInfo, ReactNode, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { loadArduino } from './loadArduino'
import { PARTS } from '../data/parts'
import type { PartConfig } from '../data/parts'
import { idleIntensity, partProgress, positionAt } from '../lib/assembly'
import type { Vec3 } from '../lib/assembly'

export type InteractionMode = 'move' | 'rotate'
export type ArduinoModel = Awaited<ReturnType<typeof loadArduino>>

type SceneProps = {
  progress: RefObject<number>
  selected: string | null
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onReady: (configs: readonly PartConfig[]) => void
  mode: InteractionMode
  resetToken: number
  reducedMotion: boolean
}

function World(props: SceneProps) {
  const { camera, gl, size, invalidate } = useThree()
  const [model, setModel] = useState<ArduinoModel | null>(null)
  const [loadingError, setLoadingError] = useState<Error | null>(null)
  const rig = useRef<THREE.Group>(null)
  const latest = useRef(props)
  latest.current = props
  const offsets = useRef(new Map<string, Vec3>())
  const rotation = useRef({ x: 0, y: 0 })
  const cursor = useRef({ x: 0, y: 0 })
  const active = useRef<{ id: string | null; startX: number; startY: number; anchor: THREE.Vector3; offset: Vec3; rotation: { x: number; y: number }; pointerId: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    let loaded: ArduinoModel | undefined
    loadArduino().then((value) => {
      if (cancelled) { value.dispose(); return }
      loaded = value
      setModel(value)
      latest.current.onReady(value.configs ?? PARTS)
    }).catch((error: unknown) => setLoadingError(error instanceof Error ? error : new Error('The board could not load.')))
    return () => { cancelled = true; loaded?.dispose() }
  }, [])

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return
    camera.position.set(7.5, 11.8, 14)
    camera.lookAt(0, 1.0, 0)
    camera.zoom = Math.min(size.width / 16.8, size.height / 12.8)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, size, invalidate])

  useEffect(() => {
    offsets.current.clear()
    rotation.current = { x: 0, y: 0 }
    active.current = null
  }, [props.resetToken])

  useEffect(() => {
    if (!model) return
    const canvas = gl.domElement
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const plane = new THREE.Plane()
    const normal = new THREE.Vector3()
    const hit = new THREE.Vector3()
    const setupRay = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      cursor.current = { x: pointer.x, y: pointer.y }
    }
    const findPart = () => {
      model.root.updateMatrixWorld(true)
      const hits = raycaster.intersectObject(model.root, true)
      for (const intersect of hits) {
        let object: THREE.Object3D | null = intersect.object
        while (object && !object.userData.partId) object = object.parent
        if (object?.userData.partId) return { id: object.userData.partId as string, point: intersect.point }
      }
      return null
    }
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || active.current) return
      setupRay(event)
      const part = findPart()
      const canMove = latest.current.mode === 'move' && latest.current.progress.current < 0.15 && part && part.id !== 'pcb'
      if (part) latest.current.onSelect(part.id)
      camera.getWorldDirection(normal)
      plane.setFromNormalAndCoplanarPoint(normal, part?.point ?? new THREE.Vector3())
      raycaster.ray.intersectPlane(plane, hit)
      const localHit = rig.current!.worldToLocal(hit.clone())
      active.current = {
        id: canMove ? part.id : null,
        startX: event.clientX, startY: event.clientY,
        anchor: localHit,
        offset: canMove ? [...(offsets.current.get(part.id) ?? [0, 0, 0])] as Vec3 : [0, 0, 0],
        rotation: { ...rotation.current }, pointerId: event.pointerId,
      }
      canvas.setPointerCapture(event.pointerId)
      canvas.style.cursor = 'grabbing'
    }
    const move = (event: PointerEvent) => {
      setupRay(event)
      const drag = active.current
      if (drag && drag.pointerId === event.pointerId) {
        if (drag.id && latest.current.progress.current < 0.15) {
          if (raycaster.ray.intersectPlane(plane, hit)) {
            const local = rig.current!.worldToLocal(hit)
            offsets.current.set(drag.id, [
              THREE.MathUtils.clamp(drag.offset[0] + local.x - drag.anchor.x, -2.5, 2.5),
              THREE.MathUtils.clamp(drag.offset[1] + local.y - drag.anchor.y, -1.4, 2),
              THREE.MathUtils.clamp(drag.offset[2] + local.z - drag.anchor.z, -2.5, 2.5),
            ])
          }
        } else if (!drag.id) {
          rotation.current.y = THREE.MathUtils.clamp(drag.rotation.y + (event.clientX - drag.startX) * 0.004, -0.36, 0.36)
          rotation.current.x = THREE.MathUtils.clamp(drag.rotation.x + (event.clientY - drag.startY) * 0.003, -0.17, 0.17)
        }
      } else if (event.pointerType !== 'touch') {
        const part = findPart()
        latest.current.onHover(part?.id ?? null)
        canvas.style.cursor = part ? 'grab' : 'default'
      }
      invalidate()
    }
    const up = (event: PointerEvent) => {
      if (active.current?.pointerId !== event.pointerId) return
      active.current = null
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      canvas.style.cursor = 'grab'
    }
    const leave = () => { latest.current.onHover(null); cursor.current = { x: 0, y: 0 } }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('lostpointercapture', up)
    canvas.addEventListener('pointerleave', leave)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('lostpointercapture', up)
      canvas.removeEventListener('pointerleave', leave)
    }
  }, [model, camera, gl, invalidate])

  const explodedQuaternion = useRef(new THREE.Quaternion())
  const identityQuaternion = useRef(new THREE.Quaternion())
  const explodedEuler = useRef(new THREE.Euler())

  useFrame(({ clock }, delta) => {
    if (!model || !rig.current) return
    const p = latest.current.progress.current
    const reduced = latest.current.reducedMotion
    const configs = model.configs ?? PARTS
    const blend = reduced ? 1 : 1 - Math.exp(-delta * 12)
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, rotation.current.x, blend)
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, rotation.current.y, blend)
    rig.current.position.x = reduced ? 0 : THREE.MathUtils.lerp(rig.current.position.x, cursor.current.x * 0.035, blend)
    for (let index = 0; index < model.parts.length; index++) {
      const part = model.parts[index]
      const config = configs.find((item) => item.id === part.id)
      if (!config || part.id === 'pcb') continue
      const position = positionAt(p, config.range, config.exploded, config.assembled, offsets.current.get(part.id))
      if (!reduced && active.current?.id !== part.id) {
        position[1] += Math.sin(clock.elapsedTime * 0.7 + index * 1.7) * 0.025 * idleIntensity(p)
      }
      if (latest.current.selected === part.id && p < 0.5) position[1] += 0.08 * (1 - p * 2)
      part.object.position.set(...position)
      explodedEuler.current.set(...(config.rotation ?? [0, 0, 0]))
      explodedQuaternion.current.setFromEuler(explodedEuler.current)
      part.object.quaternion.slerpQuaternions(explodedQuaternion.current, identityQuaternion.current, partProgress(p, config.range))
    }
    // Inspectable state for browser checks and future performance tuning.
    gl.domElement.dataset.progress = p.toFixed(4)
    gl.domElement.dataset.partCount = String(model.parts.length)
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls)
    gl.domElement.dataset.triangles = String(gl.info.render.triangles)
    gl.domElement.dataset.rotation = `${rig.current.rotation.x.toFixed(3)},${rig.current.rotation.y.toFixed(3)}`
    gl.domElement.dataset.draggedParts = String(offsets.current.size)
  })

  if (loadingError) throw loadingError
  return <>
    <ambientLight intensity={0.6} />
    <directionalLight position={[2, 10, 4]} intensity={2.8} color="#f4f0e4" />
    <directionalLight position={[-8, 5, -5]} intensity={2.2} color="#adcbd8" />
    <Environment resolution={128} frames={1}>
      <Lightformer position={[0, 8, -2]} scale={[12, 8, 1]} rotation-x={Math.PI / 2} intensity={2.5} color="#ffffff" />
      <Lightformer position={[-8, 3, 1]} scale={[8, 5, 1]} rotation-y={Math.PI / 2} intensity={2} color="#bacbd0" />
      <Lightformer position={[6, 3, 4]} scale={[5, 8, 1]} rotation-y={-Math.PI / 3} intensity={1.6} color="#fff7e5" />
    </Environment>
    <group ref={rig}>
      {model && <primitive object={model.root} />}
    </group>
  </>
}

function SceneFallback() {
  return <div className="scene-fallback" role="status"><span className="eyebrow">3D VIEW UNAVAILABLE</span><h2>Every part has a purpose.</h2><p>This browser could not start the 3D view. You can still explore all components and specifications below.</p><a href="#architecture">Explore the components <span aria-hidden="true">↗</span></a></div>
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Arduino scene unavailable', error.message, info.componentStack) }
  render() { return this.state.failed ? <SceneFallback /> : this.props.children }
}

export default function ArduinoScene(props: SceneProps) {
  const [contextLost, setContextLost] = useState(false)
  if (contextLost) return <SceneFallback />
  return <SceneBoundary>
    <Canvas
      orthographic
      camera={{ position: [7.5, 11.8, 14], zoom: 45, near: 0.1, far: 100 }}
      dpr={[1, Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75)]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      fallback={<SceneFallback />}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute('aria-label', 'Interactive Arduino UNO R4 WiFi. Drag a component to move it, or drag the background to rotate. Use the controls outside this view for keyboard access.')
        gl.domElement.setAttribute('role', 'img')
        gl.domElement.addEventListener('webglcontextlost', () => setContextLost(true), { once: true })
      }}
    >
      <Suspense fallback={null}><World {...props} /></Suspense>
    </Canvas>
  </SceneBoundary>
}

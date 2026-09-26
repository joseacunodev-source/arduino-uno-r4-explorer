import { memo, Suspense, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { SceneBoundary, SceneFallback } from '../components/SceneBoundary'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { loadArduino } from './loadArduino'
import { PARTS } from '../data/parts'
import type { PartConfig } from '../data/parts'
import { partProgress, positionAt } from '../lib/assembly'
import type { Vec3 } from '../lib/assembly'

export type InteractionMode = 'move' | 'rotate'
export type ArduinoModel = Awaited<ReturnType<typeof loadArduino>>

const portraitView = (width: number, height: number) => width < 640 && height > width * 1.15
const fitZoom = (width: number, height: number) => portraitView(width, height)
  ? Math.min(width / 9.5, height / 14)
  : Math.min(width / 13.8, height / 11.4)

type SceneProps = {
  progress: RefObject<number>
  selected: string | null
  focused: string | null
  focusToken: number
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onError: () => void
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
  const marker = useRef<THREE.Group>(null)
  const bounds = useRef(new Map<string, THREE.Box3>())
  const focusOffset = useRef(new THREE.Vector3())
  const desiredPan = useRef(new THREE.Vector3())
  const latest = useRef(props)
  latest.current = props
  // Render on input and while transitions settle, then let the GPU rest.
  useEffect(() => { invalidate() })
  const offsets = useRef(new Map<string, Vec3>())
  const velocities = useRef(new Map<string, THREE.Vector3>())
  const zoomFactor = useRef(1)
  const pan = useRef(new THREE.Vector3())
  const renderedProgress = useRef(0)
  const rotation = useRef({ x: 0, y: 0 })
  const cursor = useRef({ x: 0, y: 0 })
  const active = useRef<{ id: string | null; startX: number; startY: number; anchor: THREE.Vector3; offset: Vec3; rotation: { x: number; y: number }; pointerId: number; button: number; time: number; pan: THREE.Vector3; zoom: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    let loaded: ArduinoModel | undefined
    loadArduino().then((value) => {
      if (cancelled) { value.dispose(); return }
      loaded = value
      value.root.updateMatrixWorld(true)
      for (const part of value.parts) bounds.current.set(part.id, new THREE.Box3().setFromObject(part.object).translate(part.object.position.clone().negate()))
      setModel(value)
      latest.current.onReady(value.configs ?? PARTS)
    }).catch((error: unknown) => setLoadingError(error instanceof Error ? error : new Error('The board could not load.')))
    return () => { cancelled = true; loaded?.dispose() }
  }, [])

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return
    camera.position.set(7.5, 11.8, 14)
    camera.lookAt(0, 1.0, 0)
    if (portraitView(size.width, size.height)) camera.rotateZ(Math.PI / 2)
    camera.zoom = fitZoom(size.width, size.height)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, size, invalidate])

  useEffect(() => {
    offsets.current.clear()
    rotation.current = { x: 0, y: 0 }
    velocities.current.clear()
    pan.current.set(0, 0, 0)
    zoomFactor.current = 1
    active.current = null
  }, [props.resetToken])

  useEffect(() => {
    pan.current.set(0, 0, 0)
    if (props.focused) {
      rotation.current = { x: 0, y: 0 }
      const extent = bounds.current.get(props.focused)?.getSize(new THREE.Vector3())
      zoomFactor.current = extent ? THREE.MathUtils.clamp(5 / Math.max(extent.x, extent.y, extent.z), 1.25, 4.5) : 2
    } else zoomFactor.current = 1
    if (!model) return
    for (const part of model.parts) part.object.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        if (material.userData.originalDepthWrite === undefined) material.userData.originalDepthWrite = material.depthWrite
        const ghost = !!props.focused && part.id !== props.focused
        material.transparent = ghost
        material.opacity = ghost ? 0.035 : 1
        material.depthWrite = ghost ? false : material.userData.originalDepthWrite
        material.needsUpdate = true
      }
    })
  }, [props.focused, props.focusToken, model])

  useEffect(() => {
    if (!model) return
    const canvas = gl.domElement
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const plane = new THREE.Plane()
    const normal = new THREE.Vector3()
    const hit = new THREE.Vector3()
    const touches = new Map<number, { x: number; y: number }>()
    let pinch: { distance: number; zoom: number } | null = null
    const touchDistance = () => {
      const [a, b] = [...touches.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }
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
        if (latest.current.focused && object?.userData.partId !== latest.current.focused) continue
        if (object?.userData.partId) return { id: object.userData.partId as string, point: intersect.point }
      }
      return null
    }
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY })
        if (touches.size >= 2) {
          event.preventDefault()
          if (active.current?.id) velocities.current.delete(active.current.id)
          active.current = null
          pinch = { distance: Math.max(1, touchDistance()), zoom: zoomFactor.current }
          canvas.setPointerCapture(event.pointerId)
          return
        }
      }
      if (event.button > 2 || active.current) return
      event.preventDefault()
      setupRay(event)
      const part = findPart()
      const canMove = event.button === 0 && !latest.current.focused && latest.current.mode === 'move' && latest.current.progress.current < 0.15 && part && part.id !== 'pcb'
      if (part && event.button === 0) latest.current.onSelect(part.id)
      camera.getWorldDirection(normal)
      plane.setFromNormalAndCoplanarPoint(normal, part?.point ?? new THREE.Vector3())
      raycaster.ray.intersectPlane(plane, hit)
      const localHit = rig.current!.worldToLocal(hit.clone())
      active.current = {
        id: canMove ? part.id : null,
        startX: event.clientX, startY: event.clientY,
        anchor: localHit,
        offset: canMove ? [...(offsets.current.get(part.id) ?? [0, 0, 0])] as Vec3 : [0, 0, 0],
        rotation: { ...rotation.current }, pointerId: event.pointerId, button: event.button, time: performance.now(), pan: pan.current.clone(), zoom: zoomFactor.current,
      }
      if (canMove) velocities.current.delete(part.id)
      canvas.setPointerCapture(event.pointerId)
      canvas.style.cursor = event.button === 2 ? 'ns-resize' : 'grabbing'
      invalidate()
    }
    const move = (event: PointerEvent) => {
      if (touches.has(event.pointerId)) touches.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pinch && touches.size >= 2) {
        zoomFactor.current = THREE.MathUtils.clamp(pinch.zoom * touchDistance() / pinch.distance, 0.55, 5)
        invalidate()
        return
      }
      setupRay(event)
      const drag = active.current
      if (drag && drag.pointerId === event.pointerId) {
        if (drag.id && latest.current.progress.current < 0.15) {
          if (raycaster.ray.intersectPlane(plane, hit)) {
            const local = rig.current!.worldToLocal(hit)
            const previous = offsets.current.get(drag.id) ?? drag.offset
            const next: Vec3 = [
              THREE.MathUtils.clamp(drag.offset[0] + local.x - drag.anchor.x, -3.5, 3.5),
              THREE.MathUtils.clamp(drag.offset[1] + local.y - drag.anchor.y, -2.5, 3),
              THREE.MathUtils.clamp(drag.offset[2] + local.z - drag.anchor.z, -3.5, 3.5),
            ]
            const now = performance.now()
            const dt = Math.max((now - drag.time) / 1000, 0.008)
            velocities.current.set(drag.id, new THREE.Vector3(...next).sub(new THREE.Vector3(...previous)).divideScalar(dt).clampLength(0, 12))
            offsets.current.set(drag.id, next)
            drag.time = now
          }
        } else if (drag.button === 2) {
          zoomFactor.current = THREE.MathUtils.clamp(drag.zoom * Math.exp((drag.startY - event.clientY) * 0.006), 0.55, 5)
        } else if (drag.button === 1) {
          const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
          const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
          const scale = camera instanceof THREE.OrthographicCamera ? camera.zoom : 80
          pan.current.copy(drag.pan).addScaledVector(right, (event.clientX - drag.startX) / scale).addScaledVector(up, -(event.clientY - drag.startY) / scale)
          pan.current.clampLength(0, 5)
        } else if (!drag.id) {
          rotation.current.y = drag.rotation.y + (event.clientX - drag.startX) * 0.006
          rotation.current.x = drag.rotation.x + (event.clientY - drag.startY) * 0.005
        }
      } else if (event.pointerType !== 'touch') {
        const part = findPart()
        latest.current.onHover(part?.id ?? null)
        canvas.style.cursor = part ? 'grab' : 'default'
      }
      invalidate()
    }
    const up = (event: PointerEvent) => {
      touches.delete(event.pointerId)
      if (pinch) {
        pinch = null
        active.current = null
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      }
      if (active.current?.pointerId !== event.pointerId) return
      if (active.current.id && (event.type !== 'pointerup' || performance.now() - active.current.time > 100)) velocities.current.delete(active.current.id)
      active.current = null
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      canvas.style.cursor = 'grab'
      invalidate()
    }
    const leave = () => { latest.current.onHover(null); cursor.current = { x: 0, y: 0 } }
    const context = (e: Event) => e.preventDefault()
    const wheel = (e: WheelEvent) => {
      if (!e.shiftKey) return
      e.preventDefault()
      zoomFactor.current = THREE.MathUtils.clamp(zoomFactor.current * Math.exp(-e.deltaY * 0.0015), 0.55, 5)
      invalidate()
    }
    const cameraControl = (event: Event) => {
      const action = (event as CustomEvent<string>).detail
      if (action === 'left') rotation.current.y -= 0.25
      if (action === 'right') rotation.current.y += 0.25
      if (action === 'up') rotation.current.x -= 0.2
      if (action === 'down') rotation.current.x += 0.2
      if (action === 'bottom') { rotation.current.x = Math.PI; rotation.current.y = Math.PI }
      if (action === 'in') zoomFactor.current = Math.min(5, zoomFactor.current * 1.15)
      if (action === 'out') zoomFactor.current = Math.max(0.55, zoomFactor.current / 1.15)
      invalidate()
    }
    window.addEventListener('board-camera', cameraControl)
    canvas.addEventListener('contextmenu', context)
    canvas.addEventListener('wheel', wheel, { passive: false })
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('lostpointercapture', up)
    canvas.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('board-camera', cameraControl)
      canvas.removeEventListener('contextmenu', context)
      canvas.removeEventListener('wheel', wheel)
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

  useFrame((_, elapsed) => {
    if (!model || !rig.current) return
    const delta = Math.min(elapsed, 0.5)
    const target = latest.current.progress.current
    renderedProgress.current = latest.current.reducedMotion ? target : THREE.MathUtils.damp(renderedProgress.current, target, 9, delta)
    if (Math.abs(renderedProgress.current - target) < 0.00005) renderedProgress.current = target
    const p = renderedProgress.current
    const reduced = latest.current.reducedMotion
    const configs = model.configs ?? PARTS
    const blend = reduced ? 1 : 1 - Math.exp(-delta * 12)
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, rotation.current.x, blend)
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, rotation.current.y, blend)
    if (Math.abs(rig.current.rotation.x - rotation.current.x) < 0.00001) rig.current.rotation.x = rotation.current.x
    if (Math.abs(rig.current.rotation.y - rotation.current.y) < 0.00001) rig.current.rotation.y = rotation.current.y
    const focusPart = model.parts.find(part => part.id === latest.current.focused)
    focusOffset.current.set(0,0,0)
    if (focusPart) {
      const box = bounds.current.get(focusPart.id)
      const center = box?.getCenter(new THREE.Vector3()) ?? new THREE.Vector3()
      center.applyQuaternion(focusPart.object.quaternion).add(focusPart.object.position)
      focusOffset.current.copy(center).applyEuler(rig.current.rotation).negate().add(new THREE.Vector3(0,1,0))
      if (marker.current) {
        marker.current.position.copy(focusPart.object.position).add(new THREE.Vector3(0,(box?.max.y ?? 0.2)+0.22,0))
        marker.current.visible = true
      }
    } else if (marker.current) marker.current.visible = false
    desiredPan.current.copy(pan.current).add(focusOffset.current)
    rig.current.position.lerp(desiredPan.current, blend)
    if (rig.current.position.distanceToSquared(desiredPan.current) < 0.00000001) rig.current.position.copy(desiredPan.current)
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, fitZoom(size.width, size.height) * zoomFactor.current, blend)
      camera.updateProjectionMatrix()
      gl.domElement.dataset.zoom = zoomFactor.current.toFixed(3)
    }
    for (const [id, velocity] of velocities.current) {
      if (active.current?.id === id) continue
      if (p > 0.15 || reduced) { velocities.current.delete(id); continue }
      const offset = offsets.current.get(id)
      if (!offset) continue
      const dt = Math.min(delta, 0.04)
      for (let axis = 0; axis < 3; axis++) {
        offset[axis] += velocity.getComponent(axis) * dt
        const limit = axis === 1 ? 3 : 3.5
        if (Math.abs(offset[axis]) > limit) {
          offset[axis] = Math.sign(offset[axis]) * limit
          velocity.setComponent(axis, -velocity.getComponent(axis) * 0.35)
        }
      }
      velocity.multiplyScalar(Math.exp(-2.5 * dt))
      if (velocity.lengthSq() < 0.0001) velocities.current.delete(id)
    }
    for (let index = 0; index < model.parts.length; index++) {
      const part = model.parts[index]
      const config = configs.find((item) => item.id === part.id)
      if (!config || part.id === 'pcb') continue
      const position = positionAt(p, config.range, config.exploded, config.assembled, offsets.current.get(part.id))
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
    gl.domElement.dataset.focusedPart = latest.current.focused ?? ''
    gl.domElement.dataset.textureReady = 'true'
    gl.domElement.dataset.draggedParts = String(offsets.current.size)
    const selectedPart = model.parts.find(part => part.id === latest.current.selected)
    gl.domElement.dataset.selectedPosition = selectedPart?.object.position.toArray().map(v => v.toFixed(3)).join(',') ?? ''
    gl.domElement.dataset.pan = rig.current.position.toArray().map(v => v.toFixed(3)).join(',')
    const settling = Math.abs(p - target) > 0.00001
      || Math.abs(rig.current.rotation.x - rotation.current.x) > 0.00001
      || Math.abs(rig.current.rotation.y - rotation.current.y) > 0.00001
      || rig.current.position.distanceToSquared(desiredPan.current) > 0.00000001
      || (camera instanceof THREE.OrthographicCamera && Math.abs(camera.zoom - fitZoom(size.width, size.height) * zoomFactor.current) > 0.001)
    gl.domElement.dataset.renderFrame = String(gl.info.render.frame)
    if (settling || velocities.current.size || active.current) invalidate()
  })

  if (loadingError) throw loadingError
  return <>
    <StudioLights />
    <group ref={rig}>
      {model && <primitive object={model.root} />}
      <group ref={marker} visible={false}><mesh renderOrder={20}><sphereGeometry args={[0.022,12,8]} /><meshBasicMaterial color="#d65332" depthTest={false} depthWrite={false} /></mesh></group>
    </group>
  </>
}

// Keep the environment capture stable when assembly/UI state changes.
const StudioLights = memo(function StudioLights() {
  return <>
    <ambientLight intensity={0.75} />
    <directionalLight position={[2, 10, 4]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-normalBias={0.015} color="#f4f0e4" />
    <directionalLight position={[-8, 5, -5]} intensity={0.55} color="#f4f5f0" />
    <Environment resolution={256} frames={1}>
      <Lightformer position={[0, 8, -2]} scale={[12, 8, 1]} rotation-x={Math.PI / 2} intensity={1.3} color="#ffffff" />
      <Lightformer position={[-8, 3, 1]} scale={[8, 5, 1]} rotation-y={Math.PI / 2} intensity={0.8} color="#ffffff" />
      <Lightformer position={[6, 3, 4]} scale={[5, 8, 1]} rotation-y={-Math.PI / 3} intensity={0.9} color="#f9f7ef" />
    </Environment>
  </>
})

export default function ArduinoScene(props: SceneProps) {
  const [contextLost, setContextLost] = useState(false)
  if (contextLost) return <SceneFallback onError={props.onError} />
  return <SceneBoundary onError={props.onError}>
    <Canvas
      frameloop="demand"
      shadows
      orthographic
      camera={{ position: [7.5, 11.8, 14], zoom: 45, near: 0.1, far: 100 }}
      dpr={[1, Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75)]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      fallback={<p>3D requires a browser with canvas support. Open Details to read about the board.</p>}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute('aria-label', 'Interactive Arduino UNO R4 WiFi. Left-drag a component to move it, left-drag empty space to orbit, and right-drag up or down to zoom. Use the controls outside this view for keyboard access.')
        gl.domElement.setAttribute('role', 'img')
        gl.domElement.addEventListener('webglcontextlost', () => setContextLost(true), { once: true })
      }}
    >
      <Suspense fallback={null}><World {...props} /></Suspense>
    </Canvas>
  </SceneBoundary>
}

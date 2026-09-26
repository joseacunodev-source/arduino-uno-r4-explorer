import * as THREE from 'three'

/** Subtle manufacturing finishes over the original, unmodified CAD surfaces. */
export function finishMaterials(root: THREE.Object3D) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const pixels = ctx.createImageData(256, 256)
  let seed = 43
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (1664525 * seed + 1013904223) >>> 0
    const value = 120 + (seed % 32)
    pixels.data.set([value, value, value, 255], i)
  }
  ctx.putImageData(pixels, 0, 0)
  const grain = new THREE.CanvasTexture(canvas)
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  grain.repeat.set(7, 7)
  grain.anisotropy = 8
  const replacements = new Map<string, THREE.MeshPhysicalMaterial>()
  const originals = new Set<THREE.Material>()
  root.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return
    const geometry = child.geometry as THREE.BufferGeometry
    const positions = geometry.getAttribute('position')
    if (!geometry.getAttribute('uv')) {
      const uv = new Float32Array(positions.count * 2)
      for (let i = 0; i < positions.count; i++) {
        uv[i * 2] = positions.getX(i) + positions.getY(i) * 0.3
        uv[i * 2 + 1] = positions.getZ(i) + positions.getY(i) * 0.7
      }
      geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    }
    const replace = (original: THREE.Material) => {
      if (!(original instanceof THREE.MeshStandardMaterial)) return original
      const id = child.userData.partId as string
      const key = `${original.uuid}:${id}`
      if (replacements.has(key)) return replacements.get(key)!
      const pcb = original.name.includes('solder')
      const shield = id === 'esp32' && original.color.r > 0.15
      const metal = original.name.includes('metal') || shield
      const led = id === 'led-matrix' || id === 'status-leds'
      const polymer = !metal && ['barrel-jack', 'ra4m1', 'esp32', 'regulator-5v', 'regulator-3v3', 'voltage-translator', 'qwiic', 'spi', 'esp-header'].includes(id)
      const material = new THREE.MeshPhysicalMaterial({
        name: original.name,
        color: led ? (metal ? '#b7b2a7' : '#d9d6ca') : pcb ? '#005763' : shield ? '#bfc4c8' : polymer ? '#14191c' : original.color,
        metalness: pcb ? 0.18 : metal ? 0.92 : 0.02,
        roughness: pcb ? 0.34 : metal ? 0.4 : 0.66,
        clearcoat: pcb ? 0.45 : 0.08,
        clearcoatRoughness: pcb ? 0.3 : 0.4,
        bumpMap: grain,
        bumpScale: pcb ? 0.0018 : metal ? 0.0006 : 0.0025,
        envMapIntensity: metal ? 0.7 : 0.55,
      })
      replacements.set(key, material)
      originals.add(original)
      return material
    }
    child.material = Array.isArray(child.material) ? child.material.map(replace) : replace(child.material)
    // The STEP colors classify the socket housings as metal. Separate the
    // exposed tails from the molded housing by their actual local height.
    if (['digital-a', 'digital-b', 'power-header', 'analog-header'].includes(child.userData.partId) && !Array.isArray(child.material)) {
      const housing = new THREE.MeshPhysicalMaterial({ color: '#111519', roughness: 0.62, bumpMap: grain, bumpScale: 0.002, clearcoat: 0.12 })
      const contacts = new THREE.MeshPhysicalMaterial({ color: '#b9b5a4', roughness: 0.26, metalness: 0.95 })
      const plasticIndices: number[] = [], metalIndices: number[] = []
      const index = geometry.index
      const count = index?.count ?? positions.count
      for (let i = 0; i < count; i += 3) {
        const ids = [0, 1, 2].map(n => index ? index.getX(i + n) : i + n)
        const y = ids.reduce((sum, n) => sum + positions.getY(n), 0) / 3
        ;(y < -0.27 ? metalIndices : plasticIndices).push(...ids)
      }
      geometry.setIndex([...plasticIndices, ...metalIndices])
      geometry.clearGroups()
      geometry.addGroup(0, plasticIndices.length, 0)
      geometry.addGroup(plasticIndices.length, metalIndices.length, 1)
      child.material = [housing, contacts]
    }
  })
  originals.forEach(original => original.dispose())
  // Header overrides replace some intermediate finishes before the scene uses them.
  const used = new Set<THREE.Material>()
  root.traverse(child => { if (child instanceof THREE.Mesh) (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => used.add(m)) })
  replacements.forEach(material => { if (!used.has(material)) material.dispose() })
  return () => grain.dispose()
}

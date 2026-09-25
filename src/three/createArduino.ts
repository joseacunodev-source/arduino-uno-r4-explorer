import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { PARTS, type PartConfig } from '../data/parts'

export interface ArduinoModel {
  root: THREE.Group
  parts: { id: string; object: THREE.Group }[]
  configs: PartConfig[]
  dispose: () => void
}

/** Procedural, separable prototype. Replace this factory with a named GLB later. */
export function createArduino(): ArduinoModel {
  const root = new THREE.Group()
  root.name = 'Arduino_UNO_R4_WiFi'
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  const geometryCache = new Map<string, THREE.BufferGeometry>()

  const material = (parameters: THREE.MeshStandardMaterialParameters) => {
    const value = new THREE.MeshStandardMaterial(parameters)
    materials.add(value)
    return value
  }
  const plastic = material({ color: '#191d21', roughness: 0.51, metalness: 0.08 })
  const black = material({ color: '#080b0d', roughness: 0.7 })
  const silicon = material({ color: '#25292c', roughness: 0.64, metalness: 0.14 })
  const metal = material({ color: '#c9d0d4', roughness: 0.3, metalness: 0.88 })
  const shield = material({ color: '#c8c2af', roughness: 0.37, metalness: 0.8 })
  const gold = material({ color: '#d0a651', roughness: 0.31, metalness: 0.82 })
  const solder = material({ color: '#b5c2c7', roughness: 0.39, metalness: 0.75 })
  const ceramic = material({ color: '#c3b18b', roughness: 0.62, metalness: 0.05 })
  const white = material({ color: '#e6e0cd', roughness: 0.5 })
  const pcbEdge = material({ color: '#085267', roughness: 0.53, metalness: 0.16 })
  const pcbFiber = material({ color: '#baa158', roughness: 0.71, metalness: 0.18 })
  const red = material({ color: '#eb3423', emissive: '#b91105', emissiveIntensity: 0.64, roughness: 0.35 })
  const ledOff = material({ color: '#b96043', roughness: 0.43, metalness: 0.12 })
  const green = material({ color: '#9bdb60', emissive: '#648f19', emissiveIntensity: 0.3, roughness: 0.38 })

  const remember = <T extends THREE.BufferGeometry>(value: T): T => {
    geometries.add(value)
    return value
  }
  const cached = (key: string, build: () => THREE.BufferGeometry) => {
    if (!geometryCache.has(key)) geometryCache.set(key, remember(build()))
    return geometryCache.get(key)!
  }
  const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, surface: THREE.Material, x = 0, y = 0, z = 0) => {
    const value = new THREE.Mesh(geometry, surface)
    value.position.set(x, y, z)
    value.castShadow = true
    value.receiveShadow = true
    parent.add(value)
    return value
  }
  const box = (parent: THREE.Object3D, w: number, h: number, d: number, surface: THREE.Material, x = 0, y = 0, z = 0, radius = 0) => {
    const geo = cached(`box:${w}:${h}:${d}:${radius}`, () => radius
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3))
      : new THREE.BoxGeometry(w, h, d))
    return mesh(parent, geo, surface, x, y, z)
  }
  const cylinder = (parent: THREE.Object3D, radius: number, height: number, surface: THREE.Material, x = 0, y = 0, z = 0) => {
    const geo = cached(`cylinder:${radius}:${height}`, () => new THREE.CylinderGeometry(radius, radius, height, 24))
    return mesh(parent, geo, surface, x, y, z)
  }
  const canvasTexture = (draw: (context: CanvasRenderingContext2D, size: number) => void, size = 512) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')!
    draw(context, size)
    const value = new THREE.CanvasTexture(canvas)
    value.colorSpace = THREE.SRGBColorSpace
    value.anisotropy = 4
    textures.add(value)
    return value
  }
  const label = (parent: THREE.Object3D, w: number, d: number, y: number, draw: (context: CanvasRenderingContext2D, size: number) => void, x = 0, z = 0) => {
    const surface = material({ map: canvasTexture(draw), transparent: true, roughness: 0.66, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
    const value = mesh(parent, cached(`plane:${w}:${d}`, () => new THREE.PlaneGeometry(w, d)), surface, x, y, z)
    value.rotation.x = -Math.PI / 2
    value.castShadow = false
    return value
  }
  const print = (context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color = '#d5d8d8', weight = '500') => {
    context.fillStyle = color
    context.font = `${weight} ${size}px Arial, sans-serif`
    context.fillText(text, x, y)
  }
  const smd = (parent: THREE.Object3D, x: number, z: number, length = 0.19, rotate = false, body = ceramic) => {
    const item = new THREE.Group()
    item.position.set(x, 0, z)
    if (rotate) item.rotation.y = Math.PI / 2
    parent.add(item)
    box(item, length, 0.065, 0.095, body, 0, 0.043, 0, 0.009)
    for (const end of [-1, 1]) {
      box(item, 0.044, 0.072, 0.1, solder, end * (length / 2 - 0.016), 0.039)
      box(item, 0.072, 0.022, 0.13, gold, end * (length / 2 - 0.004), 0.004)
    }
  }
  const ic = (parent: THREE.Object3D, width: number, depth: number, pinCount: number, height = 0.17) => {
    box(parent, width, height, depth, silicon, 0, 0.08 + height / 2, 0, 0.035)
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < pinCount; i++) {
        const p = (i - (pinCount - 1) / 2) * (width - 0.12) / pinCount
        const leg = new THREE.Group()
        leg.rotation.y = side * Math.PI / 2
        parent.add(leg)
        box(leg, 0.028, 0.035, 0.15, metal, p, 0.025, depth / 2 + 0.09)
        box(leg, 0.028, 0.09, 0.028, metal, p, 0.077, depth / 2 + 0.04)
        box(leg, 0.028, 0.027, 0.08, metal, p, 0.117, depth / 2 + 0.004)
      }
    }
    cylinder(parent, 0.034, 0.002, black, -width / 2 + 0.1, height + 0.081, depth / 2 - 0.1)
  }
  const header = (parent: THREE.Object3D, count: number, pitch = 0.254) => {
    const length = count * pitch + 0.045
    box(parent, length, 0.51, 0.32, plastic, 0, 0.35, 0, 0.02)
    box(parent, length + 0.018, 0.035, 0.34, silicon, 0, 0.612)
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * pitch
      // Recessed black opening framed by a raised square socket rim.
      box(parent, 0.164, 0.003, 0.164, black, x, 0.632)
      box(parent, 0.108, 0.005, 0.106, gold, x, 0.634)
      box(parent, 0.079, 0.007, 0.082, black, x, 0.638)
      for (const edge of [-1, 1]) {
        box(parent, 0.019, 0.048, 0.2, silicon, x + edge * 0.098, 0.64)
        box(parent, 0.18, 0.048, 0.019, silicon, x, 0.64, edge * 0.098)
      }
      box(parent, 0.051, 0.39, 0.051, gold, x, -0.095)
      box(parent, 0.092, 0.038, 0.092, solder, x, 0.075)
    }
  }
  const maleHeader = (parent: THREE.Object3D, cols: number, rows: number) => {
    for (let col = 0; col < cols; col++) for (let row = 0; row < rows; row++) {
      const x = (col - (cols - 1) / 2) * 0.254
      const z = (row - (rows - 1) / 2) * 0.254
      box(parent, 0.242, 0.2, 0.242, plastic, x, 0.14, z, 0.02)
      box(parent, 0.049, 0.75, 0.049, gold, x, 0.245, z)
      box(parent, 0.095, 0.028, 0.095, solder, x, 0.025, z)
    }
  }

  const groups = new Map(PARTS.map(part => {
    const object = new THREE.Group()
    object.name = part.id
    object.userData.partId = part.id
    object.position.fromArray(part.assembled)
    root.add(object)
    return [part.id, object]
  }))
  const part = (id: string) => groups.get(id)!

  // Board outline and four actual cut-through mounting holes.
  const board = new THREE.Shape()
  board.moveTo(-3.22, -2.65)
  board.lineTo(2.78, -2.65)
  board.quadraticCurveTo(2.92, -2.65, 2.92, -2.5)
  board.lineTo(2.92, -2.18)
  board.lineTo(3.4, -1.86)
  board.lineTo(3.4, 1.85)
  board.lineTo(3.02, 2.13)
  board.lineTo(3.02, 2.47)
  board.quadraticCurveTo(3.02, 2.65, 2.83, 2.65)
  board.lineTo(-3.22, 2.65)
  board.quadraticCurveTo(-3.4, 2.65, -3.4, 2.47)
  board.lineTo(-3.4, -2.47)
  board.quadraticCurveTo(-3.4, -2.65, -3.22, -2.65)
  const holes: [number, number][] = [[-2.15, -2.16], [2.98, -1.87], [2.98, 1.91], [-2.3, 2.18]]
  for (const [x, z] of holes) {
    const hole = new THREE.Path()
    hole.absarc(x, -z, 0.145, 0, Math.PI * 2, true)
    board.holes.push(hole)
  }
  const boardBody = remember(new THREE.ExtrudeGeometry(board, { depth: 0.125, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.009, bevelSegments: 1, steps: 1, curveSegments: 12 }))
  boardBody.rotateX(-Math.PI / 2)
  boardBody.translate(0, -0.125, 0)
  mesh(part('pcb'), boardBody, pcbEdge)
  const boardCore = remember(new THREE.ExtrudeGeometry(board, { depth: 0.026, bevelEnabled: false, steps: 1, curveSegments: 12 }))
  boardCore.rotateX(-Math.PI / 2)
  boardCore.translate(0, -0.1, 0)
  mesh(part('pcb'), boardCore, pcbFiber)

  const pcbTexture = canvasTexture((ctx, size) => {
    ctx.fillStyle = '#086687'
    ctx.fillRect(0, 0, size, size)
    const sx = size / 6.8
    const sz = size / 5.3
    const px = (x: number) => (x + 3.4) * sx
    const pz = (z: number) => (z + 2.65) * sz
    // Stable fine trace network: each path uses 45-degree doglegs.
    let seed = 431
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    ctx.lineCap = 'round'
    for (let i = 0; i < 165; i++) {
      const x = -3.2 + random() * 6.35
      const z = -2.43 + random() * 4.87
      const length = 0.2 + random() * 0.85
      const direction = random() > 0.5 ? 1 : -1
      ctx.strokeStyle = i % 4 === 0 ? '#2c879b' : '#12758f'
      ctx.lineWidth = i % 3 === 0 ? 2.1 : 1.3
      ctx.beginPath()
      ctx.moveTo(px(x), pz(z))
      ctx.lineTo(px(x + length * 0.35 * direction), pz(z))
      ctx.lineTo(px(x + length * 0.6 * direction), pz(z + length * 0.25))
      ctx.lineTo(px(x + length * direction), pz(z + length * 0.25))
      ctx.stroke()
      ctx.strokeStyle = '#49a1ac'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(px(x), pz(z), 3.5, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.strokeStyle = '#bddbdf'
    ctx.lineWidth = 2
    const outline = (x: number, z: number, w: number, d: number) => ctx.strokeRect(px(x - w / 2), pz(z - d / 2), w * sx, d * sz)
    outline(1.68, -1.16, 1.73, 1.64)
    outline(1.41, 0.83, 2.62, 1.73)
    outline(-1.48, 0.7, 1.79, 1.7)
    outline(-2.81, -2.18, 0.64, 0.63)
    const writing = (text: string, x: number, z: number, height = 0.108, align: CanvasTextAlign = 'left') => {
      ctx.fillStyle = '#f0f2e7'
      ctx.font = `600 ${height * sx}px Arial, sans-serif`
      ctx.textAlign = align
      ctx.fillText(text, px(x), pz(z))
    }
    writing('DIGITAL (PWM ~)', 0.9, -1.99, 0.115, 'center')
    writing('RESET', -2.81, -1.78, 0.118, 'center')
    writing('POWER', -0.3, 1.98, 0.118, 'center')
    writing('ANALOG IN', 2.02, 2.0, 0.118, 'center')
    writing('QWIIC', 3.06, 1.02, 0.07, 'center')
    writing('SPI', 3.03, -0.56, 0.08, 'center')
    writing('ON', 2.83, -1.58, 0.08)
    writing('TX', -0.55, -0.45, 0.084)
    writing('RX', -0.55, -0.15, 0.084)
    writing('OFF   GND   VRTC', -1.96, 1.99, 0.07)
    const row = (names: string[], x: number, z: number) => names.forEach((name, i) => writing(name, x + i * 0.254, z, 0.065, 'center'))
    row(['SCL', 'SDA', 'REF', 'GND', '13', '12', '11', '10', '9', '8'], -1.473, -2.12)
    row(['7', '6', '5', '4', '3', '2', 'TX', 'RX'], 1.221, -2.12)
    row(['IOREF', 'RST', '3V3', '5V', 'GND', 'GND', 'VIN', ''], -1.259, 2.17)
    row(['A0', 'A1', 'A2', 'A3', 'A4', 'A5'], 1.495, 2.17)
    // The familiar infinity mark is drawn as vector strokes on the PCB texture.
    const cx = px(-0.2), cy = pz(-1.06), rw = sx * 0.32, rh = sz * 0.15
    ctx.strokeStyle = '#f1f3e9'
    ctx.lineWidth = sx * 0.047
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.bezierCurveTo(cx - rw * 1.9, cy - rh * 2.2, cx - rw * 1.9, cy + rh * 2.2, cx, cy)
    ctx.bezierCurveTo(cx + rw * 1.9, cy - rh * 2.2, cx + rw * 1.9, cy + rh * 2.2, cx, cy)
    ctx.stroke()
    writing('−', -0.52, -1.019, 0.19, 'center')
    writing('+', 0.12, -1.019, 0.17, 'center')
    writing('ARDUINO', -0.2, -0.64, 0.2, 'center')
    ctx.fillStyle = '#e8efea'
    ctx.fillRect(px(-0.79), pz(-0.53), sx * 1.2, sz * 0.235)
    ctx.fillStyle = '#07546e'
    ctx.font = `700 ${sx * 0.155}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('UNO R4', px(-0.2), pz(-0.35))
    outline(-0.37, -0.115, 0.86, 0.23)
    writing('WIFI', -0.37, -0.054, 0.16, 'center')
    writing('ABX00087  ·  MADE IN ITALY', 0.9, 2.55, 0.055, 'center')
  }, 2048)
  const pcbTop = remember(new THREE.ShapeGeometry(board, 12))
  pcbTop.rotateX(-Math.PI / 2)
  const position = pcbTop.getAttribute('position')
  const uv = pcbTop.getAttribute('uv')
  for (let i = 0; i < position.count; i++) uv.setXY(i, (position.getX(i) + 3.4) / 6.8, (2.65 - position.getZ(i)) / 5.3)
  uv.needsUpdate = true
  mesh(part('pcb'), pcbTop, material({ map: pcbTexture, roughness: 0.59, metalness: 0.14 }), 0, 0.012)
  for (const [x, z] of holes) {
    const ring = cached('mount-ring', () => new THREE.RingGeometry(0.145, 0.205, 32))
    mesh(part('pcb'), ring, gold, x, 0.018, z).rotation.x = -Math.PI / 2
    const lining = cached('mount-lining', () => new THREE.CylinderGeometry(0.145, 0.145, 0.13, 24, 1, true))
    const inner = mesh(part('pcb'), lining, gold, x, -0.055, z)
    inner.material = gold
  }
  for (const [id, count] of [['digital-a', 10], ['digital-b', 8], ['power-header', 8], ['analog-header', 6]] as const) {
    header(part(id), count)
    const config = PARTS.find(p => p.id === id)!
    for (let i = 0; i < count; i++) {
      const x = config.assembled[0] + (i - (count - 1) / 2) * 0.254
      const z = config.assembled[2]
      mesh(part('pcb'), cached('contact-ring', () => new THREE.RingGeometry(0.036, 0.074, 12)), gold, x, 0.022, z).rotation.x = -Math.PI / 2
      cylinder(part('pcb'), 0.034, 0.007, black, x, 0.023, z)
    }
  }

  ic(part('ra4m1'), 1.27, 1.27, 16, 0.18)
  label(part('ra4m1'), 1.17, 1.17, 0.264, (ctx) => {
    print(ctx, 'RENESAS', 46, 140, 47, '#aeb3b4')
    print(ctx, 'RA4M1', 46, 205, 34, '#949b9e')
    print(ctx, 'R7FA4M1AB3CFM', 46, 258, 26, '#949b9e')
    print(ctx, 'ARM CORTEX-M4', 46, 306, 25, '#949b9e')
    print(ctx, '48 MHz', 46, 356, 28, '#949b9e')
  })
  // Contact pads remain on the board as their packages lift away.
  for (let side = 0; side < 4; side++) for (let i = 0; i < 16; i++) {
    const angle = side * Math.PI / 2
    const localX = (i - 7.5) * 1.15 / 16
    const localZ = 0.74
    const pad = box(part('pcb'), 0.037, 0.012, 0.17, solder, 1.68 + localX * Math.cos(angle) + localZ * Math.sin(angle), 0.025, -1.16 - localX * Math.sin(angle) + localZ * Math.cos(angle))
    pad.rotation.y = angle
  }

  const wifi = part('esp32')
  box(wifi, 1.65, 0.07, 1.64, silicon, 0, 0.055, 0, 0.02)
  box(wifi, 1.5, 0.2, 1.42, shield, 0, 0.192, 0.06, 0.035)
  box(wifi, 1.56, 0.035, 1.48, metal, 0, 0.092, 0.06, 0.017)
  for (let i = 0; i < 13; i++) for (const side of [-1, 1]) {
    box(wifi, 0.062, 0.054, 0.105, gold, (i - 6) * 0.115, 0.025, side * 0.825)
    box(wifi, 0.085, 0.056, 0.05, gold, side * 0.825, 0.025, (i - 6) * 0.115)
  }
  label(wifi, 1.42, 1.34, 0.295, (ctx) => {
    print(ctx, 'ESPRESSIF', 36, 84, 44, '#514c40', '600')
    print(ctx, 'ESP32-S3-MINI-1', 36, 135, 31, '#514c40')
    print(ctx, 'Wi-Fi + Bluetooth LE', 36, 183, 22, '#716b5b')
    print(ctx, 'CE', 40, 360, 64, '#514c40')
    print(ctx, 'FCC ID: 2AC7Z-ESP32S3MINI1', 36, 408, 18, '#514c40')
    print(ctx, 'IC: 21098-ESP32S3MINI1', 36, 439, 18, '#514c40')
    ctx.fillStyle = '#5d574a'
    for (let r = 0; r < 19; r++) for (let c = 0; c < 19; c++) {
      if (((r * 7 + c * 11 + r * c) % 5) < 2) ctx.fillRect(340 + c * 6, 230 + r * 6, 5, 5)
    }
  }, 0, 0.06)
  for (const x of [-0.69, 0.69]) for (const z of [-0.58, 0.69]) cylinder(wifi, 0.032, 0.008, solder, x, 0.298, z)

  // Ninety-six LED packages, three instanced draws plus one emissive draw.
  const matrix = part('led-matrix')
  const packages = new THREE.InstancedMesh(cached('led-package', () => new THREE.BoxGeometry(0.13, 0.07, 0.115)), white, 96)
  const terminals = new THREE.InstancedMesh(cached('led-terminal', () => new THREE.BoxGeometry(0.025, 0.025, 0.125)), solder, 192)
  const lenses = new THREE.InstancedMesh(cached('led-lens', () => new THREE.BoxGeometry(0.072, 0.013, 0.065)), ledOff, 96)
  const litPositions: THREE.Matrix4[] = []
  const dummy = new THREE.Object3D()
  // A quiet infinity pattern echoes the mark printed on the board.
  const pattern = ['000000000000', '001100001100', '010010010010', '100001100001', '100001100001', '010010010010', '001100001100', '000000000000']
  for (let row = 0; row < 8; row++) for (let col = 0; col < 12; col++) {
    const i = row * 12 + col
    const x = (col - 5.5) * 0.211
    const z = (row - 3.5) * 0.188
    dummy.position.set(x, 0.055, z)
    dummy.rotation.set(0, -0.38, 0)
    dummy.updateMatrix()
    packages.setMatrixAt(i, dummy.matrix)
    dummy.position.y = 0.098
    dummy.updateMatrix()
    lenses.setMatrixAt(i, dummy.matrix)
    if (pattern[row][col] === '1') litPositions.push(dummy.matrix.clone())
    for (const side of [-1, 1]) {
      dummy.position.set(x + side * 0.071 * Math.cos(-0.38), 0.028, z - side * 0.071 * Math.sin(-0.38))
      dummy.updateMatrix()
      terminals.setMatrixAt(i * 2 + (side === -1 ? 0 : 1), dummy.matrix)
    }
    for (const end of [-1, 1]) box(part('pcb'), 0.04, 0.01, 0.11, gold, 1.41 + x + end * 0.07, 0.025, 0.83 + z)
  }
  const illuminated = new THREE.InstancedMesh(cached('led-lit', () => new THREE.BoxGeometry(0.074, 0.014, 0.067)), red, litPositions.length)
  litPositions.forEach((matrixValue, index) => illuminated.setMatrixAt(index, matrixValue))
  for (const item of [packages, terminals, lenses, illuminated]) { item.castShadow = true; item.receiveShadow = true; matrix.add(item) }

  const usb = part('usb-c')
  const shellShape = new THREE.Shape()
  shellShape.moveTo(-0.33, -0.205)
  shellShape.lineTo(0.33, -0.205)
  shellShape.absarc(0.33, 0, 0.205, -Math.PI / 2, Math.PI / 2, false)
  shellShape.lineTo(-0.33, 0.205)
  shellShape.absarc(-0.33, 0, 0.205, Math.PI / 2, Math.PI * 1.5, false)
  const shellHole = new THREE.Path()
  shellHole.moveTo(-0.33, -0.163)
  shellHole.lineTo(0.33, -0.163)
  shellHole.absarc(0.33, 0, 0.163, -Math.PI / 2, Math.PI / 2, false)
  shellHole.lineTo(-0.33, 0.163)
  shellHole.absarc(-0.33, 0, 0.163, Math.PI / 2, Math.PI * 1.5, false)
  shellShape.holes.push(shellHole)
  const shellGeo = remember(new THREE.ExtrudeGeometry(shellShape, { depth: 0.77, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, steps: 1, curveSegments: 16 }))
  shellGeo.rotateY(Math.PI / 2)
  mesh(usb, shellGeo, metal, -0.42, 0.3)
  box(usb, 0.38, 0.26, 0.84, black, 0.21, 0.3, 0, 0.06)
  box(usb, 0.56, 0.048, 0.6, plastic, -0.07, 0.27, 0, 0.02)
  for (let i = 0; i < 12; i++) box(usb, 0.25, 0.008, 0.025, gold, -0.12, 0.299, (i - 5.5) * 0.042)
  for (const end of [-1, 1]) for (const x of [-0.19, 0.23]) box(usb, 0.13, 0.22, 0.04, metal, x, 0.063, end * 0.48)

  const jack = part('barrel-jack')
  box(jack, 1.13, 0.58, 0.88, plastic, 0.07, 0.35, 0, 0.075)
  const outer = cylinder(jack, 0.465, 0.72, plastic, -0.23, 0.45)
  outer.rotation.z = Math.PI / 2
  const lip = cylinder(jack, 0.482, 0.11, silicon, -0.61, 0.45)
  lip.rotation.z = Math.PI / 2
  const cavity = cylinder(jack, 0.322, 0.008, black, -0.671, 0.45)
  cavity.rotation.z = Math.PI / 2
  const innerRing = mesh(jack, cached('jack-ring', () => new THREE.RingGeometry(0.29, 0.32, 32)), metal, -0.678, 0.45)
  innerRing.rotation.y = -Math.PI / 2
  const centerPin = cylinder(jack, 0.065, 0.24, metal, -0.69, 0.45)
  centerPin.rotation.z = Math.PI / 2
  for (const z of [-0.39, 0.39]) {
    box(jack, 0.24, 0.048, 0.2, gold, 0.15, 0.003, z)
    box(jack, 0.074, 0.28, 0.075, metal, 0.15, -0.068, z)
  }

  const reset = part('reset')
  box(reset, 0.57, 0.13, 0.57, plastic, 0, 0.1, 0, 0.025)
  box(reset, 0.54, 0.052, 0.54, metal, 0, 0.192, 0, 0.024)
  cylinder(reset, 0.17, 0.11, white, 0, 0.266)
  cylinder(reset, 0.143, 0.009, metal, 0, 0.326)
  for (const x of [-0.22, 0.22]) for (const z of [-0.22, 0.22]) {
    cylinder(reset, 0.027, 0.012, solder, x, 0.225, z)
    box(reset, 0.085, 0.12, 0.044, metal, x * 1.35, 0.035, z)
  }
  maleHeader(part('spi'), 2, 3)
  maleHeader(part('esp-header'), 3, 2)
  maleHeader(part('battery'), 3, 1)

  const qwiic = part('qwiic')
  box(qwiic, 0.39, 0.035, 0.61, white, 0, 0.042)
  box(qwiic, 0.055, 0.29, 0.61, white, -0.166, 0.18)
  box(qwiic, 0.39, 0.04, 0.61, white, 0, 0.325)
  for (const end of [-1, 1]) box(qwiic, 0.39, 0.29, 0.065, white, 0, 0.18, end * 0.273)
  box(qwiic, 0.016, 0.19, 0.45, black, -0.128, 0.175)
  for (let i = 0; i < 4; i++) {
    box(qwiic, 0.26, 0.025, 0.035, gold, 0, 0.15, (i - 1.5) * 0.1)
    box(qwiic, 0.075, 0.043, 0.04, metal, -0.23, 0.026, (i - 1.5) * 0.1)
  }

  const inductor = part('inductor')
  box(inductor, 0.51, 0.32, 0.5, silicon, 0, 0.2, 0, 0.065)
  box(inductor, 0.4, 0.035, 0.39, material({ color: '#696f72', roughness: 0.65, metalness: 0.26 }), 0, 0.372, 0, 0.032)
  for (const end of [-1, 1]) box(inductor, 0.13, 0.052, 0.33, gold, end * 0.22, 0.048)
  label(inductor, 0.37, 0.34, 0.392, ctx => print(ctx, '2R2', 52, 324, 194, '#242a2c'))
  for (const id of ['regulator-5v', 'regulator-3v3']) {
    const regulator = part(id)
    box(regulator, 0.43, 0.12, 0.35, silicon, 0, 0.1, 0, 0.025)
    box(regulator, 0.28, 0.031, 0.2, metal, 0, 0.043, 0.25)
    for (let i = 0; i < 3; i++) box(regulator, 0.061, 0.045, 0.19, solder, (i - 1) * 0.13, 0.036, -0.2)
    smd(regulator, -0.36, 0.03, 0.19, true)
    smd(regulator, 0.36, 0.04, 0.17, true)
  }
  ic(part('voltage-translator'), 0.39, 0.39, 5, 0.09)
  ic(part('usb-protection'), 0.26, 0.26, 3, 0.07)
  smd(part('usb-protection'), -0.05, 0.31)
  smd(part('usb-protection'), 0.02, -0.3, 0.14, false, silicon)
  box(part('clock'), 0.36, 0.1, 0.2, metal, 0, 0.07, 0, 0.04)
  smd(part('clock'), -0.24, -0.05, 0.13, true)
  smd(part('clock'), 0.24, -0.05, 0.13, true)
  const cluster = (id: string, rows: number) => {
    for (let i = 0; i < rows; i++) {
      smd(part(id), (i % 2) * 0.23 - 0.1, (Math.floor(i / 2) - (rows / 2 - 1) / 2) * 0.23, i % 3 === 0 ? 0.22 : 0.16, false, i % 3 === 1 ? silicon : ceramic)
    }
  }
  cluster('smd-power', 8)
  cluster('smd-mcu', 6)
  cluster('smd-analog', 6)
  // A few soldered details belong to the fixed PCB instead of becoming particles.
  for (const [x, z] of [[-0.47, 0.22], [-0.47, 0.46], [-2.72, -1.65], [-2.35, -0.88], [0.54, 1.84], [0.8, -1.92], [-0.82, 1.65], [2.72, -0.38]] as [number, number][]) smd(part('pcb'), x, z, 0.15, false, ceramic)
  for (const [x, z] of [[-0.4, -0.47], [-0.4, -0.19], [2.81, -1.52]] as [number, number][]) {
    box(part('pcb'), 0.14, 0.062, 0.08, white, x, 0.05, z)
    box(part('pcb'), 0.079, 0.012, 0.047, green, x, 0.088, z)
  }

  // Merge each moving group's static geometry by material; retain LED instances.
  // This keeps rich detail around ~100 draw calls rather than one per tiny pin.
  root.updateMatrixWorld(true)
  for (const object of groups.values()) {
    const inverse = object.matrixWorld.clone().invert()
    const buckets = new Map<THREE.Material, THREE.Mesh[]>()
    object.traverse(child => {
      if (child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh) && !Array.isArray(child.material)) {
        const items = buckets.get(child.material) ?? []
        items.push(child)
        buckets.set(child.material, items)
      }
      child.userData.partId = object.userData.partId
    })
    for (const [surface, meshes] of buckets) {
      if (meshes.length < 2) continue
      const transformed = meshes.map(item => {
        const geometry = item.geometry.clone()
        geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, item.matrixWorld))
        return geometry.index ? geometry.toNonIndexed() : geometry
      })
      const merged = mergeGeometries(transformed, false)
      for (const geometry of transformed) geometry.dispose()
      if (!merged) continue
      const combined = mesh(object, remember(merged), surface)
      combined.userData.partId = object.userData.partId
      for (const item of meshes) item.removeFromParent()
    }
  }

  return {
    root,
    parts: PARTS.map(({ id }) => ({ id, object: part(id) })),
    configs: PARTS,
    dispose: () => {
      for (const geometry of geometries) geometry.dispose()
      for (const surface of materials) surface.dispose()
      for (const texture of textures) texture.dispose()
      root.clear()
    },
  }
}

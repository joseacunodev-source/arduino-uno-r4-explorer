import * as THREE from 'three'

/**
 * Presentation-only identifiers for the texture-free official CAD export.
 * These are original, simplified labels, not a PCB fabrication silkscreen.
 * Geometry, package positions and electrical traces are not changed.
 */
export function detailCad(root: THREE.Object3D): () => void {
  const resources: { geometry: THREE.BufferGeometry; material: THREE.Material; texture: THREE.Texture; mesh: THREE.Mesh }[] = []
  const texture = (draw: (context: CanvasRenderingContext2D, size: number) => void, size = 512) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const context = canvas.getContext('2d')!
    draw(context, size)
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 4
    return map
  }
  const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, map: THREE.Texture) => {
    const material = new THREE.MeshStandardMaterial({
      map, transparent: true, roughness: 0.7, metalness: 0,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = `${parent.name}_presentation_label`
    mesh.userData.partId = parent.userData.partId ?? parent.name
    mesh.receiveShadow = true
    parent.add(mesh)
    resources.push({ geometry, material, texture: map, mesh })
    return mesh
  }
  const writing = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, height: number, color: string, weight = '500') => {
    ctx.fillStyle = color
    ctx.font = `${weight} ${height}px Arial, sans-serif`
    ctx.fillText(text, x, y)
  }

  const pcb = root.getObjectByName('pcb')
  if (pcb) {
    // Clip the presentation ink to the actual CAD board's upper triangles,
    // preserving every mounting hole and the original board outline.
    const positions: number[] = []
    const uv: number[] = []
    pcb.updateMatrixWorld(true)
    const inverse = pcb.matrixWorld.clone().invert()
    const point = new THREE.Vector3()
    pcb.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const matrix = new THREE.Matrix4().multiplyMatrices(inverse, child.matrixWorld)
      const geometry = child.geometry
      const vertex = geometry.getAttribute('position')
      const normal = geometry.getAttribute('normal')
      const index = geometry.index
      const count = index ? index.count : vertex.count
      for (let i = 0; i < count; i += 3) {
        const indices = [0, 1, 2].map(offset => index ? index.getX(i + offset) : i + offset)
        if (normal && indices.some(id => normal.getY(id) < 0.98)) continue
        const vertices = indices.map(id => point.fromBufferAttribute(vertex, id).applyMatrix4(matrix).clone())
        if (vertices.some(value => Math.abs(value.y) > 0.001)) continue
        for (const value of vertices) {
          positions.push(value.x, value.y + 0.002, value.z)
          uv.push((value.x + 3.429) / 6.858, (2.667 - value.z) / 5.334)
        }
      }
    })
    if (positions.length) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
      geometry.computeVertexNormals()
      const map = texture((ctx, size) => {
        const sx = size / 6.858, sz = size / 5.334
        const px = (x: number) => (x + 3.429) * sx
        const pz = (z: number) => (z + 2.667) * sz
        const text = (value: string, x: number, z: number, height: number, align: CanvasTextAlign = 'center') => {
          ctx.textAlign = align
          writing(ctx, value, px(x), pz(z), height * sx, '#eaf1e8', '600')
        }
        const cx = px(-0.05), cy = pz(-1.09), rw = sx * 0.3, rh = sz * 0.15
        ctx.strokeStyle = '#eaf1e8'
        ctx.lineWidth = sx * 0.045
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.bezierCurveTo(cx - rw * 1.9, cy - rh * 2.2, cx - rw * 1.9, cy + rh * 2.2, cx, cy)
        ctx.bezierCurveTo(cx + rw * 1.9, cy - rh * 2.2, cx + rw * 1.9, cy + rh * 2.2, cx, cy)
        ctx.stroke()
        text('−', -0.35, -1.045, 0.17)
        text('+', 0.25, -1.045, 0.16)
        text('ARDUINO', -0.05, -0.67, 0.19)
        ctx.fillStyle = '#eaf1e8'
        ctx.fillRect(px(-0.6), pz(-0.56), 1.1 * sx, 0.23 * sz)
        ctx.textAlign = 'center'
        writing(ctx, 'UNO R4', px(-0.05), pz(-0.39), sx * 0.15, '#075474', '700')
        ctx.lineWidth = 2
        ctx.strokeRect(px(-0.6), pz(-0.285), 0.78 * sx, 0.22 * sz)
        text('WIFI', -0.21, -0.12, 0.15)
        text('DIGITAL (PWM ~)', 0.1, -2.02, 0.108)
        text('RESET', -2.8, -1.92, 0.1)
        text('POWER', 0.35, 2.02, 0.108)
        text('ANALOG IN', 2.22, 2.02, 0.108)
        text('SPI', 3.04, 0.35, 0.075)
        text('QWIIC', 3.05, 1.7, 0.07)
        text('OFF  GND  VRTC', -1.4, 2.03, 0.071)
        const row = (names: string[], x: number, z: number) => names.forEach((name, i) => text(name, x + i * 0.254, z, 0.058))
        row(['SCL', 'SDA', 'AREF', 'GND', '13', '12', '11', '10', '9', '8'], -1.5, -2.17)
        row(['7', '6', '5', '4', '3', '2', 'TX', 'RX'], 1.139, -2.17)
        row(['IOREF', 'RST', '3V3', '5V', 'GND', 'GND', 'VIN', ''], -0.534, 2.18)
        row(['A0', 'A1', 'A2', 'A3', 'A4', 'A5'], 1.65, 2.18)
      }, 2048)
      add(pcb, geometry, map)
    }
  }

  const packageLabel = (id: string, width: number, depth: number, x: number, z: number, draw: (context: CanvasRenderingContext2D) => void) => {
    const parent = root.getObjectByName(id)
    if (!parent) return
    const bounds = new THREE.Box3()
    parent.updateMatrixWorld(true)
    const inverse = parent.matrixWorld.clone().invert()
    parent.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.geometry.computeBoundingBox()
      if (child.geometry.boundingBox) bounds.union(child.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, child.matrixWorld)))
    })
    if (bounds.isEmpty()) return
    const geometry = new THREE.PlaneGeometry(width, depth)
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(x, bounds.max.y + 0.002, z)
    add(parent, geometry, texture(draw))
  }
  packageLabel('ra4m1', 0.89, 0.89, 0, 0, ctx => {
    writing(ctx, 'RENESAS', 35, 142, 45, '#b7babb')
    writing(ctx, 'RA4M1', 35, 211, 35, '#b7babb')
    writing(ctx, 'R7FA4M1AB3CFM', 35, 271, 26, '#989fa3')
    writing(ctx, 'ARM CORTEX-M4', 35, 324, 25, '#989fa3')
  })
  packageLabel('esp32', 1.13, 1.2, 0.35, 0, ctx => {
    writing(ctx, 'ESPRESSIF', 28, 101, 43, '#4c4e49', '600')
    writing(ctx, 'ESP32-S3-MINI-1', 28, 168, 31, '#4c4e49')
    writing(ctx, 'Wi-Fi + Bluetooth LE', 28, 223, 24, '#686a63')
    writing(ctx, 'CE', 30, 361, 60, '#4c4e49')
  })
  packageLabel('inductor', 0.31, 0.31, 0, 0, ctx => writing(ctx, '2R2', 52, 324, 192, '#282c2e'))

  return () => {
    for (const resource of resources) {
      resource.mesh.removeFromParent()
      resource.geometry.dispose()
      resource.material.dispose()
      resource.texture.dispose()
    }
  }
}

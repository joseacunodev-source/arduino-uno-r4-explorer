import * as THREE from 'three'

// Registration measured from the user-supplied orthographic photographs.
const W = 6.858, D = 5.334, T = 0.160632
const photoUV = (x: number, z: number, bottom = false) => [
  (bottom ? 905 - (x + W / 2) / W * 833 : 102 + (x + W / 2) / W * 833) / 1000,
  1 - (51 + (z + D / 2) / D * 646) / 750,
]
const fromPhoto = (x: number, y: number) => new THREE.Vector2((x - 102) / 833 * W - W / 2, D / 2 - (y - 51) / 646 * D)

export async function photoDetails(root: THREE.Object3D) {
  const loader = new THREE.TextureLoader()
  const textures: THREE.Texture[] = await Promise.all(['pcb-top-bare.png', 'arduino-bottom-reference.webp', 'arduino-top-reference.webp'].map(name => loader.loadAsync(`${import.meta.env.BASE_URL}textures/${name}`)))
  for (const texture of textures) { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 16 }
  const [top, bottom, componentPhoto] = textures
  const resources: THREE.Mesh[] = []
  root.updateMatrixWorld(true)

  // Put the actual photographed package markings on the matching CAD faces.
  // UVs are computed at assembled coordinates and travel with each component.
  const parts: THREE.Object3D[] = []
  root.traverse(object => { if (object.userData.partId === object.name && object.name !== 'pcb') parts.push(object) })
  for (const part of parts) {
    const vertices: number[] = [], normals: number[] = [], uvs: number[] = []
    const inverse = part.matrixWorld.clone().invert()
    part.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const geometry = child.geometry
      const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal'), index = geometry.index
      if (!normal) return
      const local = new THREE.Matrix4().multiplyMatrices(inverse, child.matrixWorld)
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(child.matrixWorld)
      const count = index?.count ?? position.count
      for (let i = 0; i < count; i += 3) {
        const ids = [0, 1, 2].map(n => index ? index.getX(i + n) : i + n)
        if (ids.some(n => new THREE.Vector3().fromBufferAttribute(normal, n).applyMatrix3(normalMatrix).normalize().y < 0.96)) continue
        for (const n of ids) {
          const vertex = new THREE.Vector3().fromBufferAttribute(position, n)
          const world = vertex.clone().applyMatrix4(child.matrixWorld)
          vertex.applyMatrix4(local)
          vertices.push(vertex.x, vertex.y + 0.0008, vertex.z)
          normals.push(0, 1, 0)
          uvs.push(...photoUV(world.x, world.z))
        }
      }
    })
    if (!vertices.length) continue
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    const metal = ['esp32', 'usb-c', 'reset'].includes(part.name)
    const material = new THREE.MeshStandardMaterial({ map: componentPhoto, roughness: metal ? 0.49 : 0.7, metalness: metal ? 0.34 : 0.02, polygonOffset: true, polygonOffsetFactor: -1, depthWrite: false, envMapIntensity: 0.45 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = `${part.name}_photo_surface`
    mesh.userData.partId = part.name
    mesh.receiveShadow = true
    part.add(mesh)
    resources.push(mesh)
  }

  const pcb = root.getObjectByName('pcb')!
  const shape = new THREE.Shape()
  const outline = [[114,51],[890,51],[903,64],[903,206],[935,241],[935,637],[903,668],[903,685],[890,697],[114,697],[102,685],[102,64]]
  outline.forEach(([px,py],i) => { const p = fromPhoto(px,py); if (i === 0) shape.moveTo(p.x,p.y); else shape.lineTo(p.x,p.y) })
  shape.closePath()
  const mountHoles = [[286,82,0.158],[905,263,0.158],[904,607,0.158],[269,671,0.158],[125,677,0.054]]
  for (const [px,py,r] of mountHoles) {
    const p = fromPhoto(px,py), hole = new THREE.Path()
    hole.absarc(p.x,p.y,r,0,Math.PI * 2,true)
    shape.holes.push(hole)
  }
  // Pin holes are real cutouts through the laminate, not dark painted circles.
  for (const [first,count,z] of [[-1.5,10,-2.413],[1.139,8,-2.413],[-0.534,8,2.413],[1.65,6,2.413]]) {
    for (let i=0;i<count;i++) { const hole = new THREE.Path(); hole.absarc(first+i*0.254,-z,0.045,0,Math.PI*2,true); shape.holes.push(hole) }
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 48, steps: 1 })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0,-T,0)
  const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal')
  const uv = new Float32Array(position.count * 2)
  const groups: number[][] = [[],[],[]]
  for (let i=0;i<position.count;i+=3) {
    const direction = (normal.getY(i)+normal.getY(i+1)+normal.getY(i+2))/3
    const group = direction > 0.8 ? 0 : direction < -0.8 ? 1 : 2
    for (let n=i;n<i+3;n++) {
      groups[group].push(n)
      const pair = group === 2 ? [(position.getX(n)+position.getZ(n))*3,(position.getY(n)+T)/T] : photoUV(position.getX(n),position.getZ(n),group === 1)
      uv[n*2]=pair[0];uv[n*2+1]=pair[1]
    }
  }
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2))
  geometry.setIndex(groups.flat());geometry.clearGroups()
  let start = 0
  groups.forEach((indices,i) => { geometry.addGroup(start,indices.length,i);start += indices.length })
  const boardMaterial = (map: THREE.Texture) => {
    const material = new THREE.MeshPhysicalMaterial({ map, roughness: 0.58, metalness: 0.05, clearcoat: 0.13, clearcoatRoughness: 0.52, bumpMap: map, bumpScale: 0.0009, envMapIntensity: 0.5 })
    // Differentiate uncoated warm copper pads from blue solder mask and white ink.
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nfloat copper = smoothstep(0.07,0.24,diffuseColor.r-diffuseColor.b) * smoothstep(0.15,0.5,diffuseColor.r);\nmetalnessFactor = mix(0.04,0.68,copper);')
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.58,0.38,smoothstep(0.07,0.24,diffuseColor.r-diffuseColor.b));')
    }
    material.customProgramCacheKey = () => 'pcb-photo-finish-v1'
    return material
  }
  const edgeCanvas = document.createElement('canvas');edgeCanvas.width=64;edgeCanvas.height=64
  const edgeContext=edgeCanvas.getContext('2d')!
  edgeContext.fillStyle='#536c59';edgeContext.fillRect(0,0,64,64)
  for (let i=0;i<8;i++) { edgeContext.fillStyle=i%2 ? '#405644' : '#809075';edgeContext.fillRect(0,i*8,64,2) }
  const edgeMap=new THREE.CanvasTexture(edgeCanvas);edgeMap.colorSpace=THREE.SRGBColorSpace;edgeMap.wrapS=THREE.RepeatWrapping;textures.push(edgeMap)
  const edge=new THREE.MeshStandardMaterial({map:edgeMap,roughness:0.8,metalness:0.04})
  const material=[boardMaterial(top),boardMaterial(bottom),edge]
  for (const child of [...pcb.children]) {
    if (child instanceof THREE.Mesh) { child.geometry.dispose();(Array.isArray(child.material)?child.material:[child.material]).forEach(m=>m.dispose());child.removeFromParent() }
  }
  const board=new THREE.Mesh(geometry,material);board.name='photo_registered_pcb';board.userData.partId='pcb';board.receiveShadow=true;board.castShadow=true;pcb.add(board);resources.push(board)
  const plating = new THREE.MeshStandardMaterial({color:'#b9a777',roughness:0.43,metalness:0.72,envMapIntensity:0.65})
  for (const [px,py,r] of mountHoles) {
    const p=fromPhoto(px,py)
    for (const underside of [false,true]) {
      const ring=new THREE.Mesh(new THREE.RingGeometry(r,r+0.033,64),plating)
      ring.rotation.x=underside ? Math.PI/2 : -Math.PI/2
      ring.position.set(p.x,underside ? -T-0.005 : 0.005,-p.y)
      ring.userData.partId='pcb';pcb.add(ring);resources.push(ring)
    }
  }
  return () => {
    const materials=new Set<THREE.Material>()
    for (const mesh of resources) { mesh.removeFromParent();mesh.geometry.dispose();(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>materials.add(m)) }
    materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())
  }
}

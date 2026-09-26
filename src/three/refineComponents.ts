import * as THREE from 'three'

/** Replace the simplified, solid CAD jack with a hollow molded housing. */
export function refineComponents(root: THREE.Object3D) {
  const jack = root.getObjectByName('barrel-jack')
  if (jack) {
    const materials = new Set<THREE.Material>()
    for (const child of [...jack.children]) {
      child.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m)) } })
      child.removeFromParent()
    }
    materials.forEach(m=>m.dispose())
    const polymer = new THREE.MeshPhysicalMaterial({color:'#171a1b',roughness:0.69,metalness:0,clearcoat:0.08,clearcoatRoughness:0.6})
    const nickel = new THREE.MeshStandardMaterial({color:'#b7b8b2',roughness:0.38,metalness:0.86,envMapIntensity:0.6})
    const contact = new THREE.MeshStandardMaterial({color:'#c0ae72',roughness:0.4,metalness:0.8,envMapIntensity:0.6})
    const cross = new THREE.Shape()
    cross.moveTo(-0.47,-0.38);cross.lineTo(-0.47,0.245)
    cross.absarc(0,0.245,0.47,Math.PI,0,true)
    cross.lineTo(0.47,-0.38);cross.closePath()
    const bore = new THREE.Path();bore.absarc(0,0.245,0.295,0,Math.PI*2,false);cross.holes.push(bore)
    const shell = new THREE.ExtrudeGeometry(cross,{depth:1.42,bevelEnabled:true,bevelThickness:0.01,bevelSize:0.01,bevelSegments:3,curveSegments:64,steps:1})
    shell.rotateY(Math.PI/2);shell.translate(-0.71,0,0)
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number,number,number] = [0,0,0]) => {
      const mesh = new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.partId='barrel-jack';jack.add(mesh);return mesh
    }
    add(shell,polymer)
    const rearShape=cross.clone();rearShape.holes=[]
    const rearCap=new THREE.ShapeGeometry(rearShape,64);rearCap.rotateY(Math.PI/2);rearCap.translate(0.715,0,0)
    add(rearCap,polymer)
    add(new THREE.BoxGeometry(0.06,0.84,0.88),polymer,[0.66,0.12,0])
    const pin = new THREE.CylinderGeometry(0.062,0.065,0.74,32);pin.rotateZ(Math.PI/2)
    add(pin,contact,[0.1,0.245,0])
    const sleeve = new THREE.CylinderGeometry(0.275,0.275,0.3,48,1,true);sleeve.rotateZ(Math.PI/2)
    const inner=add(sleeve,nickel,[0.42,0.245,0]);inner.material=new THREE.MeshStandardMaterial({color:'#999c97',roughness:0.42,metalness:0.82,side:THREE.DoubleSide})
    for (const [x,z] of [[-0.35,0.33],[0.36,0.33],[0.36,-0.33]]) add(new THREE.BoxGeometry(0.12,0.34,0.065),nickel,[x,-0.55,z])
  }
  const radio = root.getObjectByName('esp32')
  if (radio) {
    const material = new THREE.MeshStandardMaterial({color:'#272b28',roughness:0.78,metalness:0.12})
    for (let i=0;i<6;i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.012,0.018),material)
      line.position.set(-0.73,-0.033,-0.63+i*0.23);line.userData.partId='esp32';radio.add(line)
    }
  }
}

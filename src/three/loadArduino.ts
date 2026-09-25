import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CAD_PARTS } from '../data/cadParts'
import { detailCad } from './detailCad'

/** Real Arduino STEP geometry, converted offline; no CAD parser ships to browsers. */
export async function loadArduino() {
  const url = `${import.meta.env.BASE_URL}models/arduino-uno-r4-wifi.glb`
  const gltf = await new GLTFLoader().loadAsync(url)
  const root = gltf.scene
  root.name = 'Arduino UNO R4 WiFi — official CAD'
  const parts = CAD_PARTS.map(config => {
    const source = root.getObjectByName(config.id)
    if (!source) {
      throw new Error(`CAD model is missing the ${config.id} component group`)
    }
    // glTF represents empty transform nodes as Object3D. Wrap them in Groups
    // to keep the same typed runtime contract as the procedural fallback.
    const object = new THREE.Group()
    object.name = source.name
    object.position.copy(source.position)
    object.quaternion.copy(source.quaternion)
    object.scale.copy(source.scale)
    source.parent!.add(object)
    object.add(...source.children)
    source.removeFromParent()
    object.userData.partId = config.id
    object.traverse(child => {
      child.userData.partId = config.id
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return { id: config.id, object }
  })
  const disposeDetails = detailCad(root)
  function dispose() {
    disposeDetails()
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    root.traverse(child => {
      if (child instanceof THREE.Mesh) {
        geometries.add(child.geometry)
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material)
      }
    })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
  }
  return { root, parts, configs: CAD_PARTS, dispose }
}

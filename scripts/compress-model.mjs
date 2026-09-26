import { NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression } from '@gltf-transform/extensions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import { stat } from 'node:fs/promises'
import assert from 'node:assert/strict'

// No quantization or simplification: vertices and triangle winding are preserved.
const path = 'public/models/arduino-uno-r4-wifi.glb'
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready])
const io = new NodeIO().registerExtensions([EXTMeshoptCompression])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })
const before = await stat(path)
const doc = await io.read(path)
const arrays = doc.getRoot().listAccessors().map(a => a.getArray().slice())
const indices = new Set(doc.getRoot().listMeshes().flatMap(m => m.listPrimitives().map(p => p.getIndices())))
const indexSlots = new Set(doc.getRoot().listAccessors().flatMap((a, i) => indices.has(a) ? [i] : []))
const canonical = array => {
  const result = []
  for (let i = 0; i < array.length; i += 3) {
    const tri = [...array.slice(i, i + 3)]
    const start = [0, 1, 2].sort((a, b) => tri[a] - tri[b] || tri[(a + 1) % 3] - tri[(b + 1) % 3])[0]
    result.push(tri[start], tri[(start + 1) % 3], tri[(start + 2) % 3])
  }
  return result
}
doc.createExtension(EXTMeshoptCompression).setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })
const encoded = await io.writeBinary(doc)
const decoded = await io.readBinary(encoded)
assert.equal(decoded.getRoot().listAccessors().length, arrays.length)
decoded.getRoot().listAccessors().forEach((a, i) => {
  // Triangle encoding may cyclically rotate indices without changing the face.
  assert.deepEqual(indexSlots.has(i) ? canonical(a.getArray()) : a.getArray(), indexSlots.has(i) ? canonical(arrays[i]) : arrays[i])
})
await io.write(path, doc)
console.log(`Lossless model: ${before.size} → ${(await stat(path)).size} bytes. All ${arrays.length} accessors verified.`)

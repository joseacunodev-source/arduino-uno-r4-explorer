import assert from 'node:assert/strict'
import { rename, stat, writeFile } from 'node:fs/promises'
import { NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression } from '@gltf-transform/extensions'
import { simplifyPrimitive } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'

// The CAD LED matrix has a separate bevelled solid for every one of its 96 LEDs.
// Simplify only that mesh; the silkscreen, PCB, connector and chip meshes remain exact.
const path = 'public/models/arduino-uno-r4-wifi.glb'
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions([EXTMeshoptCompression])
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(path)
const mesh = doc.getRoot().listNodes().find(node => node.getName() === 'led-matrix_6')?.getMesh()
assert(mesh, 'LED matrix mesh is missing')
const primitives = mesh.listPrimitives()
assert.equal(primitives.length, 1)
const primitive = primitives[0]
const originalTriangles = primitive.getIndices().getCount() / 3
assert.equal(originalTriangles, 451584, 'Start from the untouched official CAD conversion')

simplifyPrimitive(primitive, { simplifier: MeshoptSimplifier, ratio: 0.24, error: 0.002 })
const finalTriangles = primitive.getIndices().getCount() / 3
assert(finalTriangles < originalTriangles * 0.8, 'Simplification made too little difference')

doc.createExtension(EXTMeshoptCompression).setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })
const tempPath = `${path}.tmp`
const glb = await io.writeBinary(doc)
await writeFile(tempPath, glb)
const verified = await io.readBinary(glb)
const verifiedMesh = verified.getRoot().listNodes().find(node => node.getName() === 'led-matrix_6')?.getMesh()
assert.equal(verifiedMesh.listPrimitives()[0].getIndices().getCount() / 3, finalTriangles)
await rename(tempPath, path)
console.log(`LED matrix: ${originalTriangles.toLocaleString()} → ${finalTriangles.toLocaleString()} triangles; model ${(await stat(path)).size.toLocaleString()} bytes`)

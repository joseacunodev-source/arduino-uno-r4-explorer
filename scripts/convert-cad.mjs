/** Offline conversion. Setup: npm install --prefix .tools/cad occt-import-js three */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import * as THREE from '../.tools/cad/node_modules/three/build/three.module.js';
import { GLTFExporter } from '../.tools/cad/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from '../.tools/cad/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
const require = createRequire(import.meta.url);
const source = 'reference/cad/official-step/UNO_R4_WIFI.step';
const cache = 'reference/cad/triangulated.json';
const occt = await require('../.tools/cad/node_modules/occt-import-js')();
const result = process.env.CAD_USE_CACHE === '1' && fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache)) : occt.ReadStepFile(fs.readFileSync(source), {
  linearUnit: 'millimeter', linearDeflectionType: 'absolute_value', linearDeflection: 0.035, angularDeflection: 0.22,
});
if (!result.success) throw new Error('STEP triangulation failed');
// Original CAD has XY board plane, +Z top, origin at PCB bottom left.
// World X follows CAD X, world Y follows CAD Z, world Z follows -CAD Y.
const world = (x,y,z) => [(x-34.29)/10,z/10,(26.67-y)/10];
const groups = new Map();
const materials = new Map();
const explicit = {Board:'pcb', U1:'ra4m1', M1:'esp32', J1:'usb-c', J5:'barrel-jack', PB1:'reset', J2:'qwiic', J3:'spi', J6:'esp-header', L3:'inductor', U3:'regulator-5v', U5:'regulator-3v3', U4:'voltage-translator', JOFF:'battery', U2:'usb-protection',U6:'usb-protection',D3:'usb-protection',F1:'usb-protection'};
function bounds(mesh) {
  const box = new THREE.Box3(); const a=mesh.attributes.position.array;
  for(let i=0;i<a.length;i+=3) box.expandByPoint(new THREE.Vector3(a[i],a[i+1],a[i+2]));
  return box;
}
function choose(node,mesh,id) {
  if (node.name==='JDIGITAL') return bounds(mesh).getCenter(new THREE.Vector3()).x<44?'digital-a':'digital-b';
  if (node.name==='JANALOG') return bounds(mesh).getCenter(new THREE.Vector3()).x<49?'power-header':'analog-header';
  if (explicit[node.name]) return explicit[node.name];
  if (/^\d+$/.test(node.name)) return 'led-matrix';
  if (/^DL/.test(node.name)) return 'status-leds';
  if (/^(D1|D2|Q1|Q2|Q3)$/.test(node.name)) return 'power-switching';
  const center=bounds(mesh).getCenter(new THREE.Vector3());
  return center.x<34?'smd-power':center.y>26.67?'smd-mcu':'smd-analog';
}
function materialFor(rgb,groupId) {
  const color=rgb || [0.18,0.18,0.18];
  const metal = Math.min(...color)>0.3;
  const key=color.join(',')+'|'+(groupId==='pcb'?'pcb':metal?'metal':'body');
  if(!materials.has(key)) materials.set(key,new THREE.MeshStandardMaterial({
    color:new THREE.Color(...color), metalness:groupId==='pcb'?0.12:metal?0.65:0.03, roughness:metal?0.32:0.62,
    name:groupId==='pcb'?'CAD blue solder mask':metal?'CAD metal':'CAD body',
  }));
  return {key,material:materials.get(key)};
}
const cadNodes=result.root.children[0].children;
for(const node of cadNodes) for(const meshId of node.meshes) {
  const mesh=result.meshes[meshId]; const id=choose(node,mesh,meshId);
  if(!groups.has(id)) groups.set(id,{geometries:new Map(),designators:new Set(),sourceMeshes:[]});
  const group=groups.get(id); group.designators.add(node.name); group.sourceMeshes.push(meshId);
  const sourcePositions=mesh.attributes.position.array, positions=[];
  const sourceNormals=mesh.attributes.normal?.array, normals=[];
  for(let i=0;i<sourcePositions.length;i+=3) positions.push(...world(...sourcePositions.slice(i,i+3)));
  if(sourceNormals) for(let i=0;i<sourceNormals.length;i+=3) normals.push(sourceNormals[i],sourceNormals[i+2],-sourceNormals[i+1]);
  const triangleColors=Array(mesh.index.array.length/3).fill(mesh.color);
  for(const face of mesh.brep_faces) if(face.color) for(let i=face.first;i<=face.last;i++) triangleColors[i]=face.color;
  const buckets=new Map();
  for(let tri=0;tri<triangleColors.length;tri++) {
    const {key,material}=materialFor(triangleColors[tri],id);
    if(!buckets.has(key)) buckets.set(key,{material,indices:[]});
    buckets.get(key).indices.push(...mesh.index.array.slice(tri*3,tri*3+3));
  }
  for(const [key,bucket] of buckets) {
    let geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    if(normals.length) geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geo.setIndex(bucket.indices); if(!normals.length)geo.computeVertexNormals();
    // Remove unused source vertices after splitting by material.
    const old=geo; geo=mergeVertices(geo.toNonIndexed(),1e-5); old.dispose();
    if(!group.geometries.has(key))group.geometries.set(key,{material:bucket.material,items:[]});
    group.geometries.get(key).items.push(geo);
  }
}
const root=new THREE.Group(); root.name='Arduino_UNO_R4_WiFi_CAD';
const metadata=[]; let triangles=0, drawMeshes=0;
for(const [id,data] of groups) {
  const group=new THREE.Group();group.name=id;group.userData.partId=id;
  for(const [key,bucket] of data.geometries) {
    const geometry=mergeGeometries(bucket.items); geometry.computeBoundingBox();
    const mesh=new THREE.Mesh(geometry,bucket.material);mesh.name=`${id}_${drawMeshes++}`; mesh.userData.partId=id;
    triangles+=geometry.index.count/3;group.add(mesh);
  }
  group.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(group); const center=box.getCenter(new THREE.Vector3());
  if(id==='pcb') center.set(0,0,0);
  for(const child of group.children) child.geometry.translate(-center.x,-center.y,-center.z);
  group.position.copy(center);root.add(group);
  metadata.push({id,assembled:center.toArray(),bounds:{min:box.min.toArray(),max:box.max.toArray()},designators:[...data.designators],sourceMeshes:data.sourceMeshes});
}
// GLTFExporter only needs FileReader for buffers in this texture-free export.
globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(value=>{this.result=`data:${blob.type};base64,${Buffer.from(value).toString('base64')}`;this.onloadend?.();});}
};
const glb=await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true});
fs.mkdirSync('public/models',{recursive:true});
fs.writeFileSync('public/models/arduino-uno-r4-wifi.glb',Buffer.from(glb));
fs.writeFileSync('public/models/arduino-uno-r4-wifi.parts.json',JSON.stringify({source,sourceURL:'https://docs.arduino.cc/resources/models/ABX00087-step.zip',transform:'[(CAD_X-34.29)/10, CAD_Z/10, (26.67-CAD_Y)/10]',triangles,drawMeshes,parts:metadata},null,2));
fs.writeFileSync('src/data/cadParts.ts',`// Generated by scripts/convert-cad.mjs; assembled pivots come from official CAD.\nimport { PARTS, type PartConfig, type Vec3 } from './parts'\nconst CAD_CENTERS: Record<string, Vec3> = ${JSON.stringify(Object.fromEntries(metadata.map(p=>[p.id,p.assembled])),null,2)}\nconst extras: PartConfig[] = [\n{id:'status-leds',name:'Status LEDs',category:'Output',description:'Four small LEDs indicate power and serial or clock activity.',spec:'Power · TX · RX · SCK',assembled:[0,0,0],exploded:[0.2,0.7,-2.8],range:[0.12,0.4]},\n{id:'power-switching',name:'Power switching',category:'Power',description:'Diodes and transistors route and condition board power.',spec:'D1 · D2 · Q1 · Q2 · Q3',assembled:[0,0,0],exploded:[-2.8,0.8,2.3],range:[0.15,0.43]}\n]\nexport const CAD_PARTS: PartConfig[] = [...PARTS,...extras].filter(part=>CAD_CENTERS[part.id]).map(part=>({...part, assembled:CAD_CENTERS[part.id], ...(part.id==='pcb'?{spec:'Official CAD · 68.58 × 53.34 mm'}:{})}))\n`);
console.log(JSON.stringify({bytes:glb.byteLength,triangles,drawMeshes,groups:metadata.length}));

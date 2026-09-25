const fs = require('node:fs');
const occtFactory = require('../../.tools/cad/node_modules/occt-import-js');
occtFactory().then(occt => {
  const result = occt.ReadStepFile(fs.readFileSync('reference/cad/official-step/UNO_R4_WIFI.step'), {
    linearUnit: 'millimeter', linearDeflectionType: 'absolute_value', linearDeflection: 0.08, angularDeflection: 0.35
  });
  if (!result.success) throw new Error('STEP import failed');
  fs.writeFileSync('reference/cad/triangulated.json', JSON.stringify(result));
  const getMeshes = node => [...node.meshes, ...node.children.flatMap(getMeshes)];
  function summary(node) {
    const ids = getMeshes(node), min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
    for (const id of ids) {
      const positions=result.meshes[id].attributes.position.array;
      for (let i=0;i<positions.length;i++) {const axis=i%3; min[axis]=Math.min(min[axis],positions[i]); max[axis]=Math.max(max[axis],positions[i]);}
    }
    return {name:node.name, meshes:ids.length, triangles:ids.reduce((n,id)=>n+result.meshes[id].index.array.length/3,0), min:min.map(x=>+x.toFixed(3)),max:max.map(x=>+x.toFixed(3))};
  }
  console.log(JSON.stringify({meshCount:result.meshes.length,root:summary(result.root),children:result.root.children.map(summary)},null,2));
});

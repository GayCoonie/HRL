import fs from 'node:fs';import {models,triangle,modelNames} from './render.mjs';
const ms=await models(),entries=[];
for(const H of [30,150,270,300])for(const i of [0,1,3]){const image=await triangle(ms[i],H,160),name=`preview-${H}-${i}.rgba`;fs.writeFileSync(new URL('results/'+name,import.meta.url),image.pixels);entries.push({H,model:modelNames[i],file:name,width:image.width,height:image.height,errors:image.errors});}
fs.writeFileSync(new URL('results/preview-index.json',import.meta.url),JSON.stringify(entries,null,2));console.log(entries.map(e=>[e.H,e.model,e.errors]));

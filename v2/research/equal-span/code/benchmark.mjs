import fs from 'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
import{createHRLResearch}from'../../../lib/research.mjs';import{createHRLv2}from'../../../lib/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rows=JSON.parse(fs.readFileSync(root+'/results/combvd-inputs.json'));
const board={method:'Bradford to D65 xy=(.3127,.3290), relative Y=1. Both endpoints must be admitted. No quantization or gamut clipping. Exact public-bicone Euclidean distance.',weights:{'BFD-P':1,LEEDS:9,'RIT-DuPont':9,WITT:7},mask_note:'Admission recomputed for these model domains; old 3331-pair mask identity has NOT been independently recovered. Counts and row indices supplied.',fitted_to_COMBVD:false,models:{}};
function score(r,weighted){let dd=0,dv=0,vv=0;for(const z of r){let w=weighted?z.weight:1;dd+=w*z.de**2;dv+=w*z.de*z.dv;vv+=w*z.dv**2;}const scale=dv/dd;let ss=0;for(const z of r)ss+=(weighted?z.weight:1)*(scale*z.de-z.dv)**2;return{n:r.length,stress:100*Math.sqrt(ss/vv),scale};}
for(const variant of ['basr','equal-span','opal'])for(const gamut of ['srgb','full']){
 const m=variant==='basr'?await createHRLv2({gamut,variant}):await createHRLResearch({gamut,variant});let retained=[],rejected=[];
 for(const row of rows){try{const a=m.fromXYZ(row.xyz1),b=m.fromXYZ(row.xyz2),de=m.distance(a,b);if(!Number.isFinite(de))throw Error('Nonfinite metric');retained.push({...row,de});}catch(e){rejected.push({index:row.index,reason:e.message});}}
 const groups={};for(const d of [...new Set(retained.map(x=>x.dataset))])groups[d]=score(retained.filter(x=>x.dataset===d),false);
 groups['BFD-P combined']=score(retained.filter(x=>x.dataset.startsWith('BFD-P')),false);
 board.models[variant+'-'+gamut]={unweighted:score(retained,false),traditional_weighted:score(retained,true),subsets:groups,retained_indices:retained.map(x=>x.index),rejected};
 fs.writeFileSync(root+`/results/combvd-${variant}-${gamut}-pairs.json`,JSON.stringify(retained.map(x=>({index:x.index,de:x.de,dv:x.dv,weight:x.weight,dataset:x.dataset}))));
 console.log(variant,gamut,score(retained,false),score(retained,true));
}
fs.writeFileSync(root+'/results/combvd-baseline.json',JSON.stringify(board,null,2));

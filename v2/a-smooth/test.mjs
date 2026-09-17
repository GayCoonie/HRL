/** Frozen-checkpoint publication gate. No fitting, clipping or pair substitution. */
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createASmooth} from './index.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const def=read('definitions.json'),inputs=read('../research/equal-span/results/combvd-inputs.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const score=(rows,weighted=true)=>{
 let dd=0,dv=0,vv=0;for(const r of rows){const w=weighted?r.weight:1;dd+=w*r.de*r.de;dv+=w*r.de*r.dv;vv+=w*r.dv*r.dv;}
 assert(rows.length&&dd>0&&vv>0);const scale=dv/dd;
 return {n:rows.length,stress:100*Math.sqrt(rows.reduce((s,r)=>s+(weighted?r.weight:1)*(scale*r.de-r.dv)**2,0)/vv),scale};
};
const models={},pairs={},checks={};let state=192867;
const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
for(const g of ['srgb','full']){
 assert.equal(hash(fs.readFileSync(new URL(`source-${g}.json`,root))),def.shared_hashes['source_'+g]);
 for(const v of ['parent','smooth']){
  const m=await createASmooth({gamut:g,variant:v}),rows=[],rejected=[];
  for(const r of inputs){try{const a=m.fromXYZ(r.xyz1),b=m.fromXYZ(r.xyz2),de=m.distance(a,b);assert(Number.isFinite(de));rows.push({...r,de});}catch(e){rejected.push(r.index);}}
  const pooled=score(rows),expected=def.expected_scores[v][g];
  assert.equal(hash(JSON.stringify(rows.map(r=>r.index))),def.mask_sha256[g]);assert.equal(pooled.n,expected.n);assert(Math.abs(pooled.stress-expected.stress)<2e-8);
  const groups={};for(const d of [...new Set(rows.map(r=>r.dataset))])groups[d]=score(rows.filter(r=>r.dataset===d),false);
  groups['BFD-P combined']=score(rows.filter(r=>r.dataset.startsWith('BFD-P')),false);
  const id=v+'-'+g;models[id]={weighted:pooled,unweighted:score(rows,false),subsets:groups,retained_indices:rows.map(r=>r.index),rejected};pairs[id]=rows;
  let error=0;const max=(a,b)=>Math.max(...a.map((x,i)=>Math.abs(x-b[i])));
  for(let i=0;i<256;i++){
   const L=rand(),q={H:360*rand(),R:L*rand(),L},xyz=m.toXYZ(q),back=m.fromXYZ(xyz,q.H);
   const e=max(m.embed(q),m.embed(back));error=Math.max(error,e);assert(e<2e-6);
   const rgb=Array.from({length:3},()=>Math.floor(rand()*65536)/65535);
   const z=g==='srgb'?m.toRGB(m.fromRGB(rgb)):m.toPseudoRGB(m.fromPseudoRGB(rgb));
   assert.deepEqual(z.map(x=>Math.round(x*65535)),rgb.map(x=>Math.round(x*65535)));
  }
  for(let i=0;i<256;i++){const rgb=[i/255,i/255,i/255],z=g==='srgb'?m.toRGB(m.fromRGB(rgb)):m.toPseudoRGB(m.fromPseudoRGB(rgb));assert.deepEqual(z.map(x=>Math.round(x*255)),[i,i,i]);}
  assert.deepEqual(m.toXYZ({H:0,R:0,L:0}),[0,0,0]);assert(max(m.toXYZ({H:0,R:0,L:1}),m.field.white)<1e-12);
  const a=await createASmooth({gamut:g,variant:'parent'});for(let H=0;H<360;H+=.5){assert.equal(m.labelForHue(H),a.labelForHue(H));assert.deepEqual(m.vivid(H),a.vivid(H));}
  checks[id]={random_native_roundtrips:256,integer16_roundtrips:256,gray8_roundtrips:256,unchanged_vivid_samples:720,max_embedding_roundtrip_error:error};
  console.log(id,pooled.stress,pooled.n);
 }
 assert.deepEqual(models['parent-'+g].retained_indices,models['smooth-'+g].retained_indices);
}
const common=new Set(models['parent-srgb'].retained_indices);
for(const [id,rows]of Object.entries(pairs))models[id].same_3331=score(rows.filter(r=>common.has(r.index)));
const out={id:'HRL-A-Smooth-publication-verification',method:'Actual JS runtime, unchanged fitted coefficients and hue ring; continuous XYZ; E=[L-R/2,sqrt(3)/2 R cos(H),sqrt(3)/2 R sin(H)]',traditional_multiplicities:{'BFD-P':1,LEEDS:9,'RIT-DuPont':9,WITT:7},models,checks,source_bundle_sha256:def.source_bundle_sha256};
fs.writeFileSync(new URL('verification.json',root),JSON.stringify(out,null,2)+'\n');
let csv='variant,gamut,dataset,pairs,STRESS,scale\n';for(const [id,m]of Object.entries(models)){const [v,g]=id.split('-');for(const [d,z]of Object.entries({...m.subsets,'COMBVD weighted':m.weighted,'COMBVD unweighted':m.unweighted}))csv+=[v,g,d,z.n,z.stress,z.scale].join(',')+'\n';}
fs.writeFileSync(new URL('COMBVD.csv',root),csv);console.log('Publication gate passed');

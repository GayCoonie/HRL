/** Numerical and construction tests for the independently fitted native sRGB profiles. */
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createHRLRefits} from './index.mjs';
import {createRelativeHRL,D65} from '../relative-domain/index.mjs';
import {createRelativeRefit} from '../relative-refit/index.mjs';
const root=new URL('./',import.meta.url),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
const names=process.argv.slice(2);if(!names.length)names.push('balanced','metric');
const paths=['../../a-smooth/source-srgb.json','../../data/hue-field-0.6.json','../../data/release1-angles.json','../rl-c1/atlas.mjs','../relative-domain/geometry.mjs','../relative-domain/context.mjs','../relative-refit/results/balanced.json','../relative-refit/results/metric.json'];
const out={construction:'native sRGB own-anchor source atlas; shared physical hue field/ring; independently fitted native coefficients; no clipped full-domain mapping',hashes:Object.fromEntries(paths.map(p=>[p,hash(p)])),models:{}};
let seed=19371;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),diff=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
const rows=JSON.parse(fs.readFileSync(new URL('results/training-pairs.json',root))),base=await createRelativeHRL({gamut:'srgb',variant:'candidate',overflow:'reject',imaginary:'reject'});
const baselineMask=[];for(const p of rows){try{base.fromXYZ(p.xyz1);base.fromXYZ(p.xyz2);baselineMask.push(p.index);}catch(e){if(!(e instanceof RangeError))throw e;}}
assert.equal(baselineMask.length,3331);
for(const name of names){
 const m=await createHRLRefits({gamut:'srgb',checkpoint:name,overflow:'reject',imaginary:'reject'});
 let dd=0,dv=0,vv=0,du=0,vu=0,uu=0,rt=0,hueChange=0,grayChange=0,changed=0,integerErrors=0,minChannel=1,maxChannel=0;
 const mask=[];
 for(const p of rows){let a,b;try{a=m.importXYZ(p.xyz1);b=m.importXYZ(p.xyz2);}catch(e){if(!(e instanceof RangeError))throw e;continue;}
  assert.deepEqual(a.events,[]);assert.deepEqual(b.events,[]);const d=m.distance(a.coordinates,b.coordinates),w=p.weight;dd+=w*d*d;dv+=w*d*p.dv;vv+=w*p.dv*p.dv;du+=d*d;vu+=d*p.dv;uu+=p.dv*p.dv;mask.push(p.index);
 }
 assert.deepEqual(mask,baselineMask);
 for(let i=0;i<8192;i++){
  const L=i<1024?10**(-6*rand()):rand(),q={H:rand()*360,R:rand()*L,L},xyz=m.toXYZ(q),back=m.fromXYZ(xyz,{neutralHue:q.H}),rgb=m.toRGB(q);
  rt=Math.max(rt,diff(m.embed(q),m.embed(back)));assert(rt<2e-7,'HRL roundtrip exceeded tolerance');
  minChannel=Math.min(minChannel,...rgb);maxChannel=Math.max(maxChannel,...rgb);assert(rgb.every(v=>Number.isFinite(v)&&v>=-2e-9&&v<=1+2e-9));
  const old=base.fromXYZ(xyz,{neutralHue:q.H});hueChange=Math.max(hueChange,Math.abs(((old.H-back.H+540)%360)-180));
  changed=Math.max(changed,diff(m.embed(back),base.embed(old)));
 }
 assert(hueChange<1e-9);assert(changed>1e-4,'New sRGB profile accidentally returned the old calibration');
 for(let H=0;H<360;H+=.5){assert.equal(m.labelForHue(H),base.labelForHue(H));assert.deepEqual(m.vivid(H),base.vivid(H));const rgb=m.toRGB({H,R:1,L:1});assert(Math.abs(Math.min(...rgb))<1e-8&&Math.abs(Math.max(...rgb)-1)<1e-8);}
 for(let i=0;i<=1024;i++){const q={H:31,R:0,L:i/1024};grayChange=Math.max(grayChange,diff(m.toXYZ(q),base.toXYZ(q)));}assert(grayChange<1e-12);
 for(let i=0;i<4096;i++){
  const rgb=Array.from({length:3},()=>Math.floor(rand()*65536)/65535),q=m.fromRGB(rgb),back=m.toRGB(q);
  if(rgb.some((v,j)=>Math.round(v*65535)!==Math.round(back[j]*65535)))integerErrors++;
 }assert.equal(integerErrors,0);
 for(let i=0;i<256;i++){const rgb=[i/255,i/255,i/255],back=m.toRGB(m.fromRGB(rgb));assert.deepEqual(back.map(v=>Math.round(v*255)),[i,i,i]);}
 assert.deepEqual(m.toXYZ({H:0,R:0,L:0}),[0,0,0]);assert(diff(m.toXYZ({H:0,R:0,L:1}),D65)<1e-12);
 const rec=JSON.parse(fs.readFileSync(new URL('results/'+name+'.json',root))),weighted=100*Math.sqrt(1-dv*dv/dd/vv),unweighted=100*Math.sqrt(1-vu*vu/du/uu);
 assert(Math.abs(weighted-rec.research.metrics.weighted_stress)<2e-8,'Optimizer / JS disagreement');
 let nitsDifference=0;const n100=await createHRLRefits({gamut:'srgb',checkpoint:name,referenceWhiteNits:100});
 for(let i=0;i<128;i++){const rgb=[rand(),rand(),rand()];nitsDifference=Math.max(nitsDifference,diff(m.embed(m.fromRGB(rgb)),n100.embed(n100.fromRGB(rgb))));}assert.equal(nitsDifference,0);
 out.models[name]={weighted_stress:weighted,unweighted_stress:unweighted,pairs:mask.length,mask_sha256:crypto.createHash('sha256').update(JSON.stringify(mask)).digest('hex'),mapped_inputs:0,record_sha256:hash('results/'+name+'.json'),random_triangles:8192,max_embedding_roundtrip_error:rt,max_hue_change_degrees:hueChange,unchanged_vivid_samples:720,max_neutral_change:grayChange,integer16_tests:4096,integer16_errors:integerErrors,gray8_tests:256,min_encoded_channel:minChannel,max_encoded_channel:maxChannel,max_change_vs_old_native:changed,referenceWhite100vs300MaxDifference:nitsDifference};console.log(name,out.models[name]);
}
const fullChecks={};
for(const checkpoint of ['balanced','metric']){
 const old=await createRelativeRefit({gamut:'full',checkpoint}),now=await createHRLRefits({gamut:'full',checkpoint});let error=0;
 for(let i=0;i<1024;i++){const L=rand(),q={H:rand()*360,R:rand()*L,L};error=Math.max(error,diff(now.toXYZ(q),old.toXYZ(q)));}assert.equal(error,0);fullChecks[checkpoint]={samples:1024,maxXYZChange:0};
}
out.fullProfilesPreserved=fullChecks;
fs.writeFileSync(new URL('results/verification.json',root),JSON.stringify(out,null,2)+'\n');console.log('Native sRGB construction and refit checks passed');

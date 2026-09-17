/** Exact production-runtime verification, separate from optimizer approximations. */
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createRelativeHRL,D65} from '../relative-domain/index.mjs';import {createRelativeRefit} from './index.mjs';
const root=new URL('./',import.meta.url),checkpoints=process.argv.slice(2);if(!checkpoints.length)checkpoints.push('balanced');
const pairs=JSON.parse(fs.readFileSync(new URL('results/training-pairs.json',root))),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
const sourcePaths=['../relative-domain/geometry.mjs','../relative-domain/context.mjs','../relative-domain/base.mjs','../relative-domain/results/source-full.json','../../data/hue-field-0.6.json','../../data/release1-angles.json','../rl-c1/atlas.mjs'];
const out={definition:'Regular bicone; physical source solid, source atlas, hue field/ring, and neutral shift frozen',hashes:Object.fromEntries(sourcePaths.map(p=>[p,hash(p)])),models:{}};
const diff=(a,b)=>Math.max(...a.map((x,i)=>Math.abs(x-b[i])));let seed=541765;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const baseline=await createRelativeHRL({gamut:'full',variant:'candidate',overflow:'reject',imaginary:'reject'});
for(const name of checkpoints){
 const m=await createRelativeRefit({checkpoint:name,overflow:'reject',imaginary:'reject'});let maxError=0,maxHueChange=0,grayChange=0,integerErrors=0,dd=0,dv=0,vv=0,ddu=0,dvu=0,vvu=0;
 for(const p of pairs){const a=m.importXYZ(p.xyz1),b=m.importXYZ(p.xyz2);assert.deepEqual(a.events,[]);assert.deepEqual(b.events,[]);const d=m.distance(a.coordinates,b.coordinates);assert(Number.isFinite(d));dd+=p.weight*d*d;dv+=p.weight*d*p.dv;vv+=p.weight*p.dv*p.dv;ddu+=d*d;dvu+=d*p.dv;vvu+=p.dv*p.dv;}
 for(let i=0;i<8192;i++){
  const L=i<1024?10**(-6*rand()):rand(),q={H:360*rand(),R:rand()*L,L},x=m.toXYZ(q),back=m.fromXYZ(x,{neutralHue:q.H});
  assert(x.every(Number.isFinite));assert(x[1]>=0&&x[1]<=1+1e-12);const e=diff(m.embed(q),m.embed(back));maxError=Math.max(maxError,e);assert(e<2e-7,`Roundtrip ${JSON.stringify({q,e})}`);
  const old=baseline.fromXYZ(x,{neutralHue:q.H}),hd=Math.abs(((back.H-old.H+540)%360)-180);maxHueChange=Math.max(maxHueChange,hd);assert(hd<1e-9);
 }
 for(let H=0;H<360;H+=.5){assert.equal(m.labelForHue(H),baseline.labelForHue(H));assert.deepEqual(m.vivid(H),baseline.vivid(H));}
 for(let i=0;i<=1024;i++){const q={H:27,R:0,L:i/1024};grayChange=Math.max(grayChange,diff(m.toXYZ(q),baseline.toXYZ(q)));}
 assert(grayChange<1e-12);
 for(let i=0;i<2048;i++){
  const rgb=Array.from({length:3},()=>Math.floor(rand()*65536)/65535),q=m.fromPseudoRGB(rgb),back=m.toPseudoRGB(q);
  if(rgb.some((v,j)=>Math.round(65535*v)!==Math.round(65535*back[j])))integerErrors++;
 }
 assert.equal(integerErrors,0);assert.deepEqual(m.toXYZ({H:0,R:0,L:0}),[0,0,0]);assert(diff(m.toXYZ({H:0,R:0,L:1}),D65)<1e-12);
 const n100=await createRelativeRefit({checkpoint:name,referenceWhiteNits:100}),n300=await createRelativeRefit({checkpoint:name,referenceWhiteNits:300});let nitsDifference=0;
 for(let i=0;i<128;i++){const x=baseline.cone.at(rand()*360,rand(),rand());nitsDifference=Math.max(nitsDifference,diff(n100.embed(n100.fromXYZ(x)),n300.embed(n300.fromXYZ(x))));}
 assert.equal(nitsDifference,0);
 const weighted=100*Math.sqrt(Math.max(0,1-dv*dv/dd/vv)),unweighted=100*Math.sqrt(Math.max(0,1-dvu*dvu/ddu/vvu));
 const record=JSON.parse(fs.readFileSync(new URL('results/'+name+'.json',root)));const optimizer=record.research.metrics.weighted_stress;
 assert(Math.abs(weighted-optimizer)<2e-8,`Python/JS metric mismatch: ${weighted} ${optimizer}`);
 out.models[name]={weighted_stress:weighted,unweighted_stress:unweighted,pairs:pairs.length,mapped_inputs:0,record_sha256:hash('results/'+name+'.json'),free_full_rl_coefficients:record.coefficients[1].flat(2).length,random_triangle_roundtrips:8192,max_embedding_roundtrip_error:maxError,max_hue_change_degrees:maxHueChange,unchanged_vivid_samples:720,neutral_samples:1025,max_neutral_xyz_change:grayChange,integer16_roundtrips:2048,integer16_errors:integerErrors,referenceWhite100vs300MaxCoordinateDifference:nitsDifference};
 console.log(name,JSON.stringify(out.models[name]));
}
const oldNative=await createRelativeHRL({gamut:'srgb',variant:'candidate'}),newNative=await createRelativeRefit({gamut:'srgb'});let nativeDifference=0;
for(let i=0;i<2048;i++){const rgb=[rand(),rand(),rand()],a=oldNative.fromRGB(rgb),b=newNative.fromRGB(rgb);nativeDifference=Math.max(nativeDifference,diff(oldNative.embed(a),newNative.embed(b)));assert.deepEqual(a,b);}
out.native={samples:2048,max_coordinate_change:nativeDifference};
fs.writeFileSync(new URL('results/verification.json',root),JSON.stringify(out,null,2)+'\n');console.log('All refit checks passed');

import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHRLv2,VERSION,DEFINITION_SHA256,BOUNDARY_SHA256,addBlack,addWhite,exchangeNeutral} from '../v2/index.mjs';
import {createSpectralTonalHRL} from '../v2/research/boundary-tonal/index.mjs';
import {VERSION as RELEASE1_VERSION} from '../src/index.mjs';
const read=p=>readFile(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(await read('../v2/research/boundary-tonal/results/metric.json')),DEFINITION_SHA256);
assert.equal(sha(await read('../v2/research/boundary-tonal/boundary-1nm.json')),BOUNDARY_SHA256);
assert.equal(RELEASE1_VERSION,'R15-D Release 1');
assert.equal(VERSION,'2.0.0-beta.1');
const manifest=JSON.parse(await read('../v2/default.json'));
assert.equal(manifest.definitionSHA256,DEFINITION_SHA256);
assert.equal(manifest.checkpoint,'metric');
const results={release:VERSION,coefficientHashVerified:true,boundaryHashVerified:true,release1NameUnchanged:true,refitting:false,profiles:{}};
let seed=927513;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
for(const gamut of ['srgb','full']){
 const beta=await createHRLv2({gamut});
 const reference=await createSpectralTonalHRL({gamut,checkpoint:'metric'});
 assert.equal(beta.release.checkpoint,'metric');assert.equal(beta.release.trial,'metric-b2');
 let maxRoundTrip=0,maxReferenceDifference=0;
 const points=[{H:0,R:0,L:0},{H:269,R:0,L:1},{H:275,R:1,L:1},{H:275,R:.15,L:.3},{H:0,R:0,L:.5}];
 for(let i=0;i<64;i++){const L=random();points.push({H:360*random(),L,R:L*random()});}
 for(const q of points){
  const x=beta.toXYZ(q),old=reference.toXYZ(q);
  const difference=Math.max(...x.map((v,i)=>Math.abs(v-old[i])));
  maxReferenceDifference=Math.max(maxReferenceDifference,difference);
  assert.deepEqual(x,old,'Release facade changed frozen model output');
  const recovered=beta.fromXYZ(x),a=beta.embed(q),b=beta.embed(recovered);
  const error=Math.hypot(...a.map((v,i)=>v-b[i]));maxRoundTrip=Math.max(maxRoundTrip,error);
  assert.ok(error<2e-7,`${gamut}: round-trip ${error}`);
 }
 assert.equal(beta.distance({H:0,R:0,L:0},{H:215,R:0,L:1}),1);
 assert.throws(()=>beta.fromXYZ([NaN,0,0]));
 assert.throws(()=>beta.toXYZ({H:0,R:.8,L:.2}));
 const over=beta.importXYZ([.9504559270516716*1.2,1.2,1.0890577507598787*1.2]);
 assert.ok(over.events.includes('luminance-clipped'));
 const scaled=beta.importXYZ([20,30,10],{xyzScale:100});
 assert.ok(scaled.coordinates.R<=scaled.coordinates.L);
 if(gamut==='srgb'){
  const rgb=[.2,.5,.8],got=beta.toRGB(beta.fromRGB(rgb));
  assert.ok(Math.max(...rgb.map((x,i)=>Math.abs(x-got[i])))<2e-7);
 }else assert.throws(()=>beta.toRGB({H:0,R:.2,L:.5}));
 results.profiles[gamut]={points:points.length,maximumXYZDifferenceFromFrozenMetric:maxReferenceDifference,maxEmbeddingRoundTrip:maxRoundTrip,ceilingEventVerified:true};
}
assert.deepEqual(addBlack({H:0,R:.3,L:.6},.5),{H:0,R:.15,L:.3});
assert.deepEqual(addWhite({H:0,R:.3,L:.6},.5),{H:0,R:.15,L:.8});
assert.deepEqual(exchangeNeutral({H:0,R:.3,L:.6},.2),{H:0,R:.3,L:.8});
await assert.rejects(createHRLv2({checkpoint:'balanced'}));
await assert.rejects(createHRLv2({gamut:'display-p3'}));
await mkdir(new URL('.',import.meta.url),{recursive:true});
await writeFile(new URL('model-checks.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));

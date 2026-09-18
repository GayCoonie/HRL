import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createMappedHRL} from './import.mjs';import {createHueFairHRL} from '../hue-fair-refine/index.mjs';
import {D65,adaptWhite} from '../relative-domain/index.mjs';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex');
const expected={balanced:'159f06a6ea8eeb1bbe6617318ff8057f540f6ea3919e99e8d364a2d7b990c605',gentle:'d560a5891234d1baa59908a8d2ae694dc7c810728bc47cb15d7d7b562b95baf0'};
let seed=170917;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const error=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
const results={checkpoints:{},inDomain:[],units:[],primaryImports:[],fittedOrBoundaryChanges:false};
for(const [name,h]of Object.entries(expected))assert.equal(hash(`../hue-fair-refine/results/${name}.json`),h);
results.checkpoints=expected;
for(const checkpoint of ['balanced','gentle'])for(const gamut of ['srgb','full']){
 const m=await createMappedHRL({gamut,checkpoint}),old=await createHueFairHRL({gamut,checkpoint,overflow:'reject',imaginary:'reject'});let max=0;
 for(let i=0;i<1024;i++){
  const L=rand(),q={H:rand()*360,R:rand()*L,L},xyz=old.toXYZ(q),a=m.importXYZ(xyz),b=old.fromXYZ(xyz);
  assert.equal(a.events.length,0);assert.deepEqual(a.coordinates,b);assert.deepEqual(m.toXYZ(q),xyz);
  max=Math.max(max,error(m.toXYZ(a.coordinates),xyz));
 }
 results.inDomain.push({checkpoint,gamut,samples:1024,bitIdenticalCoordinates:true,bitIdenticalGeneratedXYZ:true,maxXYZRoundtripError:max});
 assert.throws(()=>m.fromXYZ([NaN,0,0]),TypeError);
 assert.throws(()=>m.fromXYZ([0,0]),TypeError);
 for(const Y of [1.0040999958,1.2,100]){const a=m.importXYZ(D65.map(v=>v*Y));assert(Math.abs(a.mappedXYZ[1]-1)<1e-12);assert(a.events.includes('luminance-clipped'));}
}
for(const referenceWhiteNits of [100,300]){
 const m=await createMappedHRL({referenceWhiteNits});
 const r=m.importXYZ(D65.map(v=>v*1.2),{sourceWhiteNits:100}),a=m.importXYZ(D65.map(v=>v*120),{absolute:true});
 assert(error(r.mappedXYZ,a.mappedXYZ)<1e-12);assert(Math.abs(r.mappedXYZ[1]-Math.min(120/referenceWhiteNits,1))<1e-12);
 const d50=[.96422,1,.82521],original=D65.map(v=>v*.4),back=adaptWhite(original,D65,d50),adapted=m.importXYZ(back,{sourceWhite:d50});assert(error(adapted.mappedXYZ,original)<1e-12);
 results.units.push({referenceWhiteNits,sourceWhiteNits:100,sourceRelativeY:1.2,mappedY:r.mappedXYZ[1],events:r.events,absoluteRelativeAgreement:true,bradfordCheck:true});
}
const m=await createMappedHRL(),hundred=await createMappedHRL({referenceWhiteNits:100});
for(let i=0;i<512;i++){const L=rand(),xyz=m.toXYZ({H:rand()*360,R:rand()*L,L});assert.deepEqual(m.fromXYZ(xyz),hundred.fromXYZ(xyz));}
results.sameReferenceScaleIdentitySamples=512;
for(const [name,x,y]of [['P3 red',.68,.32],['2020 red',.708,.292],['2020 green',.170,.797],['2020 blue',.131,.046]]){
 const xyz=[.2*x/y,.2,.2*(1-x-y)/y],r=m.importXYZ(xyz);assert(m.cone.physical(r.mappedXYZ));assert(error(m.toXYZ(r.coordinates),r.mappedXYZ)<1e-8);
 results.primaryImports.push({name,input:xyz,mapped:r.mappedXYZ,events:r.events});
}
for(const [name,h]of Object.entries(expected))assert.equal(hash(`../hue-fair-refine/results/${name}.json`),h);
fs.mkdirSync(new URL('results/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('results/import-tests.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));

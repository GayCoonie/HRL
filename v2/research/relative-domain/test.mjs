import fs from 'node:fs';import assert from 'node:assert/strict';
import {createRelativeHRL,D65,ReferenceContext,adaptWhite} from './index.mjs';
import {createASmooth} from '../../a-smooth/index.mjs';
const m=await createRelativeHRL({imaginary:'reject',overflow:'reject'}),old=await createASmooth({gamut:'full',variant:'parent'}),c=m.carrier,cone=m.cone;
const maxdiff=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));let state=31623;
const rand=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
let carrierError=0,carrierTests=0,rescued=0,maximumCompletion=0;
for(let i=0;i<720;i++)for(const rho of [0,.05,.25,.5,.9,1])for(const Y of [.001,.02,.2,.7,1]){
 const x=cone.at(i/2,rho,Y),q=c.fromXYZ(x),back=c.toXYZ(q);carrierError=Math.max(carrierError,maxdiff(x,back));
 assert(q.every(v=>v>=-1e-12&&v<=1+1e-12));assert(Math.abs(Math.max(...q)-Y)<1e-12);
 maximumCompletion=Math.max(maximumCompletion,cone.completion(x));if(cone.completion(x)>1+2e-10)rescued++;carrierTests++;
}
assert(carrierError<1e-8);assert(rescued>0);
let inverseError=0,maxHueError=0,integerTests=0;
for(let i=0;i<2048;i++){
 const L=rand(),q={H:360*rand(),R:L*rand(),L},xyz=m.toXYZ(q),back=m.fromXYZ(xyz,{neutralHue:q.H}),e=maxdiff(m.embed(q),m.embed(back));inverseError=Math.max(inverseError,e);assert(e<1e-7);
 const native=Array.from({length:3},()=>Math.floor(rand()*65536));assert.deepEqual(c.encode16(c.decode16(native)),native);integerTests++;
 if(cone.completion(xyz)<=1.25){const H=old.field.label(xyz),n=m.model.field.label(xyz);maxHueError=Math.max(maxHueError,Math.abs(((H-n+540)%360)-180));}
}
assert(maxHueError<1e-9);
const green=[.07285208,.78731731,.08983061],g=m.importXYZ(green);assert.deepEqual(g.events,[]);assert.throws(()=>old.fromXYZ(green));assert(maxdiff(m.toXYZ(g.coordinates),green)<1e-8);
const c100=new ReferenceContext({referenceWhiteNits:100}),c300=new ReferenceContext();
assert.equal(c100.toRelative(D65.map(v=>120*v),{absolute:true})[1],1.2);assert.equal(c300.toRelative(D65.map(v=>120*v),{absolute:true})[1],.4);
const over=D65.map(v=>1.2*v);assert(cone.physical(over));assert.throws(()=>m.fromXYZ(over));const clipped=m.importXYZ(over,{overflow:'clip'});assert.deepEqual(clipped.events,['luminance-clipped']);assert(Math.abs(m.toXYZ(clipped.coordinates)[1]-1)<1e-12);
assert(maxdiff(c.toXYZ(c.fromXYZ(over,{extended:true}),{extended:true}),over)<1e-12);
let catError=0;
for(const white of [[.96422,1,.82521],[.98074,1,1.18232],[1.0985,1,.35585]]){
 const x=[.21,.3,.12],local=adaptWhite(x,D65,white),q=m.fromXYZ(local,{sourceWhite:white}),back=m.toXYZ(q,{targetWhite:white});catError=Math.max(catError,maxdiff(back,local));assert(maxdiff(adaptWhite(white,white,D65),D65)<1e-12);
}
assert(catError<1e-8);
const n100=await createRelativeHRL({referenceWhiteNits:100}),n300=await createRelativeHRL({referenceWhiteNits:300});let scaleDifference=0;
for(let i=0;i<256;i++){const x=cone.at(360*rand(),rand(),rand());scaleDifference=Math.max(scaleDifference,maxdiff(n100.embed(n100.fromXYZ(x)),n300.embed(n300.fromXYZ(x))));}
assert.equal(scaleDifference,0);
assert.throws(()=>new ReferenceContext({referenceWhiteNits:0}));assert.throws(()=>m.fromXYZ([NaN,0,0]));
const result={carrierTests,carrierMaxXYZError:carrierError,physicalSamplesFormerlyOverCompletionCap:rescued,maximumSampledCompletion:maximumCompletion,hrlRoundTrips:2048,maxEmbeddingRoundTripError:inverseError,carrierInteger16Exact:integerTests,maxOriginalRangeHueLabelChange:maxHueError,regressionGreen:{input:green,coordinates:g.coordinates,completion:g.completion,events:g.events},bradfordRoundTripError:catError,referenceWhite100vs300RelativeCoordinateDifference:scaleDifference,relativeY1_2IsPhysical:true,clippedAboveWhiteEvents:clipped.events,extendedCarrierPreservesY1_2:true,nitsComparison:'Unit/context scaling only; existing relative appearance calibration has no fitted absolute-luminance response.'};
fs.writeFileSync(new URL('results/verification.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));

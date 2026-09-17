import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createSharedHRL,ADOBE_RGB1998} from './source.mjs';import {sharedCoordinates,darkAmount,darkPhi,inverseDark} from './core.mjs';import {createHRLRefits} from '../native-srgb-refit/index.mjs';
const cache=JSON.parse(fs.readFileSync(new URL('results/cache.json',import.meta.url))),results={models:{},method:'Actual JavaScript runtime; one rounded/frozen bank across all gamut realizations.'};let seed=170926;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),diff=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
for(const checkpoint of ['balanced','metric']){
 const raw=fs.readFileSync(new URL(`results/${checkpoint}.json`,import.meta.url)),record=JSON.parse(raw);assert.equal(record.coefficients.length,1);const r={sha256:crypto.createHash('sha256').update(raw).digest('hex'),profiles:{},sharedBankCount:1};results.models[checkpoint]=r;
 const models=[];
 for(const gamut of ['srgb','full']){
  const m=await createSharedHRL({gamut,record,overflow:'reject',imaginary:'reject'}),old=await createHRLRefits({gamut,checkpoint:'balanced'});models.push(m);let error=0,neutral=0,hue=0;
  for(let i=0;i<4096;i++){const L=i<128?10**(-8+rand()*6):rand(),q={H:rand()*360,R:L*rand(),L},xyz=m.toXYZ(q),back=m.fromXYZ(xyz);error=Math.max(error,diff(m.embed(q),m.embed(back)));if(L>.001)hue=Math.max(hue,Math.abs(((old.fromXYZ(xyz).H-back.H+540)%360)-180));}
  assert(error<1e-7);assert(hue<1e-7);
  for(let i=0;i<=1024;i++){const q={H:39,R:0,L:i/1024};neutral=Math.max(neutral,diff(m.toXYZ(q),old.toXYZ(q)));}assert(neutral<1e-12);
  for(let H=0;H<360;H+=.5)assert(diff(m.vivid(H),old.vivid(H))<1e-10);
  for(let i=0;i<2048;i++){const code=[rand(),rand(),rand()].map(x=>Math.floor(x*65536)),rgb=code.map(x=>x/65535),q=gamut==='srgb'?m.fromRGB(rgb):m.fromPseudoRGB(rgb),back=gamut==='srgb'?m.toRGB(q):m.toPseudoRGB(q);assert.deepEqual(back.map(x=>Math.round(x*65535)),code);}
  const p=cache.profiles[gamut];let dd=0,dv=0,vv=0;
  for(let i=0;i<p.a.length;i++){const a=p.a[i],b=p.b[i],qa=sharedCoordinates({H:a[0],R:a[1],L:a[2]},record),qb=sharedCoordinates({H:b[0],R:b[1],L:b[2]},record),d=m.distance(qa,qb),w=p.w[i];dd+=w*d*d;dv+=w*d*p.dv[i];vv+=w*p.dv[i]**2;}
  const stress=100*Math.sqrt(1-dv*dv/dd/vv);assert(Math.abs(stress-record.research.stats[gamut].stress)<1e-5);
  r.profiles[gamut]={randomRoundTrips:4096,maxEmbeddingError:error,maxHueLabelChange:hue,neutralSamples:1025,maxNeutralChange:neutral,vividSamples:720,exact16BitRoundTrips:2048,combvdWeighted:stress,pairs:p.a.length};console.log(checkpoint,gamut,r.profiles[gamut]);
 }
 let equal=0;for(let i=0;i<1024;i++){const L=rand(),q={H:rand()*360,R:L*rand(),L};assert.deepEqual(models[0].model.fromSource(q),models[1].model.fromSource(q));equal++;}r.bitIdenticalNormalizedTuples=equal;
 let rootError=0,minDerivative=Infinity;
 for(let i=0;i<5000;i++){const a=darkAmount(360*rand(),rand(),record),t=rand();rootError=Math.max(rootError,Math.abs(inverseDark(darkPhi(t,a),a)-t));minDerivative=Math.min(minDerivative,1-a*(1-t)*(1-3*t));}assert(minDerivative>=.15);assert(rootError<2e-13);r.darkCurve={maxInverseError:rootError,minSampledDerivative:minDerivative,analyticLowerBound:.15};
 const g=await createSharedHRL({gamut:ADOBE_RGB1998,record});let e=0;for(let i=0;i<1024;i++){const rgb=[rand(),rand(),rand()],q=g.fromLinearRGB(rgb),back=g.toLinearRGB(q);e=Math.max(e,diff(rgb,back));}assert(e<1e-8);r.thirdGamut={id:'a98-rgb',roundtrips:1024,maxLinearRGBError:e,refitting:false,bankSame:JSON.stringify(g.definition.coefficients)===JSON.stringify(record.coefficients)};
 const scale=await createSharedHRL({gamut:'srgb',record,referenceWhiteNits:100});for(let i=0;i<512;i++){const rgb=[rand(),rand(),rand()];assert.deepEqual(scale.fromRGB(rgb),models[0].fromRGB(rgb));}r.relative100vs300BitIdenticalSamples=512;
 fs.writeFileSync(new URL('results/verification.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
}

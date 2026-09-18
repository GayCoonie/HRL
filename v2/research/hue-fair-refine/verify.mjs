/** Frozen-record checks using the actual JavaScript conversion, not the fit grid. */
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createHueFairHRL,ADOBE_RGB1998,coordinates} from './index.mjs';
import {createSharedHRL} from '../shared-rl/source.mjs';
const root=new URL('./',import.meta.url),names=process.argv.slice(2);if(!names.length)names.push('balanced','gentle');
let seed=170917;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),maxerr=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
const results={seed,models:{},method:'Exact JS inverse, seeded near-black and uniform samples; finite-difference coordinate Jacobian excludes vertices and boundaries.'};
for(const name of names){
 const raw=fs.readFileSync(new URL(`results/${name}.json`,root)),rec=JSON.parse(raw);assert.equal(rec.coefficients.length,1);assert.equal(rec.ring_logits,null);
 const out={sha256:crypto.createHash('sha256').update(raw).digest('hex'),profiles:{}};results.models[name]=out;const ms=[];
 for(const gamut of ['srgb','full']){
  const m=await createHueFairHRL({gamut,record:rec,overflow:'reject',imaginary:'reject'}),old=await createSharedHRL({gamut,checkpoint:'balanced'});ms.push(m);let error=0,neutral=0,hue=0,minDet=Infinity,maxCondition=0,minChannel=Infinity,maxChannel=-Infinity;
  for(let i=0;i<8192;i++){
   const L=i<256?10**(-9+rand()*7):rand(),q={H:rand()*360,R:L*rand(),L},xyz=m.toXYZ(q),b=m.fromXYZ(xyz);error=Math.max(error,maxerr(m.embed(q),m.embed(b)));
   if(L>.001)hue=Math.max(hue,Math.abs(((old.fromXYZ(xyz).H-b.H+540)%360)-180));
   if(gamut==='srgb'){const rgb=m.model.toLinear(q);minChannel=Math.min(minChannel,...rgb);maxChannel=Math.max(maxChannel,...rgb);}
  }
  assert(error<1e-7);assert(hue<1e-7);
  for(let i=0;i<=1024;i++)neutral=Math.max(neutral,maxerr(m.toXYZ({H:39,R:0,L:i/1024}),old.toXYZ({H:39,R:0,L:i/1024})));assert(neutral<1e-12);
  let vivid=0;for(let H=0;H<360;H+=.5)vivid=Math.max(vivid,maxerr(m.vivid(H),old.vivid(H)));assert(vivid<1e-10);
  for(let i=0;i<4096;i++){
   const code=[rand(),rand(),rand()].map(x=>Math.floor(x*65536)),rgb=code.map(x=>x/65535),q=gamut==='srgb'?m.fromRGB(rgb):m.fromPseudoRGB(rgb),back=gamut==='srgb'?m.toRGB(q):m.toPseudoRGB(q);assert.deepEqual(back.map(x=>Math.round(x*65535)),code);
  }
  for(let i=0;i<1200;i++){
   const L=.002+.996*rand(),R=L*(.002+.996*rand()),q={H:360*rand(),R,L},h=1e-4*Math.min(R,L-R,1-L),f=x=>m.model.fromSource(x),a=f({...q,R:R-h}),b=f({...q,R:R+h}),c=f({...q,L:L-h}),d=f({...q,L:L+h});
   const A=(b.R-a.R)/(2*h),B=(d.R-c.R)/(2*h),C=(b.L-a.L)/(2*h),D=(d.L-c.L)/(2*h),det=A*D-B*C,ss=A*A+B*B+C*C+D*D,disc=Math.sqrt(Math.max(0,ss*ss-4*det*det));minDet=Math.min(minDet,det);maxCondition=Math.max(maxCondition,Math.sqrt((ss+disc)/Math.max(1e-30,ss-disc)));
  }assert(minDet>0&&Number.isFinite(maxCondition));
  let seam=0;for(let i=0;i<512;i++){const L=rand(),R=L*rand();seam=Math.max(seam,maxerr(m.toXYZ({H:1e-7,R,L}),m.toXYZ({H:360-1e-7,R,L})));}assert(seam<1e-6);
  if(gamut==='srgb'){assert(minChannel>=-1e-9&&maxChannel<=1+1e-9);}
  out.profiles[gamut]={randomRoundtrips:8192,nearBlackSamples:256,maxEmbeddingError:error,maxHueLabelChange:hue,neutralSamples:1025,maxNeutralChange:neutral,vividSamples:720,maxVividChange:vivid,exact16BitRoundtrips:4096,jacobianSamples:1200,minDet,maxCondition,maxSeamXYZDifference:seam,linearRGBExtent:gamut==='srgb'?[minChannel,maxChannel]:null};
 }
 for(let i=0;i<2048;i++){const L=rand(),q={H:360*rand(),R:L*rand(),L};assert.deepEqual(ms[0].model.fromSource(q),ms[1].model.fromSource(q));}out.identicalNormalizedTuples=2048;
 const third=await createHueFairHRL({gamut:ADOBE_RGB1998,record:rec});let e=0;for(let i=0;i<2048;i++){const rgb=[rand(),rand(),rand()],q=third.fromLinearRGB(rgb),back=third.toLinearRGB(q);e=Math.max(e,maxerr(rgb,back));}assert(e<1e-8);assert.deepEqual(third.definition.coefficients,rec.coefficients);out.untrainedThirdGamut={id:'a98-rgb',samples:2048,maxLinearRGBError:e,refitted:false};
 const s100=await createHueFairHRL({gamut:'srgb',record:rec,referenceWhiteNits:100});for(let i=0;i<1024;i++){const rgb=[rand(),rand(),rand()];assert.deepEqual(s100.fromRGB(rgb),ms[0].fromRGB(rgb));}out.relative100vs300IdentitySamples=1024;
 console.log(name,JSON.stringify(out));fs.writeFileSync(new URL('results/verification.json',root),JSON.stringify(results,null,2)+'\n');
}

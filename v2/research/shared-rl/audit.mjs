/** Exact-runtime edge, round-trip, and conditioning diagnostics, not observer scores. */
import fs from 'node:fs';import assert from 'node:assert/strict';import {createSharedHRL} from './source.mjs';import {createHRLRefits} from '../native-srgb-refit/index.mjs';
const root=new URL('./',import.meta.url),names=process.argv.slice(2);if(!names.length)names.push('old-balanced','balanced','metric');
const dot=(m,x)=>m.map(r=>r.reduce((s,v,i)=>s+v*x[i],0));
const M1=[[.8189330101,.3618667424,-.1288597137],[.0329845436,.9293118715,.0361456387],[.0482003018,.2643662691,.6338517070]],M2=[[.2104542553,.7936177850,-.0040720468],[1.9779984951,-2.4285922050,.4505937099],[.0259040371,.7827717662,-.8086757660]];
const ok=x=>dot(M2,dot(M1,x).map(Math.cbrt)),mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const out={models:{},method:'Actual inverse to XYZ, Oklab lightness normalized separately to each ray endpoint. No preview clipping. Diagonal/ray u=R/L. Jacobian is normalized source R/L to corrected R/L, not a luminance derivative or full XYZ Jacobian.'};
for(const name of names){out.models[name]={};for(const gamut of ['srgb','full']){
 const record=name.startsWith('old')?null:JSON.parse(fs.readFileSync(new URL(`results/${name}.json`,root))),m=record?await createSharedHRL({gamut,record}):await createHRLRefits({gamut,checkpoint:'balanced'});let rt=0,minDet=Infinity,maxCondition=0;const rows=[];
 for(let H=0;H<360;H+=5){for(const u of [.35,.7,.9,1]){
  const xyz=Array.from({length:129},(_,i)=>m.toXYZ({H,R:u*i/128,L:i/128})),vals=xyz.map(ok),endpoint=vals.at(-1)[0],progress=vals.map(v=>v[0]/endpoint),ds=progress.slice(1).map((v,i)=>v-progress[i]);
  const diffs=ds.slice(3,-3),jumps=diffs.slice(1).map((v,i)=>Math.abs(v-diffs[i])/Math.max(1e-12,(v+diffs[i])/2));
  rows.push({H,u,quarter:progress[32],eighth:progress[16],threeEighths:progress[48],maxJump:Math.max(...jumps),meanJump:mean(jumps),negativeY:xyz.slice(1).filter((x,i)=>x[1]<xyz[i][1]-1e-10).length,progress:[progress[8],progress[16],progress[24],progress[32],progress[48],progress[64]]});
 }}
 for(let i=0;i<1200;i++){
  const L=.001+(i*.61803398875%1)*.998,R=L*(.001+(i*.41421356237%1)*.998),H=(i*137.508)%360,q={H,R,L},x=m.toXYZ(q),back=m.fromXYZ(x);rt=Math.max(rt,...m.embed(back).map((v,j)=>Math.abs(v-m.embed(q)[j])));
  if(i<900){const h=1e-6*Math.min(R,L-R,1-L),f=q=>m.model.fromSource(q),a=f({...q,R:R-h}),b=f({...q,R:R+h}),c=f({...q,L:L-h}),d=f({...q,L:L+h});const A=(b.R-a.R)/(2*h),B=(d.R-c.R)/(2*h),C=(b.L-a.L)/(2*h),D=(d.L-c.L)/(2*h),det=A*D-B*C,s=A*A+B*B+C*C+D*D,disc=Math.sqrt(Math.max(0,s*s-4*det*det));minDet=Math.min(minDet,det);maxCondition=Math.max(maxCondition,Math.sqrt((s+disc)/Math.max(1e-25,s-disc)));}
 }
 assert(minDet>0&&Number.isFinite(maxCondition),'Sampled coordinate Jacobian failed');
 const edgeRows=rows.filter(r=>r.u===1),blue=edgeRows.filter(r=>r.H>=260&&r.H<=295);
 out.models[name][gamut]={maxRoundtrip:rt,minDet,maxCondition,jacobianSamples:900,edgeQuarterMean:mean(edgeRows.map(r=>r.quarter)),edgeEighthMean:mean(edgeRows.map(r=>r.eighth)),edgeMeanJump:mean(edgeRows.map(r=>r.meanJump)),edgeWorstJump:Math.max(...edgeRows.map(r=>r.maxJump)),blueQuarterMean:mean(blue.map(r=>r.quarter)),blueMeanJump:mean(blue.map(r=>r.meanJump)),negativeY:rows.reduce((s,r)=>s+r.negativeY,0),rows};
 console.log(name,gamut,JSON.stringify({...out.models[name][gamut],rows:undefined}));fs.writeFileSync(new URL('results/audit-'+names.join('-')+'.json',root),JSON.stringify(out,null,2)+'\n');
}}

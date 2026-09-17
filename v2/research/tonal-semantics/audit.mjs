/** GenSpace-only rerating of unchanged shared 0.10 candidates; no observer refit. */
import fs from 'node:fs';import crypto from 'node:crypto';
import {createSharedHRL} from '../shared-rl/source.mjs';
import {genRuler,pathStats,inspectGenDomain,RULER} from './ruler.mjs';
import {addBlack,addWhite} from './operations.mjs';
const HCOUNT=72,N=129,ratios=[.2,.4,.6,.8,1],root=new URL('./',import.meta.url);
const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
const result={version:'tonal-semantics-1',ruler:RULER,hues:HCOUNT,samplesPerPath:N,ratios,
 baseCommit:'fe0d2804680111d36eb7d8e6309bf3198d0149fe',
 sourceHashes:Object.fromEntries(['../../../src/base/appearance-runtime.mjs','../../../src/base/gen-parameters.mjs','../shared-rl/source.mjs','../shared-rl/core.mjs','../shared-rl/results/balanced.json','../shared-rl/results/metric.json'].map(p=>[p,hash(p)])),
 methods:{black:'Black to upper-edge tint: R=u*t, L=t; reversal of addBlack.',white:'Black-vivid shade to white: addWhite({R:v,L:v}, a).',normalizedLightness:'Gen L divided by Gen L of the same ray endpoint; diagnostic only.',stepStats:'Euclidean GenSpace steps, trim two endpoint steps for CV/jump; all steps for direction.',negativeLightness:'Increasing path parameter lowers Gen L by >1e-8; Descriptive only: a chromatic full-gamut endpoint can have Gen L above white, so a decrease toward white is not by itself an error.',cornerProgress:'Black family reports decreases in distance from black; white family reports increases in distance to white, both in full three-dimensional GenSpace. These are external-ruler diagnostics, not redefinitions of HRL shares.',invalidDomain:'Entire path unavailable if pinned GenSpace needs negative-response clipping. No display clipping in analysis.'},models:{}};
for(const gamut of ['srgb','full'])for(const checkpoint of ['balanced','metric']) {
 const m=await createSharedHRL({gamut,checkpoint,overflow:'reject',imaginary:'reject'}),rows=[];
 let evaluated=0,invalid=0,minResponse=Infinity;
 for(let hi=0;hi<HCOUNT;hi++) {
  const H=hi*360/HCOUNT,row={H,black:[],white:[]};
  for(const family of ['black','white'])for(const ratio of ratios) {
   const xyz=Array.from({length:N},(_,i)=>m.toXYZ(family==='black'?addBlack({H,R:ratio,L:1},1-i/(N-1)):addWhite({H,R:ratio,L:ratio},i/(N-1))));
   let ok=true;
   for(const x of xyz){evaluated++;const d=inspectGenDomain(x);minResponse=Math.min(minResponse,...d.responses);if(!d.valid){invalid++;ok=false;}}
   const record={ratio,valid:ok};
   if(ok){Object.assign(record,pathStats(xyz));const gen=xyz.map(genRuler),end=gen.at(-1)[0];record.lightnessAtQuarter=gen[32][0]/end;record.lightnessAtHalf=gen[64][0]/end;if(ratio===1)record.normalizedLightness=gen.map(p=>p[0]/end);}
   row[family].push(record);
  }rows.push(row);
 }
 const summaries={};
 for(const family of ['black','white']){
  const v=rows.flatMap(r=>r[family]).filter(r=>r.valid),edge=rows.map(r=>r[family].at(-1)).filter(r=>r.valid);
  summaries[family]={validPaths:v.length,totalPaths:HCOUNT*ratios.length,meanCV:avg(v.map(p=>p.cv)),meanStepJump:avg(v.map(p=>p.meanStepJump)),maxStepJump:Math.max(...v.map(p=>p.maxStepJump)),cornerRetreatSteps:v.reduce((s,p)=>s+(family==='black'?p.retreatFromStartSteps:p.retreatFromEndSteps),0),pathsWithCornerRetreat:v.filter(p=>(family==='black'?p.retreatFromStartSteps:p.retreatFromEndSteps)>0).length,negativeLightnessSteps:v.reduce((s,p)=>s+p.negativeLightnessSteps,0),pathsWithNegativeLightness:v.filter(p=>p.negativeLightnessSteps>0).length,edgeQuarterMean:avg(edge.map(p=>p.lightnessAtQuarter)),edgeMeanCV:avg(edge.map(p=>p.cv)),edgeMeanStepJump:avg(edge.map(p=>p.meanStepJump))};
 }
 const key=gamut+'-'+checkpoint;result.models[key]={gamut,checkpoint,evaluated,invalid,minResponse,summaries,rows};
 fs.writeFileSync(new URL('results/genspace-audit.json',root),JSON.stringify(result,null,2)+'\n');console.log(key,JSON.stringify({evaluated,invalid,summaries}));
}
result.comparison={};
for(const gamut of ['srgb','full']){
 const a=result.models[gamut+'-balanced'],b=result.models[gamut+'-metric'];result.comparison[gamut]={};
 for(const family of ['black','white']){
  const outcome={balancedLowerCV:0,metricLowerCV:0,balancedLowerJump:0,metricLowerJump:0,perHue:[]};
  for(let i=0;i<HCOUNT;i++){
   const av=a.rows[i][family],bv=b.rows[i][family];if(av.some(p=>!p.valid)||bv.some(p=>!p.valid))continue;
   const cvA=avg(av.map(p=>p.cv)),cvB=avg(bv.map(p=>p.cv)),jumpA=avg(av.map(p=>p.meanStepJump)),jumpB=avg(bv.map(p=>p.meanStepJump));
   outcome[cvA<=cvB?'balancedLowerCV':'metricLowerCV']++;outcome[jumpA<=jumpB?'balancedLowerJump':'metricLowerJump']++;
   outcome.perHue.push({H:a.rows[i].H,balancedCV:cvA,metricCV:cvB,balancedJump:jumpA,metricJump:jumpB});
  }result.comparison[gamut][family]=outcome;
 }
}
result.transformsChanged=false;result.COMBVDRerun=false;result.note='No new fitting or observer data. Existing COMBVD scores unchanged. These are model-based diagnostics, not verified human preferences.';
fs.writeFileSync(new URL('results/genspace-audit.json',root),JSON.stringify(result,null,2)+'\n');console.log('DONE',JSON.stringify(result.comparison,(k,v)=>k==='perHue'?undefined:v));

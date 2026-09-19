import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createHRLv2} from '../../index.mjs';
import {createContourHRL,fromPhysical,toPhysical} from './index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const root=new URL('./',import.meta.url),input=JSON.parse(fs.readFileSync(new URL('../boundary-tonal/results/training-inputs.json',root))),cache=JSON.parse(fs.readFileSync(new URL('results/cache.json',root)));
const names=process.argv.slice(2);if(!names.length)names.push('beta1','seed','metric','strict');
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const turn=a=>Math.max(0,(a.slice(1).reduce((s,v,i)=>s+Math.abs(v-a[i]),0)-Math.abs(a.at(-1)-a[0]))/2);
function stress(ds,dv,w){let dd=0,dv1=0,vv=0;for(let i=0;i<ds.length;i++){dd+=w[i]*ds[i]**2;dv1+=w[i]*ds[i]*dv[i];vv+=w[i]*dv[i]**2;}return 100*Math.sqrt(Math.max(0,1-dv1**2/dd/vv));}
const levels=[.005,.01,.02,.04,.08,.12,.2],us=Array.from({length:257},(_,i)=>i*.25/256);
const out={schema:'hrl-contour-direct-audit-v1',hues:72,hueOffset:2.5,levels,nearU:[0,.25],nearSamples:257,threshold:.001,observerData:'training only',models:{}};
let rng=260919;const random=()=>((rng=(1664525*rng+1013904223)>>>0)/4294967296);
for(const name of names){out.models[name]={};for(const gamut of ['srgb','full']){
 const model=name==='beta1'?await createHRLv2({gamut}):await createContourHRL({gamut,checkpoint:name}),beta=await createHRLv2({gamut});
 const rows=[];let grayError=0,vividError=0,roundtrip=0,analyticRoundtrip=0,parity=0,negativeLevel=0,worstLevelDrop=0;
 for(let i=0;i<72;i++){
  const H=i*5+2.5;
  for(const L of levels){const values=us.map(U=>genRuler(model.toXYZ({H,R:L*U,L}))[0]);rows.push({H,L,turn:turn(values),start:values[0],end:values.at(-1)});}
  for(const L of [0,.005,.02,.08,.2,.5,.8,1])grayError=Math.max(grayError,...model.toXYZ({H,R:0,L}).map((v,j)=>Math.abs(v-beta.toXYZ({H,R:0,L})[j])));
  vividError=Math.max(vividError,...model.vivid(H).map((v,j)=>Math.abs(v-beta.vivid(H)[j])));
  for(const R of [.0001,.001,.01,.05,.2,.5,.8]){
   const vals=Array.from({length:65},(_,j)=>genRuler(model.toXYZ({H,R,L:R+(1-R)*j/64}))[0]);
   for(let j=1;j<vals.length;j++)if(vals[j]<vals[j-1]-1e-8){negativeLevel++;worstLevelDrop=Math.max(worstLevelDrop,vals[j-1]-vals[j]);}
  }
 }
 for(let i=0;i<300;i++){
  const L=.0001+.9998*random(),q={H:360*random(),R:L*(.0001+.9998*random()),L};
  const r=model.fromXYZ(model.toXYZ(q));roundtrip=Math.max(roundtrip,model.distance(q,r));
  if(name!=='beta1'){const a=fromPhysical(toPhysical(q,model.definition),model.definition);analyticRoundtrip=Math.max(analyticRoundtrip,model.distance(q,a));}
 }
 const indices=gamut==='srgb'?input.native_indices:input.dv.map((_,i)=>i),dist=[];
 for(let k=0;k<indices.length;k++){
  const i=indices[k],a=model.fromXYZ(input.xyz1[i]),b=model.fromXYZ(input.xyz2[i]);dist.push(model.distance(a,b));
  if(name!=='beta1')for(const [key,q] of [['a',a],['b',b]]){const p=cache.profiles[gamut][key][k],a2=fromPhysical({H:p[0],R:p[1],L:p[2]},model.definition);parity=Math.max(parity,model.distance(q,a2));}
 }
 const score={pairs:indices.length,weighted:stress(dist,indices.map(i=>input.dv[i]),indices.map(i=>input.w[i])),unweighted:stress(dist,indices.map(i=>input.dv[i]),indices.map(()=>1))};
 if(gamut==='srgb'){
  const dd=input.dv.map((_,i)=>model.distance(model.fromXYZ(input.xyz1[i]),model.fromXYZ(input.xyz2[i])));
  score.mappedAll={pairs:dd.length,weighted:stress(dd,input.dv,input.w)};
 }
 assert(grayError<1e-12&&vividError<1e-12,'Gray/vivid preservation');assert(roundtrip<2e-7,'XYZ roundtrip embedding error');assert(analyticRoundtrip<2e-12&&parity<2e-7,'Analytic/runtime pair parity');
 const result={score,nearGray:{paths:rows.length,overThreshold:rows.filter(x=>x.turn>.001).length,meanTurn:mean(rows.map(x=>x.turn)),worstTurn:Math.max(...rows.map(x=>x.turn))},grayError,vividError,roundtripEmbeddingError:roundtrip,analyticRoundtrip,pairCoordinateParity:parity,levelOrdering:{negativeSteps:negativeLevel,worstDrop:worstLevelDrop,scope:'72 offset hues, 7 fixed Reach values, 65 Levels per path'},rows};
 if(name!=='beta1')result.recordSHA256=crypto.createHash('sha256').update(fs.readFileSync(new URL(`results/${name}.json`,root))).digest('hex');
 out.models[name][gamut]=result;console.log(name,gamut,JSON.stringify({...result,rows:undefined}));fs.writeFileSync(new URL('results/audit-'+names.join('-')+'.json',root),JSON.stringify(out,null,2)+'\n');
}}
console.log('PASS direct runtime anchors, inverses and pair parity; perceptual diagnostics reported without a universal-fix claim');

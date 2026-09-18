/** Same normalized coordinates for every model. Not an XYZ Jacobian. */
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {sharedCoordinates} from '../shared-rl/core.mjs';
const names=['parent','boundary','balanced','metric'],hues=[...new Set([...Array.from({length:72},(_,i)=>1+5*i),263,269,273,275,277,281,285,293])].sort((a,b)=>a-b),levels=[.001,.005,.02,.05,.1,.2,.35,.5,.65,.8,.95,.99,.999],ratios=[.001,.005,.02,.05,.1,.2,.35,.5,.65,.8,.9,.95,.99,.999];
const out={method:'Identical normalized source H,R,L stencil. Both source and destination R,L Jacobians transformed to the equilateral x,z basis. The learned map is the same in every gamut; this is not the gamut-dependent source-to-XYZ Jacobian.',hues,levels,ratios,step:'1e-5 * min(R,L-R,1-L)',samplesPerModel:hues.length*levels.length*ratios.length,models:{}};
const quant=(a,p)=>a[Math.floor(p*(a.length-1))];
for(const name of names){const raw=fs.readFileSync(new URL(['parent','boundary'].includes(name)?'../hue-fair-refine/results/balanced.json':`results/${name}.json`,import.meta.url)),record=JSON.parse(raw),f=q=>sharedCoordinates(q,record),values=[];let worst=null,minDet=Infinity;
 for(const H of hues)for(const L of levels)for(const U of ratios){const R=L*U,q={H,R,L},h=1e-5*Math.min(R,L-R,1-L),a=f({...q,R:R-h}),b=f({...q,R:R+h}),c=f({...q,L:L-h}),d=f({...q,L:L+h}),A=(b.R-a.R)/(2*h),B=(d.R-c.R)/(2*h),C=(b.L-a.L)/(2*h),D=(d.L-c.L)/(2*h);
  const e=A+B/2,g=Math.sqrt(3)*B/2,k=(2*C+D-A-B/2)/Math.sqrt(3),l=D-B/2,det=e*l-g*k,ss=e*e+g*g+k*k+l*l,top=(ss+Math.sqrt(Math.max(0,ss*ss-4*det*det)))/2,condition=top/Math.abs(det);assert(det>0&&Number.isFinite(condition));values.push(condition);minDet=Math.min(minDet,det);if(!worst||condition>worst.condition)worst={q,U,condition,det};
 }values.sort((a,b)=>a-b);out.models[name]={sha256:crypto.createHash('sha256').update(raw).digest('hex'),minDet,median:quant(values,.5),p95:quant(values,.95),p99:quant(values,.99),maximum:values.at(-1),worst};
}
fs.writeFileSync(new URL('results/conditioning-same-grid.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out.models,null,2));

/** Additional physical path checks: numerical inverse and intensity/chroma direction. */
import fs from 'node:fs';import {createRelativeHRL} from '../relative-domain/index.mjs';import {createRelativeRefit} from './index.mjs';
const names=process.argv.slice(2),out={};
const M1=[[.8189330101,.3618667424,-.1288597137],[.0329845436,.9293118715,.0361456387],[.0482003018,.2643662691,.6338517070]],M2=[[.2104542553,.7936177850,-.0040720468],[1.9779984951,-2.4285922050,.4505937099],[.0259040371,.7827717662,-.8086757660]],dot=(m,x)=>m.map(r=>r.reduce((s,v,i)=>s+v*x[i],0)),ok=x=>dot(M2,dot(M1,x).map(Math.cbrt));
for(const name of names){
 const m=name==='baseline'?await createRelativeHRL({variant:'candidate'}):await createRelativeRefit({checkpoint:name});let yd=0,ydmax=0,cd=0,cdmax=0,ls=0,rs=0;
 for(let H=7.5;H<360;H+=15)for(const axis of ['reach','level'])for(const fixed of [.08,.22,.44,.66,.84,.97]){
  let previous=null;
  for(let j=0;j<=128;j++){
   const t=j/128,q=axis==='reach'?{H,R:fixed*t,L:fixed}:{H,R:fixed,L:fixed+(1-fixed)*t},xyz=m.toXYZ(q),lab=ok(xyz),C=Math.hypot(lab[1],lab[2]);
   if(previous){if(axis==='level'){ls++;const d=xyz[1]-previous.Y;if(d< -1e-9){yd++;ydmax=Math.max(ydmax,-d);}}else{rs++;const d=C-previous.C;if(d< -1e-9){cd++;cdmax=Math.max(cdmax,-d);}}}
   previous={Y:xyz[1],C};
  }
 }
 out[name]={levelSteps:ls,negativeYSteps:yd,maxNegativeYStep:ydmax,reachSteps:rs,negativeOklabChromaSteps:cd,maxNegativeOklabChromaStep:cdmax};console.log(name,out[name]);
}
fs.writeFileSync(new URL('results/direction-diagnostics.json',import.meta.url),JSON.stringify(out,null,2));

/** Visual-path diagnostics, not observer data or ColorBench score substitution. */
import fs from 'node:fs';import {createASmooth} from '../../a-smooth/index.mjs';import {createRLC1} from './index.mjs';
const dot=(m,x)=>m.map(r=>r.reduce((s,v,i)=>s+v*x[i],0));
const M1=[[.8189330101,.3618667424,-.1288597137],[.0329845436,.9293118715,.0361456387],[.0482003018,.2643662691,.6338517070]],M2=[[.2104542553,.7936177850,-.0040720468],[1.9779984951,-2.4285922050,.4505937099],[.0259040371,.7827717662,-.8086757660]];
const ok=x=>dot(M2,dot(M1,x).map(Math.cbrt));
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const quantile=(a,q)=>{a=a.slice().sort((a,b)=>a-b);const t=(a.length-1)*q,i=Math.floor(t);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(t-i);};
const norm=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const names=['balanced'];
const out={method:'Continuous sRGB XYZ -> Oklab; 24 hues x 6 fixed coordinates x 129 samples, per axis. Three endpoint steps excluded. Step-jump = |d[i+1]-d[i]| / mean(d[i+1],d[i]). Proxy diagnostic, not human observation.',models:{}};
for(const name of names){
 let m;if(name==='parent'||name==='smooth')m=await createASmooth({gamut:'srgb',variant:name});
 else if(name==='balanced')m=await createRLC1({gamut:'srgb',variant:'candidate'});
 else if(name==='C1-only')m=await createRLC1({gamut:'srgb'});
 else m=await createRLC1({gamut:'srgb',record:JSON.parse(fs.readFileSync(new URL('results/'+name+'.json',import.meta.url)))});
 const axes={reach:[],level:[]};
 for(let H=0;H<360;H+=15)for(const axis of ['reach','level'])for(const fixed of axis==='reach'?[.12,.28,.5,.72,.9,1]:[0,.12,.28,.5,.72,.9]){
  const pts=[];
  for(let i=0;i<=128;i++){
   const t=i/128,q=axis==='reach'?{H,R:t*fixed,L:fixed}:{H,R:fixed,L:fixed+(1-fixed)*t};
   pts.push(ok(m.toXYZ(q)));
  }
  const ds=pts.slice(1).map((x,i)=>norm(x,pts[i])).slice(3,-3),avg=mean(ds);
  const jumps=ds.slice(1).map((d,i)=>Math.abs(d-ds[i])/((d+ds[i])/2));
  axes[axis].push({H,fixed,cv:Math.sqrt(mean(ds.map(d=>(d-avg)**2)))/avg,mean_jump:mean(jumps),p95_jump:quantile(jumps,.95),max_jump:Math.max(...jumps)});
 }
 const summary={};for(const axis of ['reach','level']){const a=axes[axis];summary[axis]={ramps:a.length,mean_cv:mean(a.map(r=>r.cv)),mean_step_jump:mean(a.map(r=>r.mean_jump)),mean_p95_step_jump:mean(a.map(r=>r.p95_jump)),worst_step_jump:Math.max(...a.map(r=>r.max_jump))};}
 out.models[name]={summary,ramps:axes};console.log(name,summary);fs.writeFileSync(new URL('results/visual-balanced.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
}

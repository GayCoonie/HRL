/** Exact inverse-transform diagnostics. Not observer data or a ColorBench score. */
import fs from 'node:fs';
import {createRelativeHRL} from '../relative-domain/index.mjs';
import {createRelativeRefit} from './index.mjs';
const args=process.argv.slice(2),names=args.length?args:['baseline','metric2','metric3'];
const dense=process.env.DENSE==='1',nh=dense?48:24,steps=dense?257:129;
const dot=(M,x)=>M.map(r=>r.reduce((s,v,i)=>s+v*x[i],0));
const M1=[[.8189330101,.3618667424,-.1288597137],[.0329845436,.9293118715,.0361456387],[.0482003018,.2643662691,.6338517070]],M2=[[.2104542553,.7936177850,-.0040720468],[1.9779984951,-2.4285922050,.4505937099],[.0259040371,.7827717662,-.8086757660]];
const RGB=[[3.2409699419045226,-1.537383177570094,-.4986107602930034],[-.9692436362808796,1.8759675015077202,.0415550574071756],[.0556300796969937,-.2039769588889765,1.0569715142428786]];
const ok=x=>dot(M2,dot(M1,x).map(Math.cbrt));
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const quantile=(a,q)=>{a=a.slice().sort((a,b)=>a-b);const x=q*(a.length-1),i=Math.floor(x);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(x-i);};
const norm=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const out={domain:'full relative-Y solid; no physical stimulus clipping in metrics',method:'Actual JS toXYZ -> Oklab, constant public Reach and Level paths. Float XYZ, exclude three endpoint steps. Training used a separate interpolated surrogate.',hue_samples:nh,hue_offset_degrees:360/nh/2,steps,models:{}};
for(const name of names){
 const m=name==='baseline'?await createRelativeHRL({gamut:'full',variant:'candidate',overflow:'reject',imaginary:'reject'}):await createRelativeRefit({checkpoint:name,overflow:'reject',imaginary:'reject'});
 const ramps={reach:[],level:[]};let displayClipped=0,count=0,maxXYZ=0;
 for(let i=0;i<nh;i++)for(const axis of ['reach','level'])for(const fixed of axis==='reach'?[.08,.22,.44,.66,.84,.97]:[0,.08,.22,.44,.66,.84]){
  const H=(i+.5)*360/nh,pts=[];
  for(let j=0;j<steps;j++){
   const t=j/(steps-1),q=axis==='reach'?{H,R:fixed*t,L:fixed}:{H,R:fixed,L:fixed+(1-fixed)*t};
   const xyz=m.toXYZ(q);if(!xyz.every(Number.isFinite))throw Error('Nonfinite XYZ');
   maxXYZ=Math.max(maxXYZ,...xyz);const rgb=dot(RGB,xyz);if(rgb.some(x=>x< -2e-10||x>1+2e-10))displayClipped++;count++;
   pts.push(ok(xyz));
  }
  const ds=pts.slice(1).map((v,j)=>norm(v,pts[j])).slice(3,-3),avg=mean(ds);
  const jumps=ds.slice(1).map((v,j)=>Math.abs(v-ds[j])/((v+ds[j])/2));
  ramps[axis].push({H,fixed,cv:Math.sqrt(mean(ds.map(v=>(v-avg)**2)))/avg,mean_jump:mean(jumps),p95_jump:quantile(jumps,.95),max_jump:Math.max(...jumps),peak_step_ratio:Math.max(...ds)/avg});
 }
 const summary={};for(const axis of ['reach','level']){const rs=ramps[axis];summary[axis]={ramps:rs.length,mean_cv:mean(rs.map(r=>r.cv)),p95_cv:quantile(rs.map(r=>r.cv),.95),mean_step_jump:mean(rs.map(r=>r.mean_jump)),mean_p95_step_jump:mean(rs.map(r=>r.p95_jump)),worst_step_jump:Math.max(...rs.map(r=>r.max_jump)),max_peak_step_ratio:Math.max(...rs.map(r=>r.peak_step_ratio))};}
 out.models[name]={summary,ramps,displayOutOfSRGB:{n:displayClipped,total:count,fraction:displayClipped/count},maxXYZ};
 console.log(name,JSON.stringify(summary));
 fs.writeFileSync(new URL(`results/visual-${dense?'dense':'screen'}-${names.join('-')}.json`,import.meta.url),JSON.stringify(out,null,2)+'\n');
}

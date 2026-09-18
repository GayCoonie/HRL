/** Direct-runtime evaluation, never the optimizer's interpolated surrogate. */
import fs from 'node:fs';import crypto from 'node:crypto';
import {createSpectralTonalHRL} from './index.mjs';import {createMappedHRL} from '../mapped-012/import.mjs';
import {genRuler,pathStats,GEN_WHITE} from '../tonal-semantics/ruler.mjs';
const root=new URL('./',import.meta.url),names=process.argv.slice(2),HCOUNT=+(process.env.HUES||36),N=+(process.env.SAMPLES||129),offset=+(process.env.OFFSET||2.5);
const ratios=[.12,.32,.55,.78,1],other=[.06,.22,.45,.68,.88],families=['black','white','exchange','reach'];const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
const cache=JSON.parse(fs.readFileSync(new URL('results/cache.json',root))),out={hues:HCOUNT,samples:N,hueOffset:offset,modelBased:true,method:'Actual inverse XYZ and frozen 3D GenSpace. No display clipping. Two endpoint steps trimmed for CV/jump only.',models:{}};
for(const name of names){out.models[name]={};for(const gamut of ['srgb','full']){
 const file=['parent','boundary'].includes(name)?'../hue-fair-refine/results/balanced.json':`${fs.existsSync(new URL('results/'+name+'.json',root))?'results':'trials'}/${name}.json`,raw=fs.readFileSync(new URL(file,root)),record=JSON.parse(raw);
 const m=name==='parent'?await createMappedHRL({gamut,checkpoint:'balanced'}):await createSpectralTonalHRL({gamut,checkpoint:name,record});const rows=[];
 for(let hi=0;hi<HCOUNT;hi++){
  const H=(360*hi/HCOUNT+offset)%360,row={H};
  for(const family of families){row[family]=[];for(const r of ['black','white'].includes(family)?ratios:other){
   const xyz=Array.from({length:N},(_,i)=>{const t=i/(N-1),q=family==='black'?{H,R:r*t,L:t}:family==='white'?{H,R:r*(1-t),L:t+r*(1-t)}:family==='exchange'?{H,R:r,L:r+(1-r)*t}:{H,R:r*t,L:r};return m.toXYZ(q);});
   const s=pathStats(xyz),gen=xyz.map(genRuler);s.ratio=r;
   if(family==='black'&&r===1){const end=Math.hypot(...gen.at(-1));s.quarterNorm=gen[Math.round((N-1)/4)][0]/gen.at(-1)[0];s.quarterDistance=Math.hypot(...gen[Math.round((N-1)/4)])/end;}
   // Quantify retreat magnitude, not just a threshold count.
   const corner=family==='black'?gen[0]:gen.at(-1),d=gen.map(x=>Math.hypot(...x.map((v,j)=>v-corner[j]))),den=Math.max(d[0],d.at(-1),1e-12);let worst=0,total=0;
   for(let i=1;i<d.length;i++){const v=family==='black'?d[i-1]-d[i]:d[i]-d[i-1];if(v>0){total+=v;worst=Math.max(worst,v);}}
   s.retreatAmountFraction=total/den;s.worstRetreatFraction=worst/den;row[family].push(s);
  }}rows.push(row);
 }
 const summaries={};for(const f of families){const r=rows.flatMap(x=>x[f]),cornerField=f==='black'?'retreatFromStartSteps':'retreatFromEndSteps';summaries[f]={meanCV:avg(r.map(x=>x.cv)),meanStepJump:avg(r.map(x=>x.meanStepJump)),worstStepJump:Math.max(...r.map(x=>x.maxStepJump)),cornerRetreatPaths:r.filter(x=>x[cornerField]>0).length,totalPaths:r.length,meanRetreatFraction:avg(r.map(x=>x.retreatAmountFraction)),worstRetreatFraction:Math.max(...r.map(x=>x.worstRetreatFraction))};}
 const edge=rows.map(x=>x.black.at(-1)),blue=rows.filter(x=>x.H>=260&&x.H<=295).map(x=>x.black.at(-1));
 const paircache=name==='parent'?JSON.parse(fs.readFileSync(new URL('../shared-rl/results/cache.json',root))):cache;const p=paircache.profiles[gamut];let dd=0,dv=0,vv=0,dd0=0,dv0=0,vv0=0;
 for(let i=0;i<p.a.length;i++){const q=x=>m.model.fromSource({H:x[0],R:x[1],L:x[2]}),d=m.distance(q(p.a[i]),q(p.b[i])),w=p.w[i],v=p.dv[i];dd+=w*d*d;dv+=w*d*v;vv+=w*v*v;dd0+=d*d;dv0+=d*v;vv0+=v*v;}
 const scores={weighted:100*Math.sqrt(1-dv*dv/(dd*vv)),unweighted:100*Math.sqrt(1-dv0*dv0/(dd0*vv0)),pairs:p.a.length};
 out.models[name][gamut]={sha256:crypto.createHash('sha256').update(raw).digest('hex'),scores,summaries,edge:{quarterGenLightness:avg(edge.map(x=>x.quarterNorm)),quarterGenDistance:avg(edge.map(x=>x.quarterDistance)),blueQuarterGenLightness:avg(blue.map(x=>x.quarterNorm))},rows};
 fs.writeFileSync(new URL(`results/direct-${HCOUNT}-${N}-${names.join('_')}.json`,root),JSON.stringify(out,null,2)+'\n');console.log(name,gamut,JSON.stringify({scores,summaries,edge:out.models[name][gamut].edge}));
}}

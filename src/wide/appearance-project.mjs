import {makeHueMapper} from './appearance-map.mjs';
import {retuneRecord,retuneMapper} from './reach-level-retune.mjs';
import {measure} from './project.mjs';
import {makeAppearanceHueIndex} from './appearance-hue.mjs';
import {edge,mod} from '../base/core.mjs';
export function makeAppearanceProjector({gamut='srgb',manifest=null,cacheLimit=24,fit='original'}={}){
 const index=makeAppearanceHueIndex({gamut,manifest}),cache=new Map(),stats={projections:0,boundaryFallbacks:0,maxPreFallbackOvershoot:0};
 function at(i){i=mod(i,1530);if(cache.has(i))return cache.get(i);const m=makeHueMapper({gamut,edge:edge(i*360/1530)});cache.set(i,m);if(cache.size>cacheLimit)cache.delete(cache.keys().next().value);return m;}
 function edgeAtHue(h){const q=index.bracket(h);let lo=q.low,hi=q.low+1;for(let i=0;i<28;i++){const mid=(lo+hi)/2,value=measure(edge(mid*360/1530),gamut).h,d=mod(value-h+180,360)-180;if(d<0)lo=mid;else hi=mid;}return {edge:edge((lo+hi)/2*360/1530),nativeHue:mod((lo+hi)/2*360/1530,360)};}
 function exact(rgb,raw){const q=edgeAtHue(raw.h),m=makeHueMapper({gamut,edge:q.edge});return {...m.forward(rgb),nativeHue:q.nativeHue};}
 function project(rgb,{precise=false}={}){
  stats.projections++;const raw=measure(rgb,gamut),low=Math.min(...rgb),high=Math.max(...rgb);
  if(high-low<1e-15||raw.C===0){const l=Math.max(0,Math.min(1,raw.J/100));return {R:0,L:26*l,b:1-l,c:0,w:l,raw,nativeHue:0};}
  if(precise)return exact(rgb,raw);
  const q=index.bracket(raw.h),a=at(q.low),b=at(q.high),Cv=a.Cv*(1-q.f)+b.Cv*q.f;let c=raw.C/Cv;if(Math.abs(c-1)<1e-10)c=1;
  if(low===0&&high===1)return {R:26,L:26,b:0,c:1,w:0,raw,nativeHue:q.nativeHue};
  if(c<0||c>1+1e-7)return exact(rgb,raw);c=Math.max(0,Math.min(1,c));
  let t;if(low===0)t=0;else if(high===1)t=1;else{const ba=a.sampleBoundary(c),bb=b.sampleBoundary(c),kb=ba.Kblack*(1-q.f)+bb.Kblack*q.f,kw=ba.Kwhite*(1-q.f)+bb.Kwhite*q.f;t=(kb-raw.K)/(kb-kw);if(t<0||t>1){stats.boundaryFallbacks++;stats.maxPreFallbackOvershoot=Math.max(stats.maxPreFallbackOvershoot,-t,t-1);return exact(rgb,raw);}}
  if(!Number.isFinite(t)||t<0||t>1)throw Error('Appearance projection escaped triangle');const w=(1-c)*t;return {R:26*c,L:26*(c+w),b:(1-c)*(1-t),c,w,raw,nativeHue:q.nativeHue};
 }
 return {project:(rgb,options)=>retuneRecord(project(rgb,options),fit),index,at:i=>retuneMapper(at(i),fit),edgeAtHue,stats,fit};
}

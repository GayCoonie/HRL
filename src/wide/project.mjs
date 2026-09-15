import {makeTriangleMapper,nativeEdge} from './triangle-map.mjs';
import {makeNeutralZcam} from './zcam-neutral-reference.mjs';
import {rgbToXYZ} from '../base/appearance-runtime.mjs';
import {edge,hsv} from '../base/core.mjs';
const zcam=makeNeutralZcam();
export const measure=(rgb,gamut='srgb')=>zcam(rgbToXYZ(rgb,{gamut}).map(x=>x*300));
export function makeProjector({gamut='srgb',cacheLimit=192}={}){
 const cache=new Map(),stats={projections:0,boundaryFallbacks:0,maxPreFallbackOvershoot:0};
 function at(i){i=(i+1530)%1530;if(cache.has(i))return cache.get(i);const m=makeTriangleMapper({gamut,edge:edge(i*360/1530),samples:129});cache.set(i,m);if(cache.size>cacheLimit)cache.delete(cache.keys().next().value);return m}
 function project(rgb){
  stats.projections++;const n=nativeEdge(rgb,gamut),raw=measure(rgb,gamut);
  if(n.neutral){const l=Math.max(0,Math.min(1,raw.J/100));return {R:0,L:26*l,b:1-l,c:0,w:l,raw};}
  const Cv=measure(n.edge,gamut).C;let c=raw.C/Cv;if(Math.abs(c-1)<1e-10)c=1;
  if(c<0||c>1+1e-8)throw Error('Chroma exceeds its native vivid boundary.');c=Math.min(1,Math.max(0,c));
  const lo=Math.min(...rgb),hi=Math.max(...rgb);
  if(lo===0&&hi===1)return {R:26,L:26,b:0,c:1,w:0,raw};
  let t;if(lo===0)t=0;else if(hi===1)t=1;else{
   const key=hsv(n.edge).h*1530/360,k=Math.floor(key),f=key-k,a=at(k).sampleBoundary(c),b=at(k+1).sampleBoundary(c),kb=a.Kblack*(1-f)+b.Kblack*f,kw=a.Kwhite*(1-f)+b.Kwhite*f;
   t=(kb-raw.K)/(kb-kw);
   if(t<0||t>1){stats.boundaryFallbacks++;stats.maxPreFallbackOvershoot=Math.max(stats.maxPreFallbackOvershoot,-t,t-1);const m=makeTriangleMapper({gamut,edge:n.edge,samples:257});const d=m.forward(rgb);t=(d.L/26-c)/(1-c);if(t<0||t>1){const bounds=directBounds(c*Cv,n.linearEdge);t=(bounds.kb-raw.K)/(bounds.kb-bounds.kw);}}
  }
  if(t< -1e-7||t>1+1e-7||!Number.isFinite(t))throw Error('Native appearance calibration escaped the triangle.');t=Math.max(0,Math.min(1,t));
  const w=(1-c)*t,b=(1-c)*(1-t);return {R:26*c,L:26*(c+w),b,c,w,raw};
 }
 function directBounds(C,e){const read=(p,top)=>measure(e.map(v=>{const lin=top?1-p*(1-v):p*v;return encode(lin)}),gamut).C;const encode=x=>gamut==='srgb'?(x<=.0031308?x*12.92:1.055*x**(1/2.4)-.055):(x<.018053968510807?4.5*x:1.09929682680944*x**.45-.09929682680944);
  const bound=top=>{let a=0,b=1;for(let i=0;i<38;i++){const p=(a+b)/2;if(read(p,top)<C)a=p;else b=p}const p=(a+b)/2;return measure(e.map(v=>encode(top?1-p*(1-v):p*v)),gamut).K};return {kb:bound(false),kw:bound(true)};
 }
 return {project,stats};
}

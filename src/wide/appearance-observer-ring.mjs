import {makeAppearanceProjector} from './appearance-project.mjs';
import {makeHueMapper} from './appearance-map.mjs';
import {makeHueAccess} from './hue.mjs';
import {observerRingCalibration} from './observer-ring-calibration.mjs';
import {PARAMETERS,retuneObserverRing,unretuneObserverRing} from './observer-ring-retune.mjs';
import {edge,nearestSheet} from '../base/core.mjs';

export function makeObserverRingAppearanceProjector({gamut='srgb',manifest,cal,wideH,cacheLimit=256,projectionCacheLimit=256,parameters=PARAMETERS}={}){
 const original=makeAppearanceProjector({gamut,manifest,cacheLimit:projectionCacheLimit});
 const sourceHues=makeHueAccess(cal,wideH),ringCal=observerRingCalibration(cal,parameters),cache=new Map();
 function originalAt(H){
  const native=sourceHues.hueToNative(H,gamut),key=native.toPrecision(16);
  if(cache.has(key))return cache.get(key);
  const m=makeHueMapper({gamut,edge:edge(native)});cache.set(key,m);
  if(cache.size>cacheLimit)cache.delete(cache.keys().next().value);
  return m;
 }
 function project(rgb,options){
  const p=original.project(rgb,options),sourceH=sourceHues.nativeToHue(p.nativeHue,gamut);
  const q=retuneObserverRing(sourceH,p.R,p.L,26,parameters);
  return {...p,...q,c:q.R/26,w:(q.L-q.R)/26,b:1-q.L/26,sourceH,sourceNativeHue:p.nativeHue,fit:'observer8'};
 }
 function mapper(H){
  const vividSource=unretuneObserverRing(H,26,26,26,parameters),base=originalAt(vividSource.H);
  return {...base,fit:'observer8',H,forward:rgb=>project(rgb,{precise:true}),inverse:(R,L)=>{
   const p=unretuneObserverRing(H,R,L,26,parameters);return originalAt(p.H).inverse(p.R,p.L);
  }};
 }
 function rgbSheet(rgb){
  if(rgb.length!==3||rgb.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Expected RGB8 integers.');
  if(Math.min(...rgb)===Math.max(...rgb)||Math.min(...rgb)===0&&Math.max(...rgb)===255)return original.index.rgbSheet(rgb);
  return nearestSheet(ringCal,project(rgb.map(v=>v/255)).H);
 }
 return {project,mapper,index:{...original.index,rgbSheet},originalIndex:original.index,edgeAtHue:original.edgeAtHue,stats:original.stats,ringCal,fit:'observer8'};
}

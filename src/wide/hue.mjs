import {edge,mod,nearestSheet} from '../base/core.mjs';
export function makeHueAccess(cal,wideH){
 const N=wideH.length,sorted=wideH.map((H,i)=>({H:mod(H,360),i})).sort((a,b)=>a.H-b.H);
 const accepted=[cal.sheetToHue[0]],exactLabels=new Map(cal.sheetToHue.map((H,i)=>[H,i]));
 for(let i=1;i<1530;i++)accepted.push(accepted.at(-1)+mod(cal.sheetToHue[i]-cal.sheetToHue[i-1],360));
 accepted.push(accepted[0]+360);
 function srgbHue(native){const u=mod(native,360)*1530/360,i=Math.floor(u);return mod(accepted[i]+(accepted[i+1]-accepted[i])*(u-i),360)}
 function nativeSrgb(H){if(exactLabels.has(H))return exactLabels.get(H)*360/1530;const h=accepted[0]+mod(H-accepted[0],360);let lo=0,hi=1530;while(hi-lo>1){const m=(lo+hi)>>1;if(accepted[m]<=h)lo=m;else hi=m;}return mod((lo+(h-accepted[lo])/(accepted[lo+1]-accepted[lo]))*360/1530,360)}
 const lerpHue=(a,b,f)=>mod(a+mod(b-a,360)*f,360);
 function wideHue(native){const x=mod(native,360)/360*N,i=Math.floor(x);return lerpHue(wideH[i],wideH[(i+1)%N],x-i)}
 function nativeWide(H){H=mod(H,360);let a=0,b=sorted.length;while(a<b){const m=(a+b)>>1;if(sorted[m].H<H)a=m+1;else b=m}const low=sorted[(a+N-1)%N],high=sorted[a%N],span=mod(high.H-low.H,360),f=span?mod(H-low.H,360)/span:0;return mod((low.i+mod(high.i-low.i,N)*f)/N*360,360)}
 function resolve(H,gamut='srgb'){if(gamut==='srgb'){const sheet=nearestSheet(cal,H);return {H:cal.sheetToHue[sheet],sheet,edge:edge(sheet*360/1530)}}return {H:mod(H,360),sheet:null,edge:edge(nativeWide(H))}}
 return {resolve,wideHue,nativeWide,srgbHue,nativeSrgb,nativeToHue:(h,gamut='srgb')=>gamut==='srgb'?srgbHue(h):wideHue(h),hueToNative:(H,gamut='srgb')=>gamut==='srgb'?nativeSrgb(H):nativeWide(H)};
}

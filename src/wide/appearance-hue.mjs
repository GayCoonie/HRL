// Vivid anchors retain their accepted HRL labels. Interior membership uses
// neutral-corrected ZCAM appearance hue at 300 cd/m², not encoded HSV hue.
import {measure} from './project.mjs';
import {edge,mod} from '../base/core.mjs';
export function makeAppearanceHueIndex({gamut='srgb',manifest=null}={}){
 const values=manifest?.appearanceHue??Array.from({length:1530},(_,i)=>measure(edge(i*360/1530),gamut).h),angles=[values[0]];
 for(let i=1;i<values.length;i++)angles.push(angles.at(-1)+mod(values[i]-values[i-1],360));
 if(angles.at(-1)-angles[0]>=360||angles.some((h,i)=>i&&h<=angles[i-1]))throw Error('Appearance hue ring is not strictly ordered.');
 const base=angles[0],last=angles.at(-1),extended=[...angles,base+360],mid=angles.map((h,i)=>(h+(i?angles[i-1]:last-360))/2),lastMid=(last+base+360)/2;
 function bracket(h){const x=base+mod(h-base,360);let lo=0,hi=1530;while(hi-lo>1){const m=(lo+hi)>>1;if(extended[m]<=x)lo=m;else hi=m;}const f=(x-extended[lo])/(extended[lo+1]-extended[lo]);return {low:lo,high:(lo+1)%1530,f,nativeHue:(lo+f)*360/1530};}
 function sheet(h){const x=base+mod(h-base,360);if(x>=lastMid)return 0;let lo=0,hi=1530;while(lo<hi){const m=(lo+hi)>>1;if(mid[m]<=x)lo=m+1;else hi=m;}return Math.max(0,lo-1);}
 function rgbSheet(rgb){if(!manifest)throw Error('An RGB8 inventory is required.');if(rgb.length!==3||rgb.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Expected RGB8 integers.');const low=Math.min(...rgb),high=Math.max(...rgb);if(low===high)return manifest.graySheets[rgb[0]];if(low===0&&high===255){const[r,g,b]=rgb;return mod(high===r?g-b:high===g?510+b-r:1020+r-g,1530);}return sheet(measure(rgb.map(v=>v/255),gamut).h);}
 return {angles,values,bracket,sheet,rgbSheet};
}

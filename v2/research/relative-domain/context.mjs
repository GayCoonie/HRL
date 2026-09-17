/** Source-white adaptation and units. Reference white is not a clipping operator. */
import {D65,triple,dot} from './geometry.mjs';
export const BRADFORD=[[.8951,.2664,-.1614],[-.7502,1.7135,.0367],[.0389,-.0685,1.0296]];
function invert(M){const[[a,b,c],[d,e,f],[g,h,i]]=M,z=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);if(!Number.isFinite(z)||Math.abs(z)<1e-20)throw RangeError('Singular matrix');return[[e*i-f*h,c*h-b*i,b*f-c*e],[f*g-d*i,a*i-c*g,c*d-a*f],[d*h-e*g,b*g-a*h,a*e-b*d]].map(r=>r.map(x=>x/z));}
const BI=invert(BRADFORD);
export function normalizeWhite(input=D65){const w=triple(input,'white');if(w[1]<=0)throw RangeError('Reference white Y must be positive');return w.map(x=>x/w[1]);}
export function adaptWhite(xyz,source=D65,target=D65){
 xyz=triple(xyz);source=normalizeWhite(source);target=normalizeWhite(target);
 if(source.every((v,i)=>v===target[i]))return xyz;
 const a=BRADFORD.map(r=>dot(r,source)),b=BRADFORD.map(r=>dot(r,target));
 if(a.some(v=>v<=0)||b.some(v=>v<=0))throw RangeError('Reference white has invalid Bradford responses');
 const c=BRADFORD.map((r,i)=>dot(r,xyz)*b[i]/a[i]);return BI.map(r=>dot(r,c));
}
export class ReferenceContext {
 constructor({referenceWhiteNits=300}={}){if(!Number.isFinite(referenceWhiteNits)||referenceWhiteNits<=0)throw RangeError('Positive referenceWhiteNits required');this.referenceWhiteNits=referenceWhiteNits;this.white=D65;}
 toRelative(xyz,{sourceWhite=D65,absolute=false,xyzScale=1}={}){
  xyz=triple(xyz);if(!Number.isFinite(xyzScale)||xyzScale<=0)throw RangeError('Positive xyzScale required');
  if(absolute&&xyzScale!==1)throw RangeError('Absolute XYZ uses physical units, not xyzScale');
  const scale=absolute?this.referenceWhiteNits:xyzScale;
  return adaptWhite(xyz.map(v=>v/scale),sourceWhite,D65);
 }
 fromRelative(xyz,{targetWhite=D65,absolute=false,xyzScale=1}={}){
  if(!Number.isFinite(xyzScale)||xyzScale<=0)throw RangeError('Positive xyzScale required');
  if(absolute&&xyzScale!==1)throw RangeError('Absolute XYZ uses physical units, not xyzScale');
  const scale=absolute?this.referenceWhiteNits:xyzScale;
  return adaptWhite(triple(xyz),D65,targetWhite).map(v=>v*scale);
 }
}

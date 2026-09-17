/** One coefficient bank. The gamut supplies only the source geometry.
 * K=1-L, W=L-R, chromaticness=R. U=R/L is only an internal ratio.
 */
import {freeCoordinates,OPALFreeModel} from '../../a-smooth/rl-core.mjs';
const wrap=h=>((h%360)+360)%360;
function valid(q){if(!q||![q.H,q.R,q.L].every(Number.isFinite)||q.R<0||q.L>1||q.R>q.L)throw new RangeError('Require 0 <= R <= L <= 1 and finite hue');}
export function darkAmount(H,U,record){
 const d=record.dark;if(!d)return 0;
 const t=wrap(H)*Math.PI/180;let v=d.coefficients[0];
 for(let k=1;k<=d.harmonics;k++)v+=d.coefficients[2*k-1]*Math.cos(k*t)+d.coefficients[2*k]*Math.sin(k*t);
 return d.cap/(1+Math.exp(-v))*U*U;
}
export function darkPhi(t,a){return t*(1-a*(1-t)*(1-t));}
export function inverseDark(y,a){
 if(y===0||y===1||a===0)return y;
 let lo=y,hi=1,t=Math.min(1,y/(1-a));
 for(let i=0;i<60;i++){
  const error=darkPhi(t,a)-y;if(Math.abs(error)<2e-15)return t;
  if(error>0)hi=t;else lo=t;
  const slope=1-a*(1-t)*(1-3*t),n=t-error/slope;t=n>lo&&n<hi?n:(lo+hi)/2;
 }
 return (lo+hi)/2;
}
export function sharedCoordinates(q,record,inverse=false){
 valid(q);
 if(record.gamut_calibration!=='shared'||record.coefficients.length!==1||record.ring_logits!==null)throw Error('One bank and unchanged hue ring required');
 // The inherited routine uses bank zero for the literal key srgb. Here there
 // is only bank zero: no gamut argument or identifier enters the learned map.
 if(inverse){const U=q.L===0?0:q.R/q.L,L=darkPhi(q.L,darkAmount(q.H,U,record));return freeCoordinates({H:q.H,R:L*U,L},record,'srgb',true);}
 const b=freeCoordinates(q,record,'srgb',false),U=b.L===0?0:b.R/b.L,L=inverseDark(b.L,darkAmount(b.H,U,record));return {H:b.H,R:L*U,L};
}
export class SharedModel extends OPALFreeModel {
 constructor(source,record){
  if(record.gamut_calibration!=='shared'||record.coefficients.length!==1)throw Error('A single shared bank is mandatory');
  if(record.dark&&(!(record.dark.cap>=0&&record.dark.cap<1)||record.dark.coefficients.length!==1+2*record.dark.harmonics))throw Error('Invalid monotone dark-curve definition');
  super(source,record);this.name='HRL shared R/L '+record.variant;this.version='0.10-shared-RL';
 }
 toSource(q){return sharedCoordinates(q,this.record,true);}
 fromSource(q){return sharedCoordinates(q,this.record,false);}
}

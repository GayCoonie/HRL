/** Experimental physical Level contours, reconstructed after the interrupted run.
 * One coefficient bank; Reach spacing cannot change a fixed physical contour.
 */
import {createSpectralTonalHRL} from '../boundary-tonal/index.mjs';
import {OPALFreeModel,freeUnitWarp as warp} from '../../a-smooth/rl-core.mjs';
import {levelToNonblack,nonblackToLevel} from '../../lib/basr.mjs';
import {encodeSRGB,decodeSRGB} from '../../lib/srgb-triangles.mjs';
const valid=q=>{if(!q||![q.H,q.R,q.L].every(Number.isFinite)||q.R<0||q.R>q.L||q.L>1)throw new RangeError('Require finite H and 0 <= R <= L <= 1');};
export function features(H,K){const t=((H%360)+360)%360*Math.PI/180,f=[1];for(let k=1;k<=K;k++)f.push(Math.cos(k*t),Math.sin(k*t));return f;}
export function contourCoefficients(H,record){const f=features(H,record.harmonics);return record.coefficients.map(r=>r.reduce((s,v,i)=>s+v*f[i],0));}
export function contourPower(s,c){return Math.exp(s*s*2*Math.tanh((c[0]+c[1]*(2*s-1))/2));}
export function contourShift(s,c){return s*s*4*Math.tanh((c[2]+c[3]*(2*s-1))/4);}
export function reachPower(L,c){if(c.length===7)return 1;const v=2*L-1;return Math.exp(2*Math.tanh((c[4]+c[5]*v+c[6]*v*v)/2));}
export function reachShift(L,c){const v=2*L-1,j=c.length===7?4:7;return 6*Math.tanh((c[j]+c[j+1]*v+c[j+2]*v*v)/6);}
export function toPhysical(q,record){
 valid(q);if(q.L===0)return{H:q.H,R:0,L:0};
 const c=contourCoefficients(q.H,record),s=warp(q.R/q.L,-reachShift(q.L,c))**(1/reachPower(q.L,c));
 const a=levelToNonblack(warp(warp(q.L,-record.neutral_shift)**contourPower(s,c),contourShift(s,c)));
 return{H:q.H,R:a*s,L:a};
}
export function fromPhysical(q,record){
 valid(q);if(q.L===0)return{H:q.H,R:0,L:0};
 const s=Math.max(0,Math.min(1,q.R/q.L)),c=contourCoefficients(q.H,record);
 const L=warp(warp(nonblackToLevel(q.L),-contourShift(s,c))**(1/contourPower(s,c)),record.neutral_shift);
 const U=warp(s**reachPower(L,c),reachShift(L,c));return{H:q.H,R:L*U,L};
}
export class ContourModel extends OPALFreeModel {
 toPhysical(q){return toPhysical(q,this.record);}
 fromPhysical(q){return fromPhysical(q,this.record);}
 physicalXYZ(q){const x=this.base.toXYZ(q);return this.source.fromLegacyXYZ?this.source.fromLegacyXYZ(x):x;}
 physicalFromXYZ(x,h=0){return this.base.fromXYZ(this.source.toLegacyXYZ?this.source.toLegacyXYZ(x):x,h);}
 toXYZ(q){return this.physicalXYZ(this.toPhysical(q));}
 fromXYZ(x,h=0){return this.fromPhysical(this.physicalFromXYZ(x,h));}
 toSource(q){return this.source.fromBase(this.toPhysical(q));}
 fromSource(q){return this.fromPhysical(this.source.toBase(q));}
 toLinear(q){if(this.gamut!=='srgb')throw new TypeError('Native sRGB only');return this.base.toLinear(this.toPhysical(q));}
 fromLinear(x,h=0){if(this.gamut!=='srgb')throw new TypeError('Native sRGB only');return this.fromPhysical(this.base.fromLinear(x,h));}
 toRGB(q){return this.toLinear(q).map(encodeSRGB);}
 fromRGB(x,h=0){return this.fromLinear(x.map(decodeSRGB),h);}
}
async function read(url){if(url.protocol==='file:'){const{readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));}const r=await fetch(url);if(!r.ok)throw Error('Contour record unavailable: '+r.status);return r.json();}
export async function createContourHRL({gamut='srgb',checkpoint='strict',record=null,referenceWhiteNits=300}={}){
 if(!['srgb','full'].includes(gamut))throw new RangeError('Contour realizations: srgb or full');
 if(!record){if(!['seed','strict','metric','guarded'].includes(checkpoint))throw new RangeError('Unknown contour checkpoint');record=await read(new URL(`results/${checkpoint}.json`,import.meta.url));}
 if(record.schema!=='hrl-physical-contours-v1'||record.contour!=='positive-power-then-logit'||!Number.isInteger(record.harmonics)||record.harmonics<0||record.coefficients.length!==(record.reach==='positive-power-then-logit'?10:7)||record.coefficients.some(r=>r.length!==1+2*record.harmonics||!r.every(Number.isFinite))||!Number.isFinite(record.neutral_shift))throw new TypeError('Invalid shared physical-contour record');
 // Retain input policy/carrier closures, which reference this exact object.
 const out=await createSpectralTonalHRL({gamut,checkpoint:'metric',referenceWhiteNits});
 Object.setPrototypeOf(out.model,ContourModel.prototype);out.model.record=record;
 out.model.variant=checkpoint;out.model.version=out.version='2.0.0-contours-reconstruction.1';
 out.model.name=out.name='HRL physical contours · '+checkpoint;out.definition=record;out.checkpoint=checkpoint;
 return out;
}

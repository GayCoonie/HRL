/** OPAL 0.7 research candidate: gamut-anchor-normalized chart and a
 * boundary-preserving joint Reach/Level calibration. Hue identity is unchanged.
 */
import {createHRLResearch,PathModel,AppearanceReadout} from './research.mjs';
const wrap=H=>((H%360)+360)%360;
const valid=q=>{if(!q||![q.H,q.R,q.L].every(Number.isFinite)||q.R<0||q.R>q.L||q.L>1)throw new RangeError('Require finite H and 0 <= R <= L <= 1');};
function coefficients(H,fit){const t=wrap(H)*Math.PI/180,f=[1];for(let k=1;k<=fit.harmonics;k++)f.push(Math.cos(k*t),Math.sin(k*t));return fit.coefficients.map(row=>row.reduce((s,v,i)=>s+v*f[i],0));}
/** Strictly monotone rational warp with exactly fixed 0 and 1. */
export function unitWarp(x,t){
 if(!Number.isFinite(x)||!Number.isFinite(t)||x<0||x>1)throw RangeError('Unit warp requires x in [0,1] and finite t');
 if(x===0||x===1||t===0)return x;
 if(t>0)return x/(x+(1-x)*Math.exp(-t));
 const e=Math.exp(t);return x*e/(1-x+x*e);
}
export function fitCoordinates(q,fit,inverse=false){
 valid(q);if(q.L===0)return {H:wrap(q.H),R:0,L:0};
 const c=coefficients(q.H,fit),H=wrap(q.H);let L=q.L,U=q.R/L;
 if(inverse){
  U=unitWarp(U,-(c[2]+c[3]*(2*L-1)+c[4]*(2*L-1)**2));
  L=unitWarp(L,-U*(c[0]+c[1]*(2*U-1)));
 }else{
  L=unitWarp(L,U*(c[0]+c[1]*(2*U-1)));
  U=unitWarp(U,c[2]+c[3]*(2*L-1)+c[4]*(2*L-1)**2);
 }
 return {H,R:L*U,L};
}
/** A separately calibrated perceived-lightness/HK correlate, not native Level. */
export class AnchorAppearanceReadout extends AppearanceReadout {
 constructor(field,legacyBrightness,saturation,record){super(field,legacyBrightness,saturation);this.calibration=record;}
 evaluate(xyz,options={}){
  const old=super.evaluate(xyz,options);if(xyz[1]<=1e-20)return old;
  const {theta,rho}=this.field.coordinates(xyz),t=theta*Math.PI/180,c=this.calibration.selected.coefficients;
  let k=c[0];for(let j=1;j<=this.calibration.selected.harmonics;j++)k+=c[2*j-1]*Math.cos(j*t)+c[2*j]*Math.sin(j*t);
  const y=xyz[1]*Math.exp(3*rho*k),B=y<=216/24389?24389*y/2700:(29*Math.cbrt(y)-4)/25;
  return {brightness:B,saturation:old.saturation,chromaticContent:B*old.saturation/.25};
 }
}
export class AnchorModel extends PathModel {
 constructor(base,atlas,readout,fit=null){super(base,atlas,readout);this.fit=fit;this.variant=fit?'opal-anchor':'anchor-control';}
 physical(q){return super.physical(this.fit?fitCoordinates(q,this.fit,true):q);}
 fromBase(q){const x=super.fromBase(q);return this.fit?fitCoordinates(x,this.fit):x;}
}
async function read(name){const url=new URL('../research/anchor-0.7/results/'+name,import.meta.url);if(url.protocol==='file:'){const{readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));}const r=await fetch(url);if(!r.ok)throw Error(`Could not load ${url}: ${r.status}`);return r.json();}
export async function createOPALAnchor({gamut='srgb',control=false,balance='balanced'}={}){
 if(!['srgb','full'].includes(gamut))throw RangeError('Unknown gamut');
 const weights={balanced:6,metric:3,conservative:12};if(!(balance in weights))throw RangeError('Unknown calibration balance');
 const [old,atlas,fit,brightness]=await Promise.all([createHRLResearch({gamut,variant:'opal'}),read(`anchor-${gamut}.json`),control?null:read(`fit-${gamut}-g${weights[balance]}.json`),read("brightness-readout.json")]);
 const ro=old.readout; const readout=new AnchorAppearanceReadout(old.field,{choice:{coefficients:ro.hk}},{coefficients:ro.sat,reference_context:ro.context},brightness);
 return new AnchorModel(old.base,atlas,readout,fit);
}

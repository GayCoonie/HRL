import {createSpectralTonalHRL} from '../boundary-tonal/index.mjs';
import {OPALFreeModel,freeUnitWarp as warp} from '../../a-smooth/rl-core.mjs';
import {darkPhi,inverseDark} from '../shared-rl/core.mjs';
const wrap=h=>((h%360)+360)%360;
const valid=q=>{if(!q||![q.H,q.R,q.L].every(Number.isFinite)||q.R<0||q.R>q.L||q.L>1)throw RangeError('Require finite H and 0 <= R <= L <= 1');};
const unit=x=>{if(x< -1e-10||x>1+1e-10||!Number.isFinite(x))throw Error('Joint map left its domain');return Math.max(0,Math.min(1,x));};
export function features(H,K){const t=wrap(H)*Math.PI/180,a=[1];for(let k=1;k<=K;k++)a.push(Math.cos(k*t),Math.sin(k*t));return a;}
export function softPower(x,p,inverse=false){if(x===0||x===1||p===1)return x;const e=.02,a=e**p,d=(1+e)**p-a;return unit(inverse?(a+x*d)**(1/p)-e:((x+e)**p-a)/d);}
function hue(H,U,L,row,phase,inverse=false){let t=(1-L*U)*Math.tanh(row[0]+row[1]*(2*U-1)+row[2]*(2*L-1)+row[3]*(2*U-1)*(2*L-1));if(inverse)t=-t;const a=Math.tanh(t/2),h=H*Math.PI/180-phase;return H+2*Math.atan2(a*Math.sin(h),1-a*Math.cos(h))*180/Math.PI;}
export function coordinates(q,r,inverse=false){
 valid(q);let H=wrap(q.H),L=q.L,U=L===0?0:q.R/L;const C=r.coefficients,A=r.hue_coefficients,N=r.neutral;
 const coeff=j=>{const f=features(H,r.harmonics);return C[j].map(row=>row.reduce((s,x,i)=>s+x*f[i],0));};
 const amount=()=>{const f=features(H,3),v=r.dark.reduce((s,x,i)=>s+x*f[i],0);return .85/(1+Math.exp(-v))*U*U;};
 const lc=c=>{const v=2*U-1;return[Math.exp(U*2*Math.tanh((c[0]+c[1]*v)/2)),8*Math.tanh(U*(c[2]+c[3]*v)/8)];};
 const rc=c=>{const v=2*L-1;return[Math.exp(2*Math.tanh((c[4]+c[5]*v+c[6]*v*v)/2)),8*Math.tanh((c[7]+c[8]*v+c[9]*v*v)/8)];};
 if(inverse){
  L=darkPhi(L,amount());
  for(let j=C.length-1;j>=0;j--){if(r.hue_enabled)H=hue(H,U,L,A[j],j%4*Math.PI/2,true);const c=coeff(j);let[p,t]=rc(c);U=softPower(warp(U,-t),p,true);[p,t]=lc(c);L=warp(softPower(L,p,true),-t);}
  L=softPower(warp(L,-N[0]),Math.exp(.5*Math.tanh(N[1]/.5)),true);
 }else{
  L=warp(softPower(L,Math.exp(.5*Math.tanh(N[1]/.5))),N[0]);
  for(let j=0;j<C.length;j++){const c=coeff(j);let[p,t]=lc(c);L=softPower(warp(L,t),p);[p,t]=rc(c);U=warp(softPower(U,p),t);if(r.hue_enabled)H=hue(H,U,L,A[j],j%4*Math.PI/2);}
  L=inverseDark(L,amount());
 }
 return{H:wrap(H),R:L*U,L};
}
class JointModel extends OPALFreeModel{toSource(q){return coordinates(q,this.record,true);}fromSource(q){return coordinates(q,this.record);}}
async function read(u){if(u.protocol==='file:'){const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(u,'utf8'));}const r=await fetch(u);if(!r.ok)throw Error('Joint record unavailable '+r.status);return r.json();}
export async function createJointHRL({gamut='srgb',checkpoint='joint',record=null,referenceWhiteNits=300}={}){
 if(!record){if(!/^[a-z0-9-]+$/.test(checkpoint))throw RangeError('Invalid joint checkpoint');record=await read(new URL(`results/${checkpoint}.json`,import.meta.url));}
 if(record.schema!=='hrl-joint-interior-v1'||!Number.isInteger(record.harmonics)||record.harmonics<0||!Array.isArray(record.coefficients)||record.coefficients.length<1||record.coefficients.some(a=>a.length!==10||a.some(row=>row.length!==1+2*record.harmonics||!row.every(Number.isFinite)))||record.hue_coefficients.length!==record.coefficients.length||record.hue_coefficients.some(r=>r.length!==4||!r.every(Number.isFinite))||record.neutral.length!==2||!record.neutral.every(Number.isFinite)||record.dark.length!==7||!record.dark.every(Number.isFinite))throw TypeError('Invalid shared joint record');
 const out=await createSpectralTonalHRL({gamut,checkpoint:'metric',referenceWhiteNits});Object.setPrototypeOf(out.model,JointModel.prototype);out.model.record=record;out.definition=record;out.checkpoint=checkpoint;out.version=out.model.version='2.0.0-joint-interior.1';out.name=out.model.name='HRL shared interior '+checkpoint;return out;
}

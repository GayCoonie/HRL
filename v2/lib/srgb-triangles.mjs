/** HRL v2: sRGB-native triangles on the UNCHANGED Observer Hue Field 0.1.
 * The gamut contributes its actual RGB boundary, not a replacement hue model.
 * Initial R/L chart: max(linear RGB)=L, min(linear RGB)=L-R.
 * This is a boundary-normalized research chart, not a new perceptual R/L fit.
 */
import {HueField, ReleaseRing} from './hue-field.mjs';
export const SRGB_TO_XYZ = [
 [.4123907992659595,.357584339383878,.1804807884018343],
 [.2126390058715104,.715168678767756,.0721923153607337],
 [.0193308187155919,.119194779794626,.9505321522496607]
];
export const XYZ_TO_SRGB = [
 [3.2409699419045226,-1.537383177570094,-.4986107602930034],
 [-.9692436362808796,1.8759675015077202,.0415550574071756],
 [.0556300796969937,-.2039769588889765,1.0569715142428786]
];
export const decodeSRGB = x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4;
export const encodeSRGB = x => x <= .0031308 ? 12.92*x : 1.055*x**(1/2.4)-.055;
export const mul3 = (m,x) => m.map(r=>r[0]*x[0]+r[1]*x[1]+r[2]*x[2]);
const wrap = (x,n=360) => ((x%n)+n)%n;
const dot3=(x,y)=>x[0]*y[0]+x[1]*y[1]+x[2]*y[2];
const B=x=>[(1-x)**3,3*x*(1-x)**2,3*x*x*(1-x),x**3];
const DB=x=>[-3*(1-x)**2,3*(1-x)*(1-3*x),3*x*(2-3*x),3*x*x];
const edgeVertices=[[1,0,0],[1,1,0],[0,1,0],[0,1,1],[0,0,1],[1,0,1],[1,0,0]];
export function edgeRGB(t){
 const x=wrap(t,6),s=Math.floor(x),u=x-s;
 return edgeVertices[s].map((v,j)=>v+(edgeVertices[s+1][j]-v)*u);
}
export function edgeIndex(v){
 const [r,g,b]=v;
 if(r>=g&&r>=b&&g>=b)return g;
 if(g>=r&&g>=b&&r>=b)return 2-r;
 if(g>=r&&g>=b&&b>=r)return 2+b;
 if(b>=r&&b>=g&&g>=r)return 4-g;
 if(b>=r&&b>=g&&r>=g)return 4+r;
 return wrap(6-b,6);
}
function threeNumbers(x){return Array.isArray(x)&&x.length===3&&x.every(Number.isFinite);}
function rl(R,L){if(!Number.isFinite(R)||!Number.isFinite(L)||R<0||R>L||L>1)throw RangeError('Require 0 <= R <= L <= 1');}
function interp(xs,ys,x){let lo=0,hi=xs.length-1;while(hi-lo>1){let m=(lo+hi)>>1;if(xs[m]<=x)lo=m;else hi=m;}let t=(x-xs[lo])/(xs[lo+1]-xs[lo]);return ys[lo]+t*(ys[lo+1]-ys[lo]);}
export class SRGBTriangles {
 constructor(field,releaseRecord=null){
  this.field=field instanceof HueField?field:new HueField(field);
  this.ring=releaseRecord?new ReleaseRing(this.field,releaseRecord):null;
  const f=this.field, W=f.white, [uw,vw]=f.whiteUV;
  this.dw=W[0]+15*W[1]+3*W[2];
  const planes=f.uvPlanes.map(([nx,ny,b])=>{const rhs=-(nx*uw+ny*vw+b);return [nx/rhs,ny/rhs];});
  this.segments=[];
  for(let s=0;s<6;s++){
   const e0=mul3(SRGB_TO_XYZ,edgeVertices[s]),e1=mul3(SRGB_TO_XYZ,edgeVertices[s+1]),de=e1.map((x,j)=>x-e0[j]);
   const d=e0[0]+15*e0[1]+3*e0[2], dd=de[0]+15*de[1]+3*de[2];
   const n=[4*e0[0]-uw*d,9*e0[1]-vw*d],dn=[4*de[0]-uw*dd,9*de[1]-vw*dd];
   this.segments.push({d,dd,n,dn,
    gauge:f.normals.map(v=>[dot3(v,e0),dot3(v,de)]),
    radial:planes.map(v=>[v[0]*n[0]+v[1]*n[1],v[0]*dn[0]+v[1]*dn[1]])});
  }
  const n=this.segments[0].n;
  this.theta0=wrap(Math.atan2(n[1],n[0])*180/Math.PI);
 }
 labelForHue(H){
  if(!Number.isFinite(H))throw RangeError('Hue must be finite');
  if(!this.ring)throw Error('No Release 1 angular calibration attached; use sampleLabel instead');
  return this.ring.label(H);
 }
 hueForLabel(label){
  if(!this.ring)throw Error('No Release 1 angular calibration attached');
  const r=this.ring,x=r.labels[0]+wrap(label-r.labels[0]);return wrap(interp(r.labels,r.H,x));
 }
 /** Stable physical chart on an RGB shell, avoiding cancellation near neutral.
  * These equations are algebraically the existing field's XYZ chart. */
 chart(t,R,L){
  const end=t===6,x=end?0:wrap(t,6),s=Math.floor(x),u=x-s,z=this.segments[s],q=R/L;
  const nx=z.n[0]+u*z.dn[0],ny=z.n[1]+u*z.dn[1],n2=nx*nx+ny*ny;
  let theta=this.theta0+wrap(Math.atan2(ny,nx)*180/Math.PI-this.theta0);if(end)theta=this.theta0+360;
  const dt=(nx*z.dn[1]-ny*z.dn[0])/n2*180/Math.PI;
  let g=-Infinity,dg=0,p=-Infinity,dp=0;
  for(const [v,dv] of z.gauge){const a=v+u*dv;if(a>g){g=a;dg=dv;}}
  for(const [v,dv] of z.radial){const a=v+u*dv;if(a>p){p=a;dp=dv;}}
  const den=(1-q)*this.dw+q*(z.d+u*z.dd),rho=q*p/den;
  const dr=q*(dp*den-p*q*z.dd)/(den*den),factor=1-q+q*g;
  const a=L*factor,mag=Math.cbrt(a/this.field.aMax),dm=mag*q*dg/(3*factor);
  return {theta,rho,a,mag,dt,dr,dm};
 }
 /** Evaluate the original cubic field and its derivative along the RGB shell. */
 shell(t,R,L,derivative=false){
  const c=this.chart(t,R,L),f=this.field,step=360/f.n,z=wrap(c.theta)/step,i=Math.floor(z),u=z-i;
  const w=[(1-u)**3,3*u**3-6*u*u+4,-3*u**3+3*u*u+3*u+1,u**3].map(x=>x/6);
  const br=B(c.rho),bm=B(c.mag);
  const dw=derivative?[-.5*(1-u)**2,1.5*u*u-2*u,-1.5*u*u+u+.5,.5*u*u].map(x=>x/step):null;
  const dr=derivative?DB(c.rho):null,dm=derivative?DB(c.mag):null;
  let correction=0,ct=0,cr=0,cm=0;
  for(let k=0;k<4;k++){
   const a=f.coeff[wrap(i+k-1,f.n)];
   for(let r=0;r<4;r++)for(let m=0;m<4;m++){
    const v=a[r][m];correction+=w[k]*br[r]*bm[m]*v;
    if(derivative){ct+=dw[k]*br[r]*bm[m]*v;cr+=w[k]*dr[r]*bm[m]*v;cm+=w[k]*br[r]*dm[m]*v;}
   }
  }
  return derivative?{value:c.theta+correction,derivative:(1+ct)*c.dt+cr*c.dr+cm*c.dm}:c.theta+correction;
 }
 solve(label,R,L){
  if(!Number.isFinite(label))throw RangeError('Label must be finite');rl(R,L);
  if(R===0)return 0;
  const start=this.shell(0,R,L),target=start+wrap(label-start);
  if(target-start<1e-12)return 0;
  let lo=0,hi=6,t=6*(target-start)/360;
  for(let k=0;k<64;k++){
   const a=this.shell(t,R,L,true),e=a.value-target;
   if(Math.abs(e)<=2e-10)return t;
   if(e>0)hi=t;else lo=t;
   if(hi-lo<2e-14)return (lo+hi)/2;
   const trial=t-e/a.derivative;
   t=Number.isFinite(trial)&&a.derivative>0&&trial>lo&&trial<hi?trial:(lo+hi)/2;
  }
  throw Error('sRGB hue-boundary intersection did not converge');
 }
 linearLabel(label,R,L){
  rl(R,L);if(!Number.isFinite(label))throw RangeError('Label must be finite');
  if(R===0)return [L,L,L];
  const v=edgeRGB(this.solve(label,R,L));
  // Convex RGB bounds by construction. No gamut clipping.
  return v.map(x=>(L-R)+R*x);
 }
 sampleLabel(label,R,L){rl(R,L);if(!Number.isFinite(label))throw RangeError('Label must be finite');return R===0?this.field.white.map(x=>x*L):mul3(SRGB_TO_XYZ,this.linearLabel(label,R,L));}
 toLinear({H,R,L}){return this.linearLabel(this.labelForHue(H),R,L);}
 toRGB(q){return this.toLinear(q).map(encodeSRGB);}
 toXYZ(q){return this.sampleLabel(this.labelForHue(q.H),q.R,q.L);}
 fromLinear(rgb,neutralHue=0){
  if(!threeNumbers(rgb)||rgb.some(x=>x<0||x>1))throw RangeError('Require three finite in-gamut linear-sRGB channels');
  const L=Math.max(...rgb),m=Math.min(...rgb),R=L-m;
  if(R===0)return {H:wrap(neutralHue),R:0,L,label:null};
  const t=edgeIndex(rgb.map(x=>(x-m)/R)),label=wrap(this.shell(t,R,L));
  return {H:this.ring?this.hueForLabel(label):null,R,L,label};
 }
 fromRGB(rgb,neutralHue=0){
  if(!threeNumbers(rgb)||rgb.some(x=>x<0||x>1))throw RangeError('Require three finite sRGB channels in [0,1]');
  return this.fromLinear(rgb.map(decodeSRGB),neutralHue);
 }
 fromXYZ(xyz,neutralHue=0){
  if(!threeNumbers(xyz))throw TypeError('XYZ must be three finite numbers');
  let rgb=mul3(XYZ_TO_SRGB,xyz);
  if(rgb.some(x=>x< -2e-12||x>1+2e-12))throw RangeError('XYZ is outside sRGB; implicit gamut mapping is not performed');
  // Only matrix-roundoff excursions, not out-of-gamut color, are snapped here.
  rgb=rgb.map(x=>x<0?0:x>1?1:x);return this.fromLinear(rgb,neutralHue);
 }
 vivid(H){return this.toXYZ({H,R:1,L:1});}
 fullVivid(H){return this.field.sample(this.labelForHue(H),1,1);}
 arms(H,t){const label=this.labelForHue(H);return {blackward:this.sampleLabel(label,t,t),whiteward:this.sampleLabel(label,t,1),neutral:this.field.white.map(v=>v*t)};}
 sheet(H){return (R,L)=>this.toXYZ({H,R,L});}
 embed({H,R,L}){return this.field.embed(H,R,L);}
 distance(a,b){const x=this.embed(a),y=this.embed(b);return Math.hypot(...x.map((v,j)=>v-y[j]));}
}

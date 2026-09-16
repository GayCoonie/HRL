/** HRL v2 equal-span / observer-parameterized research models.
 * The carrier is an encoding of physical hue sheets, never their R/L definition.
 * Lookup tables parameterize positions; XYZ always comes from the hue solver.
 */
import {HueField,ReleaseRing} from './hue-field.mjs';
import {SRGBTriangles,SRGB_TO_XYZ,XYZ_TO_SRGB,mul3,decodeSRGB,encodeSRGB} from './srgb-triangles.mjs';
import {levelToNonblack,nonblackToLevel,BASRModel} from './basr.mjs';
import {expandReleaseAngles} from './index.mjs';
const wrap=(x,n=360)=>((x%n)+n)%n;
const unit=(x,n)=>{if(!Number.isFinite(x)||x<0||x>1)throw RangeError(n+' must be in [0,1]');return x;};
function valid(q){if(!q||!Number.isFinite(q.H))throw TypeError('H must be finite');unit(q.R,'R');unit(q.L,'L');if(q.R>q.L)throw RangeError('R must not exceed L');}
const interp=(xs,ys,x)=>{let lo=0,hi=xs.length-1;while(hi-lo>1){const k=(lo+hi)>>1;if(xs[k]<=x)lo=k;else hi=k;}return ys[lo]+(ys[hi]-ys[lo])*(x-xs[lo])/(xs[hi]-xs[lo]);};
const edge=t=>{let z=wrap(t,1)*6,i=Math.floor(z),u=z-i;return [[1,u,0],[1-u,1,0],[0,1,u],[0,1-u,1],[u,0,1],[1,0,1-u]][i];};
function edgeT(v){let[r,g,b]=v;if(r>=g&&r>=b&&g>=b)return g/6;if(g>=r&&g>=b&&r>=b)return(2-r)/6;if(g>=r&&g>=b&&b>=r)return(2+b)/6;if(b>=r&&b>=g&&g>=r)return(4-g)/6;if(b>=r&&b>=g&&r>=g)return(4+r)/6;return wrap((6-b)/6,1);}
const uv=xyz=>{let d=xyz[0]+15*xyz[1]+3*xyz[2];return [4*xyz[0]/d,9*xyz[1]/d];};
/** Encoding-only landmarks on the actual declared polygon: purple endpoints and max-y green.
 * An optional monotone angle map demonstrates that the carrier is not the color model.
 */
export class SpectralCarrier {
 constructor(field,{rotation=0}={}){
  this.field=field;const vs=field.xyBoundary;
  // The purple closure is the longest polygon segment, joining the red/violet ends.
  let longest=-1,ci=-1;
  for(let i=0;i<vs.length;i++){const b=vs[(i+1)%vs.length],d=Math.hypot(b[0]-vs[i][0],b[1]-vs[i][1]);if(d>longest){longest=d;ci=i;}}
  const p=[vs[ci],vs[(ci+1)%vs.length]].sort((a,b)=>b[0]-a[0]);
  const green=vs.reduce((a,b)=>a[1]>b[1]?a:b);
  this.landmarks={red:p[0],green,violet:p[1],rule:'Longest boundary segment endpoints; maximum CIE y vertex'};
  this.t=[0,1/3,2/3,1];
  const ang=xy=>{const c=uv([xy[0],xy[1],1-xy[0]-xy[1]]);return wrap(Math.atan2(c[1]-field.whiteUV[1],c[0]-field.whiteUV[0])*180/Math.PI);};
  const r=ang(p[0])+rotation,g=r+wrap(ang(green)+rotation-r),b=r+wrap(ang(p[1])+rotation-r);
  if(!(r<g&&g<b&&b<r+360))throw Error('Spectral landmark order is invalid');
  this.theta=[r,g,b,r+360];this.origin=field.evaluate(r,1,1);
 }
 label(t){const th=interp(this.t,this.theta,wrap(t,1));return wrap(this.field.evaluate(th,1,1));}
 position(label){const th0=this.field.inverseAngle(label,1,1),th=this.theta[0]+wrap(th0-this.theta[0]);return wrap(interp(this.theta,this.t,th),1);}
 toXYZ(q){if(!Array.isArray(q)||q.length!==3)throw TypeError('Three pseudo channels required');q.forEach(x=>unit(x,'channel'));const a=Math.max(...q),m=Math.min(...q);if(a===m)return this.field.white.map(x=>a*x);const s=(a-m)/a,v=q.map(x=>(x-m)/(a-m));return this.field.sample(this.label(edgeT(v)),s,a);}
 fromXYZ(xyz){const c=this.field.coordinates(xyz);if(c.a>1+2e-10)throw RangeError('Outside bounded full-domain carrier');const a=Math.min(1,c.a);if(c.neutral)return [a,a,a];const v=edge(this.position(this.field.evaluate(c.theta,c.rho,c.a)));return v.map(x=>a*((1-c.rho)+c.rho*x));}
 decode16(q){if(!Array.isArray(q)||q.length!==3||q.some(x=>!Number.isInteger(x)||x<0||x>65535))throw RangeError('Require unsigned 16-bit triplet');return this.toXYZ(q.map(x=>x/65535));}
 encode16(xyz){return this.fromXYZ(xyz).map(x=>Math.round(x*65535));}
}
/** Safeguarded inversion for refitted fields: force bracket contraction.
 * The 0.4 solver is preserved in its original module. */
export class ResearchSRGBTriangles extends SRGBTriangles {
 solve(label,R,L){
  unit(R,'R');unit(L,'L');if(R>L||!Number.isFinite(label))throw RangeError('Invalid hue shell');
  if(R===0)return 0;
  const start=this.shell(0,R,L),target=start+wrap(label-start);
  if(target-start<1e-12)return 0;
  let lo=0,hi=6,t=6*(target-start)/360;
  for(let k=0;k<90;k++){
   const v=this.shell(t,R,L,true),e=v.value-target;
   if(Math.abs(e)<2e-10)return t;
   if(e>0)hi=t;else lo=t;
   const span=hi-lo;if(span<2e-14)return (lo+hi)/2;
   const n=t-e/v.derivative;
   t=k%3!==2&&v.derivative>0&&n>lo+.05*span&&n<hi-.05*span?n:(lo+hi)/2;
  }
  throw Error('Research hue shell did not converge');
 }
}
/** Full physical chart independent of carrier corners. */
export class EqualSpanFull {
 constructor(field,release){this.field=field;this.ring=new ReleaseRing(field,release);this.gamut='full';this.carrier=new SpectralCarrier(field);}
 labelForHue(H){if(!Number.isFinite(H))throw TypeError('H must be finite');return this.ring.label(H);}
 hueForLabel(label){const r=this.ring;return wrap(interp(r.labels,r.H,r.labels[0]+wrap(label-r.labels[0])));}
 sampleLabel(label,R,L){unit(R,'R');unit(L,'L');if(R>L)throw RangeError('R>L');return L===0?[0,0,0]:this.field.sample(label,R/L,L);}
 toXYZ(q){valid(q);return this.sampleLabel(this.labelForHue(q.H),q.R,q.L);}
 fromXYZ(xyz,neutralHue=0){const c=this.field.coordinates(xyz);if(c.a>1+2e-10)throw RangeError('Outside bounded full domain');const a=Math.min(1,c.a),label=c.neutral?null:wrap(this.field.evaluate(c.theta,c.rho,c.a));return{H:label===null?wrap(neutralHue):this.hueForLabel(label),R:a*c.rho,L:a,label};}
 toPseudoRGB(q){return this.carrier.fromXYZ(this.toXYZ(q));}
 fromPseudoRGB(q,neutralHue=0){return this.fromXYZ(this.carrier.toXYZ(q),neutralHue);}
 fullVivid(H){return this.toXYZ({H,R:1,L:1});}
}
/** Calibrated appearance readouts. They are NOT the public Level or Reach. */
export class AppearanceReadout {
 constructor(field,brightness,saturation){this.field=field;this.hk=brightness.choice.coefficients;this.sat=saturation.coefficients;this.context=saturation.reference_context;}
 evaluate(xyz,{contrast=this.context}={}){
  if(xyz[1]<=1e-20)return {brightness:0,saturation:0,chromaticContent:0};
  const c=this.field.coordinates(xyz),d=uv(xyz).map((x,i)=>x-this.field.whiteUV[i]),r=Math.hypot(...d),t=c.theta*Math.PI/180;
  const lift=c.rho*(this.hk[0]+this.hk[1]*Math.cos(2*t)+this.hk[2]*Math.sin(2*t));
  const y=xyz[1]*Math.exp(3*lift);
  const B=y<=216/24389?24389*y/2700:(29*Math.cbrt(y)-4)/25;
  let f=0;for(let k=1;k<=4;k++)f+=this.sat[2*k-1]*Math.cos(k*t)+this.sat[2*k]*Math.sin(k*t);
  for(let k=1;k<=2;k++)f+=contrast*(this.sat[9+2*k]*Math.cos(k*t)+this.sat[10+2*k]*Math.sin(k*t));
  const S=r===0?0:r*Math.exp(f);
  return{brightness:B,saturation:S,chromaticContent:B*S/.25};
 }
}
/** Periodic-H, linear-secondary interpolation of strictly increasing path maps.
 * Inverting the SAME interpolated row avoids inconsistent inverse LUTs.
 */
export class MonotoneAtlas {
 constructor(record){this.record=record;this.h=record.hues;this.y=record.secondary;this.x=record.parameter;this.rows=record.rows;}
 row(H,s){unit(s,'atlas secondary');const hf=wrap(H)/360*this.h,i=Math.floor(hf),f=hf-i;let j=Math.min(this.y.length-2,Math.floor(s*(this.y.length-1))),g=(s-this.y[j])/(this.y[j+1]-this.y[j]);let a=this.rows[i][j],b=this.rows[i][j+1],c=this.rows[(i+1)%this.h][j],d=this.rows[(i+1)%this.h][j+1];return a.map((v,k)=>(1-f)*((1-g)*v+g*b[k])+f*((1-g)*c[k]+g*d[k]));}
 forward(H,s,x){unit(x,'atlas parameter');if(x===0||x===1)return x;return interp(this.x,this.row(H,s),x);}
 inverse(H,s,y){unit(y,'atlas coordinate');if(y===0||y===1)return y;return interp(this.row(H,s),this.x,y);}
}
/** Endpoint-normalized research coordinates on the unchanged regular bicone. */
export class PathModel {
 constructor(base,record,readout=null){this.base=base;this.field=base.field;this.ring=base.ring;this.gamut=base.gamut||'srgb';this.variant=record.variant;this.record=record;this.level=record.level?new MonotoneAtlas(record.level):null;this.reach=new MonotoneAtlas(record.reach);this.readout=readout;this.carrier=new SpectralCarrier(this.field);}
 labelForHue(H){return this.base.labelForHue(H);}
 hueForLabel(label){return this.base.hueForLabel(label);}
 physical(q){valid(q);if(q.L===0)return{s:0,a:0};const U=q.R/q.L,s=this.reach.inverse(q.H,q.L,U);const l=this.level?this.level.inverse(q.H,s,q.L):q.L;return{s,a:levelToNonblack(l)};}
 toBase(q){const p=this.physical(q);return {H:q.H,R:p.a*p.s,L:p.a};}
 fromBase(q){const a=q.L;if(a===0)return{H:q.H,R:0,L:0};const s=Math.max(0,Math.min(1,q.R/a)),l=nonblackToLevel(Math.min(1,a)),L=this.level?this.level.forward(q.H,s,l):l,U=this.reach.forward(q.H,L,s);return{H:q.H,R:L*U,L};}
 toXYZ(q){return this.base.toXYZ(this.toBase(q));}
 fromXYZ(x,neutralHue=0){return this.fromBase(this.base.fromXYZ(x,neutralHue));}
 toLinear(q){if(!this.base.toLinear)throw TypeError('Native sRGB only');return this.base.toLinear(this.toBase(q));}
 toRGB(q){return this.toLinear(q).map(encodeSRGB);}
 fromLinear(x,h=0){if(!this.base.fromLinear)throw TypeError('Native sRGB only');return this.fromBase(this.base.fromLinear(x,h));}
 fromRGB(x,h=0){if(!this.base.fromRGB)throw TypeError('Native sRGB only');return this.fromBase(this.base.fromRGB(x,h));}
 sampleLabel(label,R,L){return this.toXYZ({H:this.hueForLabel(label),R,L});}
 linearLabel(label,R,L){return this.toLinear({H:this.hueForLabel(label),R,L});}
 toPseudoRGB(q){return this.carrier.fromXYZ(this.toXYZ(q));}
 fromPseudoRGB(q,h=0){return this.fromXYZ(this.carrier.toXYZ(q),h);}
 vivid(H){return this.toXYZ({H,R:1,L:1});}
 fullVivid(H){return this.field.sample(this.labelForHue(H),1,1);}
 arms(H,t){unit(t,'t');return {blackward:this.toXYZ({H,R:t,L:t}),whiteward:this.toXYZ({H,R:t,L:1}),neutral:this.toXYZ({H,R:0,L:t})};}
 shares(q){valid(q);return{black:1-q.L,neutral:q.L-q.R,vivid:q.R};}
 sheet(H){return(R,L)=>this.toXYZ({H,R,L});}
 embed(q){valid(q);return this.field.embed(q.H,q.R,q.L);}
 distance(a,b){const x=this.embed(a),y=this.embed(b);return Math.hypot(...x.map((v,i)=>v-y[i]));}
}
async function readResearch(name){const url=new URL('../data/'+name,import.meta.url);if(url.protocol==='file:'){const{readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));}const r=await fetch(url);if(!r.ok)throw Error(`Failed to load ${name}: ${r.status}`);return r.json();}
/** ESP 0.5 = equal xy arc baseline; OPAL 0.6 = experimental observer readout arcs. */
export async function createHRLResearch({gamut='srgb',variant='opal'}={}){
 if(!['srgb','full'].includes(gamut)||!['equal-span','opal'].includes(variant))throw RangeError('Unknown research profile');
 const fn=variant==='opal'?'hue-field-0.6.json':'hue-field.json';
 const [packet,angles,atlas,readouts]=await Promise.all([readResearch(fn),readResearch('release1-angles.json'),readResearch(`${variant}-${gamut}.json`),readResearch('appearance-readouts.json')]);
 const field=new HueField(packet),release=expandReleaseAngles(angles),base=gamut==='srgb'?new ResearchSRGBTriangles(field,release):new EqualSpanFull(field,release);base.gamut=gamut;
 return new PathModel(base,atlas,new AppearanceReadout(field,readouts.brightness,readouts.saturation));
}

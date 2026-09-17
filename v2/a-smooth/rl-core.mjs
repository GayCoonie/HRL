/** Exact OPAL 0.8 R/L runtime from the approved source bundle.
 * Both installed records use the original identity hue ring.
 * The unused legacy data-loading factory is omitted. */

const wrap=x=>((x%360)+360)%360;
const valid=q=>{
 if(!q||![q.H,q.R,q.L].every(Number.isFinite)||q.R<0||q.R>q.L||q.L>1)
  throw new RangeError('Require finite H and 0 <= R <= L <= 1');
};
export function freeUnitWarp(x,t){
 if(!Number.isFinite(x)||!Number.isFinite(t)||x<0||x>1)throw new RangeError('Invalid unit warp');
 if(x===0||x===1||t===0)return x;
 if(t>0)return x/(x+(1-x)*Math.exp(-t));
 const e=Math.exp(t);return x*e/(1-x+x*e);
}
/** Integral of a positive, periodic piecewise-linear density: C1, one-to-one. */
export class FreeHueRing {
 constructor(logits=null){
  this.identity=logits===null;
  if(this.identity){this.n=0;return;}
  if(!Array.isArray(logits)||logits.length<3||!logits.every(Number.isFinite))throw new TypeError('Finite ring logits required');
  this.n=logits.length;this.step=360/this.n;
  const max=Math.max(...logits),e=logits.map(x=>Math.exp(x-max)),sum=e.reduce((a,b)=>a+b,0);
  this.d=e.map(x=>x*this.n/sum);this.cdf=[0];
  for(let i=0;i<this.n;i++)this.cdf.push(this.cdf.at(-1)+this.step*(this.d[i]+this.d[(i+1)%this.n])/2);
  this.cdf[this.n]=360;
 }
 forward(H){
  if(!Number.isFinite(H))throw new TypeError('Hue must be finite');H=wrap(H);
  if(this.identity)return H;
  const x=H/this.step,i=Math.min(this.n-1,Math.floor(x)),f=x-i,a=this.d[i],b=this.d[(i+1)%this.n];
  return wrap(this.cdf[i]+this.step*(a*f+(b-a)*f*f/2));
 }
 inverse(H){
  if(!Number.isFinite(H))throw new TypeError('Hue must be finite');H=wrap(H);
  if(this.identity)return H;
  let lo=0,hi=this.n;while(hi-lo>1){const m=(lo+hi)>>1;if(this.cdf[m]<=H)lo=m;else hi=m;}
  const a=this.d[lo],b=this.d[(lo+1)%this.n],y=(H-this.cdf[lo])/this.step;
  const discriminant=Math.max(0,a*a+2*(b-a)*y);
  const f=y===0?0:2*y/(a+Math.sqrt(discriminant));
  if(f< -1e-10||f>1+1e-10)throw new Error('Ring inversion outside bracket');
  return wrap(this.step*(lo+Math.max(0,Math.min(1,f))));
 }
 derivative(H){
  if(this.identity)return 1;const x=wrap(H)/this.step,i=Math.floor(x),f=x-i;
  return this.d[i]*(1-f)+this.d[(i+1)%this.n]*f;
 }
}
function coeff(H,layers,K){
 const t=wrap(H)*Math.PI/180,f=[1];for(let k=1;k<=K;k++)f.push(Math.cos(k*t),Math.sin(k*t));
 return layers.map(layer=>layer.map(row=>row.reduce((s,v,i)=>s+v*f[i],0)));
}
/** Algebraic inverse of triangular coupling layers; no XYZ interpolation. */
export function freeCoordinates(q,record,gamut='srgb',inverse=false,ring=null){
 valid(q);ring=ring||new FreeHueRing(record.ring_logits);
 const H=inverse?ring.inverse(q.H):wrap(q.H);
 const which=record.gamut_calibration==='shared'?0:(gamut==='srgb'?0:1);
 if(!['srgb','full'].includes(gamut))throw new RangeError('Unknown gamut');
 const layers=coeff(H,record.coefficients[which],record.harmonics),cap=record.shift_cap;
 let L=q.L,U=L===0?0:q.R/L;
 const bounded=t=>cap*Math.tanh(t/cap);
 if(inverse){
  for(let i=layers.length-1;i>=0;i--){
   const c=layers[i],v=2*L-1;
   U=freeUnitWarp(U,-bounded(c[2]+c[3]*v+c[4]*v*v));
   L=freeUnitWarp(L,-bounded(U*(c[0]+c[1]*(2*U-1))));
  }
  L=freeUnitWarp(L,-record.neutral_shift);
 }else{
  L=freeUnitWarp(L,record.neutral_shift);
  for(const c of layers){
   L=freeUnitWarp(L,bounded(U*(c[0]+c[1]*(2*U-1))));
   const v=2*L-1;U=freeUnitWarp(U,bounded(c[2]+c[3]*v+c[4]*v*v));
  }
 }
 return {H:inverse?H:ring.forward(H),R:L*U,L};
}
export class OPALFreeModel {
 constructor(source,record){
  this.source=source;this.base=source.base;this.field=source.field;this.carrier=source.carrier;
  this.gamut=source.gamut;this.record=record;this.hueRing=new FreeHueRing(record.ring_logits);
  this.variant=record.variant;this.version='0.8'+this.variant;this.name='HRL OPAL '+this.version;
 }
 toSource(q){return freeCoordinates(q,this.record,this.gamut,true,this.hueRing);}
 fromSource(q){return freeCoordinates(q,this.record,this.gamut,false,this.hueRing);}
 labelForHue(H){return this.source.labelForHue(this.hueRing.inverse(H));}
 hueForLabel(label){return this.hueRing.forward(this.source.hueForLabel(label));}
 toXYZ(q){return this.source.toXYZ(this.toSource(q));}
 fromXYZ(x,h=0){return this.fromSource(this.source.fromXYZ(x,this.hueRing.inverse(h)));}
 toLinear(q){return this.source.toLinear(this.toSource(q));}
 toRGB(q){return this.source.toRGB(this.toSource(q));}
 fromLinear(x,h=0){return this.fromSource(this.source.fromLinear(x,this.hueRing.inverse(h)));}
 fromRGB(x,h=0){return this.fromSource(this.source.fromRGB(x,this.hueRing.inverse(h)));}
 toPseudoRGB(q){return this.carrier.fromXYZ(this.toXYZ(q));}
 fromPseudoRGB(x,h=0){return this.fromXYZ(this.carrier.toXYZ(x),h);}
 vivid(H){return this.toXYZ({H,R:1,L:1});}
 fullVivid(H){return this.field.sample(this.labelForHue(H),1,1);}
 shares(q){valid(q);return {black:1-q.L,neutral:q.L-q.R,vivid:q.R};}
 embed(q){valid(q);return this.field.embed(q.H,q.R,q.L);}
 distance(a,b){const x=this.embed(a),y=this.embed(b);return Math.hypot(...x.map((v,i)=>v-y[i]));}
 sheet(H){return(R,L)=>this.toXYZ({H,R,L});}
 arms(H,t){if(!Number.isFinite(t)||t<0||t>1)throw new RangeError('Invalid arm position');return {blackward:this.toXYZ({H,R:t,L:t}),whiteward:this.toXYZ({H,R:t,L:1}),neutral:this.toXYZ({H,R:0,L:t})};}
 appearance(q,{contrast=0}={}){
  valid(q);if(q.L===0)return {brightness:0,chromaticContent:0,saturation:0};
  const v=this.source.readout.evaluate(this.vivid(q.H));
  const B=q.L-q.R+v.brightness*q.R,C=v.chromaticContent*q.R;
  const physical=this.toXYZ(q),r0=this.source.readout.evaluate(physical),rc=this.source.readout.evaluate(physical,{contrast});
  const factor=r0.saturation>0?rc.saturation/r0.saturation:1;
  return {brightness:B,chromaticContent:C,saturation:B===0?0:.25*C/B*factor};
 }
}

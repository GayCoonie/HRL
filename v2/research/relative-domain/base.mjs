/** Full chromaticity/Y chart with a separately identified high-magnitude continuation. */
import {mod,unit,RelativeCone,RelativeSpectralCarrier} from './geometry.mjs';
export class RelativeFullBase {
 constructor(original){
  this.gamut='full';this.original=original;this.ring=original.ring;
  const old=original.field,cone=new RelativeCone(old);this.cone=cone;this.carrier=new RelativeSpectralCarrier(cone);
  this.field=Object.assign(Object.create(Object.getPrototypeOf(old)),old);
  this.field.coordinates=x=>{const c=cone.coordinates(x);return{theta:c.theta,rho:c.rho,a:c.a,neutral:c.neutral,Y:c.Y};};
  // Beyond the original fit range retain the final fitted angular slice.
  // This clips a MODEL ARGUMENT, not the stimulus, relative Y, or chromaticity.
  this.field.evaluate=(theta,rho,a,options={})=>old.evaluate(theta,rho,Math.min(a,old.aMax),options);
  this.field.sample=(label,rho,Y)=>this.sampleAtY(label,rho,Y);
  this.hueContinuation={kind:'hold-last-fitted-magnitude',aMax:old.aMax,notObserverValidated:true};
 }
 labelForHue(H){return this.original.labelForHue(H);}
 hueForLabel(h){return this.original.hueForLabel(h);}
 hueAt(theta,rho,Y){const p=this.cone.at(theta,rho,Y);return this.field.evaluate(theta,rho,this.cone.completion(p));}
 inverseAtY(label,rho,Y){
  const start=this.hueAt(0,rho,Y),target=start+mod(label-start);if(target-start<1e-12)return 0;
  let lo=0,hi=360,t=target-start;
  for(let k=0;k<90;k++){
   const e=this.hueAt(t,rho,Y)-target;if(Math.abs(e)<2e-10)return mod(t);
   if(e>0)hi=t;else lo=t;if(hi-lo<2e-12)return mod((hi+lo)/2);
   const step=1e-4,d=(this.hueAt(t+step,rho,Y)-this.hueAt(t-step,rho,Y))/(2*step),n=t-e/d,span=hi-lo;
   t=k%3!==2&&d>0&&n>lo+.03*span&&n<hi-.03*span?n:(lo+hi)/2;
  }
  throw Error('Relative-Y hue inversion failed');
 }
 sampleAtY(label,rho,Y){
  unit(rho,'purity');unit(Y,'Y');if(!Number.isFinite(label))throw TypeError('Finite hue label required');
  if(Y===0)return[0,0,0];if(rho===0)return this.cone.white.map(x=>x*Y);
  return this.cone.at(this.inverseAtY(label,rho,Y),rho,Y);
 }
 toXYZ(q){if(!q||!Number.isFinite(q.H))throw TypeError('Finite hue required');unit(q.R,'R');unit(q.L,'L');if(q.R>q.L)throw RangeError('R exceeds L');return q.L===0?[0,0,0]:this.sampleAtY(this.labelForHue(q.H),q.R/q.L,q.L);}
 fromXYZ(xyz,neutralHue=0){
  const c=this.cone.coordinates(xyz);if(c.Y>1+2e-12)throw RangeError('Y exceeds full reference solid');
  const L=Math.min(c.Y,1),label=c.neutral?null:mod(this.field.evaluate(c.theta,c.rho,c.a));
  return{H:label===null?mod(neutralHue):this.hueForLabel(label),R:L*c.rho,L,label};
 }
 toPseudoRGB(q){return this.carrier.fromXYZ(this.toXYZ(q));}
 fromPseudoRGB(q,h=0){return this.fromXYZ(this.carrier.toXYZ(q),h);}
 fullVivid(H){return this.toXYZ({H,R:1,L:1});}
}

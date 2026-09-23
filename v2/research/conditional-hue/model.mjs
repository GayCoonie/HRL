/** A separately versioned, bounded interior hue flow around the v3 field.
 * The physical chart's a and s determine the weight, so its inverse hue
 * equation is scalar and independent of the tonal inverse.
 */
import {validateConditionalRecord} from '../conditional-field/model.mjs';

const wrap=H=>((H%360)+360)%360;
const CAP=25,COEFF_BOUND=8;

export function validateHueRecord(record){
  if(!record||record.schema!=='hrl-conditional-hue-v4'||record.hue_shift_cap!==CAP||
    !Array.isArray(record.hue_coefficients)||record.hue_coefficients.length!==5||
    record.hue_coefficients.some(x=>!Number.isFinite(x)||Math.abs(x)>COEFF_BOUND))
    throw new TypeError('Invalid bounded interior hue record');
  validateConditionalRecord({...record,schema:'hrl-conditional-field-v3'});
  return record;
}

export class HueFlow {
  constructor(record){
    validateHueRecord(record);
    this.coefficients=record.hue_coefficients;
  }
  delta(H){
    const t=wrap(H)*Math.PI/180,[c0,c1,s1,c2,s2]=this.coefficients;
    const raw=c0+c1*Math.cos(t)+s1*Math.sin(t)+c2*Math.cos(2*t)+s2*Math.sin(2*t);
    return CAP*Math.tanh(raw/CAP);
  }
  unshifted(H,w){
    if(!Number.isFinite(H)||!Number.isFinite(w)||w<0||w>1)
      throw new RangeError('Finite hue and unit interior weight required');
    return H+w*this.delta(H);
  }
  forward(H,w){return wrap(this.unshifted(H,w));}
  inverse(physicalH,w){
    if(!Number.isFinite(physicalH)||!Number.isFinite(w)||w<0||w>1)
      throw new RangeError('Finite hue and unit interior weight required');
    if(w===0||this.coefficients.every(x=>x===0))return wrap(physicalH);
    // |delta| < 25 degrees; the derivative bound is
    // (2*8+4*8)*pi/180 < 0.838. Thus this circle map is increasing.
    let lo=physicalH-CAP,hi=physicalH+CAP;
    for(let i=0;i<58;i++){
      const mid=(lo+hi)/2;
      if(this.unshifted(mid,w)<physicalH)lo=mid;else hi=mid;
      if(hi===lo)break;
    }
    return wrap((lo+hi)/2);
  }
}

export function interiorWeight(physical){
  if(!physical||![physical.H,physical.R,physical.L].every(Number.isFinite)||
    physical.R<0||physical.R>physical.L||physical.L>1)
    throw new RangeError('Physical triangle required');
  const a=physical.L;if(a===0)return 0;
  const s=physical.R/a;
  return Math.max(0,Math.min(1,4*a*s*(1-s)));
}

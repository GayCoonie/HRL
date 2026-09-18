/** Ordinary bounded import for frozen 0.12 models. No new learned transform. */
import {createHueFairHRL} from '../hue-fair-refine/index.mjs';
import {createGenTonalHRL} from '../gen-tonal-fit/index.mjs';
import {XYZ_TO_SRGB,SRGB_TO_XYZ,mul3} from '../../lib/srgb-triangles.mjs';
export const INPUT_POLICY='mapped-012-v1';
export async function createMappedHRL({gamut='full',checkpoint='balanced',referenceWhiteNits=300}={}){
 if(!['srgb','full'].includes(gamut)||!['balanced','gentle','parent'].includes(checkpoint))throw RangeError('Unknown frozen model');
 const opts={gamut,referenceWhiteNits,overflow:'clip',imaginary:'clip'};
 const m=checkpoint==='parent'?await createGenTonalHRL({...opts,checkpoint:'balanced'}):await createHueFairHRL({...opts,checkpoint});
 m.inputPolicy=INPUT_POLICY;
 m.importXYZ=function(xyz,options={}){
  const {sourceWhiteNits,...contextOptions}=options;
  if(sourceWhiteNits!==undefined&&(!Number.isFinite(sourceWhiteNits)||sourceWhiteNits<=0))throw RangeError('Positive sourceWhiteNits required');
  if(contextOptions.absolute&&sourceWhiteNits!==undefined)throw RangeError('Absolute XYZ already supplies the luminance scale');
  let relative=this.context.toRelative(xyz,contextOptions);
  // source relative -> absolute -> target relative; avoid redundant equal-scale arithmetic.
  if(sourceWhiteNits!==undefined&&sourceWhiteNits!==this.referenceWhiteNits)relative=relative.map(v=>v*(sourceWhiteNits/this.referenceWhiteNits));
  const prepared=this.cone.prepare(relative,{overflow:'clip',imaginary:'clip'});
  let mapped=prepared.xyz,events=prepared.events.slice(),coordinates;
  if(gamut==='srgb'){
   const rgb=mul3(XYZ_TO_SRGB,mapped);
   if(rgb.some(v=>v< -2e-12||v>1+2e-12)){
    const clipped=rgb.map(v=>Math.min(1,Math.max(0,v)));
    coordinates=this.model.fromLinear(clipped,options.neutralHue??0);
    mapped=mul3(SRGB_TO_XYZ,clipped);events.push('srgb-gamut-clipped');
   }else coordinates=this.model.fromXYZ(mapped,options.neutralHue??0);
  }else coordinates=this.model.fromXYZ(mapped,options.neutralHue??0);
  if(![coordinates.H,coordinates.R,coordinates.L].every(Number.isFinite))throw Error('Nonfinite mapped coordinates');
  return{coordinates,relativeXYZ:relative,mappedXYZ:mapped,events,
   absoluteLuminance:relative[1]*this.referenceWhiteNits,
   completion:this.cone.completion(relative),hueContinuation:this.cone.completion(mapped)>this.model.field.aMax};
 };
 return m;
}

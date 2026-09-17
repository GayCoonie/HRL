/** HRL relative-domain correction. Old checkpoints and entry points stay unchanged. */
import {createASmooth} from '../../a-smooth/index.mjs';
import {OPALFreeModel} from '../../a-smooth/rl-core.mjs';
import {createRLC1} from '../rl-c1/index.mjs';
import {PathModel} from '../../lib/research.mjs';
import {C1Atlas} from '../rl-c1/atlas.mjs';
import {RelativeCone,RelativeSpectralCarrier,D65} from './geometry.mjs';
import {ReferenceContext} from './context.mjs';
import {RelativeFullBase} from './base.mjs';
export {ReferenceContext,RelativeCone,RelativeSpectralCarrier,D65};
export {adaptWhite} from './context.mjs';
export const VERSION='0.9-relative-domain';
async function readRecord(){const u=new URL('./results/source-full.json',import.meta.url);if(u.protocol==='file:'){const{readFile}=await import('node:fs/promises');return JSON.parse(await readFile(u,'utf8'));}const r=await fetch(u);if(!r.ok)throw Error('Relative-domain atlas missing; run build.mjs');return r.json();}
export class RelativeModel {
 constructor(model,{referenceWhiteNits=300,overflow='clip',imaginary='clip'}={}){
  this.model=model;this.gamut=model.gamut;this.context=new ReferenceContext({referenceWhiteNits});this.referenceWhiteNits=referenceWhiteNits;
  this.overflow=overflow;this.imaginary=imaginary;this.cone=new RelativeCone(model.field);this.carrier=new RelativeSpectralCarrier(this.cone);
  this.name='HRL '+VERSION+' '+model.variant+' '+this.gamut;this.version=VERSION;
 }
 importXYZ(xyz,options={}){
  const relative=this.context.toRelative(xyz,options),prepared=this.cone.prepare(relative,{overflow:options.overflow??this.overflow,imaginary:options.imaginary??this.imaginary});
  // A bounded H/R/L solid cannot encode preserved Y>1. The context and floating
  // carrier can retain it, but bounded import must either reject or explicitly clip.
  if(prepared.xyz[1]>1+2e-12)throw RangeError('Use context/carrier for extended intensity; bounded H/R/L has no above-white slot');
  const coordinates=this.model.fromXYZ(prepared.xyz,options.neutralHue??0);
  return{coordinates,relativeXYZ:relative,mappedXYZ:prepared.xyz,events:prepared.events,
   absoluteLuminance:relative[1]*this.referenceWhiteNits,completion:this.cone.completion(relative),
   hueContinuation:this.gamut==='full'&&this.cone.completion(prepared.xyz)>this.model.field.aMax};
 }
 fromXYZ(xyz,options={}){return this.importXYZ(xyz,options).coordinates;}
 toXYZ(q,options={}){return this.context.fromRelative(this.model.toXYZ(q),options);}
 fromAbsoluteXYZ(xyz,options={}){return this.fromXYZ(xyz,{...options,absolute:true});}
 toAbsoluteXYZ(q,options={}){return this.toXYZ(q,{...options,absolute:true});}
 fromRGB(rgb,h=0){if(this.gamut!=='srgb')throw TypeError('Native RGB methods require sRGB profile');return this.model.fromRGB(rgb,h);}
 toRGB(q){if(this.gamut!=='srgb')throw TypeError('Full profile has no silently clipped sRGB output');return this.model.toRGB(q);}
 fromPseudoRGB(rgb,h=0){return this.fromXYZ(this.carrier.toXYZ(rgb),{neutralHue:h});}
 toPseudoRGB(q){return this.carrier.fromXYZ(this.model.toXYZ(q));}
 embed(q){return this.model.embed(q);}
 distance(a,b){return this.model.distance(a,b);}
 vivid(H){return this.model.toXYZ({H,R:1,L:1});}
 labelForHue(H){return this.model.labelForHue(H);}
}
export async function createRelativeHRL({gamut='full',variant='candidate',referenceWhiteNits=300,overflow='clip',imaginary='clip'}={}){
 if(!['full','srgb'].includes(gamut)||!['parent','smooth','candidate'].includes(variant))throw RangeError('Unknown profile or variant');
 const old=variant==='candidate'?await createRLC1({gamut,variant:'candidate'}):await createASmooth({gamut,variant});
 let model=old;
 if(gamut==='full'){
  const base=new RelativeFullBase(old.base),readout=Object.assign(Object.create(Object.getPrototypeOf(old.source.readout)),old.source.readout,{field:base.field});
  const source=new PathModel(base,await readRecord(),readout);source.carrier=base.carrier;
  // C1 interpolation stays C1 in the selected candidate; parent/Smooth retain
  // their interpolation policy so domain change and smoothing remain separate.
  if(variant==='candidate'){source.level=new C1Atlas(source.level.record);source.reach=new C1Atlas(source.reach.record);}
  model=new OPALFreeModel(source,old.record);model.fullVivid=H=>base.fullVivid(H);
 }
 return new RelativeModel(model,{referenceWhiteNits,overflow,imaginary});
}

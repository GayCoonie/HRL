/** Unfitted experimental physical-field candidate. Beta 1 remains immutable. */
import {createSpectralTonalHRL} from '../boundary-tonal/index.mjs';
import {OPALFreeModel} from '../../a-smooth/rl-core.mjs';
import {encodeSRGB,decodeSRGB} from '../../lib/srgb-triangles.mjs';
import {FreshFieldTransport} from './model.mjs';

async function read(url){
  if(url.protocol==='file:'){
    const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));
  }
  const r=await fetch(url);if(!r.ok)throw Error('Fresh-field seed unavailable '+r.status);return r.json();
}
export class FreshFieldModel extends OPALFreeModel {
  toPhysical(q){return this.transport.forward(q);}
  fromPhysical(q){return this.transport.inverse(q);}
  physicalXYZ(q){const xyz=this.base.toXYZ(q);return this.source.fromLegacyXYZ?this.source.fromLegacyXYZ(xyz):xyz;}
  physicalFromXYZ(x,h=0){return this.base.fromXYZ(this.source.toLegacyXYZ?this.source.toLegacyXYZ(x):x,h);}
  toXYZ(q){return this.physicalXYZ(this.toPhysical(q));}
  fromXYZ(x,h=0){return this.fromPhysical(this.physicalFromXYZ(x,h));}
  toSource(q){return this.source.fromBase(this.toPhysical(q));}
  fromSource(q){return this.fromPhysical(this.source.toBase(q));}
  toLinear(q){if(this.gamut!=='srgb')throw new TypeError('Native sRGB only');return this.base.toLinear(this.toPhysical(q));}
  fromLinear(rgb,h=0){if(this.gamut!=='srgb')throw new TypeError('Native sRGB only');return this.fromPhysical(this.base.fromLinear(rgb,h));}
  toRGB(q){return this.toLinear(q).map(encodeSRGB);}
  fromRGB(rgb,h=0){return this.fromLinear(rgb.map(decodeSRGB),h);}
}

export async function createFreshFieldHRL({gamut='srgb',record=null,referenceWhiteNits=300}={}){
  if(!['srgb','full'].includes(gamut))throw new RangeError('Fresh-field realizations: srgb or full');
  const bank=record??await read(new URL('./records/seed.json',import.meta.url));
  const transport=new FreshFieldTransport(bank);
  // The wrapper's mapped import and pseudoRGB closures point to this exact
  // mutable model object; replacing that object would keep stale conversions.
  const out=await createSpectralTonalHRL({gamut,checkpoint:'metric',referenceWhiteNits});
  Object.setPrototypeOf(out.model,FreshFieldModel.prototype);
  out.model.transport=transport;out.model.record=bank;
  out.model.variant='fresh-field';out.model.version=out.version='2.0.0-fresh-field-seed.1';
  out.model.name=out.name='HRL experimental physical field';
  out.definition=bank;out.checkpoint='fresh-field-seed';
  return out;
}

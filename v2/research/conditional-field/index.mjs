/** Experimental conditional Reach/Level model; the user-facing Beta 1 default is unchanged. */
import {createSpectralTonalHRL} from '../boundary-tonal/index.mjs';
import {FreshFieldModel} from '../fresh-field/index.mjs';
import {ConditionalFieldTransport} from './model.mjs';

async function read(url){
  if(url.protocol==='file:'){
    const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));
  }
  const r=await fetch(url);if(!r.ok)throw Error('Conditional-field seed unavailable '+r.status);return r.json();
}
export class ConditionalFieldModel extends FreshFieldModel {}

export async function createConditionalFieldHRL({gamut='srgb',record=null,referenceWhiteNits=300}={}){
  if(!['srgb','full'].includes(gamut))throw new RangeError('Conditional field realizations: srgb or full');
  const bank=record??await read(new URL('./records/seed.json',import.meta.url)),transport=new ConditionalFieldTransport(bank);
  // Existing wrapper import and pseudoRGB functions close over this very model.
  const out=await createSpectralTonalHRL({gamut,checkpoint:'metric',referenceWhiteNits});
  Object.setPrototypeOf(out.model,ConditionalFieldModel.prototype);
  out.model.transport=transport;out.model.record=bank;
  out.model.variant='conditional-field';out.model.version=out.version='2.0.0-conditional-field-v3.experimental';
  out.model.name=out.name='HRL experimental conditional physical field';
  out.definition=bank;out.checkpoint=record===null?'conditional-field-v3-seed':'conditional-field-v3-record';
  return out;
}

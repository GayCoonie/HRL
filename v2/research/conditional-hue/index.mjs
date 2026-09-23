/** Research-only v4: conditional physical Reach/Level plus interior hue flow. */
import {createConditionalFieldHRL,ConditionalFieldModel} from '../conditional-field/index.mjs';
import {HueFlow,interiorWeight,validateHueRecord} from './model.mjs';

async function read(url){
  if(url.protocol==='file:'){
    const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));
  }
  const r=await fetch(url);if(!r.ok)throw Error('Conditional hue seed unavailable '+r.status);return r.json();
}

export class ConditionalHueModel extends ConditionalFieldModel {
  toPhysical(q){
    const base=this.transport.forward(q),weight=interiorWeight(base);
    return{...base,H:this.hueFlow.forward(q.H,weight)};
  }
  fromPhysical(base){
    const weight=interiorWeight(base),H=this.hueFlow.inverse(base.H,weight);
    return this.transport.inverse({...base,H});
  }
}

export async function createConditionalHueHRL({gamut='srgb',record=null,referenceWhiteNits=300}={}){
  const bank=validateHueRecord(record??await read(new URL('./records/seed.json',import.meta.url)));
  const tonal={...bank,schema:'hrl-conditional-field-v3'};
  // Preserve the existing wrapper object and its import and pseudoRGB closures.
  const out=await createConditionalFieldHRL({gamut,record:tonal,referenceWhiteNits});
  Object.setPrototypeOf(out.model,ConditionalHueModel.prototype);
  out.model.hueFlow=new HueFlow(bank);out.model.record=bank;
  out.model.variant='conditional-hue';
  out.model.version=out.version='2.0.0-conditional-hue-v4.seed';
  out.model.name=out.name='HRL experimental conditional field with interior hue';
  out.definition=bank;out.checkpoint='conditional-hue-v4-seed';
  return out;
}

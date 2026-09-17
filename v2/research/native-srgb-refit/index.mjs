/** Gamut-relative HRL refits. sRGB uses its own hue-sheet boundary and R/L fit. */
import {createRelativeHRL,RelativeModel} from '../relative-domain/index.mjs';
import {createRelativeRefit} from '../relative-refit/index.mjs';
import {OPALFreeModel} from '../../a-smooth/rl-core.mjs';
export const VERSION='0.9-dual-gamut-refits';
const records=new Map();
async function readRecord(name){
 if(!/^[a-zA-Z0-9_-]+$/.test(name))throw new RangeError('Invalid native checkpoint name');
 if(!records.has(name))records.set(name,(async()=>{
  const u=new URL(`results/${name}.json`,import.meta.url);
  if(u.protocol==='file:'){const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(u,'utf8'));}
  const r=await fetch(u);if(!r.ok)throw new Error(`Native sRGB checkpoint not available: ${r.status}`);return r.json();
 })().catch(e=>{records.delete(name);throw e;}));
 return records.get(name);
}
export async function createHRLRefits({gamut='srgb',checkpoint='balanced',referenceWhiteNits=300,overflow='clip',imaginary='clip'}={}){
 if(!['srgb','full'].includes(gamut))throw new RangeError('Use gamut srgb or full');
 if(checkpoint==='baseline')return createRelativeHRL({gamut,variant:'candidate',referenceWhiteNits,overflow,imaginary});
 if(gamut==='full')return createRelativeRefit({gamut:'full',checkpoint,referenceWhiteNits,overflow,imaginary});
 const baseline=await createRelativeHRL({gamut:'srgb',variant:'candidate',referenceWhiteNits,overflow,imaginary});
 const definition=await readRecord(checkpoint);
 if(definition.ring_logits!==null||definition.gamut_calibration!=='separate')throw new Error('Native calibration must preserve the shared hue ring');
 const model=new OPALFreeModel(baseline.model.source,definition);
 const out=new RelativeModel(model,{referenceWhiteNits,overflow,imaginary});
 out.name=`HRL ${VERSION} native sRGB ${checkpoint}`;out.version=VERSION;out.checkpoint=checkpoint;
 return out;
}

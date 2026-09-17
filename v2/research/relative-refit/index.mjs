/** R/L-only refit on the unchanged relative-Y physical solid. */
import {createRelativeHRL,RelativeModel} from '../relative-domain/index.mjs';
import {OPALFreeModel} from '../../a-smooth/rl-core.mjs';
export const VERSION='0.9-RL-refit';
async function readRecord(name){
 if(!/^[a-zA-Z0-9_-]+$/.test(name))throw new RangeError('Invalid checkpoint name');
 const u=new URL(`results/${name}.json`,import.meta.url);
 if(u.protocol==='file:'){const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(u,'utf8'));}
 const r=await fetch(u);if(!r.ok)throw new Error(`Cannot load R/L refit checkpoint: ${r.status}`);return r.json();
}
export async function createRelativeRefit({gamut='full',checkpoint='balanced',referenceWhiteNits=300,overflow='clip',imaginary='clip'}={}){
 const baseline=await createRelativeHRL({gamut,variant:'candidate',referenceWhiteNits,overflow,imaginary});
 if(gamut==='srgb')return baseline; // native calibration is intentionally untouched.
 const definition=await readRecord(checkpoint);
 if(definition.ring_logits!==null||definition.gamut_calibration!=='separate')throw new Error('Expected the frozen shared hue ring and separate profile calibration');
 const model=new OPALFreeModel(baseline.model.source,definition);
 model.fullVivid=H=>baseline.model.base.fullVivid(H);
 const out=new RelativeModel(model,{referenceWhiteNits,overflow,imaginary});
 out.version=VERSION;out.name=`HRL ${VERSION} ${checkpoint}`;
 return out;
}

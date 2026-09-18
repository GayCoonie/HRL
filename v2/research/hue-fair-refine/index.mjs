/** Balanced-parent shared-gamut refinements. Previous APIs remain untouched. */
import {createGenTonalHRL} from '../gen-tonal-fit/index.mjs';
export {coordinates,ADOBE_RGB1998,DISPLAY_P3,REC2020,addBlack,addWhite,exchangeNeutral,getSource} from '../gen-tonal-fit/index.mjs';
export async function createHueFairHRL({checkpoint='balanced',record=null,...options}={}){
 if(!record){if(!/^[a-z0-9-]+$/.test(checkpoint))throw RangeError('Invalid checkpoint');const u=new URL(`results/${checkpoint}.json`,import.meta.url);if(u.protocol==='file:'){const{readFile}=await import('node:fs/promises');record=JSON.parse(await readFile(u,'utf8'));}else{const r=await fetch(u);if(!r.ok)throw Error('Checkpoint unavailable '+r.status);record=await r.json();}}
 const m=await createGenTonalHRL({...options,record});m.version='0.12-hue-fair';m.name='HRL 0.12 '+record.variant;m.model.version=m.version;m.model.name=m.name;return m;
}

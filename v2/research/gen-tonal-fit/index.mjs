/** Shared GenSpace-trained tonal checkpoints. Old models and APIs are untouched. */
import {createSharedHRL,getSource,ADOBE_RGB1998,DISPLAY_P3,REC2020} from '../shared-rl/source.mjs';
export {getSource,ADOBE_RGB1998,DISPLAY_P3,REC2020};
export {sharedCoordinates as coordinates} from '../shared-rl/core.mjs';
export {addBlack,addWhite,exchangeNeutral} from '../tonal-semantics/operations.mjs';
export const VERSION='0.11-gen-tonal';
async function read(name){if(!/^[a-z0-9-]+$/.test(name))throw RangeError('Invalid checkpoint');const u=new URL(`results/${name}.json`,import.meta.url);if(u.protocol==='file:'){const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(u,'utf8'));}const r=await fetch(u);if(!r.ok)throw Error('Checkpoint unavailable '+r.status);return r.json();}
export async function createGenTonalHRL({checkpoint='balanced',record=null,...options}={}){
 const def=record||await read(checkpoint);if(def.research?.ruler!=='helmlab-1.0.0-genspace')throw Error('Not a GenSpace tonal fit record');
 const m=await createSharedHRL({...options,record:def});m.version=VERSION;m.name='HRL '+VERSION+' '+def.variant;m.model.version=VERSION;m.model.name=m.name;return m;
}

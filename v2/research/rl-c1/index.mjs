/** Experimental R/L-only continuation of A Smooth. Accepted checkpoints unchanged. */
import {createASmooth} from '../../a-smooth/index.mjs';
import {OPALFreeModel} from '../../a-smooth/rl-core.mjs';
import {C1Atlas} from './atlas.mjs';
async function readRecord(){const url=new URL('./candidate.json',import.meta.url);if(url.protocol==='file:'){const{readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));}const r=await fetch(url);if(!r.ok)throw Error('Cannot load experimental checkpoint');return r.json();}
export async function createRLC1({gamut='srgb',variant='smooth',secondary=true,record=null}={}){
 const original=await createASmooth({gamut,variant:variant==='parent'?'parent':'smooth'});
 const source=Object.assign(Object.create(Object.getPrototypeOf(original.source)),original.source);
 source.level=new C1Atlas(source.level.record,{secondary});source.reach=new C1Atlas(source.reach.record,{secondary});
 const definition=record||(variant==='candidate'?await readRecord():original.record);
 const m=new OPALFreeModel(source,definition);m.version=variant==='candidate'?'0.8A-RL-C1-candidate':'0.8A-'+variant+'-C1-unfitted';m.name='HRL R/L C1 '+variant;
 return m;
}

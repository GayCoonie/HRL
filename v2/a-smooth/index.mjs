/** Approved A Smooth: original hue ring, original sheets, fixed R/L checkpoint. */
import {HueField} from '../lib/hue-field.mjs';
import {expandReleaseAngles} from '../lib/index.mjs';
import {ResearchSRGBTriangles,EqualSpanFull,PathModel} from '../lib/research.mjs';
import {SourceAppearanceReadout} from './source-readout.mjs';
import {OPALFreeModel} from './rl-core.mjs';
export const VERSION='0.8A-RL-smooth';
export const VARIANTS=Object.freeze(['smooth','parent']);
async function read(relative){
 const url=new URL(relative,import.meta.url);
 if(url.protocol==='file:'){const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));}
 const response=await fetch(url);if(!response.ok)throw new Error(`Cannot load ${url}: ${response.status}`);return response.json();
}
let common;
const sources=new Map();
async function source(gamut){
 if(!common)common=Promise.all([read('definitions.json'),read('../data/hue-field-0.6.json'),read('../data/release1-angles.json'),read('../data/appearance-readouts.json')]).catch(e=>{common=null;throw e;});
 const [definition,packet,angles,readouts]=await common;
 if(!sources.has(gamut))sources.set(gamut,(async()=>{
  const field=new HueField(packet),release=expandReleaseAngles(angles);
  const base=gamut==='srgb'?new ResearchSRGBTriangles(field,release):new EqualSpanFull(field,release);base.gamut=gamut;
  const readout=new SourceAppearanceReadout(field,readouts.brightness,readouts.saturation,definition.brightness);
  return new PathModel(base,await read(`source-${gamut}.json`),readout);
 })().catch(e=>{sources.delete(gamut);throw e;}));
 return {definition,source:await sources.get(gamut)};
}
export async function createASmooth({gamut='srgb',variant='smooth'}={}){
 if(!['srgb','full'].includes(gamut)||!VARIANTS.includes(variant))throw new RangeError('Use gamut srgb/full and variant smooth/parent');
 const s=await source(gamut),record=s.definition.models[variant];
 if(record.ring_logits!==null||record.gamut_calibration!=='separate')throw new Error('Publication requires the original fixed ring');
 const model=new OPALFreeModel(s.source,record);
 model.version=variant==='smooth'?VERSION:'0.8A';model.name=variant==='smooth'?'HRL A Smooth':'HRL A parent';
 return model;
}

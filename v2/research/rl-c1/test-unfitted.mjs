import fs from 'node:fs';import assert from 'node:assert/strict';
import {createRLC1} from './index.mjs';import {createASmooth} from '../../a-smooth/index.mjs';
const pairs=JSON.parse(fs.readFileSync(new URL('../equal-span/results/combvd-inputs.json',import.meta.url)));
const out={};let seed=209;
const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(const gamut of ['srgb','full'])for(const variant of ['parent','smooth']){
 const base=await createASmooth({gamut,variant}),m=await createRLC1({gamut,variant});let dd=0,dv=0,vv=0,n=0,error=0,changed=0;
 for(const p of pairs){try{const a=m.fromXYZ(p.xyz1),b=m.fromXYZ(p.xyz2),d=m.distance(a,b),w=p.weight;dd+=w*d*d;dv+=w*d*p.dv;vv+=w*p.dv*p.dv;n++;}catch(e){if(!(e instanceof RangeError))throw e;}}
 for(let i=0;i<1000;i++){
  const L=rand(),q={H:360*rand(),R:L*rand(),L},x=m.toXYZ(q),back=m.fromXYZ(x),e=Math.max(...m.embed(q).map((v,j)=>Math.abs(v-m.embed(back)[j])));error=Math.max(error,e);
  assert(e<2e-6);
 }
 for(let H=0;H<360;H+=5){assert.deepEqual(m.vivid(H),base.vivid(H));assert.equal(m.labelForHue(H),base.labelForHue(H));}
 out[gamut+'-'+variant]={n,weighted_stress:100*Math.sqrt(Math.max(0,1-dv*dv/dd/vv)),max_roundtrip_error:error};console.log(gamut,variant,out[gamut+'-'+variant]);
}
fs.writeFileSync(new URL('results/c1-unfitted.json',import.meta.url),JSON.stringify(out,null,2)+'\n');

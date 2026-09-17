import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createRLC1} from './index.mjs';import {createASmooth} from '../../a-smooth/index.mjs';
const raw=fs.readFileSync(new URL('candidate.json',import.meta.url));
const pairs=JSON.parse(fs.readFileSync(new URL('../equal-span/results/combvd-inputs.json',import.meta.url)));
const out={candidate_sha256:crypto.createHash('sha256').update(raw).digest('hex'),model:'0.8A R/L C1 balanced',profiles:{}};
let seed=81264;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const maxdiff=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
for(const gamut of ['srgb','full']){
 const m=await createRLC1({gamut,variant:'candidate'}),reference=await createASmooth({gamut,variant:'smooth'}),parent=await createASmooth({gamut,variant:'parent'});
 let dd=0,dv=0,vv=0,embeddingError=0,neutralError=0,hueError=0;const indices=[];
 for(const p of pairs){try{const a=m.fromXYZ(p.xyz1),b=m.fromXYZ(p.xyz2),d=m.distance(a,b),w=p.weight;dd+=w*d*d;dv+=w*d*p.dv;vv+=w*p.dv*p.dv;indices.push(p.index);}catch(e){if(!(e instanceof RangeError))throw e;}}
 for(let i=0;i<4096;i++){
  const L=rand(),q={H:360*rand(),R:L*rand(),L},xyz=m.toXYZ(q),back=m.fromXYZ(xyz),e=maxdiff(m.embed(q),m.embed(back));embeddingError=Math.max(embeddingError,e);assert(e<5e-8);
  const q0=parent.fromXYZ(xyz);hueError=Math.max(hueError,Math.abs(((back.H-q0.H+540)%360)-180));
 }
 for(let H=0;H<360;H+=.5){assert.equal(m.labelForHue(H),parent.labelForHue(H));assert.deepEqual(m.vivid(H),parent.vivid(H));}
 for(let i=0;i<=1024;i++){const q={H:37,R:0,L:i/1024};neutralError=Math.max(neutralError,maxdiff(m.toXYZ(q),reference.toXYZ(q)));}
 assert(neutralError<1e-12);assert(hueError<1e-10);
 let integer16=0;
 for(let i=0;i<1024;i++){
  const channels=[rand(),rand(),rand()].map(x=>Math.floor(x*65536)),rgb=channels.map(x=>x/65535);
  const q=gamut==='srgb'?m.fromRGB(rgb):m.fromPseudoRGB(rgb),back=gamut==='srgb'?m.toRGB(q):m.toPseudoRGB(q);
  assert.deepEqual(back.map(x=>Math.round(x*65535)),channels);integer16++;
 }
 for(let i=0;i<256;i++){const rgb=[i/255,i/255,i/255],q=gamut==='srgb'?m.fromRGB(rgb):m.fromPseudoRGB(rgb),back=gamut==='srgb'?m.toRGB(q):m.toPseudoRGB(q);assert.deepEqual(back.map(x=>Math.round(x*255)),[i,i,i]);}
 let inverseError=0,minIncrement=Infinity;
 for(const atlas of [m.source.level,m.source.reach])for(let k=0;k<64;k++){
  const H=rand()*360,s=rand(),y=atlas.row(H,s);for(let i=1;i<y.length;i++)minIncrement=Math.min(minIncrement,y[i]-y[i-1]);
  for(let j=0;j<=32;j++){const x=j===0?0:j===32?1:rand(),v=atlas.forward(H,s,x),back=atlas.inverse(H,s,v);inverseError=Math.max(inverseError,Math.abs(x-back));}
 }
 assert(minIncrement>0);assert(inverseError<1e-10);
 const expected=gamut==='srgb'?27.833646147955804:28.489587944394685;
 const stress=100*Math.sqrt(1-dv*dv/dd/vv);assert(Math.abs(stress-expected)<2e-8);
 out.profiles[gamut]={weighted_stress:stress,n:indices.length,retained_indices_sha256:crypto.createHash('sha256').update(JSON.stringify(indices)).digest('hex'),random_triangle_roundtrips:4096,max_embedding_roundtrip_error:embeddingError,unchanged_vivid_samples:720,max_hue_change_deg:hueError,neutral_samples:1025,max_neutral_xyz_change:neutralError,integer16_exact_roundtrips:integer16,gray8_exact_roundtrips:256,min_atlas_row_increment:minIncrement,max_atlas_inverse_error:inverseError};
 console.log(gamut,out.profiles[gamut]);
}
fs.writeFileSync(new URL('results/verification.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log('Candidate verification passed');

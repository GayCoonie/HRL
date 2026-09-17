/** Cache exact production-source coordinates, not an approximated color-space port. */
import fs from 'node:fs';import crypto from 'node:crypto';
import {createRLC1} from './index.mjs';import {createASmooth} from '../../a-smooth/index.mjs';
const url=new URL('../equal-span/results/combvd-inputs.json',import.meta.url),raw=fs.readFileSync(url),pairs=JSON.parse(raw);
const out={input_sha256:crypto.createHash('sha256').update(raw).digest('hex'),grid_steps:16,profiles:{}};
for(const gamut of ['srgb','full']){
 const m=await createRLC1({gamut}),reference=await createASmooth({gamut,variant:'smooth'}),a=[],b=[],dv=[],w=[],indices=[];
 for(const p of pairs){try{const x=m.source.fromXYZ(p.xyz1),y=m.source.fromXYZ(p.xyz2);a.push([x.H,x.R,x.L]);b.push([y.H,y.R,y.L]);dv.push(p.dv);w.push(p.weight);indices.push(p.index);}catch(e){if(!(e instanceof RangeError))throw e;}}
 const grid=[],target=[],addresses=[],lookup=new Map();
 for(let h=0;h<24;h++)for(let i=0;i<=16;i++)for(let j=0;j<=i;j++){
  const q={H:h*15,R:j/16,L:i/16},xyz=reference.toXYZ(q),s=m.source.fromXYZ(xyz,q.H);
  lookup.set(`${h},${i},${j}`,grid.length);grid.push([s.H,s.R,s.L]);target.push(reference.embed(q));addresses.push([h,i,j]);
 }
 const first=[],second=[];
 for(const [h,i,j] of addresses){const z=lookup.get(`${h},${i},${j}`);
  for(const [di,dj] of [[1,0],[0,1]]){const a=lookup.get(`${h},${i-di},${j-dj}`),b=lookup.get(`${h},${i+di},${j+dj}`);if(b!==undefined)first.push([z,b]);if(a!==undefined&&b!==undefined)second.push([a,z,b]);}
 }
 out.profiles[gamut]={a,b,dv,w,indices,grid,target,first,second};console.log(gamut,indices.length,grid.length);
}
fs.writeFileSync(new URL('results/fit-cache.json',import.meta.url),JSON.stringify(out));

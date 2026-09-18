import fs from 'node:fs';import {getBoundarySource,createSpectralTonalHRL} from './index.mjs';
const r=JSON.parse(fs.readFileSync(new URL('results/training-inputs.json',import.meta.url))),out={source:r.provenance,profiles:{}};
for(const gamut of ['srgb','full']){
 const source=await getBoundarySource(gamut),indices=gamut==='srgb'?r.native_indices:Array.from({length:r.dv.length},(_,i)=>i),p={a:[],b:[],dv:[],w:[],indices};
 for(const i of indices){const a=source.fromXYZ(r.xyz1[i]),b=source.fromXYZ(r.xyz2[i]);p.a.push([a.H,a.R,a.L]);p.b.push([b.H,b.R,b.L]);p.dv.push(r.dv[i]);p.w.push(r.w[i]);}
 const m=await createSpectralTonalHRL({gamut,checkpoint:'boundary'});let dd=0,dv=0,vv=0;
 for(let i=0;i<indices.length;i++){const q=x=>m.model.fromSource({H:x[0],R:x[1],L:x[2]}),d=m.distance(q(p.a[i]),q(p.b[i])),w=p.w[i],v=p.dv[i];dd+=w*d*d;dv+=w*d*v;vv+=w*v*v;}
 p.baselineWeighted=100*Math.sqrt(1-dv*dv/dd/vv);out.profiles[gamut]=p;console.log(gamut,indices.length,p.baselineWeighted);
}
fs.writeFileSync(new URL('results/cache.json',import.meta.url),JSON.stringify(out)+'\n');

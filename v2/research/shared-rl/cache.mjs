/** Exact source-coordinate/XYZ cache for joint training. No held-out data. */
import fs from 'node:fs';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {createHRLRefits} from '../native-srgb-refit/index.mjs';
import {getSource} from './source.mjs';
const root=new URL('./',import.meta.url),fine=process.argv.includes('--fine'),H=fine?48:24,N=fine?161:129;
if(isMainThread){
 fs.mkdirSync(new URL('results/',root),{recursive:true});
 const pairs=JSON.parse(fs.readFileSync(new URL('../relative-refit/results/training-pairs.json',root))),out={H,N,profiles:{}};
 for(const gamut of ['srgb','full']){
  const model=await createHRLRefits({gamut,checkpoint:'balanced',overflow:'reject',imaginary:'reject'}),source=await getSource(gamut),p={a:[],b:[],dv:[],w:[],indices:[],baseline:model.model.record};
  for(let i=0;i<pairs.length;i++){const x=pairs[i];try{const a=source.fromXYZ(x.xyz1),b=source.fromXYZ(x.xyz2);p.a.push([a.H,a.R,a.L]);p.b.push([b.H,b.R,b.L]);p.dv.push(x.dv);p.w.push(x.weight);p.indices.push(i);}catch(e){if(!(e instanceof RangeError))throw e;}}
  out.profiles[gamut]=p;console.log(gamut,'pairs',p.a.length);
 }
 fs.writeFileSync(new URL(`results/cache${fine?'-fine':''}.json`,root),JSON.stringify(out));
 if(!process.argv.includes('--coordinates-only'))for(const gamut of ['srgb','full']){
  const a=new Float64Array(H*N*N*3);
  await Promise.all(Array.from({length:4},(_,i)=>new Promise((resolve,reject)=>{
   const w=new Worker(new URL(import.meta.url),{workerData:{start:i*H/4,end:(i+1)*H/4,gamut},argv:fine?['--fine']:[]});
   w.on('message',m=>{if(m.grid){a.set(new Float64Array(m.grid),m.start*N*N*3);resolve();}else console.log(gamut,'hue',m.h);});w.on('error',reject);w.on('exit',n=>{if(n)reject(Error('worker failed '+n));});
  })));
  fs.writeFileSync(new URL(`results/grid-${fine?'fine-':''}${gamut}.f64`,root),Buffer.from(a.buffer));
 }
}else{
 const{start,end,gamut}=workerData,source=await getSource(gamut),a=new Float64Array((end-start)*N*N*3);let k=0;
 for(let h=start;h<end;h++){
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
   const L=(1-Math.cos(Math.PI*j/(N-1)))/2,U=(1-Math.cos(Math.PI*i/(N-1)))/2;
   for(const v of source.toXYZ({H:360*h/H,R:L*U,L}))a[k++]=v;
  }parentPort.postMessage({h});
 }parentPort.postMessage({start,grid:a.buffer},[a.buffer]);
}

/** Rebuild exact source-XYZ -> frozen GenSpace grids. No observer/policy clipping. */
import fs from 'node:fs';import crypto from 'node:crypto';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {getSource} from '../shared-rl/source.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const H=+(process.env.HUES||48),N=+(process.env.GRID||193),root=new URL('./',import.meta.url);
if(isMainThread){
 const metadata={H,N,grid:'cosine in source U=R/L and L',ruler:'frozen HelmLab 1.0.0 GenSpace, neutral correction off',source:'shared deterministic own-gamut chart',hashes:{},profiles:{}};
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
 for(const p of ['../shared-rl/source.mjs','../shared-rl/core.mjs','../shared-rl/results/cache.json','../../../src/base/appearance-runtime.mjs','../../../src/base/gen-parameters.mjs'])metadata.hashes[p]=hash(p);
 for(const gamut of ['srgb','full']){
  const data=new Float64Array(H*N*N*3);let done=0;const begin=Date.now();
  await Promise.all(Array.from({length:4},(_,i)=>new Promise((resolve,reject)=>{
   const start=Math.floor(i*H/4),end=Math.floor((i+1)*H/4);const w=new Worker(new URL(import.meta.url),{workerData:{gamut,start,end,H,N}});
   w.on('message',m=>{if(m.buffer){data.set(new Float64Array(m.buffer),start*N*N*3);resolve();}else{done++;if(done%6===0)console.log(gamut,done,'/',H,Math.round((Date.now()-begin)/1000)+'s');}});w.on('error',reject);w.on('exit',code=>{if(code)reject(Error('worker '+code));});
  })));
  const path=`results/gen-grid-${gamut}.f64`;fs.writeFileSync(new URL(path,root),Buffer.from(data.buffer));metadata.profiles[gamut]={sha256:hash(path),seconds:(Date.now()-begin)/1000};fs.writeFileSync(new URL('results/grid.json',root),JSON.stringify(metadata,null,2)+'\n');
 }
}else{
 const {gamut,start,end,H,N}=workerData,source=await getSource(gamut),v=new Float64Array((end-start)*N*N*3),grid=Array.from({length:N},(_,i)=>(1-Math.cos(Math.PI*i/(N-1)))/2);let k=0;
 for(let h=start;h<end;h++){for(const L of grid)for(const U of grid){const gen=genRuler(source.toXYZ({H:360*h/H,R:L*U,L}));for(const x of gen)v[k++]=x;}parentPort.postMessage({h});}
 parentPort.postMessage({buffer:v.buffer},[v.buffer]);
}

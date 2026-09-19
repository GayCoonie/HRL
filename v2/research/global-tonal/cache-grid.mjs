/** Rebuild exact source-XYZ -> frozen GenSpace grids. No observer/policy clipping. */
import fs from 'node:fs';import {pathToFileURL} from 'node:url';import crypto from 'node:crypto';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {getBoundarySource as getSource} from '../boundary-tonal/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const H=+(process.env.HUES||48),N=+(process.env.GRID||193),root=new URL('../boundary-tonal/',import.meta.url),output=pathToFileURL(process.env.GRID_ROOT+'/');
if(!process.env.GRID_ROOT||!process.env.GRID_ROOT.startsWith('/'))throw Error('Absolute scratch GRID_ROOT required');
fs.mkdirSync(output,{recursive:true});
if(isMainThread){
 const metadata={H,N,grid:'cosine in source U=R/L and L',ruler:'frozen HelmLab 1.0.0 GenSpace, neutral correction off',source:'shared deterministic chart with full-domain 1-nm boundary transport',hashes:{},profiles:{}};
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
 for(const p of ['index.mjs','boundary-1nm.json','results/cache.json','../shared-rl/source.mjs','../shared-rl/core.mjs','../../../src/base/appearance-runtime.mjs','../../../src/base/gen-parameters.mjs'])metadata.hashes[p]=hash(p);
 for(const gamut of ['srgb','full']){
  const data=new Float64Array(H*N*N*3);let done=0;const begin=Date.now();
  await Promise.all(Array.from({length:4},(_,i)=>new Promise((resolve,reject)=>{
   const start=Math.floor(i*H/4),end=Math.floor((i+1)*H/4);const w=new Worker(new URL(import.meta.url),{workerData:{gamut,start,end,H,N}});
   w.on('message',m=>{if(m.buffer){data.set(new Float64Array(m.buffer),start*N*N*3);resolve();}else{done++;if(done%6===0)console.log(gamut,done,'/',H,Math.round((Date.now()-begin)/1000)+'s');}});w.on('error',reject);w.on('exit',code=>{if(code)reject(Error('worker '+code));});
  })));
  const path=`gen-grid-${gamut}.f64`,raw=Buffer.from(data.buffer);fs.writeFileSync(new URL(path,output),raw);metadata.profiles[gamut]={sha256:crypto.createHash('sha256').update(raw).digest('hex'),seconds:(Date.now()-begin)/1000};fs.writeFileSync(new URL('grid.json',output),JSON.stringify(metadata,null,2)+'\n');
 }
}else{
 const {gamut,start,end,H,N}=workerData,source=await getSource(gamut),v=new Float64Array((end-start)*N*N*3),grid=Array.from({length:N},(_,i)=>(1-Math.cos(Math.PI*i/(N-1)))/2);let k=0;
 for(let h=start;h<end;h++){for(const L of grid)for(const U of grid){const gen=genRuler(source.toXYZ({H:360*h/H,R:L*U,L}));for(const x of gen)v[k++]=x;}parentPort.postMessage({h});}
 parentPort.postMessage({buffer:v.buffer},[v.buffer]);
}

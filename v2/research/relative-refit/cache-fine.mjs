/** Exact fixed-source grid with endpoint-resolving cosine spacing. */
import fs from 'node:fs';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {createRelativeHRL} from '../relative-domain/index.mjs';
const H=48,N=193;
if(isMainThread){
 const record=JSON.parse(fs.readFileSync(new URL('results/cache.json',import.meta.url)));record.H=H;record.N=N;record.parameter='(1-cos(pi*t))/2';
 fs.writeFileSync(new URL('results/cache-fine.json',import.meta.url),JSON.stringify(record));
 const out=new Float64Array(H*N*N*3);let completed=0;
 await Promise.all(Array.from({length:4},(_,i)=>new Promise((resolve,reject)=>{
  const worker=new Worker(new URL(import.meta.url),{workerData:{start:i*12,end:(i+1)*12}});
  worker.on('message',message=>{if(message.grid){out.set(new Float64Array(message.grid),message.start*N*N*3);resolve();}else{console.log('source hue',message.h,'completed',++completed,'/',H);}});worker.on('error',reject);worker.on('exit',code=>{if(code)reject(Error('grid worker '+code));});
 })));
 fs.writeFileSync(new URL('results/source-grid-fine.f64',import.meta.url),Buffer.from(out.buffer));console.log('fine cache ready');
}else{
 const model=await createRelativeHRL({gamut:'full',variant:'candidate',overflow:'reject',imaginary:'reject'}),source=model.model.source;
 const {start,end}=workerData,out=new Float64Array((end-start)*N*N*3);let offset=0;
 for(let h=start;h<end;h++){
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
   const L=(1-Math.cos(Math.PI*j/(N-1)))/2,U=(1-Math.cos(Math.PI*i/(N-1)))/2,xyz=source.toXYZ({H:h*360/H,R:U*L,L});
   for(let k=0;k<3;k++)out[offset++]=xyz[k];
  }
  parentPort.postMessage({h});
 }
 parentPort.postMessage({start,grid:out.buffer},[out.buffer]);
}

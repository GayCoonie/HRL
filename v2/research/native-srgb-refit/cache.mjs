/** Fit the native sRGB chart, not clipped full-domain HRL. Exact source coordinates. */
import fs from 'node:fs';import crypto from 'node:crypto';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {createRelativeHRL} from '../relative-domain/index.mjs';
const root=new URL('./',import.meta.url),H=48,N=161;
if(isMainThread){
 const pairs=JSON.parse(fs.readFileSync(new URL('results/training-pairs.json',root)));
 const model=await createRelativeHRL({gamut:'srgb',variant:'candidate',overflow:'reject',imaginary:'reject'}),source=model.model.source;
 const data={id:'native-sRGB-own-anchor-source',H,N,parameter:'(1-cos(pi*t))/2',pairs:{a:[],b:[],dv:[],w:[],indices:[]},baseline:model.model.record,rejected:[]};
 for(const p of pairs){try{const a=source.fromXYZ(p.xyz1),b=source.fromXYZ(p.xyz2);data.pairs.a.push([a.H,a.R,a.L]);data.pairs.b.push([b.H,b.R,b.L]);data.pairs.dv.push(p.dv);data.pairs.w.push(p.weight);data.pairs.indices.push(p.index);}catch(e){if(!(e instanceof RangeError))throw e;data.rejected.push(p.index);}}
 if(data.pairs.a.length!==3331)throw Error('Unexpected sRGB mask: '+data.pairs.a.length);
 data.source_sha256=crypto.createHash('sha256').update(fs.readFileSync(new URL('../../a-smooth/source-srgb.json',root))).digest('hex');
 fs.writeFileSync(new URL('results/cache.json',root),JSON.stringify(data));fs.writeFileSync(new URL('results/cache-fine.json',root),JSON.stringify(data));
 const out=new Float64Array(H*N*N*3);let done=0;
 await Promise.all(Array.from({length:4},(_,i)=>new Promise((resolve,reject)=>{
  const worker=new Worker(new URL(import.meta.url),{workerData:{start:i*12,end:(i+1)*12}});
  worker.on('message',m=>{if(m.grid){out.set(new Float64Array(m.grid),m.start*N*N*3);resolve();}else console.log('source hue',m.h,++done,'/',H);});worker.on('error',reject);worker.on('exit',c=>{if(c)reject(Error('worker '+c));});
 })));
 fs.writeFileSync(new URL('results/source-grid-fine.f64',root),Buffer.from(out.buffer));
 console.log('cache ready',data.pairs.a.length,'native pairs',H*N*N,'samples');
}else{
 const model=await createRelativeHRL({gamut:'srgb',variant:'candidate',overflow:'reject',imaginary:'reject'}),source=model.model.source;
 const {start,end}=workerData,out=new Float64Array((end-start)*N*N*3);let k=0;
 for(let h=start;h<end;h++){
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
   const L=(1-Math.cos(Math.PI*j/(N-1)))/2,U=(1-Math.cos(Math.PI*i/(N-1)))/2,xyz=source.toXYZ({H:h*360/H,R:U*L,L});
   for(const v of xyz)out[k++]=v;
  }
  parentPort.postMessage({h});
 }
 parentPort.postMessage({start,grid:out.buffer},[out.buffer]);
}

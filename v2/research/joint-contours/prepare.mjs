/** Geometry-normalized source samples for a shared interior diffeomorphism.
 * No mode-specific learned coefficients. Grid values come from actual runtime.
 */
import fs from 'node:fs';import crypto from 'node:crypto';
import {Worker,isMainThread,workerData,parentPort} from 'node:worker_threads';
import {getBoundarySource} from '../boundary-tonal/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const root=new URL('./results/fine/',import.meta.url),g=process.argv[2];if(!['srgb','full'].includes(g))throw Error('Specify srgb or full');fs.mkdirSync(root,{recursive:true});
const hs=[...new Set([...Array.from({length:360},(_,i)=>i),...Array.from({length:49},(_,i)=>284+i*.25)])].sort((a,b)=>a-b),N=129;
const buffer=isMainThread?new SharedArrayBuffer(hs.length*N*N*4*8):workerData.buffer,a=new Float64Array(buffer);
const grid=Array.from({length:N},(_,i)=>(1-Math.cos(Math.PI*i/(N-1)))/2);
if(!isMainThread){
 const source=await getBoundarySource(g);
 for(let h=workerData.worker;h<hs.length;h+=workerData.workers){let k=h*N*N*4;for(const L of grid)for(const U of grid){const xyz=source.toXYZ({H:hs[h],R:L*U,L});a.set([...genRuler(xyz),xyz[1]],k);k+=4;}parentPort.postMessage(h);}
}else{
 const workers=4;let done=0;
 await Promise.all(Array.from({length:workers},(_,worker)=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{argv:[g],workerData:{buffer,worker,workers}});w.on('message',()=>{done++;if(done%24===0)console.log(g,done,'/',hs.length);});w.on('error',reject);w.on('exit',code=>code?reject(Error('Grid worker exit '+code)):resolve());})));
const raw=Buffer.from(a.buffer);fs.writeFileSync(new URL(`source-${g}.f64`,root),raw);
const rec={schema:'hrl-joint-source-grid-v1',gamut:g,hues:hs,N,channels:['GenSpace J','GenSpace a','GenSpace b','physical Y'],grid:'cosine public source U and source L',sha256:crypto.createHash('sha256').update(raw).digest('hex'),sourceCommit:'e7d6f699610141451b40883d7133132266867763'};
fs.writeFileSync(new URL(`grid-${g}.json`,root),JSON.stringify(rec,null,2)+'\n');console.log('PASS grid',g,raw.length,rec.sha256);
}

/** Geometry-normalized source samples for a shared interior diffeomorphism.
 * No mode-specific learned coefficients. Grid values come from actual runtime.
 */
import fs from 'node:fs';import crypto from 'node:crypto';
import {getBoundarySource} from '../boundary-tonal/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const root=new URL('./results/',import.meta.url),g=process.argv[2];if(!['srgb','full'].includes(g))throw Error('Specify srgb or full');
const hs=[...new Set([...Array.from({length:72},(_,i)=>i*5),...Array.from({length:49},(_,i)=>284+i*.25)])].sort((a,b)=>a-b),N=81;
const source=await getBoundarySource(g),a=new Float64Array(hs.length*N*N*4);let k=0;
const grid=Array.from({length:N},(_,i)=>(1-Math.cos(Math.PI*i/(N-1)))/2);
for(let h=0;h<hs.length;h++){for(const L of grid)for(const U of grid){const xyz=source.toXYZ({H:hs[h],R:L*U,L});a.set([...genRuler(xyz),xyz[1]],k);k+=4;}if(h%12===0)console.log(g,h,'/',hs.length);}
const raw=Buffer.from(a.buffer);fs.writeFileSync(new URL(`source-${g}.f64`,root),raw);
const rec={schema:'hrl-joint-source-grid-v1',gamut:g,hues:hs,N,channels:['GenSpace J','GenSpace a','GenSpace b','physical Y'],grid:'cosine public source U and source L',sha256:crypto.createHash('sha256').update(raw).digest('hex'),sourceCommit:'e7d6f699610141451b40883d7133132266867763'};
fs.writeFileSync(new URL(`grid-${g}.json`,root),JSON.stringify(rec,null,2)+'\n');console.log('PASS grid',g,raw.length,rec.sha256);

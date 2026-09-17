/** Cache exact fixed source coordinates and physical geometry for differentiable R/L fitting. */
import fs from 'node:fs'; import crypto from 'node:crypto';
import {createRelativeHRL} from '../relative-domain/index.mjs';
const root=new URL('./',import.meta.url),pairs=JSON.parse(fs.readFileSync(new URL('results/training-pairs.json',root)));
const model=await createRelativeHRL({gamut:'full',variant:'candidate',overflow:'reject',imaginary:'reject'}),source=model.model.source;
const H=24,N=97,data={id:'relative-refit-fixed-source',H,N,pairs:{a:[],b:[],dv:[],w:[]},baseline:model.model.record};
for(const p of pairs){for(const [key,x]of [['a',p.xyz1],['b',p.xyz2]]){const q=source.fromXYZ(x);data.pairs[key].push([q.H,q.R,q.L]);}data.pairs.dv.push(p.dv);data.pairs.w.push(p.weight);}
fs.writeFileSync(new URL('results/cache.json',root),JSON.stringify(data));
const array=new Float64Array(H*N*N*3);let off=0;
for(let h=0;h<H;h++){
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){
  const L=j/(N-1),U=i/(N-1),xyz=source.toXYZ({H:h*360/H,R:U*L,L});
  for(let k=0;k<3;k++)array[off++]=xyz[k];
 }
 console.log('source grid',h+1,'/',H);
}
fs.writeFileSync(new URL('results/source-grid.f64',root),Buffer.from(array.buffer));
console.log('cache ready',pairs.length,'pairs,',H*N*N,'physical samples');

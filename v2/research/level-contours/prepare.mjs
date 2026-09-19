import fs from 'node:fs';import crypto from 'node:crypto';
import {getBoundarySource} from '../boundary-tonal/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
import {levelToNonblack} from '../../lib/basr.mjs';
const root=new URL('./',import.meta.url);fs.mkdirSync(new URL('results/',root),{recursive:true});
const input=JSON.parse(fs.readFileSync(new URL('../boundary-tonal/results/training-inputs.json',root)));
const parent=JSON.parse(fs.readFileSync(new URL('../boundary-tonal/results/metric.json',root)));
const K=4,seed={schema:'hrl-physical-contours-v1',contour:'positive-power-then-logit',id:'HRL-v2-contours-seed',variant:'seed',harmonics:K,neutral_shift:parent.neutral_shift,coefficients:Array.from({length:7},()=>Array(2*K+1).fill(0)),gamut_calibration:'shared',ring_logits:null};
fs.writeFileSync(new URL('results/seed.json',root),JSON.stringify(seed,null,2)+'\n');
const out={H:36,N:97,profiles:{},source:'4aac529; raw physical hue charts, repaired full boundary; inherited tonal atlases bypassed',grid:'cosine s and inverse-CIELAB physical magnitude l',inputSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../boundary-tonal/results/training-inputs.json',root))).digest('hex')};
for(const gamut of ['srgb','full']){
 const src=await getBoundarySource(gamut),base=src.base;
 const from=x=>base.fromXYZ(src.toLegacyXYZ?src.toLegacyXYZ(x):x),to=q=>{const x=base.toXYZ(q);return src.fromLegacyXYZ?src.fromLegacyXYZ(x):x;};
 const indices=gamut==='srgb'?input.native_indices:input.dv.map((_,i)=>i);
 out.profiles[gamut]={a:[],b:[],dv:indices.map(i=>input.dv[i]),w:indices.map(i=>input.w[i]),indices};
 for(const key of ['a','b'])out.profiles[gamut][key]=indices.map(i=>{const q=from(input[key==='a'?'xyz1':'xyz2'][i]);return[q.H,q.R,q.L];});
 const grid=Array.from({length:out.N},(_,i)=>(1-Math.cos(Math.PI*i/(out.N-1)))/2),v=new Float64Array(out.H*out.N*out.N*3);let j=0;
 for(let h=0;h<out.H;h++){
  for(const l of grid){const a=levelToNonblack(l);for(const s of grid){for(const x of genRuler(to({H:h*360/out.H,R:a*s,L:a})))v[j++]=x;}}
  if(h%6===0)console.log(gamut,'grid hue',h,'/',out.H);
 }
 const bytes=Buffer.from(v.buffer);fs.writeFileSync(new URL(`results/grid-${gamut}.f64`,root),bytes);out.profiles[gamut].gridSHA256=crypto.createHash('sha256').update(bytes).digest('hex');
 fs.writeFileSync(new URL('results/cache.json',root),JSON.stringify(out)+'\n');
}
console.log('PASS physical pair coordinates and GenSpace grids prepared');

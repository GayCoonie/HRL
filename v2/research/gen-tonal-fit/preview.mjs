/** Raw exact-transform hue sheets, with display-only clipping metadata. */
import fs from 'node:fs';import {createGenTonalHRL} from './index.mjs';import {createSharedHRL} from '../shared-rl/source.mjs';import {XYZ_TO_SRGB,mul3,encodeSRGB} from '../../lib/srgb-triangles.mjs';
const names=process.argv.slice(2),W=191,T=220,rows=[];if(!names.length)names.push('old-balanced','old-metric','balanced','metric');
for(const gamut of ['srgb','full'])for(const name of names){
 const dir=fs.existsSync(new URL(`results/${name}.json`,import.meta.url))?'results':'trials';const rec=name.startsWith('old-')?null:JSON.parse(fs.readFileSync(new URL(`${dir}/${name}.json`,import.meta.url)));const m=rec?await createGenTonalHRL({gamut,record:rec}):await createSharedHRL({gamut,checkpoint:name.slice(4)});
 for(const H of [30,90,150,210,240,270,300,330]){
  const data=new Uint8Array(W*T*4);let clipped=0,inside=0;
  for(let y=0;y<T;y++)for(let x=0;x<W;x++){const R=x/(W-1),L=1-y/(T-1)+R/2;if(R>L||L>1)continue;const xyz=m.toXYZ({H,R,L}),rgb=mul3(XYZ_TO_SRGB,xyz);inside++;if(rgb.some(v=>v< -2e-9||v>1+2e-9))clipped++;const k=(y*W+x)*4;for(let j=0;j<3;j++)data[k+j]=Math.round(255*encodeSRGB(Math.max(0,Math.min(1,rgb[j]))));data[k+3]=255;}
  const file=`${gamut}-${name}-${H}.rgba`;fs.writeFileSync(new URL('results/'+file,import.meta.url),data);rows.push({gamut,name,H,W,T,file,inside,clipped});
 }console.log(gamut,name,'preview complete');
}
fs.writeFileSync(new URL('results/preview-index.json',import.meta.url),JSON.stringify({names,rows},null,2)+'\n');

/** Colorimetric sRGB-clipped previews of true full-domain colors, not fitted images. */
import fs from 'node:fs';
import {createRelativeHRL} from '../relative-domain/index.mjs';
import {createRelativeRefit} from './index.mjs';
const names=process.argv.slice(2);if(!names.length)names.push('baseline','balanced','metric');
const M=[[3.2409699419045226,-1.537383177570094,-.4986107602930034],[-.9692436362808796,1.8759675015077202,.0415550574071756],[.0556300796969937,-.2039769588889765,1.0569715142428786]],gamma=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
const entries=[];
for(const name of names){
 const model=name==='baseline'?await createRelativeHRL({gamut:'full',variant:'candidate'}):await createRelativeRefit({checkpoint:name});
 for(const H of [30,90,150,210,270,300]){
  const height=144,width=Math.ceil(height*Math.sqrt(3)/2),pixels=new Uint8Array(width*height*4);let oog=0,inside=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const R=x/(width-1),L=1-y/(height-1)+R/2;if(R>L||L>1)continue;
   const xyz=model.toXYZ({H,R,L}),rgb=M.map(r=>r.reduce((s,v,i)=>s+v*xyz[i],0));inside++;if(rgb.some(v=>v< -1e-10||v>1+1e-10))oog++;
   const i=4*(y*width+x);for(let k=0;k<3;k++)pixels[i+k]=Math.round(255*gamma(Math.min(1,Math.max(0,rgb[k]))));pixels[i+3]=255;
  }
  const file=`preview-${name}-${H}.rgba`;fs.writeFileSync(new URL('results/'+file,import.meta.url),pixels);entries.push({name,H,width,height,file,oog,inside});
 }
 console.log('rendered',name);
}
fs.writeFileSync(new URL('results/preview-index.json',import.meta.url),JSON.stringify(entries,null,2));

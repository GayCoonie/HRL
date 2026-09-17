import {createASmooth} from '../../a-smooth/index.mjs';
import {createRLC1} from './index.mjs';
export const modelNames=['0.8A parent','A Smooth','C1 only — no refit','C1 balanced candidate'];
let loaded;
export function models(){return loaded||(loaded=Promise.all([
 createASmooth({gamut:'srgb',variant:'parent'}),createASmooth({gamut:'srgb',variant:'smooth'}),
 createRLC1({gamut:'srgb',variant:'smooth'}),createRLC1({gamut:'srgb',variant:'candidate'})]));}
export async function triangle(model,H,height=256,{yieldRows=0,cancel=()=>false}={}){
 const width=Math.ceil(height*Math.sqrt(3)/2),pixels=new Uint8ClampedArray(width*height*4);let errors=0;
 for(let y=0;y<height;y++){
  if(yieldRows&&y%yieldRows===0){await new Promise(r=>setTimeout(r,0));if(cancel())return null;}
  for(let x=0;x<width;x++){
   const R=x/(width-1),L=1-y/(height-1)+R/2;if(L<R||L>1)continue;
   const offset=4*(y*width+x);
   try{const rgb=model.toRGB({H,R,L});for(let k=0;k<3;k++)pixels[offset+k]=Math.round(255*rgb[k]);pixels[offset+3]=255;}
   catch(e){errors++;pixels[offset]=255;pixels[offset+2]=255;pixels[offset+3]=255;}
  }
 }
 return {width,height,pixels,errors};
}
export function strip(model,H,axis,fixed,width=384,height=20){
 const pixels=new Uint8ClampedArray(width*height*4);let errors=0;
 for(let x=0;x<width;x++){
  const t=x/(width-1),q=axis==='reach'?{H,R:fixed*t,L:fixed}:{H,R:fixed,L:fixed+(1-fixed)*t};
  try{const rgb=model.toRGB(q);for(let y=0;y<height;y++){const o=4*(y*width+x);for(let k=0;k<3;k++)pixels[o+k]=Math.round(255*rgb[k]);pixels[o+3]=255;}}
  catch(e){errors++;}
 }
 return {width,height,pixels,errors};
}

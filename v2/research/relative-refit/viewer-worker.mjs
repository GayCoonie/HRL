import {createRelativeHRL} from '../relative-domain/index.mjs';
import {createRelativeRefit} from './index.mjs';
const names=['Corrected solid, before refit','Balanced / smoother refit','Metric-leaning refit'];
const models=Promise.all([createRelativeHRL({gamut:'full',variant:'candidate'}),createRelativeRefit({checkpoint:'balanced'}),createRelativeRefit({checkpoint:'metric'})]);
const M=[[3.2409699419045226,-1.537383177570094,-.4986107602930034],[-.9692436362808796,1.8759675015077202,.0415550574071756],[.0556300796969937,-.2039769588889765,1.0569715142428786]];
const gamma=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
function display(xyz){const linear=M.map(r=>r.reduce((s,v,i)=>s+v*xyz[i],0));return{rgb:linear.map(x=>Math.round(255*gamma(Math.min(1,Math.max(0,x))))),outside:linear.some(x=>x< -1e-10||x>1+1e-10)};}
let latest=null,busy=false;
self.onmessage=e=>{latest=e.data;if(!busy)run();};
async function triangle(model,H,height,id){
 const width=Math.ceil(Math.sqrt(3)/2*height),pixels=new Uint8ClampedArray(width*height*4),xyzs=new Float64Array(width*height*3),mask=new Uint8Array(width*height);let clipped=0,inside=0;
 for(let y=0;y<height;y++){
  if(y%8===0){await new Promise(r=>setTimeout(r,0));if(latest&&latest.id>id)return null;}
  for(let x=0;x<width;x++){
   const R=x/(width-1),L=1-y/(height-1)+R/2;if(R>L||L>1)continue;
   const xyz=model.toXYZ({H,R,L}),d=display(xyz),i=y*width+x;inside++;
   if(d.outside){clipped++;mask[i]=1;}
   for(let k=0;k<3;k++){pixels[4*i+k]=d.rgb[k];xyzs[3*i+k]=xyz[k];}pixels[4*i+3]=255;
  }
 }
 return{width,height,pixels,xyzs,mask,clipped,inside};
}
function strip(model,H,axis,fixed){
 const width=384,height=22,pixels=new Uint8ClampedArray(width*height*4);
 for(let x=0;x<width;x++){
  const t=x/(width-1),q=axis==='reach'?{H,R:t*fixed,L:fixed}:{H,R:fixed,L:fixed+t*(1-fixed)},d=display(model.toXYZ(q));
  for(let y=0;y<height;y++){const i=4*(y*width+x);for(let k=0;k<3;k++)pixels[i+k]=d.rgb[k];pixels[i+3]=255;}
 }
 return{width,height,pixels};
}
async function run(){
 busy=true;
 try{
  const ms=await models;
  while(latest){const job=latest;latest=null;
   for(let i=0;i<ms.length;i++){
    const tri=await triangle(ms[i],job.H,job.height,job.id);if(!tri)break;
    const reach=strip(ms[i],job.H,'reach',job.fixedL),level=strip(ms[i],job.H,'level',job.fixedR);
    self.postMessage({id:job.id,H:job.H,index:i,name:names[i],tri,reach,level},[tri.pixels.buffer,tri.xyzs.buffer,tri.mask.buffer,reach.pixels.buffer,level.pixels.buffer]);
   }
   if(!latest)self.postMessage({id:job.id,done:true});
  }
 }catch(e){self.postMessage({error:e.stack||String(e)});}finally{busy=false;}
}

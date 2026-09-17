import {createHRLRefits} from '../refits.mjs';
import {createSharedHRL} from '../research/shared-rl/source.mjs';
const ids=['baseline','balanced','metric'],cache=new Map();
async function models(gamut){
 if(!cache.has(gamut))cache.set(gamut,Promise.all(ids.map(checkpoint=>checkpoint==='baseline'?createHRLRefits({gamut,checkpoint:'balanced',overflow:'reject',imaginary:'reject'}):createSharedHRL({gamut,checkpoint,overflow:'reject',imaginary:'reject'}))).catch(e=>{cache.delete(gamut);throw e;}));
 return cache.get(gamut);
}
const M=[[3.2409699419045226,-1.537383177570094,-.4986107602930034],[-.9692436362808796,1.8759675015077202,.0415550574071756],[.0556300796969937,-.2039769588889765,1.0569715142428786]];
const gamma=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
const decode=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const FWD=[[.4123907992659595,.357584339383878,.1804807884018343],[.2126390058715104,.715168678767756,.0721923153607337],[.0193308187155918,.119194779794626, .9505321522496607]];
const mul=(A,p)=>A.map(r=>r.reduce((a,v,i)=>a+v*p[i],0));
function display(xyz){const linear=mul(M,xyz);return{rgb:linear.map(x=>Math.round(255*gamma(Math.min(1,Math.max(0,x))))),outside:linear.some(x=>x< -2e-9||x>1+2e-9)};}
let latest=null,busy=false;
self.onmessage=({data:d})=>{
 if(d.type==='sample'||d.type==='import'){sample(d).catch(e=>self.postMessage({type:'sample',sampleId:d.sampleId,error:e.message}));return;}
 latest=d;if(!busy)run();
};
async function sample(d){
 const ms=await models(d.gamut),index=ids.indexOf(d.checkpoint);if(index<0)throw Error('Unknown model');
 let q=d.q;
 if(d.type==='import'){
  if(!/^#[0-9a-fA-F]{6}$/.test(d.hex))throw Error('Enter a six-digit sRGB hex color.');
  const rgb=[1,3,5].map(i=>parseInt(d.hex.slice(i,i+2),16)/255),xyz=mul(FWD,rgb.map(decode));
  q=ms[index].fromXYZ(xyz,{neutralHue:d.neutralHue??0});
 }
 const readings=ms.map((m,i)=>{const xyz=m.toXYZ(q),out=display(xyz);return{checkpoint:ids[i],q,xyz,rgb:out.rgb,outside:out.outside};});
 self.postMessage({type:'sample',sampleId:d.sampleId,gamut:d.gamut,checkpoint:d.checkpoint,q,readings});
}
async function triangle(model,H,height,id){
 const width=Math.ceil(Math.sqrt(3)/2*height),pixels=new Uint8ClampedArray(width*height*4),xyzs=new Float64Array(width*height*3),mask=new Uint8Array(width*height);let clipped=0,inside=0;
 for(let y=0;y<height;y++){
  if(y%8===0){await new Promise(r=>setTimeout(r,0));if(latest&&latest.id>id)return null;}
  for(let x=0;x<width;x++){
   const R=x/(width-1),L=1-y/(height-1)+R/2;if(R>L||L>1)continue;
   const xyz=model.toXYZ({H,R,L}),out=display(xyz),k=y*width+x;inside++;
   if(out.outside){clipped++;mask[k]=1;}
   for(let j=0;j<3;j++){pixels[4*k+j]=out.rgb[j];xyzs[3*k+j]=xyz[j];}pixels[4*k+3]=255;
  }
 }
 return{width,height,pixels,xyzs,mask,clipped,inside};
}
function strip(model,H,axis,fixed){
 const width=384,height=22,pixels=new Uint8ClampedArray(width*height*4);let clipped=0;
 for(let x=0;x<width;x++){
  const t=x/(width-1),q=axis==='edge'?{H,R:fixed*t,L:t}:axis==='reach'?{H,R:fixed*t,L:fixed}:{H,R:fixed,L:fixed+(1-fixed)*t},out=display(model.toXYZ(q));
  if(out.outside)clipped++;
  for(let y=0;y<height;y++){const k=4*(y*width+x);for(let j=0;j<3;j++)pixels[k+j]=out.rgb[j];pixels[k+3]=255;}
 }
 return{width,height,pixels,clipped};
}
async function run(){
 busy=true;
 try{while(latest){
  const job=latest;latest=null;const ms=await models(job.gamut);
  if(latest&&latest.id>job.id)continue;
  for(let i=0;i<ms.length;i++){
   const tri=await triangle(ms[i],job.H,job.height,job.id);if(!tri)break;
   const reach=strip(ms[i],job.H,'reach',job.fixedL),level=strip(ms[i],job.H,'level',job.fixedR),edge=strip(ms[i],job.H,'edge',1),near=strip(ms[i],job.H,'edge',.9);
   self.postMessage({type:'render',id:job.id,gamut:job.gamut,H:job.H,index:i,tri,reach,level,edge,near},[tri.pixels.buffer,tri.xyzs.buffer,tri.mask.buffer,reach.pixels.buffer,level.pixels.buffer,edge.pixels.buffer,near.pixels.buffer]);
  }
  if(!latest)self.postMessage({type:'render',id:job.id,gamut:job.gamut,done:true});
 }}catch(e){self.postMessage({type:'render',error:e.stack||String(e)});}finally{busy=false;}
}

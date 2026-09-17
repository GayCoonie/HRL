import {models,triangle,strip,modelNames} from './render.mjs';
let latest=null,busy=false;
self.onmessage=e=>{latest=e.data;if(!busy)run();};
async function run(){
 busy=true;
 try{
  const ms=await models();
  while(latest){
   const job=latest;latest=null;
   for(let i=0;i<ms.length;i++){
    const tri=await triangle(ms[i],job.H,job.height,{yieldRows:12,cancel:()=>latest&&latest.id>job.id});
    if(!tri)break;
    const reach=strip(ms[i],job.H,'reach',job.fixedL),level=strip(ms[i],job.H,'level',job.fixedR);
    self.postMessage({id:job.id,H:job.H,index:i,name:modelNames[i],tri,reach,level},[tri.pixels.buffer,reach.pixels.buffer,level.pixels.buffer]);
   }
   if(!latest)self.postMessage({id:job.id,done:true});
  }
 }catch(e){self.postMessage({error:e.stack||String(e)});}
 finally{busy=false;}
}

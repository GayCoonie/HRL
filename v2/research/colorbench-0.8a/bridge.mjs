/** JSON-lines adapter to the frozen production JavaScript model. No gamut clipping. */
import {createInterface} from 'node:readline';
import {createASmooth} from '../../a-smooth/index.mjs';
const cache=new Map();
async function model(gamut,variant){
 const key=gamut+':'+variant;
 if(!cache.has(key))cache.set(key,variant==='candidate'?import('../rl-c1/index.mjs').then(({createRLC1})=>createRLC1({gamut,variant:'candidate'})):createASmooth({gamut,variant}));
 return cache.get(key);
}
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 try{
  const req=JSON.parse(line),m=await model(req.gamut||'full',req.variant||'parent');
  const errors=[];
  const data=req.data.map((x,index)=>{
   try{
    if(req.op==='inverse'){
     const R=Math.hypot(x[1],x[2])*2/Math.sqrt(3),L=x[0]+R/2;
     return m.toXYZ({H:Math.atan2(x[2],x[1])*180/Math.PI,R,L});
    }
    if(req.op==='toXYZ')return m.toXYZ({H:x[0],R:x[1],L:x[2]});
    if(req.op==='sourceXYZ')return m.source.toXYZ({H:x[0],R:x[1],L:x[2]});
    const q=req.op==='source'?m.source.fromXYZ(x):m.fromXYZ(x);
    if(req.op==='coordinates'||req.op==='source')return [q.H,q.R,q.L];
    return m.embed(q);
   }catch(e){
    if(!(e instanceof RangeError || e instanceof TypeError))throw e;
    errors.push({index,type:e.name,message:e.message});return [null,null,null];
   }
  });
  process.stdout.write(JSON.stringify({data,errors})+'\n');
 }catch(e){process.stdout.write(JSON.stringify({fatal:e.stack||String(e)})+'\n');}
}

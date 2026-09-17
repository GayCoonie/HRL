/** Numeric benchmark adapter: JSON input, bicone coordinates, explicit audit. */
import {createInterface} from 'node:readline';
import {createRelativeHRL} from './index.mjs';
import {createASmooth} from '../../a-smooth/index.mjs';
import {createRLC1} from '../rl-c1/index.mjs';
const config=JSON.parse(process.argv[2]);
const m=config.mode==='legacy'?(config.variant==='candidate'?await createRLC1({gamut:config.gamut,variant:'candidate'}):await createASmooth({gamut:config.gamut,variant:config.variant})):await createRelativeHRL({...config,referenceWhiteNits:config.nits,overflow:config.policy,imaginary:config.policy});
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 try{
  const req=JSON.parse(line),audit={points:req.data.length,mapped:0,rejected:0,continued:0,event_counts:{},error_counts:{},examples:[]};
  const data=req.data.map(x=>{
   try{
    let q;
    if(config.mode==='legacy')q=m.fromXYZ(x);
    else{
     const r=m.importXYZ(x);q=r.coordinates;
     if(r.events.length){audit.mapped++;for(const e of r.events)audit.event_counts[e]=(audit.event_counts[e]||0)+1;if(audit.examples.length<4)audit.examples.push({input:x,mapped:r.mappedXYZ,events:r.events});}
     if(r.hueContinuation)audit.continued++;
    }
    const e=m.embed(q);if(!e.every(Number.isFinite))throw Error('Nonfinite embedding');return e;
   }catch(e){
    if(!(e instanceof RangeError))throw e;
    audit.rejected++;audit.error_counts[e.message]=(audit.error_counts[e.message]||0)+1;
    if(audit.examples.length<4)audit.examples.push({input:x,error:e.message});return[null,null,null];
   }
  });
  process.stdout.write(JSON.stringify({data,audit})+'\n');
 }catch(e){process.stdout.write(JSON.stringify({fatal:e.stack||String(e)})+'\n');}
}

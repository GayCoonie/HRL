/** Scored-benchmark bridge: real transforms and inherited explicit import policies. */
import {createInterface} from 'node:readline';import {createRelativeHRL} from '../relative-domain/index.mjs';import {createHRLRefits} from './index.mjs';
const c=JSON.parse(process.argv[2]),options={gamut:c.gamut||'full',referenceWhiteNits:c.nits||300,overflow:c.policy,imaginary:c.policy};
const m=c.mode==='baseline'?await createRelativeHRL({...options,variant:'candidate'}):await createHRLRefits({...options,checkpoint:c.checkpoint||'balanced'});
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 try{const r=JSON.parse(line),audit={points:r.data.length,mapped:0,rejected:0,continued:0,event_counts:{},error_counts:{},examples:[]};
  const data=r.data.map(x=>{try{const result=m.importXYZ(x);if(result.events.length){audit.mapped++;for(const e of result.events)audit.event_counts[e]=(audit.event_counts[e]||0)+1;if(audit.examples.length<4)audit.examples.push({input:x,mapped:result.mappedXYZ,events:result.events});}if(result.hueContinuation)audit.continued++;return m.embed(result.coordinates);}catch(e){if(!(e instanceof RangeError))throw e;audit.rejected++;audit.error_counts[e.message]=(audit.error_counts[e.message]||0)+1;if(audit.examples.length<4)audit.examples.push({input:x,error:e.message});return[null,null,null];}});
  process.stdout.write(JSON.stringify({data,audit})+'\n');
 }catch(e){process.stdout.write(JSON.stringify({fatal:e.stack||String(e)})+'\n');}
}

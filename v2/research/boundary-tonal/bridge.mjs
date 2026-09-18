/** JSON-lines adapter. Conversion errors abort instead of silently dropping inputs. */
import {createInterface} from 'node:readline';
import {createMappedHRL} from '../mapped-012/import.mjs';
import {createSpectralTonalHRL} from './index.mjs';
const c=JSON.parse(process.argv[2]),m=c.mode==='parent'?await createMappedHRL({gamut:c.gamut,checkpoint:'balanced',referenceWhiteNits:c.nits}):await createSpectralTonalHRL({gamut:c.gamut,checkpoint:c.mode,referenceWhiteNits:c.nits});
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 try{
  const r=JSON.parse(line),audit={points:r.data.length,mapped:0,rejected:0,continued:0,event_counts:{},error_counts:{},examples:[]},flags=[];
  const data=r.data.map(x=>{
   const v=m.importXYZ(x);flags.push(v.events);
   if(v.events.length){audit.mapped++;for(const e of v.events)audit.event_counts[e]=(audit.event_counts[e]||0)+1;if(audit.examples.length<4)audit.examples.push({input:x,mapped:v.mappedXYZ,events:v.events});}
   if(v.hueContinuation)audit.continued++;
   return m.embed(v.coordinates);
  });
  process.stdout.write(JSON.stringify({data,audit,flags})+'\n');
 }catch(e){process.stdout.write(JSON.stringify({fatal:e.stack||String(e)})+'\n');}
}

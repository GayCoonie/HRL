/** JSONL adapter for the original pinned ColorBench Python judges. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHRLv2} from '../../index.mjs';
import {createJointHRL} from '../joint-contours/index.mjs';

const c=JSON.parse(process.argv[2]),opt={gamut:c.gamut,referenceWhiteNits:300};
let model;
if(c.model==='beta1')model=await createHRLv2(opt);
else if(c.model==='joint')model=await createJointHRL(opt);
else if(c.model==='candidate'){
 if(!c.record||!c.identity)throw Error('Candidate requires a frozen record and pinned source identity');
 const actual=JSON.parse(execFileSync(process.execPath,['--experimental-vm-modules','--no-warnings',fileURLToPath(new URL('./source-identity.mjs',import.meta.url)),c.module,c.record],{encoding:'utf8'}));
 if(JSON.stringify(actual)!==JSON.stringify(c.identity))throw Error('Candidate recursive JS source or record changed before runtime import');
 if(path.resolve(c.module)!==c.identity.module||path.resolve(c.record)!==c.identity.record||
    path.resolve(path.dirname(c.module),'model.mjs')!==c.identity.model)throw Error('Candidate source path mismatch');
 const module=await import(pathToFileURL(path.resolve(c.module)).href),factory=module[c.factory??'createFreshFieldHRL'];
 if(typeof factory!=='function')throw TypeError('Candidate factory unavailable');
 if(c.record)opt.record=JSON.parse(fs.readFileSync(path.resolve(c.record),'utf8'));
 model=await factory(opt);
}else throw RangeError('Unrecognized model');
if(typeof model?.importXYZ!=='function'||typeof model?.embed!=='function')throw TypeError('Candidate needs importXYZ and embed');

for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 try{
  const batch=JSON.parse(line).data,events={},flags=[];let mapped=0;const data=batch.map(x=>{
   const r=model.importXYZ(x);flags.push(r.events);if(r.events.length){mapped++;for(const e of r.events)events[e]=(events[e]??0)+1;}
   const v=model.embed(r.coordinates);if(!v.every(Number.isFinite))throw Error('Nonfinite coordinate');return v;
  });
  process.stdout.write(JSON.stringify({data,flags,audit:{points:batch.length,mapped,rejected:0,eventCounts:events}})+'\n');
 }catch(e){process.stdout.write(JSON.stringify({fatal:e.stack??String(e)})+'\n');}
}

/** Add exact critical hues without regenerating the original uniform grid.
 * Equations copied from boundary-tonal/cache-grid.mjs; parent bytes immutable. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {getBoundarySource} from '../boundary-tonal/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const options={};const args=process.argv.slice(2);
for(let i=0;i<args.length;i++){assert(['--source','--out'].includes(args[i]),'Use --source and --out');assert(!options[args[i]],'Duplicate option');options[args[i]]=args[++i];}
const source=options['--source'],out=options['--out'];
assert(source&&out&&path.isAbsolute(source)&&path.isAbsolute(out),'Absolute --source/--out required');
assert(!fs.existsSync(out),'Refusing existing output directory');assert(os.endianness()==='LE','Original .f64 encoding requires little-endian host');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const gridPath=path.join(source,'grid.json'),raw=fs.readFileSync(gridPath),parent=JSON.parse(raw);
assert.equal(parent.H,96);assert.equal(parent.N,193);
const baseH=parent.H,N=parent.N,baseHues=parent.hues??Array.from({length:baseH},(_,i)=>360*i/baseH);
assert.deepEqual(baseHues,Array.from({length:96},(_,i)=>360*i/96),'Expected original uniform96 grid');
const requested=[263,269,273,275,277,281,285,293],added=requested.filter(h=>!baseHues.includes(h)),hues=[...baseHues,...added];
assert.equal(added.length,7);assert.equal(hues.length,103);
const sliceBytes=N*N*3*8,parentBytes=baseH*sliceBytes,parentHashes={};
for(const gamut of ['srgb','full']){const file=path.join(source,`gen-grid-${gamut}.f64`),data=fs.readFileSync(file);assert.equal(data.length,parentBytes);parentHashes[gamut]=sha(data);assert.equal(parentHashes[gamut],parent.profiles[gamut].sha256,'Parent profile hash mismatch');}
const boundary=fileURLToPath(new URL('../boundary-tonal/',import.meta.url));
for(const [relative,expected] of Object.entries(parent.hashes)){assert.equal(sha(fs.readFileSync(path.resolve(boundary,relative))),expected,'Parent runtime source changed: '+relative);}
const started=Date.now(),metadata={...parent,H:hues.length,N,baseH,hues,profiles:{},augmentation:{status:'building',reason:'Exact critical blue angles absent from uniform96 grid; original96 slices preserved unchanged.',requestedCriticalHues:requested,appendedHues:added,alreadyPresent:requested.filter(h=>baseHues.includes(h)),sourceParentDirectory:source,sourceParentGridSHA256:sha(raw),sourceParentProfileSHA256:parentHashes,sourceParentGrid:parent,nodeVersion:process.version,scriptSHA256:sha(fs.readFileSync(fileURLToPath(import.meta.url))),createdUTC:new Date().toISOString(),layout:'base96 slices followed by seven listed appended hues; each slice L-major,U-minor,XYZ channels, little-endian float64'}};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'grid.json'),JSON.stringify(metadata,null,2)+'\n');
const grid=Array.from({length:N},(_,i)=>(1-Math.cos(Math.PI*i/(N-1)))/2);
for(const gamut of ['srgb','full']){
 const sourceFile=path.join(source,`gen-grid-${gamut}.f64`),target=path.join(out,`gen-grid-${gamut}.f64`),begin=Date.now();fs.copyFileSync(sourceFile,target);
 const chart=await getBoundarySource(gamut);
 for(const H of added){const data=new Float64Array(N*N*3);let k=0;
  for(const L of grid)for(const U of grid){const gen=genRuler(chart.toXYZ({H,R:L*U,L}));for(const x of gen){assert(Number.isFinite(x),'Nonfinite GenSpace sample');data[k++]=x;}}
  assert.equal(k,data.length);fs.appendFileSync(target,Buffer.from(data.buffer));console.log(JSON.stringify({gamut,H,elapsedSeconds:(Date.now()-begin)/1000}));
 }
 const original=fs.readFileSync(sourceFile),all=fs.readFileSync(target);assert.equal(all.length,hues.length*sliceBytes);assert(all.subarray(0,parentBytes).equals(original),'Parent prefix changed');assert.equal(sha(original),parentHashes[gamut],'Parent cache changed during augmentation');
 metadata.profiles[gamut]={sha256:sha(all),seconds:(Date.now()-begin)/1000,bytes:all.length,preservedPrefixBytes:parentBytes,preservedPrefixSHA256:parentHashes[gamut],appendedHues:added.length,appendedBytes:added.length*sliceBytes};
 fs.writeFileSync(path.join(out,'grid.json'),JSON.stringify(metadata,null,2)+'\n');
}
assert.equal(sha(fs.readFileSync(gridPath)),metadata.augmentation.sourceParentGridSHA256,'Parent metadata changed');metadata.augmentation.status='completed';metadata.augmentation.elapsedSeconds=(Date.now()-started)/1000;fs.writeFileSync(path.join(out,'grid.json'),JSON.stringify(metadata,null,2)+'\n');console.log(JSON.stringify({status:'completed',H:metadata.H,N,appendedHues:added,elapsedSeconds:metadata.augmentation.elapsedSeconds,profiles:metadata.profiles}));

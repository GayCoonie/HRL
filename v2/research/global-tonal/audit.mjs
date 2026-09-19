/** Candidate-aware actual-runtime audit. Equations adapted from the frozen
 * boundary-tonal/evaluate.mjs and sheet-audit.mjs; originals stay unchanged. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createSpectralTonalHRL} from '../boundary-tonal/index.mjs';
import {genRuler,pathStats} from '../tonal-semantics/ruler.mjs';

const boundary=fileURLToPath(new URL('../boundary-tonal/',import.meta.url));
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const quant=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.floor(p*(a.length-1))];
const finite=x=>{if(typeof x==='number')assert(Number.isFinite(x),'Nonfinite metric');else if(x&&typeof x==='object')for(const v of Object.values(x))finite(v);};
const args=process.argv.slice(2),records=[];let outfile;
for(let i=0;i<args.length;i++){
 if(args[i]==='--out'){assert(!outfile,'Duplicate --out');outfile=args[++i];continue;}
 assert(!args[i].startsWith('--'),'Unknown option '+args[i]);
 const at=args[i].indexOf('=');assert(at>0&&at<args[i].length-1,'Use label=recordpath');
 const label=args[i].slice(0,at);assert(/^[a-zA-Z0-9_-]+$/.test(label),'Invalid label');
 assert(!records.some(x=>x.label===label),'Duplicate label');
 records.push({label,file:path.resolve(args[i].slice(at+1))});
}
assert(outfile&&path.isAbsolute(outfile),'--out must be an absolute JSON path');
assert(!fs.existsSync(outfile),'Refusing to overwrite an existing receipt');
assert(!path.resolve(outfile).startsWith(path.resolve(boundary)+path.sep),'Receipt cannot overwrite frozen research files');
if(!records.length)for(const label of ['metric','balanced'])records.push({label,file:path.join(boundary,`results/${label}.json`)});
const inputPath=path.join(boundary,'results/training-inputs.json'),cachePath=path.join(boundary,'results/cache.json');
const input=read(inputPath),cache=read(cachePath);
assert.equal(input.dv.length,3813);assert.equal(input.native_indices.length,3331);
assert.deepEqual(cache.profiles.srgb.indices,input.native_indices);
assert.deepEqual(cache.profiles.full.indices,Array.from({length:3813},(_,i)=>i));
const mask=Buffer.alloc(input.native_indices.length*8);input.native_indices.forEach((v,i)=>mask.writeBigInt64LE(BigInt(v),i*8));
assert.equal(sha(mask),input.provenance.native_mask_sha256);
const historicalPath=path.join(boundary,'results/direct-72-257-parent_boundary_balanced_metric.json');
const historicalSheetPath=path.join(boundary,'results/sheet-final.json');
const historical=read(historicalPath),historicalSheet=read(historicalSheetPath);
const regular=Array.from({length:72},(_,i)=>1+5*i),critical=[263,269,273,275,277,281,285,293],controls=[156,216];
const hues=[...new Set([...regular,...critical,...controls])].sort((a,b)=>a-b),N=257;
const ratios=[.12,.32,.55,.78,1],other=[.06,.22,.45,.68,.88],families=['black','white','exchange','reach'];
const centres=[];for(let j=4;j<31;j+=2)for(let i=2;i<j-1;i+=2)centres.push([i/32,j/32]);
for(const L of [.04,.08,.12,.18])for(const u of [.18,.4,.65,.84])centres.push([L*u,L]);
const offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const files=[inputPath,cachePath,historicalPath,historicalSheetPath,fileURLToPath(import.meta.url),...['index.mjs','boundary-1nm.json','evaluate.mjs','sheet-audit.mjs','../shared-rl/core.mjs','../shared-rl/source.mjs','../../a-smooth/rl-core.mjs','../tonal-semantics/ruler.mjs','../../../src/base/appearance-runtime.mjs','../../../src/base/gen-parameters.mjs'].map(p=>path.resolve(boundary,p))];
const frozenManifest=read(path.join(boundary,'results/colorbench.json')).frozen_source_hashes;
const frozenIdentity={checked:0,mismatches:[]};
for(const [p,expected] of Object.entries(frozenManifest)){const f=path.resolve(boundary,p);if(!fs.existsSync(f)||sha(fs.readFileSync(f))!==expected)frozenIdentity.mismatches.push(p);frozenIdentity.checked++;}
assert.equal(frozenIdentity.mismatches.length,0,'Frozen manifest mismatch');
const out={schema:'hrl-global-tonal-audit-v1',createdUTC:new Date().toISOString(),status:'running',versions:{node:process.version,platform:process.platform,arch:process.arch},method:'Actual JavaScript inverse XYZ and frozen 3D GenSpace; unchanged pathStats and nine-point equilateral sheet stencil. No display clipping or optimization surrogate.',limits:['COMBVD is training data, not held-out validation.','GenSpace regularity is synthetic, not new observer evidence.','Sampled contracts do not prove continuous-domain behavior.','Mapped native score is a separate 3813-pair pipeline result, not retained 3331-pair score.','No new upstream ColorBench run.'],sampling:{regularHues:regular,criticalHues:critical,controlHues:controls,allUniqueHues:hues,samplesPerPath:N,pathsPerHue:20,stencilsPerHue:centres.length,stencilCentres:centres,stencilOffsets:offsets,sheetReferenceScale:1/32},hashes:Object.fromEntries(files.map(p=>[p,sha(fs.readFileSync(p))])),frozenIdentity,models:{}};
function score(dist,dv,w){let dd=0,dvsum=0,vv=0,dd0=0,dv0=0,vv0=0;for(let i=0;i<dist.length;i++){const d=dist[i],v=dv[i];dd+=w[i]*d*d;dvsum+=w[i]*d*v;vv+=w[i]*v*v;dd0+=d*d;dv0+=d*v;vv0+=v*v;}return{weighted:100*Math.sqrt(1-dvsum*dvsum/(dd*vv)),unweighted:100*Math.sqrt(1-dv0*dv0/(dd0*vv0)),pairs:dist.length};}
function paths(m,H){const row={H};for(const family of families){row[family]=[];for(const r of ['black','white'].includes(family)?ratios:other){
 const xyz=Array.from({length:N},(_,i)=>{const t=i/(N-1),q=family==='black'?{H,R:r*t,L:t}:family==='white'?{H,R:r*(1-t),L:t+r*(1-t)}:family==='exchange'?{H,R:r,L:r+(1-r)*t}:{H,R:r*t,L:r};return m.toXYZ(q);});
 const s=pathStats(xyz),gen=xyz.map(genRuler);s.ratio=r;
 if(family==='black'&&r===1){const end=Math.hypot(...gen.at(-1));s.quarterNorm=gen[Math.round((N-1)/4)][0]/gen.at(-1)[0];s.quarterDistance=Math.hypot(...gen[Math.round((N-1)/4)])/end;}
 const corner=family==='black'?gen[0]:gen.at(-1),d=gen.map(x=>Math.hypot(...x.map((v,j)=>v-corner[j]))),den=Math.max(d[0],d.at(-1),1e-12);let worst=0,total=0;
 for(let i=1;i<d.length;i++){const v=family==='black'?d[i-1]-d[i]:d[i]-d[i-1];if(v>0){total+=v;worst=Math.max(worst,v);}}
 s.retreatAmountFraction=total/den;s.worstRetreatFraction=worst/den;row[family].push(s);
 }}return row;}
function pathSummary(rows){const summaries={};for(const f of families){const r=rows.flatMap(x=>x[f]),cornerField=f==='black'?'retreatFromStartSteps':'retreatFromEndSteps';summaries[f]={meanCV:mean(r.map(x=>x.cv)),meanStepJump:mean(r.map(x=>x.meanStepJump)),worstStepJump:Math.max(...r.map(x=>x.maxStepJump)),cornerRetreatPaths:r.filter(x=>x[cornerField]>0).length,totalPaths:r.length,meanRetreatFraction:mean(r.map(x=>x.retreatAmountFraction)),worstRetreatFraction:Math.max(...r.map(x=>x.worstRetreatFraction))};}return summaries;}
function sheet(m,H){const values=[];for(const[R,L]of centres){const h=Math.min(1/64,R/2,(L-R)/3,(1-L)/2),v=offsets.map(([a,b])=>genRuler(m.toXYZ({H,R:R+a*h,L:L+b*h})));let hessian=0,gradient=0;
 for(let c=0;c<3;c++){const dr=(v[1][c]-v[2][c])/(2*h),dl=(v[3][c]-v[4][c])/(2*h),rr=(v[1][c]+v[2][c]-2*v[0][c])/h**2,ll=(v[3][c]+v[4][c]-2*v[0][c])/h**2,rl=(v[5][c]-v[6][c]-v[7][c]+v[8][c])/(4*h*h),x=(2*dr+dl)/Math.sqrt(3),xx=(4*rr+4*rl+ll)/3,xz=(2*rl+ll)/Math.sqrt(3);gradient+=x*x+dl*dl;hessian+=xx*xx+2*xz*xz+ll*ll;}
 values.push(hessian/Math.max(gradient,1e-8)/1024);
 }return{H,mean:mean(values),rms:Math.sqrt(mean(values.map(v=>v*v))),p95:quant(values,.95),max:Math.max(...values),values};}
function sheetSummary(rows){return{mean:mean(rows.map(x=>x.mean)),rms:Math.sqrt(mean(rows.map(x=>x.mean*x.mean))),p95Hue:quant(rows.map(x=>x.mean),.95),worstHue:Math.max(...rows.map(x=>x.mean))};}
function contracts(m,baseline){let seed=170917;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),err=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));let roundtrip=0,neutral=0,vivid=0,seam=0;const count=1024;
 for(let i=0;i<count;i++){const L=i<64?10**(-9+rand()*7):rand(),q={H:360*rand(),R:L*rand(),L},xyz=m.toXYZ(q),back=m.fromXYZ(xyz);finite(xyz);finite(back);assert(back.R>=-1e-12&&back.R<=back.L+1e-12&&back.L<=1+1e-12);roundtrip=Math.max(roundtrip,err(m.embed(q),m.embed(back)));const source=m.model.toSource(q);assert(Math.abs(((source.H-q.H+540)%360)-180)<1e-9);}
 for(let i=0;i<=128;i++)neutral=Math.max(neutral,err(m.toXYZ({H:39,R:0,L:i/128}),baseline.toXYZ({H:39,R:0,L:i/128})));
 for(const H of hues)vivid=Math.max(vivid,err(m.toXYZ({H,R:1,L:1}),baseline.toXYZ({H,R:1,L:1})));
 for(let i=0;i<128;i++){const L=rand(),R=L*rand();seam=Math.max(seam,err(m.toXYZ({H:1e-7,R,L}),m.toXYZ({H:360-1e-7,R,L})));}
 for(const q of [{H:0,R:-.1,L:.5},{H:0,R:.7,L:.5},{H:0,R:0,L:1.1},{H:NaN,R:0,L:0}])assert.throws(()=>m.toXYZ(q));
 assert(roundtrip<1e-7);assert(neutral<1e-12);assert(vivid<1e-10);assert(seam<1e-6);
 return{seed:170917,roundtripSamples:count,nearBlackSamples:64,maxEmbeddingError:roundtrip,neutralSamples:129,maxNeutralDifference:neutral,vividSamples:hues.length,maxVividDifference:vivid,seamSamples:128,maxSeamXYZDifference:seam,invalidInputsRejected:4};}
const start=Date.now();
for(const {label,file} of records){const raw=fs.readFileSync(file),record=JSON.parse(raw),hash=sha(raw);assert.equal(record.coefficients.length,1);assert.equal(record.ring_logits,null);assert.equal(record.gamut_calibration,'shared');
 const models={},result={file,sha256:hash,profiles:{}};out.models[label]=result;
 for(const gamut of ['srgb','full']){const m=await createSpectralTonalHRL({gamut,record,checkpoint:label});models[gamut]=m;const baseline=await createSpectralTonalHRL({gamut,checkpoint:'metric'}),p=cache.profiles[gamut];
  const retained=score(p.a.map((a,i)=>{const q=x=>m.model.fromSource({H:x[0],R:x[1],L:x[2]});return m.distance(q(a),q(p.b[i]));}),p.dv,p.w);
  const profile={retained,contracts:contracts(m,baseline)};result.profiles[gamut]=profile;
  if(gamut==='srgb'){let mappedPairs=0;const distances=input.xyz1.map((x,i)=>{const a=m.importXYZ(x),b=m.importXYZ(input.xyz2[i]);if(a.events.length||b.events.length)mappedPairs++;return m.distance(a.coordinates,b.coordinates);});profile.mappedAllInput={...score(distances,input.dv,input.w),mappedPairs};assert.equal(mappedPairs,482);}
  const pathRows=[],sheetRows=[];for(const H of hues){pathRows.push(paths(m,H));sheetRows.push(sheet(m,H));}
  const subset=(rows,angles)=>rows.filter(r=>angles.includes(r.H));
  profile.paths={globalRegular:pathSummary(subset(pathRows,regular)),critical:pathSummary(subset(pathRows,critical)),controls:pathSummary(subset(pathRows,controls)),rows:pathRows};
  const ordinarySheet=subset(sheetRows,regular);profile.sheet={globalRegular:{...sheetSummary(ordinarySheet),blueMean:mean(ordinarySheet.filter(x=>x.H>=255&&x.H<=295).map(x=>x.mean))},critical:sheetSummary(subset(sheetRows,critical)),controls:sheetSummary(subset(sheetRows,controls)),rows:sheetRows};
  profile.samples={pathPoints:hues.length*20*N,sheetXYZPoints:hues.length*centres.length*9,regularPathPoints:regular.length*20*N,regularSheetXYZPoints:regular.length*centres.length*9};
  const frozenName=['metric','balanced'].find(n=>sha(fs.readFileSync(path.join(boundary,`results/${n}.json`)))===hash);
  if(frozenName){const expected=historical.models[frozenName][gamut],es=historicalSheet.models[frozenName][gamut],deltas={weighted:retained.weighted-expected.scores.weighted,unweighted:retained.unweighted-expected.scores.unweighted,pathCV:{},sheet:{}};assert(Math.abs(deltas.weighted)<1e-7);assert(Math.abs(deltas.unweighted)<1e-7);
   for(const f of families){deltas.pathCV[f]=profile.paths.globalRegular[f].meanCV-expected.summaries[f].meanCV;assert(Math.abs(deltas.pathCV[f])<1e-6*Math.max(1,expected.summaries[f].meanCV));}
   for(const k of ['mean','rms','p95Hue','worstHue','blueMean']){deltas.sheet[k]=profile.sheet.globalRegular[k]-es[k];assert(Math.abs(deltas.sheet[k])<1e-6*Math.max(1,es[k]));}profile.historicalSanity={frozenName,passed:true,deltas};
  }
  finite(profile);out.elapsedSeconds=(Date.now()-start)/1000;fs.writeFileSync(outfile,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({label,gamut,retained,mapped:profile.mappedAllInput,pathCV:Object.fromEntries(families.map(f=>[f,profile.paths.globalRegular[f].meanCV])),sheet:profile.sheet.globalRegular,elapsedSeconds:out.elapsedSeconds}));
 }
 let seed=317019;for(let i=0;i<256;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const L=seed/2**32,q={H:i*137.507764,R:L*((i+.5)/256),L};assert.deepEqual(models.srgb.model.fromSource(q),models.full.model.fromSource(q));}result.sharedBankIdentitySamples=256;
}
out.status='completed';out.elapsedSeconds=(Date.now()-start)/1000;finite(out);fs.writeFileSync(outfile,JSON.stringify(out,null,2)+'\n');

/** Frozen, population-explicit COMBVD evaluation of HRL research candidates.
 * Run from the repository root; ordinary mapped import is used for every input.
 * COMBVD is development/training evidence, not an independent observer holdout.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHRLv2} from '../../index.mjs';
import {createJointHRL} from '../joint-contours/index.mjs';

const ROOT=new URL('../../../',import.meta.url);
const INPUT=new URL('../boundary-tonal/results/training-inputs.json',import.meta.url);
const LABELS=new URL('../equal-span/results/combvd-inputs.json',import.meta.url);
const NPZ=new URL('../mapped-012/results/balanced-full-combvd.npz',import.meta.url);
const BETA=new URL('../boundary-tonal/results/metric.json',import.meta.url);
const JOINT=new URL('../joint-contours/results/joint.json',import.meta.url);
const OLD_BOARD=new URL('../boundary-tonal/results/colorbench.json',import.meta.url);
const FAMILIES=['BFD-P(D65)','BFD-P( C )','BFD-P(M)','LEEDS','RIT-DuPont','WITT'];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const readJSON=url=>JSON.parse(fs.readFileSync(url,'utf8'));
const range=n=>Array.from({length:n},(_,i)=>i);

export function stress(indices,predicted,visualDifference,weights){
  if(!indices.length)throw RangeError('STRESS requires a nonempty population');
  let dd=0,dv=0,vv=0;
  for(const i of indices){const w=weights[i],d=predicted[i],v=visualDifference[i];
    if(!(w>0)||![d,v].every(Number.isFinite))throw RangeError('Nonfinite COMBVD row');
    dd+=w*d*d;dv+=w*d*v;vv+=w*v*v;
  }
  if(!(dd>0&&vv>0))throw RangeError('Degenerate COMBVD population');
  const scale=dv/dd;
  let residual=0;for(const i of indices)residual+=weights[i]*(scale*predicted[i]-visualDifference[i])**2;
  return 100*Math.sqrt(Math.max(0,residual/vv));
}

export function loadInputs(){
  const bytes=fs.readFileSync(INPUT),labelBytes=fs.readFileSync(LABELS),raw=JSON.parse(bytes),rows=JSON.parse(labelBytes);
  const n=3813;
  for(const k of ['xyz1','xyz2','dv','w'])if(raw[k]?.length!==n)throw Error(`Expected ${n} ${k} rows`);
  if(rows.length!==n||raw.native_indices?.length!==3331)throw Error('Unexpected COMBVD source or native mask size');
  if(raw.provenance.sha256!==sha(fs.readFileSync(NPZ)))throw Error('Prepared COMBVD NPZ differs from its pinned provenance');
  const mask=Buffer.allocUnsafe(raw.native_indices.length*8),seen=new Set();
  raw.native_indices.forEach((i,j)=>{if(!Number.isInteger(i)||i<0||i>=n||seen.has(i))throw Error('Invalid native retained index');seen.add(i);mask.writeBigInt64LE(BigInt(i),8*j);});
  if(sha(mask)!==raw.provenance.native_mask_sha256)throw Error('Native retained mask differs from its pinned provenance');
  const counts=Object.fromEntries(FAMILIES.map(x=>[x,0]));
  rows.forEach((r,i)=>{if(r.index!==i||r.dv!==raw.dv[i]||r.weight!==raw.w[i]||!(r.dataset in counts))throw Error(`Mismatch in COMBVD label row ${i}`);counts[r.dataset]++;});
  if(JSON.stringify(Object.values(counts))!==JSON.stringify([2028,200,548,307,312,418]))throw Error('Unexpected COMBVD family counts');
  return {raw,labels:rows.map(r=>r.dataset),all:range(n),native:raw.native_indices,
    identity:{preparedInputsSHA256:sha(bytes),labelRowsSHA256:sha(labelBytes),sourceNPZSHA256:raw.provenance.sha256,nativeMaskSHA256:sha(mask),familyCounts:counts}};
}

function scorePopulation(indices,predicted,impacts,input,labels,mappedPairs){
  const {dv,w}=input,ones=w.map(()=>1);
  const families=Object.fromEntries(FAMILIES.map(label=>{const subset=indices.filter(i=>labels[i]===label);
    return [label,{pairs:subset.length,weighted:stress(subset,predicted,dv,w),unweighted:stress(subset,predicted,dv,ones),mappedPairs:subset.filter(i=>impacts[i]).length}];}));
  return{pairs:indices.length,weighted:stress(indices,predicted,dv,w),unweighted:stress(indices,predicted,dv,ones),mappedPairs:indices.filter(i=>impacts[i]).length,perFamily:families};
}

export function evaluate(model,gamut,inputs){
  for(const method of ['importXYZ','distance'])if(typeof model?.[method]!=='function')throw TypeError(`Model lacks ${method}`);
  const {raw,labels,all,native}=inputs,predicted=[],mappedPairs=[];
  let mappedEndpoints=0;const eventCounts={};
  for(const i of all){
    const a=model.importXYZ(raw.xyz1[i]),b=model.importXYZ(raw.xyz2[i]);
    if(!a?.coordinates||!b?.coordinates||!Array.isArray(a.events)||!Array.isArray(b.events))throw Error(`Malformed import at pair ${i}`);
    for(const r of [a,b]){if(r.events.length)mappedEndpoints++;for(const e of r.events)eventCounts[e]=(eventCounts[e]||0)+1;}
    mappedPairs[i]=a.events.length>0||b.events.length>0;
    const delta=model.distance(a.coordinates,b.coordinates);
    if(!Number.isFinite(delta)||delta<0)throw Error(`Nonfinite embedding distance at pair ${i}`);
    predicted[i]=delta;
  }
  const supported=gamut==='srgb'?native:all;
  const retained=scorePopulation(supported,predicted,mappedPairs,raw,labels);
  if(retained.mappedPairs)throw Error(`${gamut} retained population maps ${retained.mappedPairs} supposedly supported pairs`);
  const mapped=gamut==='srgb'?scorePopulation(all,predicted,mappedPairs,raw,labels):null;
  if(gamut==='srgb'&&mapped.mappedPairs!==482)throw Error(`Native mapped-pair population changed: ${mapped.mappedPairs}`);
  return{gamut,retained,mappedAll:mapped,imports:{endpoints:all.length*2,mappedEndpoints,mappedPairs:all.filter(i=>mappedPairs[i]).length,eventCounts}};
}

export function parseArgs(args){
  const o={models:['beta1','joint'],factory:'createFreshFieldHRL',candidateName:'candidate'};
  for(let i=0;i<args.length;i++){
    const k=args[i],v=args[i+1];if(!k.startsWith('--')||!v||v.startsWith('--'))throw Error(`Expected value after ${k}`);i++;
    if(k==='--models')o.models=v.split(',');else if(k==='--candidate-module')o.module=v;else if(k==='--candidate-export')o.factory=v;
    else if(k==='--candidate-record')o.record=v;else if(k==='--candidate-name')o.candidateName=v;else throw Error(`Unknown option ${k}`);
  }
  if(!o.models.length||o.models.some(x=>!['beta1','joint','candidate'].includes(x))||new Set(o.models).size!==o.models.length)throw Error('Use distinct --models beta1,joint,candidate');
  if(o.models.includes('candidate')&&!o.module)throw Error('--candidate-module is required for candidate');
  if(o.models.includes('candidate')&&!o.record)throw Error('--candidate-record is required for candidate; implicit seed state is not reproducible');
  if(o.record&&!o.module)throw Error('--candidate-record requires --candidate-module');
  if(!/^[a-zA-Z_$][\w$]*$/.test(o.factory))throw Error('Invalid candidate export name');
  return o;
}

/** Node-parsed recursive local ESM static-import closure and explicit record.
 * Resampled after evaluation to reject changing source bytes mid-run.
 */
export function candidateIdentity(modulePath,recordPath){
  if(!modulePath||!recordPath)throw Error('Candidate entry and explicit frozen record are required');
  return JSON.parse(execFileSync(process.execPath,['--experimental-vm-modules','--no-warnings',fileURLToPath(new URL('./source-identity.mjs',import.meta.url)),modulePath,recordPath],{encoding:'utf8'}));
}

export async function run(options=parseArgs([])){
  const inputs=loadInputs(),historical=readJSON(OLD_BOARD);
  const source={hrlCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:new URL('.',ROOT),encoding:'utf8'}).trim(),
    colorbenchCommit:historical.colorbench_commit,poolCommit:historical.pool_commit,
    beta1DefinitionSHA256:sha(fs.readFileSync(BETA)),jointDefinitionSHA256:sha(fs.readFileSync(JOINT)),
    ...inputs.identity};
  let candidate;
  if(options.models.includes('candidate')){
    const identity=candidateIdentity(options.module,options.record);
    const module=await import(pathToFileURL(identity.module).href),factory=module[options.factory];
    if(typeof factory!=='function')throw TypeError(`Missing ${options.factory} in ${identity.module}`);
    candidate={factory,record:readJSON(identity.record),identity,export:options.factory};
  }
  const results={};
  for(const name of options.models){
    const key=name==='candidate'?options.candidateName:name;if(results[key])throw Error(`Duplicate model name ${key}`);
    results[key]={};
    for(const gamut of ['srgb','full']){
      const opt={gamut,referenceWhiteNits:300};if(candidate&&name==='candidate')opt.record=candidate.record;
      const m=name==='beta1'?await createHRLv2(opt):name==='joint'?await createJointHRL(opt):await candidate.factory(opt);
      results[key][gamut]=evaluate(m,gamut,inputs);
      if(candidate&&name==='candidate'&&JSON.stringify(candidateIdentity(options.module,options.record))!==JSON.stringify(candidate.identity))throw Error('Candidate code or record changed during evaluation');
    }
  }
  return {schema:'hrl-fresh-field-combvd-v2',scope:'COMBVD development scores; no independent observer holdout',method:'D65 relative XYZ, mapped import, actual HRL bicone distance; fitted residual STRESS with traditional per-row weights',referenceWhiteNits:300,source,candidate:candidate?{...candidate.identity,export:candidate.export}:null,models:results};
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
  try{console.log(JSON.stringify(await run(parseArgs(process.argv.slice(2))),null,2));}
  catch(e){console.error(e.stack??String(e));process.exitCode=1;}
}

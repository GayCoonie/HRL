/** Supplemental omitted-edge stencils. Separate from historical eligibility.
 * The bending equation is copied from boundary-tonal/sheet-audit.mjs. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createSpectralTonalHRL} from '../boundary-tonal/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const boundary=fileURLToPath(new URL('../boundary-tonal/',import.meta.url));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const quant=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.floor(p*(a.length-1))];
let outfile;const records=[],args=process.argv.slice(2);
for(let i=0;i<args.length;i++){
 if(args[i]==='--out'){assert(!outfile,'Duplicate --out');outfile=args[++i];continue;}
 assert(!args[i].startsWith('--'),'Unknown option');const at=args[i].indexOf('=');assert(at>0&&at<args[i].length-1,'Use label=recordpath');
 const label=args[i].slice(0,at);assert(/^[a-zA-Z0-9_-]+$/.test(label),'Invalid label');assert(!records.some(x=>x.label===label),'Duplicate label');
 records.push({label,file:path.resolve(args[i].slice(at+1))});
}
assert(outfile&&path.isAbsolute(outfile)&&outfile.endsWith('.json'),'--out requires absolute JSON path');assert(!fs.existsSync(outfile),'Refusing to overwrite receipt');
assert(!path.resolve(outfile).startsWith(path.resolve(boundary)+path.sep),'Do not write frozen research directory');
const baselinePath=path.join(boundary,'results/metric.json'),baselineHash=sha(baselinePath);
if(!records.length)records.push({label:'metric',file:baselinePath});
const regular=Array.from({length:72},(_,i)=>1+5*i),critical=[263,269,273,275,277,281,285,293],hues=[...new Set([...regular,...critical])].sort((a,b)=>a-b);
const centres=[];for(const L of [.02,.3])for(const U of [.18,.4,.65,.84,.94,.985])centres.push({R:L*U,L,U});
for(const L of [.04,.08,.12,.18])for(const U of [.94,.985])centres.push({R:L*U,L,U});assert.equal(centres.length,20);
const offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const stencils=centres.map(({R,L,U})=>{const radius=Math.min(1/64,R/2,(L-R)/3,(1-L)/2);return{R,L,U,radius,points:offsets.map(([a,b])=>({R:R+a*radius,L:L+b*radius}))};});
for(const s of stencils)for(const q of s.points)assert(q.R>=0&&q.R<=q.L&&q.L<=1,'Illegal stencil');
const files=[fileURLToPath(import.meta.url),...['index.mjs','boundary-1nm.json','sheet-audit.mjs','results/cache.json','../shared-rl/core.mjs','../shared-rl/source.mjs','../../a-smooth/rl-core.mjs','../tonal-semantics/ruler.mjs','../../../src/base/appearance-runtime.mjs','../../../src/base/gen-parameters.mjs'].map(p=>path.resolve(boundary,p))];
const manifest=read(path.join(boundary,'results/colorbench.json')).frozen_source_hashes,frozenIdentity={checked:0,mismatches:[]};
for(const [p,h] of Object.entries(manifest)){const f=path.resolve(boundary,p);if(!fs.existsSync(f)||sha(f)!==h)frozenIdentity.mismatches.push(p);frozenIdentity.checked++;}assert.equal(frozenIdentity.mismatches.length,0);
const out={schema:'hrl-tonal-next-edge-audit-v1',createdUTC:new Date().toISOString(),status:'running',node:process.version,method:'Supplemental20 omitted centres; original nine-point actual-inverse-XYZ-to-GenSpace equilateral normalized vector bending. Separate from historical121-centre eligibility.',limits:['Synthetic diagnostic, not observer preference or held-out validation.','Finite stencils do not establish continuous-domain smoothness.','Regular and critical aggregates are separate; no promotion or eligibility rule change.'],baseline:{file:baselinePath,sha256:baselineHash},sampling:{regularHues:regular,criticalHues:critical,uniqueHues:hues,stencils,offsets,referenceScale:1/32,stencilsPerGamut:hues.length*20,xyzEvaluationsPerGamut:hues.length*20*9},hashes:Object.fromEntries(files.map(p=>[p,sha(p)])),frozenIdentity,models:{}};
function row(m,H){const values=stencils.map(({R,L,radius:h})=>{const v=offsets.map(([a,b])=>genRuler(m.toXYZ({H,R:R+a*h,L:L+b*h})));let hessian=0,gradient=0;
 for(let c=0;c<3;c++){const dr=(v[1][c]-v[2][c])/(2*h),dl=(v[3][c]-v[4][c])/(2*h),rr=(v[1][c]+v[2][c]-2*v[0][c])/h**2,ll=(v[3][c]+v[4][c]-2*v[0][c])/h**2,rl=(v[5][c]-v[6][c]-v[7][c]+v[8][c])/(4*h*h),x=(2*dr+dl)/Math.sqrt(3),xx=(4*rr+4*rl+ll)/3,xz=(2*rl+ll)/Math.sqrt(3);gradient+=x*x+dl*dl;hessian+=xx*xx+2*xz*xz+ll*ll;}
 const value=hessian/Math.max(gradient,1e-8)/1024;assert(Number.isFinite(value)&&value>=0);return value;});
 return{H,mean:mean(values),rms:Math.sqrt(mean(values.map(x=>x*x))),p95:quant(values,.95),max:Math.max(...values),values};}
function summary(rows){return{hues:rows.length,mean:mean(rows.map(x=>x.mean)),rms:Math.sqrt(mean(rows.map(x=>x.mean*x.mean))),p95Hue:quant(rows.map(x=>x.mean),.95),worstHue:Math.max(...rows.map(x=>x.mean)),maxStencil:Math.max(...rows.flatMap(x=>x.values))};}
const started=Date.now();
for(const{label,file}of records){const record=read(file);assert.equal(record.coefficients.length,1);assert.equal(record.ring_logits,null);assert.equal(record.gamut_calibration,'shared');const h=sha(file),result={file,sha256:h,isFrozenMetric:h===baselineHash,profiles:{}};out.models[label]=result;
 for(const gamut of ['srgb','full']){const m=await createSpectralTonalHRL({gamut,record,checkpoint:label}),rows=hues.map(H=>row(m,H));result.profiles[gamut]={regular:summary(rows.filter(r=>regular.includes(r.H))),critical:summary(rows.filter(r=>critical.includes(r.H))),rows};out.elapsedSeconds=(Date.now()-started)/1000;fs.writeFileSync(outfile,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({label,gamut,regular:result.profiles[gamut].regular,critical:result.profiles[gamut].critical,elapsedSeconds:out.elapsedSeconds}));}
}
out.status='completed';out.elapsedSeconds=(Date.now()-started)/1000;fs.writeFileSync(outfile,JSON.stringify(out,null,2)+'\n');

import {createHRLv2} from '/workspace/scratch/20abb8fd27ac/hrl-v2-next/v2/index.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createSpectralTonalHRL} from '/workspace/scratch/20abb8fd27ac/hrl-v2-next/v2/research/boundary-tonal/index.mjs';
import {genRuler,pathStats} from '/workspace/scratch/20abb8fd27ac/hrl-v2-next/v2/research/tonal-semantics/ruler.mjs';
const dir=new URL('file:///workspace/scratch/20abb8fd27ac/hrl-optimization/'),boundary=new URL('file:///workspace/scratch/20abb8fd27ac/hrl-v2-next/v2/research/boundary-tonal/'),read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const cache=read(new URL('results/cache.json',boundary)),input=read(new URL('results/training-inputs.json',boundary));
const out={createdUTC:new Date().toISOString(),scope:'Fresh baseline/selected/final pair scores, H281 paths/sheet, H275 direct-runtime XYZ export, finite boundary probes, Beta1 public-versus-explicit factory identity; checked against final receipts.',models:{},hashes:{}};
for(const f of ['index.mjs','../shared-rl/core.mjs','../tonal-semantics/ruler.mjs','results/cache.json','results/training-inputs.json'])out.hashes[f]=sha(new URL(f,boundary));
const score=(ds,vs,ws)=>{const s=w=>{let dot=0,dd=0,vv=0;ds.forEach((d,i)=>{dot+=w[i]*d*vs[i];dd+=w[i]*d*d;vv+=w[i]*vs[i]*vs[i]});return 100*Math.sqrt(1-dot*dot/(dd*vv))};return{weighted:s(ws),unweighted:s(ds.map(()=>1)),pairs:ds.length}};
const centres=[];for(let L=4;L<31;L+=2)for(let R=2;R<L-1;R+=2)centres.push([R/32,L/32]);for(const L of [.04,.08,.12,.18])for(const u of [.18,.4,.65,.84])centres.push([L*u,L]);
const offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
for(const name of ['beta1','sheet-raw','blue-raw','blue-robust']){
 const file=name==='beta1'?new URL('results/metric.json',boundary):new URL('../hrl-v2-next/v2/research/tonal-next/trials/'+name+'.json',dir),record=read(file),result={recordSHA256:sha(file),profiles:{}};out.models[name]=result;
 for(const gamut of ['srgb','full']){
  const m=await createSpectralTonalHRL({gamut,record,checkpoint:name}),p=cache.profiles[gamut],q=x=>m.model.fromSource({H:x[0],R:x[1],L:x[2]});
  const z={retained:score(p.a.map((x,i)=>m.distance(q(x),q(p.b[i]))),p.dv,p.w),H:281,paths:{},sheetValues:[]};result.profiles[gamut]=z;
  const expected=read(new URL('audit-'+(name==='beta1'?'baseline':name)+'.json',dir)).models[name==='beta1'?'metric':name].profiles[gamut];
  z.maxEmbeddingRoundtripError=0;z.exportedHueSheet=[];
  const publicFactory=name==='beta1'?await createHRLv2({gamut}):null;
  for(const H of [0,269,275,281,359.999999])for(const L of [0,1e-8,.001,.05,.5,1])for(const U of [0,.5,.999,1]){
   const q={H,R:L*U,L},xyz=m.toXYZ(q),back=m.fromXYZ(xyz),error=Math.max(...m.embed(q).map((v,i)=>Math.abs(v-m.embed(back)[i])));
   assert(xyz.every(Number.isFinite));assert(error<1e-7);z.maxEmbeddingRoundtripError=Math.max(z.maxEmbeddingRoundtripError,error);
   if(publicFactory)assert.deepEqual(xyz,publicFactory.toXYZ(q));
  }
  for(let il=0;il<=8;il++)for(let ir=0;ir<=il;ir++){const q={H:275,R:ir/8,L:il/8};z.exportedHueSheet.push({q,xyz:m.toXYZ(q)})}
  if(publicFactory)z.publicExplicitFactoryIdentitySamples=120;
  for(const key of ['weighted','unweighted','pairs'])assert(Math.abs(z.retained[key]-expected.retained[key])<1e-8);

  if(gamut==='srgb'){let mappedPairs=0;const ds=input.xyz1.map((x,i)=>{const a=m.importXYZ(x),b=m.importXYZ(input.xyz2[i]);if(a.events.length||b.events.length)mappedPairs++;return m.distance(a.coordinates,b.coordinates)});z.mappedAllInput={...score(ds,input.dv,input.w),mappedPairs};assert.equal(mappedPairs,482);for(const key of ['weighted','unweighted','pairs','mappedPairs'])assert(Math.abs(z.mappedAllInput[key]-expected.mappedAllInput[key])<1e-8)}
  for(const family of ['black','white','exchange','reach']){
   z.paths[family]=[];for(const r of ['black','white'].includes(family)?[.12,.32,.55,.78,1]:[.06,.22,.45,.68,.88]){
    const xyz=Array.from({length:257},(_,i)=>{const t=i/256,q={H:281};if(family==='black'){q.R=r*t;q.L=t}else if(family==='white'){q.R=r*(1-t);q.L=t+r*(1-t)}else if(family==='exchange'){q.R=r;q.L=r+(1-r)*t}else{q.R=r*t;q.L=r}return m.toXYZ(q)});
    z.paths[family].push({ratio:r,cv:pathStats(xyz).cv});
   }
  }
  z.sheetValues=centres.map(([R,L])=>{const h=Math.min(1/64,R/2,(L-R)/3,(1-L)/2),v=offsets.map(([a,b])=>genRuler(m.toXYZ({H:281,R:R+a*h,L:L+b*h})));let h2=0,g2=0;
   for(let c=0;c<3;c++){const dr=(v[1][c]-v[2][c])/(2*h),dl=(v[3][c]-v[4][c])/(2*h),rr=(v[1][c]-2*v[0][c]+v[2][c])/(h*h),ll=(v[3][c]-2*v[0][c]+v[4][c])/(h*h),rl=(v[5][c]-v[6][c]-v[7][c]+v[8][c])/(4*h*h),dx=(2*dr+dl)/Math.sqrt(3),dxx=(4*rr+4*rl+ll)/3,dxz=(2*rl+ll)/Math.sqrt(3);g2+=dx*dx+dl*dl;h2+=dxx*dxx+2*dxz*dxz+ll*ll}return h2/Math.max(g2,1e-8)/1024});
  z.sheetMean=z.sheetValues.reduce((a,b)=>a+b,0)/z.sheetValues.length;
  const sheet=expected.sheet.rows.find(r=>r.H===281),paths=expected.paths.rows.find(r=>r.H===281);
  z.maxSheetDifference=Math.max(...z.sheetValues.map((v,i)=>Math.abs(v-sheet.values[i])));assert(z.maxSheetDifference<1e-8);
  z.maxPathCVDifference=Math.max(...Object.keys(z.paths).flatMap(f=>z.paths[f].map((v,i)=>Math.abs(v.cv-paths[f][i].cv))));assert(z.maxPathCVDifference<1e-10);

  console.log(JSON.stringify({name,gamut,retained:z.retained,mapped:z.mappedAllInput,H:z.H,sheetMean:z.sheetMean}));
 }
}
out.status='completed';fs.writeFileSync(new URL('file:///workspace/scratch/13a5381bdd70/review/runtime-fresh.json'),JSON.stringify(out,null,2)+'\n');

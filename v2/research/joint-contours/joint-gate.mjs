import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createJointHRL} from './index.mjs';
const input=JSON.parse(fs.readFileSync(new URL('../boundary-tonal/results/training-inputs.json',import.meta.url)));
const stress=(ds,dv,w)=>{let dd=0,c=0,vv=0;for(let i=0;i<ds.length;i++){dd+=w[i]*ds[i]**2;c+=w[i]*ds[i]*dv[i];vv+=w[i]*dv[i]**2;}return 100*Math.sqrt(Math.max(0,1-c*c/(dd*vv)));};
for(const gamut of ['srgb','full']){const m=await createJointHRL({gamut}),idx=gamut==='srgb'?input.native_indices:input.dv.map((_,i)=>i);const ds=idx.map(i=>m.distance(m.fromXYZ(input.xyz1[i]),m.fromXYZ(input.xyz2[i])));const score=stress(ds,idx.map(i=>input.dv[i]),idx.map(i=>input.w[i]));console.log(gamut,idx.length,'weighted STRESS',score);assert(score<(gamut==='srgb'?29.1070478078:29.9485546453),'Joint target requires retained observer gain in both realizations');}
console.log('PASS retained native3331 and full3813 observer gate; visual audit is separate');
const P=new URL('./results/',import.meta.url),audit=JSON.parse(fs.readFileSync(new URL('audit-joint.json',P))),base=JSON.parse(fs.readFileSync(new URL('audit-beta1.json',P)));
const sha=crypto.createHash('sha256').update(fs.readFileSync(new URL('joint.json',P))).digest('hex');
for(const g of ['srgb','full']){
 const r=audit.models.joint[g],b=base.models.beta1[g];assert.equal(r.recordSHA256,sha,'Audit does not bind selected bytes');
 assert(r.nearGray.meanTurn<=.1*b.nearGray.meanTurn,'Requires >=90% mean near-gray turn reduction');
 assert(r.levelOrdering.worstDrop<=b.levelOrdering.worstDrop,'Sampled Level-step regression');
 assert(r.levelOrdering.worstTotalRetreat<=b.levelOrdering.worstTotalRetreat,'Integrated ordering regression');
 assert(r.vividError===0&&r.roundtripEmbedding<1e-6,'Runtime anchors/inverse failure');
 console.log('PASS direct visual milestone',g);
}

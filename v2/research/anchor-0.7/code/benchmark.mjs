/** Re-score actual JavaScript forward/inverse model, same XYZ inputs and exact bicone. */
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import path from'node:path';import{fileURLToPath}from'node:url';
import{createHRLResearch}from'../../../lib/research.mjs';import{createOPALAnchor,fitCoordinates}from'../../../lib/opal-anchor.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=n=>JSON.parse(fs.readFileSync(root+'/results/'+n,'utf8'));
const rows=JSON.parse(fs.readFileSync(root+'/../equal-span/results/combvd-inputs.json','utf8'));
const score=(rows,weighted=true)=>{let dd=0,dv=0,vv=0;for(const z of rows){const w=weighted?z.weight:1;dd+=w*z.de*z.de;dv+=w*z.de*z.dv;vv+=w*z.dv*z.dv;}const scale=dv/dd;return {n:rows.length,stress:100*Math.sqrt(rows.reduce((s,z)=>s+(weighted?z.weight:1)*(scale*z.de-z.dv)**2,0)/vv),scale};};
const models={},pairs={};
for(const gamut of ['srgb','full'])for(const variant of ['opal0.6','anchor-control','balanced','metric','conservative']){
 const m=variant==='opal0.6'?await createHRLResearch({gamut}):await createOPALAnchor({gamut,control:variant==='anchor-control',balance:['balanced','metric','conservative'].includes(variant)?variant:'balanced'}),retained=[],rejected=[];
 for(const r of rows){try{const a=m.fromXYZ(r.xyz1),b=m.fromXYZ(r.xyz2),de=m.distance(a,b);if(!Number.isFinite(de))throw Error('Nonfinite distance');retained.push({index:r.index,dataset:r.dataset,dv:r.dv,weight:r.weight,de});}catch(e){rejected.push({index:r.index,reason:e.message});}}
 const subsets={};for(const d of [...new Set(retained.map(r=>r.dataset))])subsets[d]=score(retained.filter(r=>r.dataset===d),false);subsets['BFD-P combined']=score(retained.filter(r=>r.dataset.startsWith('BFD-P')),false);
 const id=variant+'-'+gamut;models[id]={weighted:score(retained),unweighted:score(retained,false),subsets,retained_indices:retained.map(r=>r.index),rejected};pairs[id]=retained;
 if(m.fit&&Math.abs(models[id].weighted.stress-m.fit.stress_all_weighted)>1e-7)throw Error('Fit/runtime score mismatch '+id);
 console.log(id,models[id].weighted.stress);
}
for(const g of ['srgb','full'])for(const v of ['anchor-control','balanced','metric','conservative'])assert.deepEqual(models[v+'-'+g].retained_indices,models['opal0.6-'+g].retained_indices);
const common=new Set(models['opal0.6-srgb'].retained_indices),matched={};
for(const [id,r]of Object.entries(pairs))matched[id]=score(r.filter(x=>common.has(x.index)));
const omissions={};for(const g of ['srgb','full'])for(const geo of [3,6])for(const f of ['BFD-P','LEEDS','RIT-DuPont','WITT']){
 const fit=read(`fit-${g}-omit-${f}-g${geo}.json`),input=read(`fit-input-${g}.json`),m=await createOPALAnchor({gamut:g,control:true});
 const rr=input.pairs.filter(r=>r.dataset.startsWith(f)).map(r=>({index:r.index,weight:r.weight,dv:r.dv,de:m.distance(fitCoordinates(r.a,fit),fitCoordinates(r.b,fit))}));
 const old=pairs['opal0.6-'+g].filter(r=>r.dataset.startsWith(f));omissions[`${g}-g${geo}-${f}`]={family:f,omitted_fit:score(rr),opal0_6:score(old),note:'Retrospective entire-family exclusion from direct COMBVD loss. Not untouched independent validation; auxiliary data and visual reference are shared.'};
}
const out={input_sha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/../equal-span/results/combvd-inputs.json')).digest('hex'),all_variant_masks_identical_to_OPAL_0_6:true,id:'OPAL-0.7-native-bicone-COMBVD',method:'Identical stored Bradford-adapted D65 XYZ inputs from the OPAL 0.6 baseline. No channel clipping or output quantization. Public regular-bicone Euclidean distance. One pooled optimal scale, with BFD-P:1 LEEDS:9 RIT-DuPont:9 WITT:7 multiplicities for traditional weighting.',fitted_to_COMBVD:true,selection_note:'Default geometry weight 6; 3 and 12 retained as disclosed metric/visual compromises. All are development results.',models,matched_3331:matched,family_omissions:omissions};
fs.writeFileSync(root+'/results/benchmarks.json',JSON.stringify(out,null,2)+'\n');fs.writeFileSync(root+'/results/pair-distances.json',JSON.stringify(pairs)+'\n');
console.log('Matched pairs',JSON.stringify(matched));

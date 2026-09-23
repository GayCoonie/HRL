/** Direct runtime training-contact and shifted-hue/level check for v4 trials. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHRLv2} from '../../index.mjs';
import {createJointHRL} from '../joint-contours/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';

// Optional module paths permit the independent research checkouts before integration.
// In the merged tree, the sibling canonical model modules are selected by default.
const [outputPath,v3Argument,v4Argument,rootArgument]=process.argv.slice(2);
if(!outputPath)throw Error('Usage: node audit-contact.mjs <output> [v3 module] [v4 module] [research root]');
const root=rootArgument??fileURLToPath(new URL('../',import.meta.url));
const v3Module=v3Argument??fileURLToPath(new URL('../conditional-field/index.mjs',import.meta.url));
const v4Module=v4Argument??fileURLToPath(new URL('../conditional-hue/index.mjs',import.meta.url));
const [{createConditionalFieldHRL},{createConditionalHueHRL}]=await Promise.all([
  import(pathToFileURL(v3Module).href),import(pathToFileURL(v4Module).href),
]);
const paths={
  beta1:path.join(root,'boundary-tonal/results/metric.json'),
  joint:path.join(root,'joint-contours/results/joint.json'),
  conditionalV3:path.join(root,'conditional-fit/results/conditional-joint-guarded-v0.json'),
  coupledV4:path.join(root,'conditional-hue-fit/results/conditional-hue-coupled-guarded-v0.json'),
  contactV4:path.join(root,'conditional-hue-fit/results/conditional-hue-blue-yellow-contact-v0.json'),
};
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const records=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,JSON.parse(fs.readFileSync(p))]));
const groups={
  trainedBlue:[269,273,277].flatMap(H=>[[.1,.5],[.08,.8],[.07,.35]].map(([R,L])=>({H,R,L}))),
  heldoutBlue:[270,275,280].flatMap(H=>[[.09,.45],[.12,.6],[.08,.8],[.11,.7]].map(([R,L])=>({H,R,L}))),
  trainedYellow:[115,120,125].map(H=>({H,R:.64,L:.8})),
  heldoutYellow:[117.5,122.5].flatMap(H=>[[.6,.75],[.7,.85],[.64,.8]].map(([R,L])=>({H,R,L}))),
};
const out={schema:'hrl-conditional-contact-audit-v1',method:'Actual JS XYZ, no display clipping; physical s=R_base/L_base, Y relative luminance, GenSpace J',
  source:Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,{path:p,sha256:sha(p)}])),groups,models:{}};
for(const gamut of ['srgb','full']){
  const models={
    beta1:await createHRLv2({gamut}),
    joint:await createJointHRL({gamut,record:records.joint}),
    conditionalV3:await createConditionalFieldHRL({gamut,record:records.conditionalV3}),
    coupledV4:await createConditionalHueHRL({gamut,record:records.coupledV4}),
    contactV4:await createConditionalHueHRL({gamut,record:records.contactV4}),
  };
  out.models[gamut]={};
  for(const [name,m] of Object.entries(models)){
    out.models[gamut][name]={};
    for(const [group,queries] of Object.entries(groups)){
      const rows=queries.map(q=>{
        const physical=m.model.toPhysical?m.model.toPhysical(q):m.model.source.toBase(m.model.toSource(q));
        const xyz=m.toXYZ(q);
        return {...q,physicalHue:physical.H,a:physical.L,
          s:physical.L?physical.R/physical.L:0,Y:xyz[1],GenSpaceJ:genRuler(xyz)[0]};
      });
      const average=key=>rows.reduce((sum,row)=>sum+row[key],0)/rows.length;
      out.models[gamut][name][group]={rows,meanS:average('s'),meanY:average('Y'),minS:Math.min(...rows.map(x=>x.s)),minY:Math.min(...rows.map(x=>x.Y))};
    }
  }
}
fs.writeFileSync(outputPath,JSON.stringify(out,null,2)+'\n');
for(const g of ['srgb','full'])for(const n of ['beta1','joint','coupledV4','contactV4'])
  console.log(g,n,JSON.stringify(Object.fromEntries(Object.entries(out.models[g][n]).map(([k,v])=>[k,{meanS:v.meanS,meanY:v.meanY,minS:v.minS,minY:v.minY}]))));

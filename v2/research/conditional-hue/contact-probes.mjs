/** Direct-JS physical and perceptual probes at matched public HRL positions.
 * Run from any directory: node v2/research/conditional-hue/contact-probes.mjs --out NEW.json
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHRLv2} from '../../index.mjs';
import {createJointHRL} from '../joint-contours/index.mjs';
import {createConditionalFieldHRL} from '../conditional-field/index.mjs';
import {createConditionalHueHRL} from './index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';

const defaults={beta:new URL('../boundary-tonal/results/metric.json',import.meta.url),joint:new URL('../joint-contours/results/joint.json',import.meta.url),
  v3:new URL('../conditional-field/results/conditional-joint-guarded-v0.json',import.meta.url),coupled:new URL('./results/conditional-hue-coupled-guarded-v0.json',import.meta.url),contact:new URL('./results/conditional-hue-blue-yellow-contact-v0.json',import.meta.url)};
const options={};for(let i=2;i<process.argv.length;i++){
  const a=process.argv[i],v=process.argv[++i];if(!['--out','--v3-record','--coupled-record','--contact-record'].includes(a)||!v)throw Error('Use --out NEW.json [--v3-record FILE] [--coupled-record FILE] [--contact-record FILE]');options[a.slice(2).replaceAll('-','_')]=v;
}
if(!options.out)throw Error('Missing --out NEW.json');const destination=path.resolve(options.out);if(fs.existsSync(destination))throw Error('Refusing to overwrite '+destination);
for(const name of ['v3','coupled','contact'])if(options[`${name}_record`])defaults[name]=pathToFileURL(path.resolve(options[`${name}_record`]));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const records=Object.fromEntries(Object.entries(defaults).map(([name,url])=>{const data=fs.readFileSync(url);return[name,{sha256:sha(data),record:JSON.parse(data)}]}));
const yellowH=[117.5,120,122.5],blueH=[270,273,275,280];
const probes=[...yellowH.flatMap(H=>[[.64,.8],[.6,.75],[.7,.85]].map(([R,L])=>({H,R,L,group:'yellow'}))),...blueH.flatMap(H=>[[.1,.5],[.09,.45],[.12,.6],[.08,.8],[.11,.7]].map(([R,L])=>({H,R,L,group:'blue'}))),{H:182.5,R:.1,L:.5,group:'cyan-control'},{H:182.5,R:.64,L:.8,group:'cyan-control'}];
const sources={script:import.meta.url,beta:new URL('../../index.mjs',import.meta.url),joint:new URL('../joint-contours/index.mjs',import.meta.url),v3Factory:new URL('../conditional-field/index.mjs',import.meta.url),v3Model:new URL('../conditional-field/model.mjs',import.meta.url),v4Factory:new URL('./index.mjs',import.meta.url),v4Model:new URL('./model.mjs',import.meta.url),ruler:new URL('../tonal-semantics/ruler.mjs',import.meta.url)};
const out={schema:'hrl-v4-contact-independent-direct-probes-v1',records:Object.fromEntries(Object.entries(records).map(([name,v])=>[name,v.sha256])),sourceSHA256:Object.fromEntries(Object.entries(sources).map(([name,url])=>[name,sha(fs.readFileSync(fileURLToPath(url)))])),referenceWhiteNits:300,
  definition:'Physical s=physical R/physical L; relative chroma=opponent-plane GenSpace distance from same-Level gray divided by same-Level vivid chroma; Y from original, unclipped XYZ.',probeLocations:probes,models:{}};
for(const gamut of ['srgb','full']){
  const models=[['Beta 1',await createHRLv2({gamut})],['Frozen joint',await createJointHRL({gamut})],['V3 guarded',await createConditionalFieldHRL({gamut,record:records.v3.record})],['V4 coupled guarded',await createConditionalHueHRL({gamut,record:records.coupled.record})],['V4 contact FAILED COMBVD',await createConditionalHueHRL({gamut,record:records.contact.record})]];
  out.models[gamut]={};
  for(const [name,m] of models){const rows=probes.map(({H,R,L,group})=>{
    const q={H,R,L},xyz=m.toXYZ(q),physical=m.model.toPhysical?m.model.toPhysical(q):m.model.source.toBase(m.model.toSource(q));
    const gen=genRuler(xyz),gray=genRuler(m.toXYZ({H,R:0,L})),vivid=genRuler(m.toXYZ({H,R:L,L}));
    const chroma=Math.hypot(gen[1]-gray[1],gen[2]-gray[2])/Math.hypot(vivid[1]-gray[1],vivid[2]-gray[2]);
    return{group,H,R,L,Y:xyz[1],J:gen[0],physicalS:physical.L>0?physical.R/physical.L:0,physicalH:physical.H,relativeChroma:chroma};
  });
  const near=rows.filter(r=>r.group==='blue'&&r.H!==273),yellow=rows.filter(r=>r.group==='yellow'&&r.H!==120),mean=(arr,key)=>arr.reduce((s,r)=>s+r[key],0)/arr.length;
  const paths=blueH.map(H=>{const R=.1,J=Array.from({length:65},(_,i)=>genRuler(m.toXYZ({H,R,L:R+(1-R)*i/64}))[0]);const drops=J.slice(1).map((v,i)=>Math.max(0,J[i]-v));return{H,fixedPublicR:R,maxNegativeJStep:Math.max(...drops),totalJRetreat:drops.reduce((a,b)=>a+b,0)};});
  out.models[gamut][name]={rows,heldoutBlue:{count:near.length,meanPhysicalS:mean(near,'physicalS'),meanRelativeChroma:mean(near,'relativeChroma')},heldoutYellow:{count:yellow.length,meanY:mean(yellow,'Y')},blueFixedRPaths:paths};
  console.log(gamut,name,'heldout blue physical s',mean(near,'physicalS').toFixed(5),'relative chroma',mean(near,'relativeChroma').toFixed(5),'yellow Y',mean(yellow,'Y').toFixed(5),'worst J drop',Math.max(...paths.map(p=>p.maxNegativeJStep)).toFixed(5));
  }
}
fs.writeFileSync(destination,JSON.stringify(out,null,2)+'\n');console.log('Wrote',destination);

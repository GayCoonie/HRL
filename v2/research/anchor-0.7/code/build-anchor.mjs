/** Gamut-anchor normalization ablation. The hue field remains OPAL 0.6. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHRLResearch,MonotoneAtlas} from '../../../lib/research.mjs';
import {AnchorAppearanceReadout} from '../../../lib/opal-anchor.mjs';
import {levelToNonblack} from '../../../lib/basr.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const N=72,NY=33,NX=65,grid=n=>Array.from({length:n},(_,i)=>i/(n-1)),sg=grid(NY),xg=grid(NX);
function arc(points){let row=[0];for(let i=1;i<points.length;i++)row.push(row.at(-1)+Math.hypot(...points[i].map((v,k)=>v-points[i-1][k])));const total=row.at(-1);if(total<1e-15)return xg.slice();return row.map((v,i)=>i===0?0:i===NX-1?1:.999*v/total+.001*i/(NX-1));}
for(const gamut of ['srgb','full']){
 const old=await createHRLResearch({gamut}),base=old.base,ro=old.readout;
 const readout=process.argv.includes('--legacy-readout')?ro:new AnchorAppearanceReadout(base.field,{choice:{coefficients:ro.hk}},{coefficients:ro.sat,reference_context:ro.context},JSON.parse(fs.readFileSync(root+'/results/brightness-readout.json')));
 const sample=(H,s,l)=>base.toXYZ({H,R:s*levelToNonblack(l),L:levelToNonblack(l)});
 const normalizers=grid(N).map(()=>null);
 function aFor(H){const v=readout.evaluate(base.toXYZ({H,R:1,L:1}));const w=readout.evaluate(base.field.white);return xyz=>{const a=readout.evaluate(xyz),c=a.chromaticContent/v.chromaticContent;return [a.brightness/w.brightness+(.5-v.brightness/w.brightness)*c,Math.sqrt(3)/2*c];};}
 const anchors=[],rowsL=[];
 for(let h=0;h<N;h++){const H=h*360/N,A=aFor(H);anchors.push({H,XYZ:base.toXYZ({H,R:1,L:1}),B:readout.evaluate(base.toXYZ({H,R:1,L:1})).brightness,C:readout.evaluate(base.toXYZ({H,R:1,L:1})).chromaticContent,embedded:[A([0,0,0]),A(base.field.white),A(base.toXYZ({H,R:1,L:1}))]});rowsL.push(sg.map(s=>s===0?xg.slice():arc(xg.map(l=>A(sample(H,s,l))))));}
 const level={hues:N,secondary:sg,parameter:xg,rows:rowsL},la=new MonotoneAtlas(level),rowsR=[];
 for(let h=0;h<N;h++){const H=h*360/N,A=aFor(H);rowsR.push(sg.map(L=>L===0?xg.slice():arc(xg.map(s=>A(sample(H,s,la.inverse(H,s,L)))))));}
 const rec={id:`OPAL-anchor-control-${gamut}`,gamut,variant:'anchor-control',version:'0.7-control',level,reach:{hues:N,secondary:sg,parameter:xg,rows:rowsR},method:'Before integration, map the actual gamut/hue B,W,V readouts to the equilateral auxiliary triangle. z=B/Bw+(.5-Bv/Bw)*C/Cv; x=sqrt(3)/2*C/Cv. Then same nested path normalization as OPAL 0.6. Hue field and neutral curve unchanged.',anchors};
 fs.writeFileSync(root+`/results/anchor-${gamut}.json`,JSON.stringify(rec,(k,v)=>typeof v==='number'?Number(v.toPrecision(12)):v)+'\n');console.log(gamut,'built');
}

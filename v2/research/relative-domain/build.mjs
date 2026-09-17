/** Reparameterize the full-domain source paths on the declared relative-Y solid.
 * No observer data or COMBVD optimization occurs in this builder.
 */
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {createASmooth} from '../../a-smooth/index.mjs';
import {MonotoneAtlas} from '../../lib/research.mjs';
import {levelToNonblack} from '../../lib/basr.mjs';
import {RelativeFullBase} from './base.mjs';
const root=new URL('./',import.meta.url);fs.mkdirSync(new URL('results/',root),{recursive:true});
const old=await createASmooth({gamut:'full',variant:'parent'}),base=new RelativeFullBase(old.base);
const ro=Object.assign(Object.create(Object.getPrototypeOf(old.source.readout)),old.source.readout,{field:base.field});
const N=72,NY=33,NX=65,grid=n=>Array.from({length:n},(_,i)=>i/(n-1)),sg=grid(NY),xg=grid(NX);
let minSlope=Infinity,checks=0;
for(const Y of [.0001,.003,.03,.1,.3,.6,1])for(const rho of [0,.01,.1,.3,.6,.85,1]){
 let previous=base.hueAt(0,rho,Y);
 for(let i=1;i<=1440;i++){const next=base.hueAt(i/4,rho,Y),slope=(next-previous)*4;minSlope=Math.min(minSlope,slope);assert(slope>0,'Composite constant-Y hue shell folds');previous=next;checks++;}
}
console.log('Constant-Y hue order',checks,'minimum slope',minSlope);
const audit={base:'4919b977049c58a15703f8f86442dd11436d2aad',solid:'polygonized physical chromaticity cone intersect 0<=Y<=1',hueContinuation:base.hueContinuation,hueShellChecks:checks,minHueSlope:minSlope,fit:'none; inherited coefficients with regenerated source path maps',referenceWhiteNits:300,nitsAffectRelativeGeometry:false};
fs.writeFileSync(new URL('results/build-audit.json',root),JSON.stringify(audit,null,2)+'\n');
function arc(points){const row=[0];for(let i=1;i<points.length;i++)row.push(row.at(-1)+Math.hypot(...points[i].map((v,k)=>v-points[i-1][k])));const total=row.at(-1);if(total<1e-15)return xg.slice();return row.map((v,i)=>i===0?0:i===NX-1?1:.999*v/total+.001*i/(NX-1));}
const sample=(H,s,l)=>{const Y=levelToNonblack(l);return base.toXYZ({H,R:s*Y,L:Y});};
function anchorMap(H){const v=ro.evaluate(base.toXYZ({H,R:1,L:1})),w=ro.evaluate(base.field.white);return xyz=>{const a=ro.evaluate(xyz),c=a.chromaticContent/v.chromaticContent;return[a.brightness/w.brightness+(.5-v.brightness/w.brightness)*c,Math.sqrt(3)/2*c];};}
const anchors=[],rowsL=[];
for(let h=0;h<N;h++){
 const H=h*360/N,A=anchorMap(H),XYZ=base.toXYZ({H,R:1,L:1}),r=ro.evaluate(XYZ);
 anchors.push({H,XYZ,B:r.brightness,C:r.chromaticContent});
 rowsL.push(sg.map(s=>s===0?xg.slice():arc(xg.map(l=>A(sample(H,s,l))))));
 if(h%12===0)console.log('Level atlas',h,'/',N);
}
const level={hues:N,secondary:sg,parameter:xg,rows:rowsL},la=new MonotoneAtlas(level),rowsR=[];
for(let h=0;h<N;h++){
 const H=h*360/N,A=anchorMap(H);rowsR.push(sg.map(L=>L===0?xg.slice():arc(xg.map(s=>A(sample(H,s,la.inverse(H,s,L)))))));
 if(h%12===0)console.log('Reach atlas',h,'/',N);
}
const record={id:'HRL-relative-Y-full-source',gamut:'full',variant:'relative-Y',version:'0.9-source',level,reach:{hues:N,secondary:sg,parameter:xg,rows:rowsR},anchors,method:'Same auxiliary brightness/chromatic-content path integration as A, on physical chromaticities with relative Y in [0,1]. Original coupling coefficients are not refitted.'};
for(const family of [record.level,record.reach])for(const block of family.rows)for(const row of block)for(let i=1;i<row.length;i++)assert(row[i]>row[i-1]);
const text=JSON.stringify(record,(k,v)=>typeof v==='number'?Number(v.toPrecision(14)):v)+'\n';
fs.writeFileSync(new URL('results/source-full.json',root),text);
audit.atlasSha256=crypto.createHash('sha256').update(text).digest('hex');
fs.writeFileSync(new URL('results/build-audit.json',root),JSON.stringify(audit,null,2)+'\n');console.log('Atlas generated',audit.atlasSha256);

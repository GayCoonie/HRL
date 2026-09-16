/** Reproducible path-normalization builder, Node only. No XYZ raster interpolation. */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {HueField} from '../../../lib/hue-field.mjs';
import {SRGBTriangles} from '../../../lib/srgb-triangles.mjs';
import {expandReleaseAngles} from '../../../lib/index.mjs';
import {EqualSpanFull,AppearanceReadout,MonotoneAtlas,ResearchSRGBTriangles} from '../../../lib/research.mjs';
import {levelToNonblack} from '../../../lib/basr.mjs';
const v2=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=n=>JSON.parse(fs.readFileSync(path.join(v2,'data',n),'utf8'));
const angles=expandReleaseAngles(read('release1-angles.json')),ro=read('appearance-readouts.json');
const N=72,Ny=33,Nx=65;const grid=n=>Array.from({length:n},(_,i)=>i/(n-1)),sg=grid(Ny),xg=grid(Nx);
function arc(points){const a=[0];for(let i=1;i<points.length;i++){const d=Math.hypot(...points[i].map((x,j)=>x-points[i-1][j]));a.push(a.at(-1)+d);}const total=a.at(-1);if(!(total>1e-15))return xg.slice();return a.map((x,i)=>i===a.length-1?1:i===0?0:.999*x/total+.001*i/(a.length-1));}
function appearance(readout,xyz){const r=readout.evaluate(xyz);return [r.brightness,r.chromaticContent];}
for(const variant of ['equal-span','opal'])for(const gamut of ['srgb','full']){
 const t0=performance.now();const f=new HueField(read(variant==='opal'?'hue-field-0.6.json':'hue-field.json'));
 const base=gamut==='srgb'?new ResearchSRGBTriangles(f,angles):new EqualSpanFull(f,angles);base.gamut=gamut;
 const A=new AppearanceReadout(f,ro.brightness,ro.saturation);const sample=(H,s,l)=>base.toXYZ({H,R:s*levelToNonblack(l),L:levelToNonblack(l)});
 let level=null,rows=[];
 if(variant==='opal'){
  for(let h=0;h<N;h++){
   const H=h*360/N;let hr=[];
   for(const s of sg){if(s===0){hr.push(xg.slice());continue;}hr.push(arc(xg.map(l=>appearance(A,sample(H,s,l)))));}
   rows.push(hr);
  }
  level={hues:N,secondary:sg,parameter:xg,rows};
 }
 const la=level?new MonotoneAtlas(level):null;rows=[];
 for(let h=0;h<N;h++){
  const H=h*360/N;let hr=[];
  for(const L of sg){
   if(L===0){hr.push(xg.slice());continue;}
   const pts=xg.map(s=>{
    const l=la?la.inverse(H,s,L):L,xyz=sample(H,s,l);
    if(variant==='opal')return appearance(A,xyz);
    const sum=xyz.reduce((a,b)=>a+b,0);return sum>0?[xyz[0]/sum,xyz[1]/sum]:[f.white[0]/f.white.reduce((a,b)=>a+b),f.white[1]/f.white.reduce((a,b)=>a+b)];
   });
   hr.push(arc(pts));
  }
  rows.push(hr);
 }
 const record={id:`HRL-${variant}-${gamut}`,variant,gamut,version:variant==='opal'?'0.6':'0.5',level,reach:{hues:N,secondary:sg,parameter:xg,rows},method:variant==='opal'?'Nested endpoint-normalized arc lengths in (brightness, brightness*saturation/.25) readouts; then exact hue-sheet decoding.':'Endpoint-normalized CIE 1931 xy arc at fixed BASR nonblack amount; geometric baseline, not claimed perceptually uniform.',regularization:'0.1% identity mixed with normalized cumulative path length ensures strictly monotone maps.','units_note':'Readout .25 chromatic scale and Euclidean combination are declared design choices, not fitted human DeltaE.','reference_surround_contrast':0,'grid':{hues:N,secondary:Ny,parameter:Nx},'serialization_precision_significant_digits':12};
 // Runtime serialization precision is part of the definition, not a discarded preview.
 const output=JSON.stringify(record,(k,v)=>typeof v==='number'?Number(v.toPrecision(12)):v);
 fs.writeFileSync(path.join(v2,'data',`${variant}-${gamut}.json`),output+'\n');
 console.log(variant,gamut,(performance.now()-t0)/1000,output.length);
}

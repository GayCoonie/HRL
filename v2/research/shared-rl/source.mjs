/** Gamut geometry and deterministic own-anchor normalization, not fitted heads. */
import {createRelativeHRL,RelativeModel} from '../relative-domain/index.mjs';
import {ResearchSRGBTriangles,PathModel,MonotoneAtlas} from '../../lib/research.mjs';
import {edgeRGB,mul3} from '../../lib/srgb-triangles.mjs';
import {levelToNonblack} from '../../lib/basr.mjs';
import {C1Atlas} from '../rl-c1/atlas.mjs';
import {D65,adaptWhite} from '../relative-domain/index.mjs';
import {SharedModel} from './core.mjs';
const wrap=h=>((h%360)+360)%360,dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const ADOBE_RGB1998={id:'a98-rgb',matrix:[[.5766690429101304,.1855582379065463,.1882286462349947],[.29734497525053605,.6273635662554661,.07529145849399788],[.02703136138641234,.07068885253582723,.9913375368376387]]};
export const DISPLAY_P3={id:'display-p3',matrix:[[.4865709486482162,.26566769316909306,.1982172852343625],[.2289745640697488,.6917385218365064,.079286914093745],[0,.04511338185890264,1.043944368900976]],white:D65};
export const REC2020={id:'rec2020',matrix:[[.6369580483012914,.14461690358620832,.1688809751641721],[.2627002120112671,.6779980715188708,.05930171646986196],[0,.028072693049087428,1.060985057710791]],white:D65};
function inv([[a,b,c],[d,e,f],[g,h,i]]){const z=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);if(Math.abs(z)<1e-12)throw RangeError('Singular gamut matrix');return[[e*i-f*h,c*h-b*i,b*f-c*e],[f*g-d*i,a*i-c*g,c*d-a*f],[d*h-e*g,b*g-a*h,a*e-b*d]].map(r=>r.map(v=>v/z));}
export class RGBBoundary extends ResearchSRGBTriangles {
 constructor(template,descriptor){
  super(template.field);this.ring=template.ring;this.gamut=descriptor.id;
  let M=descriptor.matrix;
  if(!Array.isArray(M)||M.length!==3||M.some(r=>!Array.isArray(r)||r.length!==3||r.some(v=>!Number.isFinite(v))))throw TypeError('Finite 3x3 RGB-to-XYZ matrix required');
  const white=descriptor.white||M.map(r=>r.reduce((a,b)=>a+b,0));
  const sum=M.map(r=>r.reduce((a,b)=>a+b,0));
  if(Math.max(...sum.map((v,i)=>Math.abs(v-white[i]/white[1])))>2e-6)throw RangeError('Matrix must be relative to its declared Y=1 white');
  const columns=[0,1,2].map(i=>adaptWhite(M.map(r=>r[i]),white,D65));
  M=[0,1,2].map(i=>columns.map(c=>c[i]));this.M=M;this.MI=inv(M);
  const f=this.field;
  for(const primary of columns){if(f.minPlane(primary)<-2e-10)throw RangeError('Gamut primary lies outside the declared polygonized physical cone; explicit boundary revision required');}
  const [uw,vw]=f.whiteUV,planes=f.uvPlanes.map(([nx,ny,b])=>{const v=-(nx*uw+ny*vw+b);return[nx/v,ny/v];});
  this.segments=[];
  for(let s=0;s<6;s++){
   const e0=mul3(M,edgeRGB(s)),e1=mul3(M,edgeRGB(s+1)),de=e1.map((v,j)=>v-e0[j]);
   const d=e0[0]+15*e0[1]+3*e0[2],dd=de[0]+15*de[1]+3*de[2],n=[4*e0[0]-uw*d,9*e0[1]-vw*d],dn=[4*de[0]-uw*dd,9*de[1]-vw*dd];
   this.segments.push({d,dd,n,dn,gauge:f.normals.map(v=>[dot(v,e0),dot(v,de)]),radial:planes.map(v=>[dot(v,n),dot(v,dn)])});
  }
  this.theta0=wrap(Math.atan2(this.segments[0].n[1],this.segments[0].n[0])*180/Math.PI);
 }
 chart(t,R,L){const c=super.chart(t,R,L);if(c.mag>1){c.mag=1;c.dm=0;}return c;}
 sampleLabel(label,R,L){return R===0?this.field.white.map(x=>x*L):mul3(this.M,this.linearLabel(label,R,L));}
 fromXYZ(x,h=0){if(!x||x.length!==3||!x.every(Number.isFinite))throw TypeError('Finite XYZ triplet required');let rgb=mul3(this.MI,x);if(rgb.some(v=>v< -2e-10||v>1+2e-10))throw RangeError('Outside '+this.gamut);return this.fromLinear(rgb.map(v=>Math.max(0,Math.min(1,v))),h);}
}
export async function buildSource(base,readout,{hues=72,secondary=33,parameter=65,onProgress=null}={}){
 const grid=n=>Array.from({length:n},(_,i)=>i/(n-1)),sg=grid(secondary),xg=grid(parameter);
 const arc=points=>{const r=[0];for(let i=1;i<points.length;i++)r.push(r.at(-1)+Math.hypot(...points[i].map((v,j)=>v-points[i-1][j])));const n=r.at(-1);return n<1e-15?xg.slice():r.map((v,i)=>i===0?0:i===parameter-1?1:.999*v/n+.001*i/(parameter-1));};
 const sample=(H,s,l)=>{const a=levelToNonblack(l);return base.toXYZ({H,R:s*a,L:a});};
 const anchor=H=>{const v=readout.evaluate(base.toXYZ({H,R:1,L:1})),w=readout.evaluate(base.field.white);return xyz=>{const r=readout.evaluate(xyz),c=r.chromaticContent/v.chromaticContent;return[r.brightness/w.brightness+(.5-v.brightness/w.brightness)*c,Math.sqrt(3)/2*c];};};
 const rowsL=[];for(let h=0;h<hues;h++){const H=360*h/hues,A=anchor(H);rowsL.push(sg.map(s=>s===0?xg.slice():arc(xg.map(l=>A(sample(H,s,l))))));if(onProgress)onProgress('level',h,hues);if(h%6===0)await new Promise(r=>setTimeout(r,0));}
 const level={hues,secondary:sg,parameter:xg,rows:rowsL},la=new MonotoneAtlas(level),rowsR=[];
 for(let h=0;h<hues;h++){const H=360*h/hues,A=anchor(H);rowsR.push(sg.map(L=>L===0?xg.slice():arc(xg.map(s=>A(sample(H,s,la.inverse(H,s,L)))))));if(onProgress)onProgress('reach',h,hues);if(h%6===0)await new Promise(r=>setTimeout(r,0));}
 return{gamut:base.gamut,variant:'deterministic-own-anchor',level,reach:{hues,secondary:sg,parameter:xg,rows:rowsR}};
}
const sourceCache=new Map();
export async function getSource(gamut='srgb',{rebuild=false,onProgress=null}={}){
 const descriptor=typeof gamut==='string'?(gamut==='a98-rgb'?ADOBE_RGB1998:gamut==='display-p3'?DISPLAY_P3:gamut==='rec2020'?REC2020:null):gamut;
 if(!descriptor&&!['srgb','full'].includes(gamut))throw RangeError('Unknown gamut descriptor');
 if(descriptor&&typeof descriptor.id!=='string')throw TypeError('Gamut descriptor needs an id');
 const id=descriptor?descriptor.id:gamut,key=descriptor?JSON.stringify(descriptor):id;
 if(!rebuild&&sourceCache.has(key))return sourceCache.get(key);
 const task=(async()=>{
  const old=await createRelativeHRL({gamut:id==='full'?'full':'srgb',variant:'candidate',overflow:'reject',imaginary:'reject'});let source=old.model.source;
  if(descriptor||rebuild){
   let template=source.base;
   if(descriptor){const wide=await createRelativeHRL({gamut:'full',variant:'candidate'});template=Object.assign(Object.create(Object.getPrototypeOf(template)),template,{field:wide.model.field});}
   const base=descriptor?new RGBBoundary(template,descriptor):source.base;
   const readout=Object.assign(Object.create(Object.getPrototypeOf(source.readout)),source.readout,{field:base.field});
   const record=await buildSource(base,readout,{onProgress});source=new PathModel(base,record,readout);source.level=new C1Atlas(record.level);source.reach=new C1Atlas(record.reach);}
  return source;
 })();if(!rebuild)sourceCache.set(key,task);return task;
}
async function readRecord(name){if(!['balanced','metric'].includes(name))throw RangeError('Unknown shared checkpoint');const u=new URL(`results/${name}.json`,import.meta.url);if(u.protocol==='file:'){const{readFile}=await import('node:fs/promises');return JSON.parse(await readFile(u,'utf8'));}const r=await fetch(u);if(!r.ok)throw Error('Checkpoint unavailable '+r.status);return r.json();}
export async function createSharedHRL({gamut='srgb',checkpoint='balanced',referenceWhiteNits=300,overflow='clip',imaginary='clip',record=null,onProgress=null}={}){
 const source=await getSource(gamut,{onProgress}),definition=record||await readRecord(checkpoint),model=new SharedModel(source,definition),out=new RelativeModel(model,{referenceWhiteNits,overflow,imaginary});
 const originalImport=out.importXYZ.bind(out);out.importXYZ=(xyz,options={})=>{const r=originalImport(xyz,options);r.hueContinuation=out.cone.completion(r.mappedXYZ)>model.field.aMax;return r;};
 out.version='0.10-shared-RL';out.name=model.name;out.definition=definition;
 out.toLinearRGB=q=>model.toLinear(q);out.fromLinearRGB=(rgb,h=0)=>model.fromLinear(rgb,h);
 out.gamutID=typeof gamut==='string'?gamut:gamut.id;
 return out;
}

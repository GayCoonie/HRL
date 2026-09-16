import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
import {createHRLResearch,SpectralCarrier,AppearanceReadout} from '../../../lib/research.mjs';
import{createHRLv2}from'../../../lib/index.mjs';
import{levelToNonblack}from'../../../lib/basr.mjs';
let state=150926;const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/2**32;};
const assert=(x,s)=>{if(!x)throw Error(s);};const gap=(x,y)=>Math.max(...x.map((z,i)=>Math.abs(z-y[i])));
const results={id:'HRL-ESP-0.5-OPAL-0.6',profiles:{},generated_at:new Date().toISOString(),limitations:['Computational validation is not human hue or uniformity accuracy.','Dense tests are not an exhaustive RGB cube census.','Both fits use the declared 5 nm boundary, not an exact continuous spectral boundary.']};
for(const variant of ['equal-span','opal'])for(const gamut of ['srgb','full']){
 const m=await createHRLResearch({gamut,variant}),out={};const N=gamut==='srgb'?20000:10000;let max=0,mismatches=0,outside=0,hue=0,coord=0;
 for(let i=0;i<N;i++){
  const v=Array.from({length:3},()=>Math.floor(rand()*65536)/65535);
  let q=gamut==='srgb'?m.fromRGB(v):m.fromPseudoRGB(v);let back=gamut==='srgb'?m.toRGB(q):m.toPseudoRGB(q);max=Math.max(max,gap(v,back));if(back.some((x,j)=>Math.round(x*65535)!==Math.round(v[j]*65535)))mismatches++;
  if(back.some(x=>x<-1e-8||x>1+1e-8))outside++;
 }
 assert(!mismatches&&!outside,'Roundtrip failure '+variant+gamut);out.digital16={samples:N,max_channel_error:max,integer_mismatches:mismatches,out_of_gamut:outside};
 for(let i=0;i<5000;i++){
  let L=.001+.999*rand(),q={H:360*rand(),R:L*(.001+.999*rand()),L};let x=m.toXYZ(q),b=m.fromXYZ(x);coord=Math.max(coord,gap(m.embed(q),m.embed(b)));let phi=m.field.label(x);if(phi!==null)hue=Math.max(hue,Math.abs(((phi-m.labelForHue(q.H)+540)%360)-180));
 }
 assert(coord<1e-7,'Coordinate inverse');out.continuous={samples:5000,max_native_error:coord,max_hue_label_degrees:hue};
 let axis=0,vivid=0;for(let i=0;i<=360;i++){
  const H=i,L=i/360;axis=Math.max(axis,gap(m.toXYZ({H,R:0,L}),m.field.white.map(x=>x*levelToNonblack(L))));vivid=Math.max(vivid,gap(m.vivid(H),m.base.toXYZ({H,R:1,L:1})));
 }assert(axis<1e-12&&vivid<1e-12,'Endpoints');out.fixed_points={neutral_axis_max_error:axis,vivid_max_error:vivid};
 // A different intermediate layout must not change the fixed native mapping.
 const original=m.carrier;m.carrier=new SpectralCarrier(m.field,{rotation:27});let change=0;for(let i=0;i<1000;i++){let L=rand(),q={H:360*rand(),R:L*rand(),L};const x=m.toXYZ(q);m.carrier=original;const y=m.toXYZ(q);m.carrier=new SpectralCarrier(m.field,{rotation:27});change=Math.max(change,gap(x,y));}m.carrier=original;assert(change===0,'Carrier dependence');out.carrier_independence={samples:1000,max_XYZ_difference:change};
 let slopes={minimum:Infinity,maximum:0};for(const table of [m.record.level,m.record.reach].filter(Boolean))for(const h of table.rows)for(const row of h)for(let i=1;i<row.length;i++){let s=(row[i]-row[i-1])/(table.parameter[i]-table.parameter[i-1]);slopes.minimum=Math.min(slopes.minimum,s);slopes.maximum=Math.max(slopes.maximum,s);assert(s>0,'Atlas fold');}out.atlas_slopes=slopes;
 out.pseudo_landmarks=m.carrier.landmarks;out.pseudo_primary_xyz=[[1,0,0],[0,1,0],[0,0,1]].map(q=>m.carrier.toXYZ(q));
 out.blue_purple_probes=[270.4413,274.8,290,305].map(H=>({H,blackward:[1,.95,.8,.5].map(t=>({t,xyz:m.toXYZ({H,R:t,L:t}),...(gamut==='srgb'?{rgb8:m.toRGB({H,R:t,L:t}).map(x=>Math.round(x*255))}:{})})),whiteward:[1,.8,.5,0].map(t=>({t,xyz:m.toXYZ({H,R:t,L:1}),...(gamut==='srgb'?{rgb8:m.toRGB({H,R:t,L:1}).map(x=>Math.round(x*255))}:{})}))}));
 results.profiles[variant+'-'+gamut]=out;console.log(variant,gamut,out.digital16,out.continuous);
}
// Densely check new hue ordering, independent of the sparse training shell constraints.
const m=await createHRLResearch({gamut:'srgb',variant:'opal'});let minimum=Infinity,reversals=0,count=0;
for(const a of [.001,.005,.02,.07,.2,.55,1])for(const u of [.03,.15,.33,.55,.78,1]){let prev=m.base.shell(0,a*u,a);for(let i=1;i<=2048;i++){let v=m.base.shell(i*6/2048,a*u,a);minimum=Math.min(minimum,v-prev);if(v<=prev)reversals++;count++;prev=v;}}
assert(!reversals,'New field shell reversal');results.shell_order={positions:count,minimum_label_increment_degrees:minimum,reversals};
const v2=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');fs.writeFileSync(path.join(v2,'research/equal-span/results/implementation-verification.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results.shell_order));

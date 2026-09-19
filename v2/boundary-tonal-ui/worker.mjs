import {createSpectralTonalHRL} from '../research/boundary-tonal/index.mjs';
import {createMappedHRL} from '../research/mapped-012/import.mjs';
import {XYZ_TO_SRGB,SRGB_TO_XYZ,mul3,encodeSRGB,decodeSRGB} from '../lib/srgb-triangles.mjs';
const ids=['parent','boundary','balanced','metric'],models=new Map();
function load(gamut,id){const key=gamut+':'+id;if(!models.has(key))models.set(key,id==='parent'?createMappedHRL({gamut,checkpoint:'balanced'}):createSpectralTonalHRL({gamut,checkpoint:id}));return models.get(key);}
function display(x){const rgb=mul3(XYZ_TO_SRGB,x);return{clipped:rgb.some(v=>v< -2e-9||v>1+2e-9),rgb:rgb.map(v=>Math.round(255*encodeSRGB(Math.max(0,Math.min(1,v)))))};}
function image(m,H,mask){const w=241,h=279,data=new Uint8ClampedArray(w*h*4);let total=0,clipped=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const R=x/(w-1),L=1-y/(h-1)+R/2;if(R>L||L>1)continue;const c=display(m.toXYZ({H,R,L}));total++;if(c.clipped)clipped++;const k=4*(y*w+x);let rgb=c.rgb;if(mask&&c.clipped&&((x+y)%14<3))rgb=rgb.map((v,i)=>Math.round(.35*v+.65*[255,150,218][i]));data.set([...rgb,255],k);}
 return{w,h,pixels:data,clipped,total};}
function strip(m,H,f){const w=257,h=20,data=new Uint8ClampedArray(w*h*4);let clipped=0;for(let i=0;i<w;i++){const t=i/(w-1),q=f==='black'?{H,R:t,L:t}:f==='near'?{H,R:.96*t,L:t}:f==='white'?{H,R:.65*(1-t),L:.65+.35*t}:f==='reach'?{H,R:.65*t,L:.65}:{H,R:.15,L:.15+.85*t};const c=display(m.toXYZ(q));if(c.clipped)clipped++;for(let y=0;y<h;y++)data.set([...c.rgb,255],4*(y*w+i));}return{w,h,pixels:data,clipped};}
let pending=null,busy=false;
async function loop(){if(busy)return;busy=true;while(pending){const job=pending;pending=null;try{
 const selected=Array.isArray(job.ids)?job.ids.filter(id=>ids.includes(id)):ids;
 for(const id of selected){const m=await load(job.gamut,id);if(pending)break;const tri=image(m,job.H,job.mask),bars={};for(const f of ['black','near','white','reach','level'])bars[f]=strip(m,job.H,f);postMessage({type:'panel',request:job.request,id,H:job.H,tri,bars},[tri.pixels.buffer,...Object.values(bars).map(x=>x.pixels.buffer)]);await new Promise(resolve=>setTimeout(resolve,0));}
 if(!pending)postMessage({type:'rendered',request:job.request,H:job.H,gamut:job.gamut});
 }catch(e){postMessage({type:'error',request:job.request,message:e.message||'Unable to render this hue sheet.'});}}busy=false;}
// Sampling is independent of rendering; retain only the newest queued sample.
const commands=[];onmessage=e=>{if(e.data.type==='render'){pending=e.data;loop();}else{if(e.data.type==='sample'){for(let i=commands.length-1;i>=0;i--)if(commands[i].type==='sample')commands.splice(i,1);}commands.push(e.data);runCommands();}};
let commandBusy=false;async function runCommands(){if(commandBusy)return;commandBusy=true;while(commands.length){const job=commands.shift();try{const m=await load(job.gamut,job.id);if(job.type==='sample'){const xyz=m.toXYZ(job.q);postMessage({type:'sampled',request:job.request,id:job.id,q:job.q,xyz,...display(xyz),gamut:job.gamut});}else if(job.type==='import'){const text=job.hex.trim().replace(/^#/,'');if(!/^[a-f\d]{6}$/i.test(text))throw Error('Use a six-digit sRGB hex value, such as #8055CC.');const rgb=[0,2,4].map(i=>parseInt(text.slice(i,i+2),16)/255),xyz=mul3(SRGB_TO_XYZ,rgb.map(decodeSRGB)),q=m.fromXYZ(xyz);postMessage({type:'imported',request:job.request,id:job.id,q,gamut:job.gamut});}}catch(e){postMessage({type:'error',request:job.request,message:e.message||'Unable to calculate this color.'});}}commandBusy=false;}

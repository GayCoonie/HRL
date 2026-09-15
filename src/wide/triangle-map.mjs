import {makeNeutralZcam} from './zcam-neutral-reference.mjs';
const MATRIX={
 srgb:[[.4123907992659595,.357584339383878,.1804807884018343],[.2126390058715104,.715168678767756,.0721923153607337],[.0193308187155918,.119194779794626,.9505321522496607]],
 rec2020:[[.6369580483012914,.1446169035862083,.1688809751641721],[.2627002120112671,.6779980715188708,.059301716469862],[0,.0280726930490874,1.060985057710791]]
};
const ALPHA=1.09929682680944,BETA=.018053968510807;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function decodeChannel(x,gamut='srgb'){return gamut==='srgb'?(x<=.04045?x/12.92:((x+.055)/1.055)**2.4):(x<4.5*BETA?x/4.5:((x+ALPHA-1)/ALPHA)**(1/.45));}
export function encodeChannel(x,gamut='srgb'){return gamut==='srgb'?(x<=.0031308?12.92*x:1.055*Math.max(0,x)**(1/2.4)-.055):(x<BETA?4.5*x:ALPHA*Math.max(0,x)**.45-(ALPHA-1));}
function xyz(linear,gamut){return MATRIX[gamut].map(row=>300*row.reduce((sum,x,i)=>sum+x*linear[i],0));}
export function nativeEdge(rgb,gamut='srgb'){
 if(!MATRIX[gamut]||rgb.length!==3||rgb.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Expected three encoded RGB components in [0,1].');
 const linear=rgb.map(x=>decodeChannel(x,gamut)),lo=Math.min(...linear),hi=Math.max(...linear),p=hi-lo;
 if(p<1e-15)return {edge:null,linearEdge:null,neutral:true,mixture:{p:0,w:lo,b:1-hi},linear};
 const linearEdge=linear.map(x=>(x-lo)/p);
 return {edge:linearEdge.map(x=>encodeChannel(x,gamut)),linearEdge,neutral:false,mixture:{p,w:lo,b:1-hi},linear};
}
function tableAt(list,x,key='C',value='K'){
 if(x<=list[0][key])return list[0][value];
 if(x>=list.at(-1)[key])return list.at(-1)[value];
 let lo=0,hi=list.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(list[mid][key]<=x)lo=mid;else hi=mid;}
 const f=(x-list[lo][key])/(list[hi][key]-list[lo][key]);return list[lo][value]*(1-f)+list[hi][value]*f;
}
function weight(a,b,c,r,l){const x=b.r-a.r,y=b.l-a.l,u=c.r-a.r,v=c.l-a.l,det=x*v-y*u;if(Math.abs(det)<1e-15)return null;const wr=((r-a.r)*v-(l-a.l)*u)/det,wl=(x*(l-a.l)-y*(r-a.r))/det;return [1-wr-wl,wr,wl];}
export function makeTriangleMapper({gamut='srgb',edge,samples=129,grid=33,refine=4}={}){
 if(!MATRIX[gamut])throw Error('Unknown gamut.');
 const native=nativeEdge(edge,gamut);if(native.neutral)throw Error('A chromatic vivid edge anchor is required.');
 if(Math.abs(Math.min(...edge))>1e-9||Math.abs(Math.max(...edge)-1)>1e-9)throw Error('Anchor must be on the vivid RGB edge (min 0, max 1).');
 samples=Math.max(33,Math.floor(samples));grid=Math.max(9,Math.floor(grid));
 const e=native.linearEdge,zcam=makeNeutralZcam(),measure=linear=>zcam(xyz(linear,gamut));
 const vivid=measure(e),Cv=vivid.C,lower=[],upper=[],neutral=[];let boundaryFallbacks=0;
 for(let i=0;i<samples;i++){
  const t=i/(samples-1),p=t*t*t,q=(1-Math.cos(Math.PI*t))/2;
  lower.push({...measure(e.map(x=>x*p)),p});
  upper.push({...measure(e.map(x=>1-q*(1-x))),p:q});
  neutral.push({...measure([p,p,p]),p});
 }
 if(lower.some((x,i)=>i&&x.C<=lower[i-1].C)||upper.some((x,i)=>i&&x.C<=upper[i-1].C))throw Error('Boundary chroma is not strictly monotone for this anchor.');
 function exactBoundary(c){
  const C=c*Cv;let values=[];
  for(const whiteEdge of [false,true]){let a=0,b=1,raw;
   for(let i=0;i<32;i++){const p=(a+b)/2;raw=measure(e.map(x=>whiteEdge?1-p*(1-x):p*x));if(raw.C<C)a=p;else b=p;}
   values.push(measure(e.map(x=>whiteEdge?1-((a+b)/2)*(1-x):((a+b)/2)*x)).K);
  }
  return {Kblack:values[0],Kwhite:values[1],C};
 }
 function calibrate(raw,{p,w}={}){
  let c=raw.C/Cv;if(c<1e-12)c=0;if(Math.abs(c-1)<1e-10)c=1;
  if(c===1)return {R:26,L:26,b:0,c:1,w:0,raw,inTriangle:true};
  let kb=tableAt(lower,raw.C),kt=tableAt(upper,raw.C),span=kb-kt;
  let t=span>1e-12?(kb-raw.K)/span:1;
  if(c>0&&c<1&&(t<0||t>1)&&w>1e-12&&1-p-w>1e-12){const exact=exactBoundary(c);kb=exact.Kblack;kt=exact.Kwhite;t=(kb-raw.K)/(kb-kt);boundaryFallbacks++;}
  if(w!==undefined&&w<1e-12)t=0;else if(p!==undefined&&w!==undefined&&1-p-w<1e-12)t=1;
  // Neutral blackness is exactly 1-J/100 after gamut-reference normalization.
  if(c===0)t=raw.J/100;
  if(t<0&&t>-1e-8)t=0;if(t>1&&t<1+1e-8)t=1;
  const b=(1-c)*(1-t),ww=(1-c)*t,l=c+ww;
  return {R:26*c,L:26*l,b,c,w:ww,raw,inTriangle:c>=0&&c<=1&&t>=0&&t<=1};
 }
 function forward(rgb){
  const point=nativeEdge(rgb,gamut),{p,w}=point.mixture;
  const planeResidual=Math.max(...point.linear.map((x,i)=>Math.abs(x-(p*e[i]+w))));
  return {...calibrate(measure(point.linear),{p,w}),planeResidual};
 }
 const nodes=[],triangles=[],bins=Array.from({length:32*32},()=>[]);let gridBuilt=false;
 function buildInverseGrid(){if(gridBuilt)return;gridBuilt=true;
 for(let j=0;j<grid;j++){
  // Concentrate samples near black without imposing an encoded-RGB R/L definition.
  const v=(j/(grid-1))**2;
  for(let i=0;i<grid;i++){
   const u=(i/(grid-1))**2,p=v,w=(1-v)*u,raw=measure(e.map(x=>p*x+w)),f=calibrate(raw,{p,w});
   nodes.push({r:f.R/26,l:f.L/26,p,w});
  }
 }
 function add(ids){const vs=ids.map(i=>nodes[i]);if(!weight(...vs,vs[0].r,vs[0].l))return;
  const minx=clamp(Math.floor(Math.min(...vs.map(x=>x.r))*32),0,31),maxx=clamp(Math.floor(Math.max(...vs.map(x=>x.r))*32),0,31),miny=clamp(Math.floor(Math.min(...vs.map(x=>x.l))*32),0,31),maxy=clamp(Math.floor(Math.max(...vs.map(x=>x.l))*32),0,31);
  const id=triangles.length;triangles.push(vs);for(let y=miny;y<=maxy;y++)for(let x=minx;x<=maxx;x++)bins[y*32+x].push(id);
 }
 for(let j=0;j<grid-1;j++)for(let i=0;i<grid-1;i++){const n=j*grid+i;add([n,n+1,n+grid]);add([n+1,n+grid+1,n+grid]);}
 }
 function solveSeed(r,l){
  buildInverseGrid();
  const ids=bins[clamp(Math.floor(l*32),0,31)*32+clamp(Math.floor(r*32),0,31)];
  for(const id of ids){const vs=triangles[id],ws=weight(...vs,r,l);if(ws&&Math.min(...ws)>=-1e-9)return [vs.reduce((s,v,i)=>s+ws[i]*v.p,0),vs.reduce((s,v,i)=>s+ws[i]*v.w,0)];}
  // Numerical lookup edge fallback; Newton below still validates the result.
  return [r,l-r];
 }
 function inverse(R,L){
  if(!Number.isFinite(R)||!Number.isFinite(L)||R<0||R>L||L>26)throw Error('Expected 0 ≤ Reach ≤ Level ≤ 26.');
  const c=R/26,l=L/26;if(c===1)return edge.slice();if(l===0)return [0,0,0];if(c===0&&l===1)return [1,1,1];
  const C=c*Cv,kb=tableAt(lower,C),kt=tableAt(upper,C),t=c===1?0:(l-c)/(1-c),K=kb+(kt-kb)*t;
  const J=Math.sqrt(Math.max(0,((100-K)/.8)**2-8*C*C));
  let [p,w]=solveSeed(c,l);
  if(c===0){p=0;w=tableAt(neutral,l*100,'J','p');}
  else if(R===L){p=tableAt(lower,C,'C','p');w=0;}
  else if(L===26){p=tableAt(upper,C,'C','p');w=1-p;}
  for(let iteration=0;iteration<refine;iteration++){
   const current=measure(e.map(x=>p*x+w)),ec=current.C-C,ej=current.J-J;if(Math.max(Math.abs(ec),Math.abs(ej))<1e-8)break;
   const delta=1e-5,pp=measure(e.map(x=>(p+delta)*x+w)),ww=measure(e.map(x=>p*x+w+delta));
   const a=(pp.C-current.C)/delta,b=(ww.C-current.C)/delta,d=(pp.J-current.J)/delta,f=(ww.J-current.J)/delta,det=a*f-b*d;
   if(Math.abs(det)<1e-10)break;
   let dp=(f*ec-b*ej)/det,dw=(-d*ec+a*ej)/det;
   if(c===0){dp=p;dw=ej/f;}else if(R===L){dw=w;dp=ec/a;}else if(L===26){dp=ec/(a-b);dw=-dp;}
   let scale=1;while(scale>1/128&&(p-scale*dp<0||w-scale*dw<0||p+w-scale*(dp+dw)>1))scale/=2;
   p=clamp(p-scale*dp);w=clamp(w-scale*dw,0,1-p);
  }
  return e.map(x=>encodeChannel(clamp(p*x+w),gamut));
 }
 function sampleBoundary(c){const C=c*Cv;return {Kblack:tableAt(lower,C),Kwhite:tableAt(upper,C),C};}
 return {forward,inverse,edge:edge.slice(),gamut,Cv,rawVivid:vivid,lower,upper,sampleBoundary,exactBoundary,stats:{samples,grid,get boundaryFallbacks(){return boundaryFallbacks;},get triangles(){return triangles.length;}},calibrate};
}

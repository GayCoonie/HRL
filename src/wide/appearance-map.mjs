// Analytic hue-sheet fit: exact inverse of HRL's neutral-corrected ZCAM correlates.
// Uses the frozen 300-nit parameters from dist/rl-triangle/zcam-neutral-reference.mjs.
import {makeNeutralZcam} from './zcam-neutral-reference.mjs';
import {retuneMapper} from './reach-level-retune.mjs';
import {decodeChannel,encodeChannel} from './triangle-map.mjs';
const N=2610/16384,P=1.7*2523/32,C1=3424/4096,C2=2413/128,C3=2392/128,D0=3.7035226210190005e-11;
const D65=[.9504559270516716,1,1.0890577507598784];
const MATRIX={srgb:[[.4123907992659595,.357584339383878,.1804807884018343],[.2126390058715104,.715168678767756,.0721923153607337],[.0193308187155918,.119194779794626,.9505321522496607]],rec2020:[[.6369580483012914,.1446169035862083,.1688809751641721],[.2627002120112671,.6779980715188708,.059301716469862],[0,.0280726930490874,1.060985057710791]]};
const LMS=[[.41478972,.579999,.014648],[-.20151,1.120649,.0531008],[-.0166008,.2648,.6684799]];
const mul=(m,v)=>m.map(row=>row.reduce((s,x,i)=>s+x*v[i],0));
function inv(m){const [[a,b,c],[d,e,f],[g,h,i]]=m,det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);return [[e*i-f*h,c*h-b*i,b*f-c*e],[f*g-d*i,a*i-c*g,c*d-a*f],[d*h-e*g,b*g-a*h,a*e-b*d]].map(row=>row.map(x=>x/det));}
const LMSI=inv(LMS),RGBI=Object.fromEntries(Object.entries(MATRIX).map(([k,m])=>[k,inv(m)]));
const pq=x=>{const u=(Math.max(0,x)/10000)**N;return ((C1+C2*u)/(1+C3*u))**P};
const pqi=x=>{if(x<0||!Number.isFinite(x))return NaN;const u=x**(1/P),d=C2-C3*u;return d>0?10000*(Math.max(0,u-C1)/d)**(1/N):NaN};
const opp=p=>[3.524*p[0]-4.066708*p[1]+.542708*p[2],.199076*p[0]+1.096799*p[1]-1.295875*p[2]];
const lms=([x,y,z])=>mul(LMS,[1.15*x-.15*z,.66*y+.34*x,z]);
const white=D65.map(x=>300*x),lw=lms(white),iw=pq(lw[1])-D0,fb=Math.sqrt(.2),fl=.171*60**(1/3)*(1-Math.exp(-48/9*60));
const qp=1.6*.69/fb**.12,qm=.69**2.2*fb**.5*fl**.2,qw=2700*iw**qp*qm,cFactor=10000*fl**.2/(fb**.1*iw**.78*qw);
const measureXYZ=makeNeutralZcam();
export const measure=(rgb,gamut='srgb')=>measureXYZ(mul(MATRIX[gamut],rgb.map(x=>decodeChannel(x,gamut))).map(x=>x*300));
export function inverseLinear({J,C,h},gamut='srgb'){
 if(![J,C,h].every(Number.isFinite)||J<0||C<0)return [NaN,NaN,NaN];
 const pm=iw*(J/100)**(1/qp)+D0,scale=pqi(pm)/lw[1],[na,nb]=opp(lw.map(x=>pq(x*scale)));
 const angle=h*Math.PI/180,ee=1.015+Math.cos((89.038+h)*Math.PI/180),radius=(C/(cFactor*ee**.068))**(1/.74);
 const u=radius*Math.cos(angle)+na+4.066708*pm,v=radius*Math.sin(angle)+nb-1.096799*pm,det=3.524*(-1.295875)-.542708*.199076;
 const pl=(u*(-1.295875)-.542708*v)/det,ps=(3.524*v-.199076*u)/det;
 const [xp,yp,z]=mul(LMSI,[pqi(pl),pqi(pm),pqi(ps)]),x=(xp+.15*z)/1.15,y=(yp-.34*x)/.66;
 return mul(RGBI[gamut],[x/300,y/300,z/300]);
}
export const inverse=(p,gamut='srgb')=>inverseLinear(p,gamut).map(x=>encodeChannel(x,gamut));
export const inGamut=(linear,eps=2e-9)=>linear.every(x=>Number.isFinite(x)&&x>=-eps&&x<=1+eps);
export function makeHueMapper({edge,gamut='srgb',steps=40,samples=129,fit='original'}={}){
 const vivid=measure(edge,gamut),{C:Cv,J:Jv,h}=vivid;
 const stats={samples,steps,boundaryFallbacks:0,hueDefinition:'HRL neutral-corrected ZCAM opponent angle',boundaryModel:'constant corrected appearance hue; min/max RGB gamut crossings'};
 const lower=[],upper=[],exactCache=new Map();let built=false;
 const boundsAtC=C=>{
  const center=inverseLinear({C,J:Jv,h},gamut);
  if(!inGamut(center))throw Error('Jv chroma segment leaves gamut: '+JSON.stringify({gamut,edge,C,Cv,Jv,h,center}));
  if(C===Cv)return {lo:Jv,hi:Jv,C};
  let outside=0,inside=Jv;
  for(let i=0;i<steps;i++){const m=(inside+outside)/2;if(inGamut(inverseLinear({C,J:m,h},gamut),0))inside=m;else outside=m;}
  const lo=inside;outside=100;inside=Jv;
  for(let i=0;i<steps;i++){const m=(inside+outside)/2;if(inGamut(inverseLinear({C,J:m,h},gamut),0))inside=m;else outside=m;}
  return {lo,hi:inside,C};
 };
 const k=(J,C)=>100-.8*Math.hypot(J,Math.sqrt(8)*C);
 function exactBoundary(c){if(exactCache.has(c))return exactCache.get(c);const C=c*Cv;let out;if(c===0)out={C,Kblack:100,Kwhite:20,Jblack:0,Jwhite:100};else{const {lo,hi}=boundsAtC(C);out={C,Kblack:k(lo,C),Kwhite:k(hi,C),Jblack:lo,Jwhite:hi};}exactCache.set(c,out);if(exactCache.size>2048)exactCache.delete(exactCache.keys().next().value);return out;}
 function build(){if(built)return;built=true;for(let i=0;i<samples;i++){const c=(i/(samples-1))**2,b=exactBoundary(c);lower.push({C:b.C,K:b.Kblack});upper.push({C:b.C,K:b.Kwhite});}}
 function interpolate(table,C){if(C<=0)return table[0].K;if(C>=Cv)return table.at(-1).K;let a=0,b=table.length-1;while(b-a>1){const m=(a+b)>>1;if(table[m].C<=C)a=m;else b=m;}const f=(C-table[a].C)/(table[b].C-table[a].C);return table[a].K*(1-f)+table[b].K*f;}
 function sampleBoundary(c){build();const C=c*Cv;return {C,Kblack:interpolate(lower,C),Kwhite:interpolate(upper,C)};}
 function at(R,L){
  if(![R,L].every(Number.isFinite)||R<0||R>L||L>26)throw Error('Invalid triangle');if(R===26)return edge.slice();if(R===0){if(L===0)return [0,0,0];if(L===26)return [1,1,1];const pm=iw*(L/26)**(1/qp)+D0,g=encodeChannel(pqi(pm)/lw[1],gamut);return [g,g,g];}
  const c=R/26,C=c*Cv,t=(L-R)/(26-R),getJ=b=>{const a=b.Jblack,z=b.Jwhite,d2=8*C*C;if(t===0)return a;if(t===1)return z;const s0=Math.sqrt(a*a+d2),s1=Math.sqrt(z*z+d2),cross=(a*a*z*z+d2*(a*a+z*z))/(s0*s1+d2);return Math.sqrt((1-t)**2*a*a+t*t*z*z+2*t*(1-t)*cross);};
  let b=exactBoundary(c),J=getJ(b),lin=inverseLinear({J,C,h},gamut);
  if(!inGamut(lin,1e-13)){stats.boundaryFallbacks++;b=exactBoundary(c);J=getJ(b);lin=inverseLinear({J,C,h},gamut);}
  if(!inGamut(lin,1e-11))throw Error('Curved hue inverse escaped gamut');
  if(R===L)lin[lin.indexOf(Math.min(...lin))]=0;if(L===26)lin[lin.indexOf(Math.max(...lin))]=1;
  const rgb=lin.map(x=>encodeChannel(Math.max(0,Math.min(1,x)),gamut));if(R===L)rgb[rgb.indexOf(Math.min(...rgb))]=0;if(L===26)rgb[rgb.indexOf(Math.max(...rgb))]=1;return rgb;
 }
 function forward(rgb){
  const raw=measure(rgb,gamut);let c=raw.C/Cv;if(Math.abs(c-1)<1e-10)c=1;if(c>1+1e-8)throw Error('Color chroma exceeds this hue anchor');
  if(c<1e-12||Math.min(...rgb)===Math.max(...rgb)){const t=raw.J/100;return {R:0,L:26*t,b:1-t,c:0,w:t,raw,inTriangle:true};}
  if(c===1)return {R:26,L:26,b:0,c:1,w:0,raw,inTriangle:true};
  let b=exactBoundary(c);const tt=bound=>{const a=bound.Jblack,z=bound.Jwhite,d2=8*raw.C*raw.C;return ((raw.J-a)*(raw.J+a)*(Math.sqrt(z*z+d2)+Math.sqrt(a*a+d2)))/((Math.sqrt(raw.J*raw.J+d2)+Math.sqrt(a*a+d2))*(z-a)*(z+a));};let t=tt(b);
  if(Math.min(...rgb)===0)t=0;else if(Math.max(...rgb)===1)t=1;
  else if(t<0||t>1){stats.boundaryFallbacks++;b=exactBoundary(c);t=tt(b);}
  if(t< -1e-7||t>1+1e-7||!Number.isFinite(t))throw Error('Curved hue forward escaped triangle');t=Math.max(0,Math.min(1,t));
  const w=(1-c)*t,black=(1-c)*(1-t);return {R:26*c,L:26*(c+w),b:black,c,w,raw,inTriangle:true};
 }
 return retuneMapper({inverse:at,forward,boundsAtC,rawVivid:vivid,vivid,Cv,sampleBoundary,exactBoundary,lower,upper,stats,edge,gamut},fit);
}

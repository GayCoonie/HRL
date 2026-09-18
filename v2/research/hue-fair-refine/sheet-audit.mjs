/** Direct inverse: equilateral whole-sheet vector regularity, not fitted-grid values. */
import fs from 'node:fs';
import {createHueFairHRL} from './index.mjs';
import {createGenTonalHRL} from '../gen-tonal-fit/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const ids=process.argv.slice(2);if(!ids.length)ids.push('parent','balanced','gentle');
const n=+(process.env.HUES||72),offset=+(process.env.OFFSET||1),hues=Array.from({length:n},(_,i)=>(360*i/n+offset)%360);
const centres=[];for(let j=4;j<31;j+=2)for(let i=2;i<j-1;i+=2)centres.push([i/32,j/32]);for(const L of [.04,.08,.12,.18])for(const u of [.18,.4,.65,.84])centres.push([L*u,L]);
const offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const sum=a=>a.reduce((s,v)=>s+v,0),mean=a=>sum(a)/a.length,quant=(a,p)=>{a=a.slice().sort((x,y)=>x-y);return a[Math.floor(p*(a.length-1))];};
const out={hues:n,hueOffset:offset,stencilsPerHue:centres.length,referenceScale:1/32,method:'Nine-point actual-XYZ-to-GenSpace stencil; vector Hessian and gradient transformed from R,L to x=sqrt(3)R/2,z=L-R/2. No preview clipping or source lookup surrogate. Synthetic regularity, not observer validation.',models:{}};
for(const name of ids){out.models[name]={};for(const gamut of ['srgb','full']){
 const model=name==='parent'?await createGenTonalHRL({gamut,checkpoint:'balanced'}):await createHueFairHRL({gamut,checkpoint:name}),rows=[];
 for(const H of hues){const values=[];for(const[R,L]of centres){const h=Math.min(1/64,R/2,(L-R)/3,(1-L)/2),v=offsets.map(([a,b])=>genRuler(model.toXYZ({H,R:R+a*h,L:L+b*h})));let hessian=0,gradient=0;
 for(let c=0;c<3;c++){const dr=(v[1][c]-v[2][c])/(2*h),dl=(v[3][c]-v[4][c])/(2*h),rr=(v[1][c]+v[2][c]-2*v[0][c])/h**2,ll=(v[3][c]+v[4][c]-2*v[0][c])/h**2,rl=(v[5][c]-v[6][c]-v[7][c]+v[8][c])/(4*h*h),x=(2*dr+dl)/Math.sqrt(3),xx=(4*rr+4*rl+ll)/3,xz=(2*rl+ll)/Math.sqrt(3);gradient+=x*x+dl*dl;hessian+=xx*xx+2*xz*xz+ll*ll;}
 values.push(hessian/Math.max(gradient,1e-8)/1024);}
 rows.push({H,mean:mean(values),rms:Math.sqrt(mean(values.map(v=>v*v))),p95:quant(values,.95),max:Math.max(...values),values});}
 const blue=rows.filter(x=>x.H>=255&&x.H<=295);out.models[name][gamut]={mean:mean(rows.map(x=>x.mean)),rms:Math.sqrt(mean(rows.map(x=>x.mean*x.mean))),p95Hue:quant(rows.map(x=>x.mean),.95),worstHue:Math.max(...rows.map(x=>x.mean)),blueMean:mean(blue.map(x=>x.mean)),rows};
 console.log(name,gamut,JSON.stringify({...out.models[name][gamut],rows:undefined}));fs.writeFileSync(new URL('results/sheet-final.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
}}

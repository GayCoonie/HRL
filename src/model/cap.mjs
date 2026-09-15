import {AlgorithmicModel} from './algorithmic.mjs';
const clamp=x=>Math.max(0,Math.min(1,x)),sm=x=>x**3*(10-15*x+6*x*x),ds=x=>30*x*x*(1-x)**2;
function hue(h){const angle=[20,272.9790146757525,118.68].map(c=>2*Math.PI*(h-c/360)),s=[22,16,18].map(v=>(v*Math.PI/180)**2);return {b:angle.map((a,i)=>Math.exp((Math.cos(a)-1)/s[i])),d:angle.map((a,i)=>-2*Math.PI*Math.sin(a)/s[i])};}
function gate(R,L){const z=L-R/2,x=clamp((z-.125)/.1),y=clamp((.875-z)/.1);return {g:sm(x)*sm(y),d:(ds(x)*sm(y)-sm(x)*ds(y))/.1};}
function basis(h){const t=((h%1)+1)%1*8,i=Math.floor(t),u=t-i;return {indices:[(i+7)%8,i%8,(i+1)%8,(i+2)%8],w:[(1-u)**3,3*u**3-6*u*u+4,-3*u**3+3*u*u+3*u+1,u**3].map(x=>x/6),d:[-3*(1-u)**2,9*u*u-12*u,-9*u*u+6*u+3,3*u*u].map(x=>x/6*8)};}
export class CapModel extends AlgorithmicModel{
 constructor(parent,table,oldResults,record){const a=record.anchorFractionA;super(parent,table,oldResults.B.parameters.map((v,i)=>(1-a)*v+a*oldResults.A.parameters[i]));this.record=record;}
 capmap(q){const [h,r,l]=q,v=Math.max(1-r,1e-15),t=(l-r)/v,{b,d}=hue(h),capT=clamp((r-.25)/.15),g=sm(capT),gr=ds(capT)/.15,coef=[.5,1,.28].map(v=>v*this.record.cap),strength=.035+b.reduce((s,x,i)=>s+x*coef[i],0),dh=b.reduce((s,x,i)=>s+x*d[i]*coef[i],0),power=this.record.power,f=r**power*(1-r),fr=power*r**(power-1)*(1-r)-r**power,shift=-strength*f*g,grad=[-dh*f*g,-strength*(fr*g+f*gr),0];
 const out=[h,r+shift,l+shift*(1-t)],J=[[1,0,0],[0,1,0],[0,0,1]];for(let k=0;k<3;k++){J[1][k]+=grad[k];J[2][k]+=(1-t)*grad[k];}J[2][1]-=shift*(l-1)/v**2;J[2][2]-=shift/v;
 if(r>=1-1e-12)return {q:q.slice(),J:[[1,0,0],[0,1,0],[0,0,1]]};return {q:out,J};}
 residual(q){const [h,r,l]=q,v=Math.max(1-r,1e-15),t=(l-r)/v,{g,d:gz}=gate(r,l),radial=16*r*r*(1-r)**2,drad=32*r*(1-r)*(1-2*r),tonal=4*t*(1-t),dton=4*(1-2*t),a=radial*tonal*g,ar=drad*tonal*g+radial*dton*(l-1)/v**2*g-radial*tonal*gz/2,al=radial*dton/v*g+radial*tonal*gz,{b,d}=hue(h),coeff=[.65,.65,.3],weight=.35+b.reduce((s,x,i)=>s+x*coeff[i],0),dw=b.reduce((s,x,i)=>s+x*d[i]*coeff[i],0),hb=basis(h),p=this.record.parameters,out=[0,0],J=[[0,0,0],[0,0,0]];
 for(let c=0;c<2;c++)for(let k=0;k<4;k++)for(let t=0;t<2;t++){const radial=t===0?1:2*r-1,dr=t===0?0:2,coef=p[c*16+hb.indices[k]*2+t];out[c]+=coef*hb.w[k]*radial*a*weight;J[c][0]+=coef*radial*a*(hb.d[k]*weight+hb.w[k]*dw);J[c][1]+=coef*hb.w[k]*(radial*ar+dr*a)*weight;J[c][2]+=coef*hb.w[k]*radial*al*weight;}
 return {value:out,J};}
 inverse(q,withJac=false){const c=this.capmap(q),b=super.inverse(c.q,true),r=this.residual(q),out=[b.q[0],b.q[1]+r.value[0],b.q[2]+r.value[1]];if(!withJac)return out;const J=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>b.J[i].reduce((s,x,k)=>s+x*c.J[k][j],0)));for(let i=1;i<3;i++)for(let j=0;j<3;j++)J[i][j]+=r.J[i-1][j];return {q:out,J};}
 forward(target){const lower=Math.abs(target[2]-target[1])<1e-13,upper=Math.abs(target[2]-1)<1e-13;if(!lower&&!upper)return super.forward(target);let lo=0,hi=1;for(let i=0;i<48;i++){const r=(lo+hi)/2,q=[target[0],r,upper?1:r];if(this.inverse(q)[1]<target[1])lo=r;else hi=r;}const r=(lo+hi)/2;return [target[0],r,upper?1:r];}

}

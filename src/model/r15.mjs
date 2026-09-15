import {CompleteModel as R14Model} from './r14.mjs';
const mod=x=>((x%360)+360)%360;
function basis(h,n){const t=mod(h)/(360/n),i=Math.floor(t),u=t-i;return {indices:[(i+n-1)%n,i%n,(i+1)%n,(i+2)%n],weights:[(1-u)**3,3*u**3-6*u*u+4,-3*u**3+3*u*u+3*u+1,u**3].map(v=>v/6)};}
function angular(h,coeff,offset){const b=basis(h,12);let v=0;for(let j=0;j<4;j++)v+=b.weights[j]*coeff[offset+b.indices[j]];return v;}
function polynomial(h,r,coeff,offset){const b=basis(h,12),w=[(1-r)**3,3*r*(1-r)**2,3*r*r*(1-r),r**3];let v=0;for(let j=0;j<4;j++)for(let k=0;k<4;k++)v+=b.weights[j]*w[k]*coeff[offset+b.indices[j]*4+k];return v;}
function linearPolynomial(h,r,coeff,offset){const b=basis(h,12),w=[1-r,r];let v=0;for(let j=0;j<4;j++)for(let k=0;k<2;k++)v+=b.weights[j]*w[k]*coeff[offset+b.indices[j]*2+k];return v;}
export class Transport {
 constructor(packet){this.p=packet.parameters;this.span=packet.blueSpan;this.levelPower=packet.levelPower??1;this.flatInterior=packet.kind==='r15-flat-interior-reach';this.interiorReach=packet.kind==='r15-interior-reach'||this.flatInterior;this.residual=packet.kind==='r15-residual-two-sided-level'||this.interiorReach;this.logistic=packet.kind==='r15-logistic-level'||this.residual;this.twoSided=packet.kind==='r15-two-sided-level';if(this.p.length!==(this.interiorReach?168:this.residual?156:132))throw Error('Invalid R15 coefficient count');}
 ring(h){const x=mod(h-273.5+180)-180;if(Math.abs(x)>=30)return mod(h);const z=1-(x/30)**2,edge=(1-(3.5/30)**2)**3,extra=this.span-7;return mod(h+(extra/(7*edge)*x-extra*.1/edge)*z**3);}
 unring(h){h=mod(h);let lo=h-20,hi=h+20;for(let i=0;i<50;i++){const m=(lo+hi)/2,d=mod(this.ring(m)-h+180)-180;if(d<0)lo=m;else hi=m;}return mod((lo+hi)/2);}
 shade(h,r,l){if(r===0||l===1)return 0;const v=(1-l)/(1+l),u=l>0?(l-r)/l:0;return v*angular(h,this.p,0)+v*v*angular(h,this.p,12)+v*u*angular(h,this.p,24);}
 forward(H,R,L){
  if(R===0)return [H,R,L];const h=H+this.shade(H,R,L);if(R===1)return [this.ring(h),1,1];
  const r=R+R*(1-R)*polynomial(h,R,this.p,36),t=(L-R)/(1-R);let t1;
  if(this.twoSided){const g=R*R*(3-2*R),b0=linearPolynomial(h,R,this.p,84),b1=linearPolynomial(h,R,this.p,108);t1=t+g*(b0*t*(1-t)**2+b1*t*t*(1-t));}
  else {const k=(1-(1-R)**this.levelPower)*polynomial(h,R,this.p,84),ek=this.logistic?Math.exp(k):0;t1=this.logistic?t*ek/(1-t+t*ek):t+k*t*(1-t);if(this.residual){const g=R*R*(3-2*R),c0=angular(h,this.p,132),c1=angular(h,this.p,144),x=t1;t1=x+g*(c0*x*(1-x)**2+c1*x*x*(1-x));}}
  const r2=this.interiorReach?r+(this.flatInterior?4*r*r*(1-r)**2*16*t1*t1*(1-t1)**2:r*r*(1-r)*4*t1*(1-t1))*angular(h,this.p,156):r;
  return [this.ring(h),r2,r2+(1-r2)*t1];
 }
 inverse(H,R,L){
  if(![H,R,L].every(Number.isFinite)||R<0||R>L||L>1)throw Error('Coordinates require 0 ≤ Reach ≤ Level ≤ 1');
  if(R===0)return [H,R,L];const h=this.unring(H);if(R===1)return [h,1,1];
  if(this.interiorReach){const t=(L-R)/(1-R),u=this.flatInterior?16*t*t*(1-t)**2:4*t*(1-t),a=angular(h,this.p,156);let rl=0,rh=1;for(let i=0;i<50;i++){const r=(rl+rh)/2,value=r+(this.flatInterior?4*r*r*(1-r)**2:r*r*(1-r))*u*a;if(value<R)rl=r;else rh=r;}R=(rl+rh)/2;L=R+(1-R)*t;}
  let lo=0,hi=1;
  for(let i=0;i<50;i++){const r=(lo+hi)/2,value=r+r*(1-r)*polynomial(h,r,this.p,36);if(value<R)lo=r;else hi=r;}
  const r=(lo+hi)/2,t1=(L-R)/(1-R);let t;
  if(t1===0||t1===1)t=t1;
  else if(this.twoSided){const g=r*r*(3-2*r),b0=linearPolynomial(h,r,this.p,84),b1=linearPolynomial(h,r,this.p,108);let tl=0,th=1;for(let i=0;i<50;i++){const tm=(tl+th)/2,value=tm+g*(b0*tm*(1-tm)**2+b1*tm*tm*(1-tm));if(value<t1)tl=tm;else th=tm;}t=(tl+th)/2;}
  else {let x=t1;if(this.residual){const g=r*r*(3-2*r),c0=angular(h,this.p,132),c1=angular(h,this.p,144);let xl=0,xh=1;for(let i=0;i<50;i++){const xm=(xl+xh)/2,value=xm+g*(c0*xm*(1-xm)**2+c1*xm*xm*(1-xm));if(value<t1)xl=xm;else xh=xm;}x=(xl+xh)/2;}const k=(1-(1-r)**this.levelPower)*polynomial(h,r,this.p,84);t=this.logistic?x/(Math.exp(k)*(1-x)+x):2*x/(1+k+Math.sqrt(Math.max(0,(1+k)**2-4*k*x)));}
  const l=r+(1-r)*t;lo=h-20;hi=h+20;
  for(let i=0;i<50;i++){const m=(lo+hi)/2;if(m+this.shade(m,r,l)<h)lo=m;else hi=m;}
  return [mod((lo+hi)/2),r,l];
 }
}
export class CompleteModel {
 constructor(config,key,curve=null,transport=null){this.base=new R14Model(config,key,curve);this.transport=transport?new Transport(transport):null;this.data=this.base.data;this.model=this.base.model;}
 nativeToHue(n){return this.base.nativeToHue(n);}hueToNative(h){return this.base.hueToNative(h);}
 ringForward(h){const old=this.base.ringForward(h);return this.transport?this.transport.ring(old):old;}
 ringInverse(h){return this.base.ringInverse(this.transport?this.transport.unring(h):h);}
 color(H,R,L,options={}){const q=this.transport?this.transport.inverse(H,R,L):[H,R,L];return this.base.color(...q,options);}
 project(rgb){const old=this.base.project(rgb),q=this.transport?this.transport.forward(old.H,old.R,old.L):[old.H,old.R,old.L];return {H:q[0],R:q[1],L:q[2]};}
}

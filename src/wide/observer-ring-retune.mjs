/** R8: zero-fixed ring reparameterization and conditional native-simplex fit.
 * Input is ORIGINAL appearance HRL before R4. Native delta-E is unchanged.
 * The ring changes hue labels of existing vivid RGB anchors. Two odds shears
 * and a conditional Möbius map retune the interior without folding. */
export const PARAMETERS=Object.freeze({
  "ringSin1": 11.097090109071267,
  "ringCos1": -8.235512782701322,
  "ringSin2": 1.6383115049652681,
  "ringCos2": 3.944929638812233,
  "ringSin3": -2.282070013059679,
  "ringCos3": -0.34604435580573084,
  "axDark": 0.08048643932898605,
  "ayDark": 0.03780298798200131,
  "axPale": 0.00963630850372697,
  "ayPale": 0.04071255009320548,
  "s0": 0.017005100907518073,
  "s1": 0.15499518578781624,
  "s2": 0.0986221976734675,
  "k1": 1.442216320378848,
  "k2": -2.75518948924093,
  "s0Cos": 0.03774310667310088,
  "s0Sin": -0.028100606801686592,
  "k1Cos": 0.38496482505551366,
  "k1Sin": 0.34548594666707205
});
const R4=Object.freeze({logs0:0.20960642690329234,a:-0.5051497794915139,
 b:0.7044834063142867,k:-1.3510344017187292,k2:0.16111164555268925});
const DEG=Math.PI/180,mod=x=>((x%360)+360)%360;
const odds=(x,g)=>x===0||x===1?x:x/(x+Math.exp(-g)*(1-x));
function check(H,R,L,M){
 if(![H,R,L,M].every(Number.isFinite)||M<=0||R<0||R>L||L>M)throw Error('Invalid HRL coordinates.');
}
function checkParameters(p){
 if(!Object.keys(PARAMETERS).every(k=>Number.isFinite(p[k])))throw Error('R8 coefficients must be finite.');
}
export function ringForward(H,p=PARAMETERS){
 let result=H;
 for(let n=1;n<=3;n++)result+=p['ringSin'+n]*Math.sin(n*H*DEG)+p['ringCos'+n]*(Math.cos(n*H*DEG)-1);
 return result;
}
export function ringDerivative(H,p=PARAMETERS){
 let result=1;
 for(let n=1;n<=3;n++)result+=n*DEG*(p['ringSin'+n]*Math.cos(n*H*DEG)-p['ringCos'+n]*Math.sin(n*H*DEG));
 return result;
}
/** Monotone lift inverse. Newton steps are safeguarded within a bracket. */
export function ringInverse(H,p=PARAMETERS){
 let bound=0;
 for(let n=1;n<=3;n++)bound+=Math.hypot(p['ringSin'+n],p['ringCos'+n])+Math.abs(p['ringCos'+n]);
 if(bound===0)return H;
 let low=H-bound-1,high=H+bound+1,x=H;
 for(let i=0;i<48;i++){
  const f=ringForward(x,p)-H;
  if(Math.abs(f)<1e-12)return x;
  if(f>0)high=x;else low=x;
  const next=x-f/ringDerivative(x,p);
  x=next>low&&next<high?next:(low+high)/2;
 }
 return x;
}
function r4Coefficients(){return {s0:-R4.logs0,s1:-R4.a,s2:-R4.b,k1:R4.k,k2:R4.k2};}
function rlCoefficients(H,p){const h=H*DEG;return {
 s0:p.s0+p.s0Cos*Math.cos(h)+p.s0Sin*Math.sin(h),s1:p.s1,s2:p.s2,
 k1:p.k1+p.k1Cos*Math.cos(h)+p.k1Sin*Math.sin(h),k2:p.k2};}
/** Positive two-shear map in color presence and the white:black ratio. */
function rl(H,R,L,M,p,inverse=false){
 if(R===0||R===M)return {H,R,L};
 const r=R/M,t=(L-R)/(M-R);
 let c,q;
 if(inverse){const z=2*t-1;c=odds(r,-p.s0-p.s1*z-p.s2*z*z);q=odds(t,-p.k1*c-p.k2*c*c);}
 else {q=odds(t,p.k1*r+p.k2*r*r);const z=2*q-1;c=odds(r,p.s0+p.s1*z+p.s2*z*z);}
 const Rout=M*c;return {H,R:Rout,L:L===R?Rout:L===M?M:M*(c+(1-c)*q)};
}
function alphaAt(R,L,M,p){const r=R/M,l=L/M,d=4*r*(1-l),w=4*r*(l-r);return [d*p.axDark+w*p.axPale,d*p.ayDark+w*p.ayPale];}
function hue(H,R,L,M,p,inverse=false){
 if(R===0||R===M)return H;
 const [a,b]=alphaAt(R,L,M,p),x=Math.cos(H*DEG),y=Math.sin(H*DEG),s=inverse?1:-1;
 const nr=x+s*a,ni=y+s*b,dr=1+s*(a*x+b*y),di=s*(a*y-b*x);
 return mod(Math.atan2(ni*dr-nr*di,nr*dr+ni*di)/DEG);
}
export function retuneObserverRing(H,R,L,M=26,p=PARAMETERS){
 check(H,R,L,M);checkParameters(p);
 let q=rl(mod(ringForward(H,p)),R,L,M,r4Coefficients());
 q.H=hue(q.H,q.R,q.L,M,p);
 return rl(q.H,q.R,q.L,M,rlCoefficients(q.H,p));
}
export function unretuneObserverRing(H,R,L,M=26,p=PARAMETERS){
 check(H,R,L,M);checkParameters(p);
 let q=rl(H,R,L,M,rlCoefficients(H,p),true);
 q.H=hue(q.H,q.R,q.L,M,p,true);
 q=rl(q.H,q.R,q.L,M,r4Coefficients(),true);
 q.H=mod(ringInverse(q.H,p));return q;
}
function rlDet(R,L,M,p){
 const r=R/M,t=(L-R)/(M-R),g=p.k1*r+p.k2*r*r,eg=Math.exp(-g),dg=t+eg*(1-t),q=odds(t,g),z=2*q-1;
 const s=p.s0+p.s1*z+p.s2*z*z,es=Math.exp(-s),ds=r+es*(1-r);
 return eg*es*es/(dg*dg*ds*ds*ds);
}
export function nativeJacobian(H,R,L,M=26,p=PARAMETERS){
 check(H,R,L,M);checkParameters(p);
 if(!(R>0&&R<L&&L<M))throw Error('Jacobian is for the open colored triangle.');
 const h=ringForward(H,p),q=rl(h,R,L,M,r4Coefficients()),[a,b]=alphaAt(q.R,q.L,M,p);
 const dh=(1-a*a-b*b)/((Math.cos(h*DEG)-a)**2+(Math.sin(h*DEG)-b)**2);
 const newH=hue(q.H,q.R,q.L,M,p),dr4=rlDet(R,L,M,r4Coefficients()),dr7=rlDet(q.R,q.L,M,rlCoefficients(newH,p));
 return {ringDerivative:ringDerivative(H,p),baseRLDeterminant:dr4,conditionalHueDerivative:dh,
  finalRLDeterminant:dr7,fullDeterminant:ringDerivative(H,p)*dr4*dh*dr7};
}
export function parameterCertificate(p=PARAMETERS){
 checkParameters(p);
 let secondBound=0,min=Infinity,max=-Infinity,drift=0,incMin=Infinity,incMax=-Infinity;
 for(let n=1;n<=3;n++)secondBound+=(n*DEG)**2*Math.hypot(p['ringSin'+n],p['ringCos'+n]);
 for(let i=0;i<7200;i++){const H=i*.05,d=ringDerivative(H,p);min=Math.min(min,d);max=Math.max(max,d);drift=Math.max(drift,Math.abs(ringForward(H,p)-H));}
 for(let H=0;H<360;H++){const d=ringForward(H+1,p)-ringForward(H,p);incMin=Math.min(incMin,d);incMax=Math.max(incMax,d);}
 const minD=min-secondBound*.025,maxD=max+secondBound*.025;
 const A=Math.max(Math.hypot(p.axDark,p.ayDark),Math.hypot(p.axPale,p.ayPale));
 return {zero:ringForward(0,p),period:360,maxAbsDisplacementDegrees:drift,
  displacementGlobalUpperBound:drift+Math.max(Math.abs(minD-1),Math.abs(maxD-1))*.025,
  derivativeGlobalLowerBound:minD,derivativeGlobalUpperBound:maxD,
  integerIncrementMinimum:incMin,integerIncrementMaximum:incMax,maximumMobiusRadius:A,
  conditionalHueDerivativeLowerBound:(1-A)/(1+A),conditionalHueDerivativeUpperBound:(1+A)/(1-A),
  positiveJacobian:minD>0&&A<1,grayscaleAppearanceFixed:true,vividRGBAnchorsPreserved:true,
  acceptedHueZeroFixed:true,interiorHueMayChange:true,
  inverse:'Analytic odds and Möbius stages; safeguarded monotone scalar ring inverse.'};
}
// Explicit aliases retained for the independent numerical diagnostics.
export const retuneRingJoint=retuneObserverRing,unretuneRingJoint=unretuneObserverRing;
export const ringHue=ringForward,inverseRingHue=ringInverse;

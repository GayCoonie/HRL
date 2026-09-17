/** Monotone C1 path interpolation, with convex C2 secondary smoothing.
 * No new hue field, no XYZ interpolation, and no gamut clipping.
 * The source controls are still the exact frozen A atlas samples.
 */
const wrap=x=>((x%360)+360)%360;
const lerp=(a,b,t)=>a+(b-a)*t;
function interval(xs,x){let a=0,b=xs.length-1;while(b-a>1){const m=(a+b)>>1;if(xs[m]<=x)a=m;else b=m;}return a;}
function validUnit(x){if(!Number.isFinite(x)||x<0||x>1)throw new RangeError('Expected unit interval');}
export class C1Atlas {
 constructor(record,{secondary=true}={}){
  this.record=record;this.x=record.parameter;this.y=record.secondary;this.rows=record.rows;this.h=record.hues;this.secondary=secondary;
  // Open cubic knot vector. Greville-sampled controls reproduce affine paths;
  // all evaluation weights are nonnegative, preserving strict row monotonicity.
  this.knots=[0,0,0,0,...this.y.slice(1,-1),1,1,1,1];
  this.greville=Array.from({length:this.knots.length-4},(_,i)=>(this.knots[i+1]+this.knots[i+2]+this.knots[i+3])/3);
  this.controls=this.rows.map(rows=>this.greville.map(s=>{const j=interval(this.y,s),f=(s-this.y[j])/(this.y[j+1]-this.y[j]);return rows[j].map((v,k)=>lerp(v,rows[j+1][k],f));}));
 }
 weights(s){
  const U=this.knots,n=this.controls[0].length;let span=s===1?n-1:interval(U,s);
  const N=[1,0,0,0],left=[0,0,0,0],right=[0,0,0,0];
  for(let j=1;j<=3;j++){
   left[j]=s-U[span+1-j];right[j]=U[span+j]-s;let saved=0;
   for(let r=0;r<j;r++){const temp=N[r]/(right[r+1]+left[j-r]);N[r]=saved+right[r+1]*temp;saved=left[j-r]*temp;}
   N[j]=saved;
  }
  return {span,N};
 }
 row(H,s){
  validUnit(s);const hf=wrap(H)/360*this.h,i=Math.floor(hf),f=hf-i,k=(i+1)%this.h;
  if(!this.secondary){const j=interval(this.y,s),g=(s-this.y[j])/(this.y[j+1]-this.y[j]);return this.rows[i][j].map((v,t)=>lerp(lerp(v,this.rows[i][j+1][t],g),lerp(this.rows[k][j][t],this.rows[k][j+1][t],g),f));}
  const {span,N}=this.weights(s);return this.x.map((_,t)=>{if(t===0)return 0;if(t===this.x.length-1)return 1;let a=0,b=0;for(let j=0;j<4;j++){a+=N[j]*this.controls[i][span-3+j][t];b+=N[j]*this.controls[k][span-3+j][t];}return lerp(a,b,f);});
 }
 slope(y,i){
  const n=this.x.length,delta=j=>(y[j+1]-y[j])/(this.x[j+1]-this.x[j]);
  if(i===0||i===n-1){
   const first=i===0,j=first?0:n-2,k=first?1:n-3;
   const h=this.x[j+1]-this.x[j],g=this.x[k+1]-this.x[k],a=delta(j),b=delta(k);
   const m=((2*h+g)*a-h*b)/(h+g);return Math.max(0,Math.min(3*a,m));
  }
  const h=this.x[i]-this.x[i-1],g=this.x[i+1]-this.x[i],a=delta(i-1),b=delta(i);
  if(a<=0||b<=0)return 0;
  const w1=2*g+h,w2=g+2*h;return (w1+w2)/(w1/a+w2/b);
 }
 segment(y,i,t,derivative=false){
  const h=this.x[i+1]-this.x[i],a=y[i],b=y[i+1],m=h*this.slope(y,i),n=h*this.slope(y,i+1);
  if(derivative)return (6*t*t-6*t)*a+(3*t*t-4*t+1)*m+(-6*t*t+6*t)*b+(3*t*t-2*t)*n;
  // De Casteljau evaluation avoids cancellation near the exact unit endpoints.
  const p=a+m/3,q=b-n/3,ab=lerp(a,p,t),bc=lerp(p,q,t),cd=lerp(q,b,t);
  const value=lerp(lerp(ab,bc,t),lerp(bc,cd,t),t);
  if(value<a-1e-13||value>b+1e-13)throw Error('Monotone cubic overshot its bracket');
  return Math.max(a,Math.min(b,value)); // only bracket roundoff, never a color gamut map
 }
 forward(H,s,x){validUnit(x);if(x===0||x===1)return x;const y=this.row(H,s),i=interval(this.x,x),t=(x-this.x[i])/(this.x[i+1]-this.x[i]);return this.segment(y,i,t);}
 inverse(H,s,v){
  validUnit(v);if(v===0||v===1)return v;const y=this.row(H,s),i=interval(y,v);let lo=0,hi=1,t=(v-y[i])/(y[i+1]-y[i]);
  for(let j=0;j<48;j++){
   const e=this.segment(y,i,t)-v;if(Math.abs(e)<2e-15)return lerp(this.x[i],this.x[i+1],t);
   if(e>0)hi=t;else lo=t;
   const d=this.segment(y,i,t,true),n=t-e/d;t=d>0&&n>lo&&n<hi?n:(lo+hi)/2;
  }
  return lerp(this.x[i],this.x[i+1],(lo+hi)/2);
 }
}

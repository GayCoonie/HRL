/** Relative-Y carrier geometry. No appearance fit and no RGB display clipping. */
export const D65 = Object.freeze([0.9504559270516716, 1, 1.0890577507598787]);
export const mod = (x,n=360) => ((x%n)+n)%n;
export const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
export function triple(x,name='XYZ') {
 if(!x || x.length!==3 || !Array.from(x).every(Number.isFinite)) throw new TypeError(`${name}: three finite numbers required`);
 return Array.from(x);
}
export function unit(x,name='coordinate') { if(!Number.isFinite(x)||x<0||x>1)throw new RangeError(`${name} outside [0,1]`);return x; }
export const uv = p => {const d=p[0]+15*p[1]+3*p[2];return [4*p[0]/d,9*p[1]/d];};
export const uvDirection = ([u,v]) => [u/4,v/9,(1-u/4-5*v/3)/3];
export function interval(xs,x){let i=0,j=xs.length-1;while(j-i>1){const k=(i+j)>>1;if(xs[k]<=x)i=k;else j=k;}return i;}
export function interpolate(xs,ys,x){const i=interval(xs,x),f=(x-xs[i])/(xs[i+1]-xs[i]);return ys[i]+f*(ys[i+1]-ys[i]);}
const edge=t=>{const z=mod(t,1)*6,i=Math.floor(z),f=z-i;return [[1,f,0],[1-f,1,0],[0,1,f],[0,1-f,1],[f,0,1],[1,0,1-f]][i];};
function edgePosition([r,g,b]){if(r>=g&&g>=b)return g/6;if(g>=r&&r>=b)return(2-r)/6;if(g>=b&&b>=r)return(2+b)/6;if(b>=g&&g>=r)return(4-g)/6;if(b>=r&&r>=g)return(4+r)/6;return mod((6-b)/6,1);}
export class RelativeCone {
 constructor(field){
  this.white=field.white.slice();this.whiteUV=uv(this.white);this.vertices=field.xyBoundary.map(x=>x.slice());
  this.normals=field.normals.map(n=>n.map(v=>v/dot(n,this.white)));
  const vs=this.vertices.map(([x,y])=>uv([x,y,1-x-y]));
  this.planes=vs.map((a,i)=>{const b=vs[(i+1)%vs.length],nx=b[1]-a[1],ny=a[0]-b[0];return[nx,ny,-nx*a[0]-ny*a[1]];});
 }
 completion(p){return Math.max(...this.normals.map(n=>dot(n,p)));}
 physical(p){
  if(!p.every(Number.isFinite)||p[1]<0)return false;
  const size=Math.max(...p.map(Math.abs));if(size===0)return true;
  if(p[1]===0)return false;
  return this.normals.every(n=>dot(n,p)>=-2e-12*size);
 }
 radius(theta){
  const t=theta*Math.PI/180,c=Math.cos(t),s=Math.sin(t);let r=Infinity;
  for(const [nx,ny,b] of this.planes){const d=nx*c+ny*s;if(d>1e-15)r=Math.min(r,-(nx*this.whiteUV[0]+ny*this.whiteUV[1]+b)/d);}
  if(!(r>0&&Number.isFinite(r)))throw Error('Invalid spectral boundary');return r;
 }
 at(theta,rho,Y){
  if(!Number.isFinite(Y)||Y<0)throw RangeError('Relative Y must be nonnegative');unit(rho,'purity');
  if(Y===0)return[0,0,0];if(rho===0)return this.white.map(v=>v*Y);
  const t=theta*Math.PI/180,r=rho*this.radius(theta),d=uvDirection([this.whiteUV[0]+r*Math.cos(t),this.whiteUV[1]+r*Math.sin(t)]);
  if(!(d[1]>0))throw Error('Spectral direction has nonpositive Y');
  return d.map(v=>v*Y/d[1]);
 }
 coordinates(x){
  x=triple(x);if(!this.physical(x))throw RangeError('XYZ outside physical chromaticity cone');
  const Y=x[1];if(Y===0)return{Y:0,a:0,rho:0,theta:0,neutral:true};
  const normalized=x.map(v=>v/Y),c=uv(normalized),dx=c[0]-this.whiteUV[0],dy=c[1]-this.whiteUV[1],r=Math.hypot(dx,dy);
  if(r<2e-14)return{Y,a:this.completion(x),rho:0,theta:0,neutral:true};
  const theta=mod(Math.atan2(dy,dx)*180/Math.PI),rho=r/this.radius(theta);
  if(rho>1+2e-9)throw RangeError('XYZ outside polygonized chromaticity cone');
  return{Y,a:this.completion(x),rho:Math.min(1,rho),theta,neutral:false};
 }
 /** Explicit import policy; luminosity clipping scales XYZ together, not channels. */
 prepare(input,{overflow='clip',imaginary='clip'}={}){
  if(!['clip','reject','preserve'].includes(overflow)||!['clip','reject'].includes(imaginary))throw RangeError('Unknown import policy');
  let xyz=triple(input),events=[];
  if(!this.physical(xyz)){
   if(imaginary==='reject')throw RangeError('XYZ outside physical chromaticity cone');
   if(xyz[1]<=0){xyz=[0,0,0];events.push('imaginary-to-black');}
   else{
    const c=uv(xyz),dx=c[0]-this.whiteUV[0],dy=c[1]-this.whiteUV[1];
    if(!c.every(Number.isFinite)||c[1]<=0){xyz=this.white.map(v=>v*xyz[1]);events.push('imaginary-to-neutral');}
    else{const theta=mod(Math.atan2(dy,dx)*180/Math.PI);xyz=this.at(theta,1,xyz[1]);events.push('chromaticity-clipped');}
   }
  }
  if(xyz[1]>1+2e-12){
   if(overflow==='reject')throw RangeError('Relative Y exceeds reference solid; not an imaginary chromaticity');
   if(overflow==='clip'){xyz=xyz.map(v=>v/xyz[1]);events.push('luminance-clipped');}
  }else if(xyz[1]>1&&overflow!=='preserve')xyz=xyz.map(v=>v/xyz[1]);
  return{xyz,events,physicalInput:this.physical(Array.from(input)),relativeYInput:input[1]};
 }
}
/** Bounded encoding: max(pseudoRGB)=relative Y, with every physical chromaticity. */
export class RelativeSpectralCarrier {
 constructor(cone){
  this.cone=cone;const vs=cone.vertices;
  let longest=-1,index=0;for(let i=0;i<vs.length;i++){const b=vs[(i+1)%vs.length],d=Math.hypot(b[0]-vs[i][0],b[1]-vs[i][1]);if(d>longest){longest=d;index=i;}}
  const [red,violet]=[vs[index],vs[(index+1)%vs.length]].sort((a,b)=>b[0]-a[0]),green=vs.reduce((a,b)=>a[1]>b[1]?a:b);
  const angle=p=>{const c=uv([p[0],p[1],1-p[0]-p[1]]);return mod(Math.atan2(c[1]-cone.whiteUV[1],c[0]-cone.whiteUV[0])*180/Math.PI);};
  const r=angle(red),g=r+mod(angle(green)-r),b=r+mod(angle(violet)-r);
  if(!(r<g&&g<b&&b<r+360))throw Error('Carrier landmark order');
  this.t=[0,1/3,2/3,1];this.theta=[r,g,b,r+360];this.landmarks={red,green,violet};
 }
 fromXYZ(xyz,{extended=false}={}){
  const c=this.cone.coordinates(xyz);if(!extended&&c.Y>1+2e-12)throw RangeError('Y exceeds bounded carrier');
  if(c.neutral)return[c.Y,c.Y,c.Y];const theta=this.theta[0]+mod(c.theta-this.theta[0]),v=edge(interpolate(this.theta,this.t,theta));
  return v.map(x=>c.Y*(1-c.rho+c.rho*x));
 }
 toXYZ(input,{extended=false}={}){
  const q=triple(input,'pseudoRGB');if(q.some(x=>x<0||(!extended&&x>1+2e-12)))throw RangeError('Invalid pseudoRGB range');
  const Y=Math.max(...q),m=Math.min(...q);if(Y===m)return this.cone.white.map(x=>x*Y);
  const rho=(Y-m)/Y,t=edgePosition(q.map(x=>(x-m)/(Y-m)));
  return this.cone.at(interpolate(this.t,this.theta,t),rho,Y);
 }
 encode16(xyz){return this.fromXYZ(xyz).map(x=>Math.round(unit(Math.max(0,Math.min(1,x)))*65535));}
 decode16(q){if(!q||q.length!==3||q.some(x=>!Number.isInteger(x)||x<0||x>65535))throw RangeError('Unsigned 16-bit channels required');return this.toXYZ(q.map(x=>x/65535));}
}

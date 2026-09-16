/** Observer-fitted HRL v2 research hue field, version 0.1.
 * This module does not define final HRL angular density or perceptual R/L spacing.
 * A label is an arbitrary circular coordinate. Equal labels name one fitted sheet.
 * 16-bit values are storage; all internal calculations use JavaScript Number.
 */
const mod=(x,n=360)=>((x%n)+n)%n;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const bern=x=>[(1-x)**3,3*x*(1-x)**2,3*x*x*(1-x),x**3];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=(...a)=>a.every(Number.isFinite);
function interval(xs,x){let lo=0,hi=xs.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(xs[m]<=x)lo=m;else hi=m;}return Math.min(lo,xs.length-2);}
function linear(xs,ys,x){const i=interval(xs,x),t=(x-xs[i])/(xs[i+1]-xs[i]);return ys[i]*(1-t)+ys[i+1]*t;}
function uv(x){const d=x[0]+15*x[1]+3*x[2];return [4*x[0]/d,9*x[1]/d];}
function direction([u,v]){return [u/4,v/9,(1-u/4-5*v/3)/3];}
function edge(t){const s=mod(t,1)*6,i=Math.min(5,Math.floor(s)),u=s-i;return [[1,u,0],[1-u,1,0],[0,1,u],[0,1-u,1],[u,0,1],[1,0,1-u]][i];}
function edgeParameter([r,g,b]){
  if(r>=g&&r>=b&&g>=b)return g/6;
  if(g>=r&&g>=b&&r>=b)return (2-r)/6;
  if(g>=r&&g>=b&&b>=r)return (2+b)/6;
  if(b>=r&&b>=g&&g>=r)return (4-g)/6;
  if(b>=r&&b>=g&&r>=g)return (4+r)/6;
  return mod((6-b)/6,1);
}
export class HueField {
  constructor(record){
    this.record=record;this.n=record.ntheta;this.aMax=record.a_max;
    this.coeff=record.coefficients;this.white=record.cone.white_xyz.slice();
    this.whiteUV=uv(this.white);this.normals=record.cone.normals;
    this.xyBoundary=record.cone.vertices_xy;
    const vs=this.xyBoundary.map(([x,y])=>uv([x,y,1-x-y]));
    this.uvPlanes=vs.map((v,i)=>{const b=vs[(i+1)%vs.length],nx=b[1]-v[1],ny=v[0]-b[0];return [nx,ny,-nx*v[0]-ny*v[1]];});
    this.ringLabels=record.carrier_ring_labels||null;
    if(this.ringLabels){
      if(this.ringLabels.some((x,i)=>!finite(x)||(i&&x<=this.ringLabels[i-1])))throw Error('Unordered carrier ring');
      this.ringT=this.ringLabels.map((_,i)=>i/(this.ringLabels.length-1));
    }
  }
  evaluate(theta,rho,a,{derivative=false}={}){
    if(!finite(theta,rho,a)||rho< -1e-7||rho>1+1e-7||a<0||a>this.aMax+1e-7)throw RangeError('Outside the fitted hue chart');
    rho=clamp(rho,0,1);const step=360/this.n,z=mod(theta)/step,i=Math.floor(z),v=z-i;
    const w=derivative?[-.5*(1-v)**2,1.5*v*v-2*v,-1.5*v*v+v+.5,.5*v*v].map(x=>x/step):[(1-v)**3,3*v**3-6*v*v+4,-3*v**3+3*v*v+3*v+1,v**3].map(x=>x/6);
    const br=bern(rho),ba=bern(Math.cbrt(a/this.aMax));let correction=0;
    for(let k=0;k<4;k++){const c=this.coeff[mod(i+k-1,this.n)];for(let r=0;r<4;r++)for(let l=0;l<4;l++)correction+=w[k]*br[r]*ba[l]*c[r][l];}
    return (derivative?1:theta)+correction;
  }
  inverseAngle(label,rho,a){
    if(!finite(label))throw RangeError('Hue label must be finite');
    const zero=this.evaluate(0,rho,a),target=zero+mod(label-zero);let lo=0,hi=360,t=target-zero;
    for(let i=0;i<70;i++){
      const e=this.evaluate(t,rho,a)-target;if(Math.abs(e)<2e-12)return mod(t);
      if(e>0)hi=t;else lo=t;
      const trial=t-e/this.evaluate(t,rho,a,{derivative:true});t=trial>lo&&trial<hi?trial:(lo+hi)/2;
    }
    throw Error('Hue inversion failed to converge');
  }
  gauge(xyz){let g=-Infinity;for(const n of this.normals)g=Math.max(g,dot(n,xyz));return g;}
  minPlane(xyz){let g=Infinity;for(const n of this.normals)g=Math.min(g,dot(n,xyz));return g;}
  radius(theta){
    const t=theta*Math.PI/180,c=Math.cos(t),s=Math.sin(t);let radius=Infinity;
    for(const [nx,ny,b] of this.uvPlanes){const den=nx*c+ny*s;if(den>1e-15)radius=Math.min(radius,-(nx*this.whiteUV[0]+ny*this.whiteUV[1]+b)/den);}
    if(!(radius>0&&finite(radius)))throw Error('Invalid physical boundary ray');return radius;
  }
  coordinates(xyz){
    if(!Array.isArray(xyz)||xyz.length!==3||!finite(...xyz))throw TypeError('XYZ must be three finite numbers');
    const a=this.gauge(xyz);
    if(this.minPlane(xyz)< -2e-10||a< -1e-12||a>this.aMax+1e-8)throw RangeError('XYZ outside the declared fitted physical cone/range');
    const delta=xyz.map((x,i)=>x-xyz[1]*this.white[i]);
    if(Math.hypot(...delta)<1e-12)return {theta:0,rho:0,a:Math.max(0,a),neutral:true};
    const c=uv(xyz),d=c.map((x,i)=>x-this.whiteUV[i]),theta=mod(Math.atan2(d[1],d[0])*180/Math.PI);
    return {theta,rho:clamp(Math.hypot(...d)/this.radius(theta),0,1),a,neutral:false};
  }
  label(xyz){const c=this.coordinates(xyz);return c.neutral?null:mod(this.evaluate(c.theta,c.rho,c.a));}
  sample(label,rho,a){
    if(!finite(label,rho,a)||rho<0||rho>1||a<0||a>this.aMax)throw RangeError('Require finite label, 0<=rho<=1, 0<=a<=aMax');
    if(a===0)return [0,0,0];if(rho===0)return this.white.map(x=>a*x);
    const theta=this.inverseAngle(label,rho,a),t=theta*Math.PI/180,r=rho*this.radius(theta);
    const d=direction([this.whiteUV[0]+r*Math.cos(t),this.whiteUV[1]+r*Math.sin(t)]),g=this.gauge(d);
    return d.map(x=>a*x/g);
  }
  curve(label,a=1){return rho=>this.sample(label,rho,a);}
  sheet(label){return (rho,a)=>this.sample(label,rho,a);}
  carrierLabel(t){if(!this.ringLabels)throw Error('No carrier ring attached');return mod(linear(this.ringT,this.ringLabels,mod(t,1)));}
  carrierPosition(label){if(!this.ringLabels)throw Error('No carrier ring attached');const x=this.ringLabels[0]+mod(label-this.ringLabels[0]);return mod(linear(this.ringLabels,this.ringT,x),1);}
  pseudoToXYZ(q){
    if(!Array.isArray(q)||q.length!==3||!finite(...q)||q.some(x=>x<0||x>1))throw RangeError('Pseudo-RGB requires three channels in [0,1]');
    const a=Math.max(...q),m=Math.min(...q),delta=a-m;
    if(delta<1e-15)return this.white.map(x=>a*x);
    const v=q.map(x=>(x-m)/delta),rho=delta*v.reduce((s,x)=>s+x,0)/q.reduce((s,x)=>s+x,0);
    return this.sample(this.carrierLabel(edgeParameter(v)),clamp(rho,0,1),a);
  }
  xyzToPseudo(xyz){
    const c=this.coordinates(xyz);if(c.a>1+2e-10)throw RangeError('Color outside the full-span carrier: gauge exceeds 1');
    const a=clamp(c.a,0,1);if(c.neutral)return [a,a,a];
    const label=mod(this.evaluate(c.theta,c.rho,c.a)),v=edge(this.carrierPosition(label)),sum=v.reduce((s,x)=>s+x,0);
    const p=v.map(x=>(1-c.rho)/3+c.rho*x/sum),m=Math.max(...p);
    return p.map(x=>clamp(a*x/m,0,1));
  }
  decode16(q){if(!Array.isArray(q)||q.length!==3||q.some(x=>!Number.isInteger(x)||x<0||x>65535))throw RangeError('Require 3 unsigned 16-bit integers');return this.pseudoToXYZ(q.map(x=>x/65535));}
  encode16(xyz){return this.xyzToPseudo(xyz).map(x=>Math.round(x*65535));}
  triangle(label,R,L){
    if(!finite(label,R,L)||R<0||L<R||L>1)throw RangeError('Triangle requires 0<=R<=L<=1');
    if(L===0)return [0,0,0];const sigma=edge(this.carrierPosition(label)).reduce((s,x)=>s+x,0);
    const rho=R*sigma/(3*(L-R)+R*sigma);return this.sample(label,rho,L);
  }
  embed(H,R,L){
    if(!finite(H,R,L)||R<0||L<R||L>1)throw RangeError('Bicone requires 0<=R<=L<=1');
    const t=H*Math.PI/180,r=Math.sqrt(3)/2*R;return [L-R/2,r*Math.cos(t),r*Math.sin(t)];
  }
}

/** Attach a previously extracted, exact Release-1 ring without re-spacing it.
 * Each entry contains H and the exact released sRGB vivid XYZ. The interpolant
 * changes only labels, not the fitted physical sheet family.
 */
export class ReleaseRing {
  constructor(field,record){
    this.field=field;this.source=record;
    const entries=record.entries.slice().sort((a,b)=>a.H-b.H);
    if(entries.length<3)throw Error('Need at least three release anchors');
    this.H=entries.map(x=>x.H);const raw=entries.map(x=>field.label(x.xyz));
    if(raw.some(x=>x===null))throw Error('A vivid anchor cannot be neutral');
    this.labels=[raw[0]];
    for(let i=1;i<raw.length;i++){
      const delta=mod(raw[i]-raw[i-1]+180)-180;
      if(!(delta>0))throw Error(`Release anchor ${i} reverses the fitted hue order; do not silently reorder it`);
      this.labels.push(this.labels.at(-1)+delta);
    }
    if(this.labels.at(-1)>=this.labels[0]+360)throw Error('Release anchors wrap more than once');
    this.H.push(this.H[0]+360);this.labels.push(this.labels[0]+360);
  }
  label(H){const h=this.H[0]+mod(H-this.H[0]);return mod(linear(this.H,this.labels,h));}
  vivid(H){return this.field.sample(this.label(H),1,1);}
  toXYZ(H,R,L){return this.field.triangle(this.label(H),R,L);}
}

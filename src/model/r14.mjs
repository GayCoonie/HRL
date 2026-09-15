import {PickerModel} from './picker-model.mjs';
const mod=x=>((x%360)+360)%360,rad=Math.PI/180;
const encode=x=>x<=.0404482362771082/12.92?12.92*x:1.055*Math.max(x,0)**(1/2.4)-.055;
function interval(a,x){let lo=0,hi=a.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(a[m]<=x)lo=m;else hi=m;}return lo;}
export class Curve {
 constructor(packet){this.kind=packet.kind;this.knots=packet.knots;this.density=packet.density;this.cumulative=[0];for(let i=1;i<this.knots.length;i++)this.cumulative.push(this.cumulative[i-1]+.5*(this.knots[i]-this.knots[i-1])*(this.density[i-1]+this.density[i]));this.total=this.cumulative.at(-1);}
 forward(x){if(x===0||x===1)return x;const i=interval(this.knots,x),dx=x-this.knots[i],s=(this.density[i+1]-this.density[i])/(this.knots[i+1]-this.knots[i]);return (this.cumulative[i]+dx*(this.density[i]+.5*s*dx))/this.total;}
 inverse(y){if(y===0||y===1)return y;const area=y*this.total,i=interval(this.cumulative,area),a=area-this.cumulative[i],s=(this.density[i+1]-this.density[i])/(this.knots[i+1]-this.knots[i]);return this.knots[i]+2*a/(this.density[i]+Math.sqrt(Math.max(0,this.density[i]**2+2*s*a)));}
}
export class CompleteModel extends PickerModel {
 constructor(config,key,packet=null){super(config,key);this.curve=packet?new Curve(packet):null;}
 color(H,R,L,options={}){if(!this.curve)return super.color(H,R,L,options);const r=this.curve.inverse(R),l=this.curve.kind==='radial'?(R===1?1:R===0?L:1-(1-L)*(1-r)/(1-R)):this.curve.inverse(L);return super.color(H,r,Math.max(r,Math.min(1,l)),options);}
 ringForward(rawHue){const native=this.hueToNative(rawHue),psi=this.model.psi,t=native/.01,j=Math.min(psi.length-2,Math.floor(t)),angle=mod(psi[j]+(psi[j+1]-psi[j])*(t-j)),step=360/2048,i=Math.min(2047,Math.floor(angle/step)),dx=angle-i*step,{density:d,cumulative:c,originArea}=this.model.ring;return mod((c[i]+dx*(d[i]+.5*dx/step*(d[i+1]-d[i]))-originArea)*360/c.at(-1));}
 project(encoded){
  if(encoded.length!==3||encoded.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Expected in-gamut sRGB');
  const rgb=encoded.map(x=>x<=.0404482362771082?x/12.92:((x+.055)/1.055)**2.4),white=Math.min(...rgb),top=Math.max(...rgb),a=top-white,x=[a,white,1-top];
  let h=0;if(a>0){const e=rgb.map(v=>encode((v-white)/a)),m=e.indexOf(Math.max(...e)),native=m===0?60*(e[1]-e[2]):m===1?60*(2+e[2]-e[0]):60*(4+e[0]-e[1]);h=this.nativeToHue(native);}
  const weights=this.weights(h),mean=[0,0,0];for(let k=0;k<12;k++){const z=x.map((v,i)=>v>0?this.data.gamma[k]*Math.log(v)+(i===0?weights[k]:i===1?this.data.white[k]:0):-Infinity),max=Math.max(...z),e=z.map(v=>Math.exp(v-max)),sum=e.reduce((a,b)=>a+b,0);for(let i=0;i<3;i++)mean[i]+=e[i]/sum/12;}
  const R=a===0?0:a===1?1:Math.max(0,Math.min(1,mean[0])),L=top===0?0:top===1?1:Math.max(R,Math.min(1,1-mean[2])),target=[R,L-R,1-L],hp=this.model.hueParameters;let theta=h*rad,cache=x;
  const field=t=>{const hue=t/rad,mix=this.simplex(hue,target,cache);cache=mix;const e=this.edge(hue),yv=e[0]*.2126+e[1]*.7152+e[2]*.0722,y=mix[0]*yv+mix[1],u=mix[1]/Math.max(y,1e-280),v=(y-yv)/(y+yv);let A=0,B=0,I=0;for(let n=1;n<=3;n++){const s=Math.sin(n*t),c=Math.cos(n*t),j=2*(n-1);A+=s*hp[j]+c*hp[j+1];B+=s*hp[j+6]+c*hp[j+7];I+=s*hp[j+12]+c*hp[j+13];}return A*u+B*v+I*u*v;};
  if(R>0&&R<1){const count=this.model.integrationSteps||256,dt=1/count;for(let i=0;i<count;i++){const k1=field(theta),k2=field(theta+dt*k1/2),k3=field(theta+dt*k2/2),k4=field(theta+dt*k3);theta+=dt/6*(k1+2*k2+2*k3+k4);}}
  const reach=this.curve?this.curve.forward(R):R,level=this.curve?(this.curve.kind==='radial'?(R===1?1:R===0?L:1-(1-L)*(1-reach)/(1-R)):this.curve.forward(L)):L;
  return {H:a===0?0:this.ringForward(mod(theta/rad)),R:reach,L:level};
 }
}

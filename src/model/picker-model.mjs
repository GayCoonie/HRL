/* Actual inverse of the fitted mixture + physical hue flow + shared ring.
   Float64 calculations; no RGB clipping is used to manufacture vivid anchors. */
const mod=x=>((x%360)+360)%360;
const RAD=Math.PI/180;
function interval(a,x){let lo=0,hi=a.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(a[m]<=x)lo=m;else hi=m;}return Math.min(lo,a.length-2);}
function softmax(z){const top=Math.max(...z),e=z.map(x=>Math.exp(x-top)),sum=e.reduce((a,b)=>a+b,0);return e.map(x=>x/sum);}
export class PickerModel {
  constructor(data,key){this.data=data;this.model=data.models[key];if(!this.model)throw Error('Unknown model');}
  nativeToHue(n){const a=this.data.r0Accepted,t=mod(n)*1530/360,i=Math.min(1529,Math.floor(t));return mod(a[i]+(a[i+1]-a[i])*(t-i));}
  hueToNative(h){const a=this.data.r0Accepted,x=a[0]+mod(h-a[0]),i=interval(a,x);return mod((i+(x-a[i])/(a[i+1]-a[i]))*360/1530);}
  edge(h){const t=this.hueToNative(h)/60,i=Math.min(5,Math.floor(t)),u=t-i;const e=[[1,u,0],[1-u,1,0],[0,1,u],[0,1-u,1],[u,0,1],[1,0,1-u]][i];return e.map(x=>x<=0.0404482362771082?x/12.92:((x+.055)/1.055)**2.4);}
  ringInverse(h){const {density:r,cumulative:c,originArea}=this.model.ring,step=360/2048,total=c[c.length-1];let area=(h*total/360+originArea)%total;if(area<0)area+=total;
    const i=interval(c,area),a=area-c[i],d0=r[i],delta=r[i+1]-d0,dx=2*a/(d0+Math.sqrt(Math.max(0,d0*d0+2*delta*a/step))),chart=i*step+dx;
    const psi=this.model.psi||this.data.psi,x=psi[0]+mod(chart-psi[0]),j=interval(psi,x),native=(j+(x-psi[j])/(psi[j+1]-psi[j]))*.01;return this.nativeToHue(native);
  }
  weights(h){const t=mod(h)/30,i=Math.floor(t),u=t-i,b=[(1-u)**3,3*u**3-6*u*u+4,-3*u**3+3*u*u+3*u+1,u**3].map(x=>x/6);return this.data.controls.map(c=>b.reduce((v,w,j)=>v+w*c[(i+j+11)%12],0));}
  simplex(h,target,initial=null){
    const active=[0,1,2].filter(i=>target[i]>0),m=active.length,out=[0,0,0];if(m===1){out[active[0]]=1;return out;}
    const t=active.map(i=>target[i]),vivid=this.weights(h),gamma=this.data.gamma,white=this.data.white,meanGamma=gamma.reduce((a,b)=>a+b,0)/12;
    const off=gamma.map((_,k)=>active.map(i=>i===0?vivid[k]:i===1?white[k]:0));
    let z=active.map((i,j)=>j===m-1?0:initial?Math.log(Math.max(initial[i],1e-280)/Math.max(initial[active[m-1]],1e-280)):Math.max(-80,Math.min(80,Math.log(t[j]/t[m-1])/meanGamma)));
    function evaluate(z){const mean=Array(m).fill(0),H=Array.from({length:m-1},()=>Array(m-1).fill(0));let value=0;
      for(let k=0;k<12;k++){const logits=z.map((x,j)=>gamma[k]*x+off[k][j]),top=Math.max(...logits),e=logits.map(x=>Math.exp(x-top)),sum=e.reduce((a,b)=>a+b,0),p=e.map(x=>x/sum);value+=(top+Math.log(sum))/gamma[k]/12;
        for(let i=0;i<m;i++){mean[i]+=p[i]/12;if(i<m-1)for(let j=0;j<m-1;j++)H[i][j]+=gamma[k]*((i===j?p[i]:0)-p[i]*p[j])/12;}}
      value-=z.reduce((s,x,j)=>s+x*t[j],0);const grad=mean.slice(0,m-1).map((x,j)=>x-t[j]);return {value,grad,H,error:Math.max(...grad.map(Math.abs))};}
    for(let iter=0;iter<160;iter++){const a=evaluate(z);if(a.error<=2e-13){const p=softmax(z);active.forEach((index,j)=>out[index]=p[j]);return out;}
      let step;if(m===2)step=[a.grad[0]/Math.max(a.H[0][0],1e-280)];else{const H=a.H,g=a.grad,det=H[0][0]*H[1][1]-H[0][1]*H[1][0];if(!(det>0))throw Error('Singular inverse');step=[(H[1][1]*g[0]-H[0][1]*g[1])/det,(-H[1][0]*g[0]+H[0][0]*g[1])/det];}
      const scale=Math.max(1,...step.map(x=>Math.abs(x)/12));step=step.map(x=>x/scale);const decrement=a.grad.reduce((s,x,i)=>s+x*step[i],0);let alpha=1,accepted=false;
      for(let trial=0;trial<45;trial++){const candidate=z.map((x,i)=>i<m-1?x-alpha*step[i]:x),b=evaluate(candidate);if(b.value<=a.value-1e-4*alpha*decrement+2e-14||b.error<a.error*.8){z=candidate;accepted=true;break;}alpha*=.5;}
      if(!accepted)throw Error('Inverse line search failed');
    }throw Error('Inverse did not converge');
  }
  color(H,R,L,{uncorrected=false,preview=false}={}){
    if(![H,R,L].every(Number.isFinite)||R<0||L<R||L>1)throw Error('Coordinates require 0 ≤ Reach ≤ Level ≤ 1');
    const target=[R,L-R,1-L],rawStart=this.ringInverse(H);let theta=rawStart*RAD,cache=null;
    const hp=uncorrected?Array(18).fill(0):this.model.hueParameters;
    const field=theta=>{const h=theta/RAD,x=this.simplex(h,target,cache);cache=x;const e=this.edge(h),yv=e[0]*.2126+e[1]*.7152+e[2]*.0722,y=x[0]*yv+x[1],u=x[1]/Math.max(y,1e-280),v=(y-yv)/(y+yv);let A=0,B=0,I=0;
      for(let n=1;n<=3;n++){const s=Math.sin(n*theta),c=Math.cos(n*theta),j=2*(n-1);A+=s*hp[j]+c*hp[j+1];B+=s*hp[j+6]+c*hp[j+7];I+=s*hp[j+12]+c*hp[j+13];}return -(A*u+B*v+I*u*v);};
    if(R>0&&R<1&&!uncorrected){const count=preview?64:(this.model.integrationSteps||64),dt=1/count;for(let step=0;step<count;step++){const k1=field(theta),k2=field(theta+dt*k1/2),k3=field(theta+dt*k2/2),k4=field(theta+dt*k3);theta+=dt/6*(k1+2*k2+2*k3+k4);}}
    const rawHue=mod(theta/RAD),x=this.simplex(rawHue,target,cache),edge=this.edge(rawHue),linear=edge.map(e=>x[0]*e+x[1]);
    const encoded=linear.map(x=>x<=0.0404482362771082/12.92?12.92*x:1.055*x**(1/2.4)-.055);
    return {linear,encoded,mixture:x,rawHue};
  }
}

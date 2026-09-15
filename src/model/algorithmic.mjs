// All-hue R0-guided R15 warp. Coordinates internally use hue turns.
// Construct with a frozen parent CompleteModel, table, and one A/B/C parameter set.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function solve(A,b){const m=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<3;k++){let pivot=k;for(let i=k+1;i<3;i++)if(Math.abs(m[i][k])>Math.abs(m[pivot][k]))pivot=i;[m[k],m[pivot]]=[m[pivot],m[k]];if(Math.abs(m[k][k])<1e-12)throw Error('Singular warp');const d=m[k][k];for(let j=k;j<4;j++)m[k][j]/=d;for(let i=0;i<3;i++)if(i!==k){const f=m[i][k];for(let j=k;j<4;j++)m[i][j]-=f*m[k][j];}}return m.map(r=>r[3]);}
export class AlgorithmicModel{
 constructor(parent,table,parameters){this.parent=parent;this.t=table;this.p=parameters;}
 field(q){
  const [H,R,L]=q,n=this.t.n,h=((H%1)+1)%1,hues=this.t.hues;let k=0;while(k+1<hues.length&&hues[k+1]<=h)k++;
  const next=(k+1)%hues.length,span=(k+1<hues.length?hues[k+1]:1)-hues[k],t=(h-hues[k])/span;
  const hw=[2*t**3-3*t*t+1,(-2*t**3+3*t*t),span*(t**3-2*t*t+t),span*(t**3-t*t)];
  const hd=[(6*t*t-6*t)/span,(-6*t*t+6*t)/span,3*t*t-4*t+1,3*t*t-2*t];
  const u=clamp(R,0,1)*n,v=clamp(L,0,1)*n,i=Math.min(n-1,Math.floor(u)),j=Math.max(i,Math.min(n-1,Math.floor(v))),x=u-i,y=v-j;
  const up=y>=x,vs=up?[[i,j],[i,j+1],[i+1,j+1]]:[[i,j],[i+1,j],[i+1,j+1]],w=up?[1-y,y-x,x]:[1-x,x-y,y],wx=up?[0,-1,1]:[-1,1,0],wy=up?[-1,1,0]:[0,-1,1];
  const value=[0,0,0],J=Array.from({length:3},()=>[0,0,0]);
  for(let a=0;a<3;a++){const [ii,jj]=vs[a],id=ii*(n+1)-ii*(ii-1)/2+jj-ii;for(let c=0;c<3;c++){
   const nodes=[this.t.values[k][id][c],this.t.values[next][id][c],this.t.slopes[k][id][c],this.t.slopes[next][id][c]],v=nodes.reduce((s,b,j)=>s+b*hw[j],0),dh=nodes.reduce((s,b,j)=>s+b*hd[j],0);
   value[c]+=w[a]*v;J[c][0]+=w[a]*dh;J[c][1]+=n*wx[a]*v;J[c][2]+=n*wy[a]*v;
  }}return {value,J};
 }
 weight(q){
  const [h,R,L]=q,p=this.p,z=L-R/2,dist=[R,z-.125,.875-z,L-R-1/12,1-L-1/12];let k=0;for(let i=1;i<5;i++)if(dist[i]<dist[k])k=i;
  const t=clamp(dist[k]/.1,0,1),fade=t**3*(10-15*t+6*t*t),df=dist[k]<=0||dist[k]>=.1?0:30*t*t*(1-t)**2/.1,dd=[[0,1,0],[0,-.5,1],[0,.5,-1],[0,-1,1],[0,0,-1]][k];
  let strength=.12*p[0],ds=0;for(const [center,sigma,amp,index] of [[20,20,.88,1],[272.9790146757525,14,.88,2],[118.68,17,.43,3]]){const a=2*Math.PI*(h-center/360),s=(sigma*Math.PI/180)**2,b=Math.exp((Math.cos(a)-1)/s)*amp*p[index];strength+=b;ds+=b*(-2*Math.PI*Math.sin(a)/s);}
  const shape=Math.exp(p[6]*2*(z-.5)+p[7]*2*(R-.3)),w=fade*strength*shape,g=dd.map((x,i)=>df*x*strength*shape+w*[0,-p[6]+2*p[7],2*p[6]][i]);g[0]+=fade*shape*ds;
  return {w,g};
 }
 inverse(q,withJac=false){const {value,J}=this.field(q),{w,g}=this.weight(q),axes=[1,this.p[4],this.p[5]],out=q.map((x,c)=>x+w*value[c]*axes[c]);if(!withJac)return out;
  return {q:out,J:J.map((r,c)=>r.map((x,k)=>(c===k?1:0)+axes[c]*(w*x+value[c]*g[k])))};
 }
 forward(target){let q=target.slice();for(let it=0;it<35;it++){
  const {q:v,J}=this.inverse(q,true),err=v.map((x,i)=>x-target[i]);err[0]=((err[0]+1.5)%1)-.5;const norm=Math.max(...err.map(Math.abs));if(norm<2e-10)return q;
  const step=solve(J,err);let scale=1,trial;
  for(let j=0;j<18;j++){trial=q.map((x,i)=>x-scale*step[i]);const v=this.inverse(trial),e=v.map((x,i)=>x-target[i]);e[0]=((e[0]+1.5)%1)-.5;if(trial[1]>=0&&trial[2]>=trial[1]&&trial[2]<=1&&Math.max(...e.map(Math.abs))<=norm+1e-15)break;scale*=.5;}
  q=trial;
 }throw Error('Warp inverse did not converge');}
 color(H,R,L,options={}){if(![H,R,L].every(Number.isFinite)||R<0||R>L||L>1)throw Error('Invalid triangle');const q=this.inverse([H/360,R,L]);return this.parent.color(q[0]*360,q[1],q[2],options);}
 project(rgb){const p=this.parent.project(rgb),q=this.forward([p.H/360,p.R,p.L]);return {H:((q[0]*360)%360+360)%360,R:q[1],L:q[2]};}
}

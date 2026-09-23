/** Experimental shared Reach/Level field. Input and output use PUBLIC H/R/L.
 * Native and full physical base charts differ; this coefficient bank does not.
 */
import {levelToNonblack,nonblackToLevel} from '../../lib/basr.mjs';
import {freeUnitWarp} from '../../a-smooth/rl-core.mjs';

const wrap=H=>((H%360)+360)%360;
const unit=(x,name)=>{if(!Number.isFinite(x)||x<0||x>1)throw new RangeError(`${name} must be in [0,1]`);return x;};
const valid=q=>{
  if(!q||!Number.isFinite(q.H))throw new TypeError('Finite H required');
  unit(q.R,'R');unit(q.L,'L');
  if(q.R>q.L)throw new RangeError('Require 0 <= R <= L <= 1');
};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const sigmoid=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
function features(H,K){const t=wrap(H)*Math.PI/180,phi=[1];for(let k=1;k<=K;k++)phi.push(Math.cos(k*t),Math.sin(k*t));return phi;}

export function validateRecord(r){
  if(!r||r.schema!=='hrl-fresh-field-v1'||!Number.isInteger(r.harmonics)||r.harmonics<0||r.harmonics>8||
    !Array.isArray(r.knots)||r.knots.length<3||r.knots.length>33||r.knots[0]!==0||r.knots.at(-1)!==1||
    r.knots.some((x,i)=>!Number.isFinite(x)||(i>0&&x<=r.knots[i-1]))||
    !Number.isFinite(r.neutral_shift)||Math.abs(r.neutral_shift)>5||
    !Number.isFinite(r.max_gain)||r.max_gain<=0||r.max_gain>=1||
    !Number.isFinite(r.log_density_cap)||r.log_density_cap<=0||r.log_density_cap>20)
    throw new TypeError('Invalid fresh-field record');
  const width=1+2*r.harmonics,row=a=>Array.isArray(a)&&a.length===width&&a.every(Number.isFinite);
  if(!['reach_logits','lift_logits'].every(name=>Array.isArray(r[name])&&r[name].length===r.knots.length&&r[name].every(row))||!row(r.gain_logits))
    throw new TypeError('Invalid fresh-field coefficient bank');
  return r;
}

/** Exact integral of a positive piecewise-linear density: C1 and one-to-one. */
export class PositiveCurve {
  constructor(knots,rows,harmonics,H,cap){
    this.knots=knots;
    const phi=features(H,harmonics);
    this.density=rows.map(row=>Math.exp(cap*Math.tanh(dot(row,phi)/cap)));
    this.areas=[0];
    for(let i=0;i<knots.length-1;i++)
      this.areas.push(this.areas.at(-1)+(knots[i+1]-knots[i])*(this.density[i]+this.density[i+1])/2);
    this.total=this.areas.at(-1);
  }
  forward(x){
    unit(x,'CDF argument');if(x===0||x===1)return x;
    const k=this.knots;let lo=0,hi=k.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(k[m]<=x)lo=m;else hi=m;}
    const dx=x-k[lo],slope=(this.density[lo+1]-this.density[lo])/(k[lo+1]-k[lo]);
    return (this.areas[lo]+dx*(this.density[lo]+.5*slope*dx))/this.total;
  }
  inverse(y){
    unit(y,'CDF ordinate');if(y===0||y===1)return y;
    const a=y*this.total;let lo=0,hi=this.areas.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(this.areas[m]<=a)lo=m;else hi=m;}
    const local=Math.max(0,a-this.areas[lo]),dx=this.knots[lo+1]-this.knots[lo],
      d0=this.density[lo],slope=(this.density[lo+1]-d0)/dx;
    const delta=2*local/(d0+Math.sqrt(Math.max(0,d0*d0+2*slope*local)));
    return Math.max(this.knots[lo],Math.min(this.knots[lo+1],this.knots[lo]+delta));
  }
}

export class FreshFieldTransport {
  constructor(record){this.record=validateRecord(record);this.cache=new Map();}
  curves(H){
    H=wrap(H);let item=this.cache.get(H);if(item)return item;
    const r=this.record,phi=features(H,r.harmonics);
    item={reach:new PositiveCurve(r.knots,r.reach_logits,r.harmonics,H,r.log_density_cap),
      lift:new PositiveCurve(r.knots,r.lift_logits,r.harmonics,H,r.log_density_cap),
      gain:r.max_gain*sigmoid(dot(r.gain_logits,phi))};
    if(this.cache.size>=128)this.cache.clear();this.cache.set(H,item);return item;
  }
  gray(L){return levelToNonblack(freeUnitWarp(L,-this.record.neutral_shift));}
  grayInverse(a){return freeUnitWarp(nonblackToLevel(a),this.record.neutral_shift);}
  forward(q){
    valid(q);const H=wrap(q.H);if(q.L===0)return{H,R:0,L:0};
    const {reach,lift,gain}=this.curves(H),g=this.gray(q.L);
    const a=g+(1-g)*gain*lift.forward(q.R),s=reach.forward(q.R)/reach.forward(q.L);
    return{H,R:a*s,L:a};
  }
  inverse(q){
    valid(q);const H=wrap(q.H),a=q.L;
    if(a===0)return{H,R:0,L:0};
    const {reach,lift,gain}=this.curves(H),s=unit(q.R/a,'physical purity');
    if(s===0)return{H,R:0,L:this.grayInverse(a)};
    if(a===1)return{H,R:reach.inverse(s),L:1};
    const at=L=>{
      const R=reach.inverse(s*reach.forward(L)),g=this.gray(L);
      return{R,value:g+(1-g)*gain*lift.forward(R)};
    };
    // Chromatic lift never lowers a, so the neutral inverse bounds Level.
    // This narrow bracket and a relative residual retain precision at black.
    let lo=0,hi=this.grayInverse(a),L=hi/2;
    for(let i=0;i<64;i++){
      const v=at(L);
      if(Math.abs(v.value-a)<=2e-14*a)break;
      if(v.value<a)lo=L;else hi=L;
      const next=(lo+hi)/2;if(next===L)break;L=next;
    }
    const R=s===1?L:at(L).R;
    // A one-ulp CDF inversion excess can put a boundary import outside the
    // exact public triangle and make distance() reject it. Preserve the edge,
    // but reject any discrepancy larger than numerical roundoff.
    if(R>L&&R-L>2e-13*L)throw new RangeError('Inverse Reach exceeded Level');
    return{H,R:Math.min(R,L),L};
  }
}

export function forwardPhysical(q,record){return new FreshFieldTransport(record).forward(q);}
export function inversePhysical(q,record){return new FreshFieldTransport(record).inverse(q);}

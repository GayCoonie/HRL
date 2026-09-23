/** Experimental shared conditional Reach/Level physical transport.
 * Public triangle (R,L) is mapped to physical purity s and nonblack amount a.
 */
import {levelToNonblack,nonblackToLevel} from '../../lib/basr.mjs';
import {freeUnitWarp} from '../../a-smooth/rl-core.mjs';

const wrap=H=>((H%360)+360)%360;
const unit=(x,name)=>{
  if(!Number.isFinite(x)||x<0||x>1)throw new RangeError(`${name} must be in [0,1]`);
  return x;
};
const valid=q=>{
  if(!q||!Number.isFinite(q.H))throw new TypeError('Finite H required');
  unit(q.R,'R');unit(q.L,'L');
  if(q.R>q.L)throw new RangeError('Require 0 <= R <= L <= 1');
};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function features(H,K){
  const theta=wrap(H)*Math.PI/180,phi=[1];
  for(let k=1;k<=K;k++)phi.push(Math.cos(k*theta),Math.sin(k*theta));
  return phi;
}

export function validateConditionalRecord(r){
  if(!r||r.schema!=='hrl-conditional-field-v3'||!Number.isInteger(r.harmonics)||r.harmonics<0||r.harmonics>8||
    !Array.isArray(r.knots)||r.knots.length<3||r.knots.length>33||r.knots[0]!==0||r.knots.at(-1)!==1||
    r.knots.some((x,i)=>!Number.isFinite(x)||(i>0&&x<=r.knots[i-1]))||
    !Number.isFinite(r.neutral_shift)||Math.abs(r.neutral_shift)>5||
    !Number.isFinite(r.log_density_cap)||r.log_density_cap<=0||r.log_density_cap>20)
    throw new TypeError('Invalid conditional-field record');
  const width=1+2*r.harmonics,row=a=>Array.isArray(a)&&a.length===width&&a.every(Number.isFinite);
  if(!['reach_logits','reach_level_logits','level_logits'].every(name=>
      Array.isArray(r[name])&&r[name].length===r.knots.length&&r[name].every(row)))
    throw new TypeError('Invalid conditional-field coefficient bank');
  return r;
}

/** C1 normalized integral of a strictly positive piecewise-linear density. */
export class PositiveDensityCDF {
  constructor(knots,logits,cap){
    this.knots=knots;
    this.density=logits.map(raw=>Math.exp(cap*Math.tanh(raw/cap)));
    this.areas=[0];
    for(let i=0;i<knots.length-1;i++)
      this.areas.push(this.areas.at(-1)+(knots[i+1]-knots[i])*(this.density[i]+this.density[i+1])/2);
    this.total=this.areas.at(-1);
  }
  forward(x){
    unit(x,'CDF argument');if(x===0||x===1)return x;
    const knots=this.knots;let lo=0,hi=knots.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(knots[m]<=x)lo=m;else hi=m;}
    const dx=x-knots[lo],slope=(this.density[lo+1]-this.density[lo])/(knots[lo+1]-knots[lo]);
    return (this.areas[lo]+dx*(this.density[lo]+.5*slope*dx))/this.total;
  }
  inverse(y){
    unit(y,'CDF ordinate');if(y===0||y===1)return y;
    const a=y*this.total;let lo=0,hi=this.areas.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(this.areas[m]<=a)lo=m;else hi=m;}
    const local=Math.max(0,a-this.areas[lo]),dx=this.knots[lo+1]-this.knots[lo],
      d0=this.density[lo],slope=(this.density[lo+1]-d0)/dx;
    const discriminant=Math.max(0,d0*d0+2*slope*local),
      delta=2*local/(d0+Math.sqrt(discriminant));
    return Math.max(this.knots[lo],Math.min(this.knots[lo+1],this.knots[lo]+delta));
  }
}

export class ConditionalFieldTransport {
  constructor(record){this.record=validateConditionalRecord(record);this.hueCache=new Map();}
  hue(H){
    H=wrap(H);let item=this.hueCache.get(H);if(item)return item;
    const r=this.record,phi=features(H,r.harmonics);
    item={base:r.reach_logits.map(row=>dot(row,phi)),
      dependent:r.reach_level_logits.map(row=>dot(row,phi)),
      level:r.level_logits.map(row=>dot(row,phi))};
    if(this.hueCache.size>=128)this.hueCache.clear();
    this.hueCache.set(H,item);return item;
  }
  gray(L){return levelToNonblack(freeUnitWarp(L,-this.record.neutral_shift));}
  grayInverse(a){return freeUnitWarp(nonblackToLevel(a),this.record.neutral_shift);}
  reach(H,L){
    const {base,dependent}=this.hue(H),logits=base.map((x,i)=>x+(1-L)*dependent[i]);
    return new PositiveDensityCDF(this.record.knots,logits,this.record.log_density_cap);
  }
  level(H,s){
    const {level}=this.hue(H),logits=level.map(x=>s*x);
    return new PositiveDensityCDF(this.record.knots,logits,this.record.log_density_cap);
  }
  forward(q){
    valid(q);const H=wrap(q.H),L=q.L;
    if(L===0)return{H,R:0,L:0};
    const s=this.reach(H,L).forward(q.R/L),a=this.level(H,s).forward(this.gray(L));
    return{H,R:a*s,L:a};
  }
  inverse(q){
    valid(q);const H=wrap(q.H),a=q.L;
    if(a===0)return{H,R:0,L:0};
    const s=unit(q.R/a,'physical purity'),z=this.level(H,s).inverse(a),L=this.grayInverse(z),
      u=this.reach(H,L).inverse(s);
    return{H,R:Math.min(L,L*u),L};
  }
}

export function forwardPhysical(q,record){return new ConditionalFieldTransport(record).forward(q);}
export function inversePhysical(q,record){return new ConditionalFieldTransport(record).inverse(q);}

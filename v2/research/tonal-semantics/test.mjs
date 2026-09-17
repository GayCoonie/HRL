import assert from 'node:assert/strict';import fs from 'node:fs';
import {shares,addBlack,addWhite,exchangeNeutral,composeAmounts,cornerDistances,zcamAttributes,conceptualShares} from './operations.mjs';
import {genRuler,GEN_WHITE,inspectGenDomain} from './ruler.mjs';
let seed=170926;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const err=(a,b)=>Math.max(Math.abs(a.R-b.R),Math.abs(a.L-b.L));let max=0;
for(let i=0;i<10000;i++) {
 const L=rnd(),q={H:360*rnd(),L,R:L*rnd()},a=rnd(),b=rnd(),s=shares(q),B=shares(addBlack(q,a)),W=shares(addWhite(q,a));
 for(const t of [B,W]) {assert(t.R>=0&&t.W>=-1e-15&&t.K>=-1e-15);assert(Math.abs(t.R+t.W+t.K-1)<1e-14);}
 assert(Math.abs(B.K-(s.K+a*(1-s.K)))<1e-14);assert(Math.abs(W.W-(s.W+a*(1-s.W)))<1e-14);
 max=Math.max(max,err(addBlack(addBlack(q,a),b),addBlack(q,composeAmounts(a,b))),err(addWhite(addWhite(q,a),b),addWhite(q,composeAmounts(a,b))));
 const bw=addWhite(addBlack(q,a),b),wb=addBlack(addWhite(q,b),a);
 assert(Math.abs(bw.R-wb.R)<1e-14);assert(Math.abs(bw.L-wb.L-a*b)<1e-14);
 assert(Math.abs(cornerDistances(addBlack(q,a)).black-(1-a)*cornerDistances(q).black)<1e-14);
 assert(Math.abs(cornerDistances(addWhite(q,a)).white-(1-a)*cornerDistances(q).white)<1e-14);
 const delta=(1-q.R)*rnd()-(q.L-q.R);assert.equal(exchangeNeutral(q,delta).R,q.R);
}
assert.deepEqual(genRuler([0,0,0]),[0,0,0]);assert(!inspectGenDomain([0,0,1]).valid);assert.throws(()=>genRuler([0,0,1]),RangeError);
const white=zcamAttributes(100,0),black=zcamAttributes(0,0),grey=zcamAttributes(50,0);
assert.deepEqual(white,{Vz:42,Kz:20,Wz:100});assert.deepEqual(black,{Vz:58,Kz:100,Wz:0});assert.deepEqual(grey,{Vz:8,Kz:60,Wz:50});
const result={seed:170926,randomOperationTests:10000,maxCompositionError:max,
  contracts:['simplex containment','same-endpoint semigroup','cross-endpoint order difference','corner-distance contractions','fixed-Reach neutral exchange'],
  ZCAM:{white,black,grey,warning:'Kz and Wz are not HRL shares, and Vz is not 100-Kz.'},
  conceptual:{ordinaryGrey:conceptualShares(.5,0),genericVivid:conceptualShares(.5,.4),symmetricZeroKW:conceptualShares(.5,Math.sqrt(3)/2)},
  GenSpace:{black:genRuler([0,0,0]),white:GEN_WHITE,negativeResponseRejection:true}};
fs.writeFileSync(new URL('results/operation-tests.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));

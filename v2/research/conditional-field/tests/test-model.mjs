import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHRLv2} from '../../../index.mjs';

const near=(x,y,t=2e-10)=>assert.ok(Math.abs(x-y)<=t,`${x} differs from ${y}`);
const xyzNear=(x,y,t=1e-7)=>x.forEach((v,i)=>near(v,y[i],t));
const seed=()=>readFile(new URL('../records/seed.json',import.meta.url),'utf8').then(JSON.parse);

test('conditional field independently controls dark and white Reach while neutral Level is unchanged',async()=>{
  const {ConditionalFieldTransport}=await import('../model.mjs'),r=await seed();
  const identity=new ConditionalFieldTransport(r),q={H:190,R:.2,L:.5};
  const gray=identity.forward({H:190,R:0,L:.5}).L,
    white=identity.forward({H:190,R:.4,L:1}).R,
    center=identity.forward(q).R,
    dark=identity.forward({H:190,R:.008,L:.02}).R;
  r.reach_level_logits[0][0]=1.4;
  r.reach_level_logits[4][0]=-1.4;
  const changed=new ConditionalFieldTransport(r);
  near(changed.forward({H:190,R:0,L:.5}).L,gray,0);
  near(changed.forward({H:190,R:.4,L:1}).R,white,2e-15);
  assert.ok(Math.abs(changed.forward(q).R-center)>1e-3);
  assert.ok(Math.abs(changed.forward({H:190,R:.008,L:.02}).R-dark)>1e-5);
});

test('conditional Level density permits both darkening and brightening at the same gray anchor',async()=>{
  const {ConditionalFieldTransport}=await import('../model.mjs'),r=await seed();
  const G=new ConditionalFieldTransport(r).forward({H:60,R:0,L:.65}).L;
  for(const [polarity,direction] of [[1,1],[-1,-1]]){
    const bank=structuredClone(r);
    bank.level_logits[0][0]=2*polarity;bank.level_logits[4][0]=-2*polarity;
    const t=new ConditionalFieldTransport(bank),p=t.forward({H:60,R:.65,L:.65});
    assert.ok((p.L-G)*direction>.01,`expected ${direction>0?'brighter':'darker'} saturated colors`);
    near(t.inverse(p).L,.65,2e-12);near(t.inverse(p).R,.65,2e-12);
  }
});

test('nontrivial hue and Level banks have exact triangle, inverse and fixed-Reach physical progress',async()=>{
  const {ConditionalFieldTransport}=await import('../model.mjs'),r=await seed();
  r.reach_logits[1][1]=.42;r.reach_logits[3][2]=-.37;
  r.reach_level_logits[1][3]=.38;r.reach_level_logits[4][4]=-.3;
  r.level_logits[0][1]=.36;r.level_logits[3][0]=-.42;
  const t=new ConditionalFieldTransport(r);
  for(const H of [0,67,141,273,359.999]){
    for(const R of [0,1e-8,.025,.2,.55]){
      let previous=-1;
      for(let k=0;k<=30;k++){
        const L=R+(1-R)*k/30,q={H,R,L},p=t.forward(q),back=t.inverse(p);
        assert.ok(p.R>=0&&p.R<=p.L&&p.L<=1);
        near(back.R,q.R,4e-12);near(back.L,q.L,4e-12);
        assert.ok(p.L>previous,`fixed R physical Level retreated at H=${H},R=${R},L=${L}`);
        previous=p.L;
      }
    }
  }
});

test('black, white and vivid boundaries are exact, gray matches Beta 1, seam and near-black inverse persist',async()=>{
  const {createConditionalFieldHRL}=await import('../index.mjs'),r=await seed();
  r.reach_logits[1][1]=.5;r.level_logits[2][2]=.2;
  const models=await Promise.all(['srgb','full'].map(gamut=>createConditionalFieldHRL({gamut,record:r})));
  assert.equal(models[0].checkpoint,'conditional-field-v3-record','explicit bank should retain provenance label');
  const beta=await Promise.all(['srgb','full'].map(gamut=>createHRLv2({gamut})));
  for(let j=0;j<2;j++)for(const H of [0,60,120,270,359.999]){
    for(const q of [{H,R:0,L:0},{H,R:0,L:1},{H,R:1,L:1},{H,R:0,L:.65}])
      xyzNear(models[j].toXYZ(q),beta[j].toXYZ(q),5e-10);
  }
  const t=models[0].model.transport;
  for(const L of [1e-15,1e-12,1e-9]){
    const q={H:359.999999,R:L*.61,L},back=t.inverse(t.forward(q));
    assert.ok(Math.abs(back.L-L)/L<1e-8);assert.ok(Math.abs(back.R-q.R)/L<1e-8);
  }
  const x=t.forward({H:360-1e-7,R:.14,L:.73}),y=t.forward({H:1e-7,R:.14,L:.73});
  near(x.R,y.R,1e-9);near(x.L,y.L,1e-9);
});

test('native/full XYZ and source mapping roundtrip, imported triangle and pseudoRGB closure',async()=>{
  const {createConditionalFieldHRL}=await import('../index.mjs'),models=await Promise.all(['srgb','full'].map(gamut=>createConditionalFieldHRL({gamut})));
  for(const model of models)for(const H of [5,84,199,273])for(const L of [.03,.3,.74,1])for(const U of [0,.13,.56,1]){
    const q={H,R:L*U,L},xyz=model.toXYZ(q),back=model.fromXYZ(xyz,{neutralHue:H});
    xyzNear(model.toXYZ(back),xyz,7e-8);
    const pseudo=model.toPseudoRGB(q),recovered=model.fromPseudoRGB(pseudo,H);
    xyzNear(model.toXYZ(recovered),xyz,2e-7);
  }
  const mapped=models[0].importXYZ(models[1].toXYZ({H:273,R:1,L:1}));
  assert.ok(mapped.coordinates.R<=mapped.coordinates.L);
  assert.ok(mapped.coordinates.R>=0&&mapped.coordinates.L<=1);
  assert.ok(mapped.events.includes('srgb-gamut-clipped'));
});

test('conditional field rejects invalid records and external triangle',async()=>{
  const {createConditionalFieldHRL}=await import('../index.mjs'),r=await seed();
  r.level_logits.pop();
  await assert.rejects(createConditionalFieldHRL({record:r}),TypeError);
  const model=await createConditionalFieldHRL();
  assert.throws(()=>model.toXYZ({H:30,R:.6,L:.5}),RangeError);
});

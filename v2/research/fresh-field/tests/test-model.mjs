import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHRLv2} from '../../../index.mjs';

const packageURL=new URL('../index.mjs',import.meta.url);
const seedURL=new URL('../records/seed.json',import.meta.url);
async function entry(){
  const module=await import(packageURL).catch(()=>({}));
  assert.equal(typeof module.createFreshFieldHRL,'function','experimental factory must exist');
  return module;
}
async function seed(){return JSON.parse(await readFile(seedURL,'utf8'));}
const close=(a,b,tol=2e-8)=>assert.ok(Math.abs(a-b)<=tol,`${a} differs from ${b}`);
const xyzClose=(a,b,tol=2e-8)=>a.forEach((x,i)=>close(x,b[i],tol));

test('fresh physical-field factory exists',async()=>{
  await entry();
});

test('positive-density reach and lift curves preserve endpoints and invert',async()=>{
  const {PositiveCurve}=await import(new URL('../model.mjs',import.meta.url));
  const rows=[[-1.1,.2,-.1,.3,.1],[.5,.1,-.3,0,0],[-.3,.2,.4,0,-.1],[.7,-.1,.2,0,0],[.2,0,0,.2,-.1]];
  const curve=new PositiveCurve([0,.25,.5,.75,1],rows,2,247,4);
  assert.equal(curve.forward(0),0);assert.equal(curve.forward(1),1);
  assert.equal(curve.inverse(0),0);assert.equal(curve.inverse(1),1);
  let previous=-1;
  for(let i=0;i<=100;i++){
    const x=i/100,y=curve.forward(x);
    assert.ok(y>previous,'curve must be strictly increasing');
    close(curve.inverse(y),x,3e-14);previous=y;
  }
});

test('seed maps the physical chart monotonically and has a real inverse',async()=>{
  const {forwardPhysical,inversePhysical}=await import(new URL('../model.mjs',import.meta.url));
  const record=await seed();
  for(const H of [0,58,145,284,359.99]){
    for(const R of [0,.02,.2,.6]){
      let previous=-1;
      for(let j=0;j<=16;j++){
        const L=R+(1-R)*j/16,q={H,R,L},p=forwardPhysical(q,record);
        assert.ok(p.L>previous,`physical progress retreated at H=${H}, R=${R}`);
        if(L>0)close(p.R/p.L,R/L,5e-14);
        const back=inversePhysical(p,record);
        close(back.R,R,2e-12);close(back.L,L,2e-12);close(back.H,H,2e-12);
        previous=p.L;
      }
    }
  }
});

test('nontrivial parameter bank changes interior while keeping an invertible positive field',async()=>{
  const {forwardPhysical,inversePhysical}=await import(new URL('../model.mjs',import.meta.url));
  const record=await seed();
  record.reach_logits[1][1]=.8;record.reach_logits[2][2]=-.5;
  record.lift_logits[3][3]=1.1;record.gain_logits[1]=.4;
  for(const H of [0,87.5,181,300,359.999])for(const L of [1e-6,.02,.2,.7,1])for(const U of [0,.1,.4,.8,1]){
    const q={H,R:L*U,L},p=forwardPhysical(q,record),back=inversePhysical(p,record);
    close(back.L,L,2e-11);close(back.R,q.R,2e-11);
    assert.ok(p.R>=0&&p.R<=p.L&&p.L<=1);
  }
  const q={H:87.5,R:.15,L:.4};
  assert.ok(Math.abs(forwardPhysical(q,record).R-forwardPhysical(q,await seed()).R)>1e-5,
    'parameter bank must actually move the color');
});

test('near-black inverse retains relative precision and the hue seam stays continuous',async()=>{
  const {forwardPhysical,inversePhysical}=await import(new URL('../model.mjs',import.meta.url));
  const record=await seed();
  for(const L of [1e-15,1e-12,1e-9]){
    const q={H:359.999999,R:.67*L,L},back=inversePhysical(forwardPhysical(q,record),record);
    assert.ok(Math.abs(back.L-L)/L<1e-9,`Level lost relative accuracy at ${L}`);
    assert.ok(Math.abs(back.R-q.R)/q.R<1e-9,`Reach lost relative accuracy at ${L}`);
  }
  const a=forwardPhysical({H:360-1e-7,R:.08,L:.7},record),
    b=forwardPhysical({H:1e-7,R:.08,L:.7},record);
  close(a.R,b.R,1e-9);close(a.L,b.L,1e-9);
});

test('native and full share one physical rule and preserve black, white, vivid, and Beta 1 gray',async()=>{
  const {createFreshFieldHRL}=await entry(),record=await seed();
  const models=await Promise.all(['srgb','full'].map(gamut=>createFreshFieldHRL({gamut,record})));
  const betas=await Promise.all(['srgb','full'].map(gamut=>createHRLv2({gamut})));
  for(let g=0;g<2;g++)for(const H of [0,61,175,284,359.99]){
    for(const q of [{H,R:0,L:0},{H,R:0,L:1},{H,R:1,L:1},{H,R:0,L:.01},{H,R:0,L:.5}])
      xyzClose(models[g].toXYZ(q),betas[g].toXYZ(q),5e-10);
  }
  for(const q of [{H:279,R:.07,L:.2},{H:31,R:.6,L:.9}]){
    const a=models[0].model.toPhysical(q),b=models[1].model.toPhysical(q);
    close(a.R,b.R,0);close(a.L,b.L,0);
  }
  assert.equal(models[0].model.record,models[1].model.record);
});

test('actual runtime round trips native/full, native linear RGB, and full pseudoRGB',async()=>{
  const {createFreshFieldHRL}=await entry(),models=await Promise.all(['srgb','full'].map(gamut=>createFreshFieldHRL({gamut})));
  for(const model of models)for(const H of [0,37,161,281,359.99])for(const L of [1e-5,.04,.31,.87,1])for(const U of [0,.1,.57,1]){
    const q={H,R:L*U,L},xyz=model.toXYZ(q),back=model.fromXYZ(xyz,{neutralHue:H});
    xyzClose(model.toXYZ(back),xyz,7e-8);
    if(U>0&&L>0){close(back.R,q.R,3e-6);close(back.L,q.L,3e-6);}
    if(model.gamut==='srgb'){
      const rgb=model.toLinearRGB(q),q2=model.fromLinearRGB(rgb,H);
      xyzClose(model.toXYZ(q2),xyz,7e-8);
    }
    const pseudo=model.toPseudoRGB(q),recovered=model.fromPseudoRGB(pseudo,H);
    xyzClose(model.toXYZ(recovered),xyz,2e-7);
  }
});

test('mapped imports and carrier still use the repaired physical domain',async()=>{
  const {createFreshFieldHRL}=await entry(),native=await createFreshFieldHRL({gamut:'srgb'}),full=await createFreshFieldHRL({gamut:'full'});
  const wide=full.toXYZ({H:270,R:1,L:1}),mapped=native.importXYZ(wide);
  assert.ok(mapped.events.includes('srgb-gamut-clipped'));
  assert.ok(mapped.coordinates.R>=0&&mapped.coordinates.R<=mapped.coordinates.L);
  assert.ok(mapped.coordinates.L<=1);
  const gray={H:0,R:0,L:.4},channels=full.carrier.fromXYZ(full.toXYZ(gray));
  close(channels[0],full.model.toPhysical(gray).L,2e-14);
  close(channels[1],channels[0],2e-14);close(channels[2],channels[0],2e-14);
});

test('a fitted bank keeps mapped saturated inputs inside the exact public triangle',async()=>{
  const {createFreshFieldHRL}=await entry();
  const record=JSON.parse(await readFile(new URL('../results/fresh-visual-neutral.json',import.meta.url),'utf8'));
  const native=await createFreshFieldHRL({gamut:'srgb',record});
  const input=[0.03978650580375263,0.08667344191270086,0.07735199173764191];
  const mapped=native.importXYZ(input);
  assert.ok(mapped.events.includes('srgb-gamut-clipped'));
  assert.ok(mapped.coordinates.R<=mapped.coordinates.L,
    'inverse CDF must not produce R above Level by even one ulp on the vivid side');
  assert.ok(Number.isFinite(native.distance(mapped.coordinates,mapped.coordinates)));
});

test('invalid triangle or record is rejected without changing Beta 1',async()=>{
  const {createFreshFieldHRL}=await entry(),beta=await createHRLv2({gamut:'srgb'}),before=beta.toXYZ({H:69,R:.2,L:.5});
  const model=await createFreshFieldHRL({gamut:'srgb'});
  assert.throws(()=>model.toXYZ({H:30,R:.6,L:.5}),RangeError);
  assert.throws(()=>model.toXYZ({H:30,R:-1,L:.5}),RangeError);
  assert.rejects(createFreshFieldHRL({gamut:'invalid'}),RangeError);
  const invalid=await seed();invalid.reach_logits.pop();
  assert.rejects(createFreshFieldHRL({record:invalid}),TypeError);
  xyzClose(beta.toXYZ({H:69,R:.2,L:.5}),before,0);
});

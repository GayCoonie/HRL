import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createConditionalFieldHRL} from '../../conditional-field/index.mjs';

const seed=()=>readFile(new URL('../records/seed.json',import.meta.url),'utf8').then(JSON.parse);
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t,`${a} differs from ${b}`);
const xyzNear=(a,b,t=1e-7)=>a.forEach((x,i)=>near(x,b[i],t));
async function entry(){
  const module=await import(new URL('../index.mjs',import.meta.url)).catch(()=>({}));
  assert.equal(typeof module.createConditionalHueHRL,'function');return module;
}

test('conditional hue v4 factory exists as a distinct research entry point',async()=>{await entry();});

test('zero hue coefficients reproduce conditional v3 XYZ and shared physical rule',async()=>{
  const {createConditionalHueHRL}=await entry(),record=await seed();
  const tonal={...record,schema:'hrl-conditional-field-v3'};
  for(const gamut of ['srgb','full']){
    const v3=await createConditionalFieldHRL({gamut,record:tonal}),v4=await createConditionalHueHRL({gamut,record});
    for(const H of [0,65,179,273,359.99])for(const L of [.01,.3,.7,1])for(const U of [0,.12,.54,1]){
      const q={H,R:U*L,L};xyzNear(v4.toXYZ(q),v3.toXYZ(q),0);
    }
  }
});

test('interior hue moves while gray, black, vivid vertex and vivid ring stay fixed',async()=>{
  const {createConditionalHueHRL}=await entry(),record=await seed();
  record.hue_coefficients=[7,3,2,2,-1];
  const model=await createConditionalHueHRL({record});
  const blue={H:275,R:.31,L:.77},base=model.model.transport.forward(blue);
  const shifted=model.model.toPhysical(blue);
  near(shifted.R,base.R,0);near(shifted.L,base.L,0);
  assert.ok(Math.abs(shifted.H-blue.H)>1,'interior hue flow should be consequential');
  for(const q of [{H:275,R:0,L:.3},{H:275,R:0,L:1},{H:275,R:1,L:1},{H:275,R:0,L:0},{H:275,R:.2,L:.2}])
    near(model.model.toPhysical(q).H,275,0);
  const top=model.model.toPhysical({H:275,R:.4,L:1});
  assert.ok(Math.abs(top.H-275)>.1,'white-vivid edge may shift while the vivid vertex stays fixed');
});

test('bounded Fourier hue shift is globally monotone and inverts through the seam',async()=>{
  const {HueFlow}=await import('../model.mjs'),record=await seed();
  record.hue_coefficients=[8,8,-8,8,-8];
  const flow=new HueFlow(record);
  for(const w of [0,.2,1]){
    let last=-Infinity;
    for(let i=-24;i<=1440;i++){
      const H=i*.25,h=flow.unshifted(H,w),back=flow.inverse(h,w);
      assert.ok(h>last,`fold at H=${H}, w=${w}`);
      near(back,((H%360)+360)%360,2e-12);
      last=h;
    }
  }
});

test('native and full runtime invert the hue and retain pseudoRGB/import closure',async()=>{
  const {createConditionalHueHRL}=await entry(),record=await seed();
  record.hue_coefficients=[6,5,-4,3,-2];
  const models=await Promise.all(['srgb','full'].map(gamut=>createConditionalHueHRL({gamut,record})));
  for(const model of models)for(const H of [1e-7,30,179,275,359.999])for(const L of [1e-8,.13,.7,1])for(const U of [0,1e-8,.41,.91,1]){
    const q={H,R:U*L,L},xyz=model.toXYZ(q),back=model.fromXYZ(xyz,{neutralHue:H});
    xyzNear(model.toXYZ(back),xyz,1e-7);
    const rgb=model.toPseudoRGB(q),q2=model.fromPseudoRGB(rgb,H);
    xyzNear(model.toXYZ(q2),xyz,2e-7);
  }
  const q={H:275,R:.31,L:.77};
  near(models[0].model.toPhysical(q).H,models[1].model.toPhysical(q).H,0);
  const imported=models[0].importXYZ(models[1].toXYZ({H:270,R:1,L:1}));
  assert.ok(imported.coordinates.R<=imported.coordinates.L);
  assert.ok(imported.events.includes('srgb-gamut-clipped'));
});

test('hue vanishes toward neutral and black; invalid large coefficient is rejected',async()=>{
  const {createConditionalHueHRL}=await entry(),record=await seed();
  record.hue_coefficients=[8,8,8,8,8];
  const model=await createConditionalHueHRL({record});
  for(const L of [.1,.5,1]){
    const q={H:280,R:L*1e-8,L};
    assert.ok(Math.abs(model.model.toPhysical(q).H-q.H)<1e-5);
  }
  near(model.model.toPhysical({H:280,R:1e-15,L:1e-15}).H,280,0);
  const invalid=await seed();invalid.hue_coefficients[1]=8.1;
  await assert.rejects(createConditionalHueHRL({record:invalid}),TypeError);
});

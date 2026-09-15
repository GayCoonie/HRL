import test from 'node:test';
import assert from 'node:assert/strict';
import {createHRL, GAMUTS, VERSION} from '../src/index.mjs';

const circular = (a,b) => Math.abs((((a-b)+540)%360)-180);
const maxError = (a,b) => Math.max(circular(a.H,b.H)/360, Math.abs(a.R-b.R), Math.abs(a.L-b.L));
const closeRGB = (actual, expected, epsilon=2e-15) =>
  actual.every((value,index)=>Math.abs(value-expected[index])<=epsilon);

function random(seed=0x48524c31) {
  let state=seed>>>0;
  return () => ((state=(1664525*state+1013904223)>>>0)/2**32);
}

for (const gamut of GAMUTS) {
  test(`${gamut}: release identity and exact neutral corners`, async () => {
    const hrl=await createHRL({gamut});
    assert.equal(hrl.version, VERSION);
    assert.ok(closeRGB(hrl.toRGB({H:0,R:0,L:0}), [0,0,0]));
    assert.ok(closeRGB(hrl.toRGB({H:0,R:0,L:1}), [1,1,1]));
  });

  test(`${gamut}: coordinate and XYZ round trips`, async () => {
    const hrl=await createHRL({gamut}), rng=random(gamut==='srgb'?1:2);
    let worst=0;
    for(let i=0;i<180;i++){
      const q={H:360*rng(),R:.01+.98*rng()};
      q.L=q.R+(1-q.R)*rng();
      const rgb=hrl.toRGB(q);
      assert.ok(rgb.every(x=>Number.isFinite(x)&&x>=-2e-9&&x<=1+2e-9));
      const back=hrl.fromRGB(rgb.map(x=>Math.max(0,Math.min(1,x))));
      worst=Math.max(worst,maxError(q,back));
      const xyz=hrl.toXYZ(q);
      const fromXYZ=hrl.fromXYZ(xyz);
      worst=Math.max(worst,maxError(q,fromXYZ));
    }
    assert.ok(worst<5e-6, `worst normalized round-trip error ${worst}`);
  });
}

test('regular-bicone embedding has unit edges', async () => {
  const hrl=await createHRL();
  const black={H:0,R:0,L:0}, white={H:0,R:0,L:1}, vivid={H:0,R:1,L:1};
  assert.ok(Math.abs(hrl.distance(black,white)-1)<1e-14);
  assert.ok(Math.abs(hrl.distance(black,vivid)-1)<1e-14);
  assert.ok(Math.abs(hrl.distance(white,vivid)-1)<1e-14);
});

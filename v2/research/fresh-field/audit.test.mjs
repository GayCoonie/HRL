import test from 'node:test';
import assert from 'node:assert/strict';
import {createHRLv2} from '../../index.mjs';
import {createJointHRL} from '../joint-contours/index.mjs';

// A mutation that follows fixed U=R/L instead of fixed public Reach must fail.
test('fixed Reach Level paths retain public R while U changes', async () => {
  const {tracePath} = await import('./audit.mjs');
  const beta = await createHRLv2({gamut:'srgb'});
  const samples = tracePath(beta, {kind:'fixedReach',H:171.25,fixed:.35,count:9});
  assert.equal(samples[0].q.L, .35);
  assert.equal(samples.at(-1).q.L, 1);
  assert.ok(samples.every(x => x.q.R === .35));
  assert.ok(samples[1].q.R/samples[1].q.L < 1);
});

// A mutation to a black-to-white edge or clipped RGB would hide this defect.
test('frozen joint has a severe green-cyan white/vivid edge spacing regression', async () => {
  const {tracePath, summarizePath} = await import('./audit.mjs');
  const [beta,joint] = await Promise.all([createHRLv2({gamut:'srgb'}),createJointHRL({gamut:'srgb'})]);
  const options={kind:'whiteEdge',H:180,count:129};
  const b=tracePath(beta,options),j=tracePath(joint,options);
  assert.deepEqual(b[0].q,{H:180,R:1,L:1});
  assert.deepEqual(b.at(-1).q,{H:180,R:0,L:1});
  assert.ok(b.every(x=>x.q.L===1));
  assert.ok(summarizePath(b).stepCV < .4);
  assert.ok(summarizePath(j).stepCV > 2);
});

// An area count based on a rectangular grid biases the dark corner.
test('near-neutral occupancy uses legal triangular area weights', async () => {
  const {areaNeutrality} = await import('./audit.mjs');
  const beta=await createHRLv2({gamut:'srgb'});
  const r=areaNeutrality(beta,273,{levelSamples:9,uSamples:9,thresholds:[.1,.2]});
  assert.equal(r.weights,'equilateral-area-L');
  assert.equal(r.valid,81);
  assert.ok(r.fractions['0.1']>=0&&r.fractions['0.1']<=r.fractions['0.2']);
  assert.ok(r.fractions['0.2']<=1);
  assert.ok(Number.isFinite(r.uAt20PercentChroma.p50));
});

// Selecting offsets per model would make the adaptive comparison incomparable.
test('adaptive hue offsets include defects from both baselines on one shared grid', async () => {
  const {chooseAdaptiveAngles} = await import('./audit.mjs');
  const rows=[
    {label:'beta1',rows:[{H:5,whiteEdgeCV:9,fixedReachRetreat:0},{H:10,whiteEdgeCV:1,fixedReachRetreat:1}]},
    {label:'joint',rows:[{H:5,whiteEdgeCV:1,fixedReachRetreat:0},{H:10,whiteEdgeCV:2,fixedReachRetreat:10}]}
  ];
  assert.deepEqual(chooseAdaptiveAngles(rows,[5,10],1).angles,[4.375,5.625,9.375,10.625]);
});

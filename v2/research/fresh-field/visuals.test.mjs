import test from 'node:test';
import assert from 'node:assert/strict';
import {createHRLv2} from '../../index.mjs';

// Wrong triangle orientation or a sRGB/linear mix makes these corners fail.
test('native sheet puts white, black, and the H120 yellow vivid at the three corners', async () => {
  const {renderSheet} = await import('./visuals.mjs');
  const model=await createHRLv2();
  const {pixels,width,height}=renderSheet(model,120,{width:31,height:35});
  const at=(x,y)=>[...pixels.slice(4*(y*width+x),4*(y*width+x)+4)];
  assert.deepEqual(at(0,0),[255,255,255,255]);
  assert.deepEqual(at(0,height-1),[0,0,0,255]);
  const vivid=at(width-1,(height-1)/2);
  assert.ok(vivid[0]>245&&vivid[1]>245&&vivid[2]<5&&vivid[3]===255);
  assert.equal(at(width-1,0)[3],0);
});

// Fractional sheet boundaries can differ by a floating-point ulp.
test('default resolution renders without an invalid-coordinate exception', async () => {
  const {renderSheet}=await import('./visuals.mjs');
  const model=await createHRLv2();
  const sheet=renderSheet(model,120);
  assert.ok(sheet.valid>5000);
});

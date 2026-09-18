/** Cross-gamut physical-hue check of the geometry-only radial transport.
 * This audit does not change any coefficients or boundary geometry.
 */
import fs from 'node:fs';
import {createSpectralTonalHRL} from './index.mjs';
import {createMappedHRL} from '../mapped-012/import.mjs';
const native=await createSpectralTonalHRL({gamut:'srgb',checkpoint:'boundary'});
const full=await createSpectralTonalHRL({gamut:'full',checkpoint:'boundary'});
const parent=await createMappedHRL({gamut:'full',checkpoint:'balanced'});
const delta=(a,b)=>Math.abs(((a-b+540)%360)-180);
const changes=[];let originalMax=0,checked=0,worst=null;
for(let i=0;i<4096;i++){
 const rgb=[(i*.61803398875)%1,(i*.41421356237)%1,(i*.73205080757)%1];
 const q=native.fromRGB(rgb);if(q.R<1e-5)continue;
 const xyz=native.toXYZ(q),newHue=full.fromXYZ(xyz).H,oldHue=parent.fromXYZ(xyz).H;
 const change=delta(newHue,q.H);changes.push(change);checked++;
 originalMax=Math.max(originalMax,delta(oldHue,q.H));
 if(!worst||change>worst.differenceDegrees)worst={rgb,xyz,nativeHue:q.H,oldFullHue:oldHue,repairedFullHue:newHue,differenceDegrees:change};
}
changes.sort((a,b)=>a-b);
const result={samplesAttempted:4096,chromaticSamples:checked,method:'Identical physical XYZ in native and full; low-chromaticness cases excluded. This is separate from fixed latent-hue tests.',
 originalMaximumNativeFullHueDifference:originalMax,
 repairedMeanNativeFullHueDifference:changes.reduce((a,b)=>a+b,0)/changes.length,
 repaired95thPercentileNativeFullHueDifference:changes[Math.floor(.95*(changes.length-1))],
 repairedMaximumNativeFullHueDifference:changes.at(-1),worst,
 interpretation:'The outer-boundary radial transport changes the full physical hue field slightly. It preserves latent labels, not exact physical hue agreement with the unchanged native chart. One shared R/L bank is retained, but exact cross-gamut hue equality is a remaining geometric-normalization limitation. Not a measured observer error; no refitting occurred.'};
fs.writeFileSync(new URL('results/hue-transport.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));

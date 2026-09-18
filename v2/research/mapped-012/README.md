# HRL 0.12 ordinary mapped imports and ColorBench rerun

This is an import-policy and evaluation change, not another fitted color space. The existing 0.12 balanced and gentle records, physical polygon, source charts, hue field, neutral progression and generated colors are unchanged. The 0.11 balanced parent is rerun as a comparison control. The pending 0.13 spectral-boundary revision is deliberately not included.

## Use ordinary mapped input

```js
import {createMappedHRL} from './import.mjs';
const hrl = await createMappedHRL({gamut:'full',checkpoint:'balanced',referenceWhiteNits:300});
const q = hrl.fromXYZ([0.4,1.2,0.2]);
const audit = hrl.importXYZ([0.4,1.2,0.2]);
// q is ordinary {H,R,L}; audit.events records any boundary or luminance mapping.
const from100nitSource = hrl.fromXYZ([1.140547112462006,1.2,1.3068693009118544],{sourceWhiteNits:100});
```

Luminance is converted through the declared source/target absolute white scales and bounded to relative Y<=1 by scaling XYZ together. Imaginary chromaticities use the existing D65-radial u-prime/v-prime projection. The native sRGB realization additionally clamps linear channels when outside that cube. The old clip flags did not implement this final native step. No above-white intensity coordinate is used; audit metadata is not another color coordinate.

Already-supported conversions and inverse colors are checked bit-identical. Nonfinite or malformed tuples remain errors. An unexpected benchmark conversion failure now aborts rather than becoming a silently omitted NaN row. Mapping is many-to-one, so an out-of-range original is not promised an exact round-trip.

## Rerun

```sh
node v2/research/mapped-012/test.mjs
python v2/research/mapped-012/run.py --colorbench /path/to/colorbench --pool /path/to/color-perception-datasets/datasets
python v2/research/mapped-012/report.py
```

ColorBench is pinned to 12b2de215cc5020682e3d245a8c78bce5f0ebbc9, and the pool to 8641f4e8ebd9d85a34dc0fedc116fa0e58493190. Both original Python judge functions and the original torch/NumPy forwarding helper are used. Only the five scored generation and sixteen scored measurement columns run. No extra unscored suite, tensor rescaling, local-derivative substitution, or optimization is performed.

Each of three checkpoints is evaluated in native and full realizations. All 3,813 COMBVD pairs are included in the mapped pipeline. Native has 482 mapped pairs; its original 3,331-pair supported subset remains separately reproduced. Full COMBVD needs no mapping and reproduces its previous values. Mapping counts in other tests are per input evaluation, not unique colors; events may overlap.

The original upstream skips and negative-XYZ preprocessing remain upstream. Finite mapped results do not imply that those original probes were all physically realizable. These are pipeline scores under the original tests. COMBVD is in-sample, and other datasets have prior project exposure.

[Score page](index.html) · [Full report](results/REPORT.md) · [Raw results](results/colorbench.json) · [CSV](results/scores.csv) · [0.12 comparison](../../hue-fair.html)

The comparison uses mapped evidence by default and retains a historical-strict selector. Switching that selector does not redraw or alter the triangles. Historical result files are untouched. New per-input event masks and raw pair arrays are preserved, along with source hashes and separate numerical and public-browser receipts.

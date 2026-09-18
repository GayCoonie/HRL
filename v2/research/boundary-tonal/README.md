# HRL 0.13: repaired boundary and shared tonal comparison

This additive experiment repairs the outer physical cone and continues Reach/Level fitting from 0.12 refined balanced. The original 0.12, the boundary-only realization of its unchanged coefficients, and two new shared-fit candidates remain separately identified. Previous pages and model records are not overwritten.

[Comparison](../../boundary-tonal.html) | [Results](results/REPORT.md) | [Normal retained COMBVD](results/retained-combvd.json) | [Design and evidence](DESIGN.md) | [Pre-fit plan](PLAN.md) | [Execution record](EXECUTION.md)

```js
import {createSpectralTonalHRL, addBlack, addWhite} from './index.mjs';
const native = await createSpectralTonalHRL({gamut:'srgb',checkpoint:'balanced'});
const full = await createSpectralTonalHRL({gamut:'full',checkpoint:'balanced'});
const boundaryOnly = await createSpectralTonalHRL({gamut:'full',checkpoint:'boundary'});
const q = native.fromRGB([0.3,0.2,0.7]);
const darkerXYZ = native.toXYZ(addBlack(q,0.2));
const whiterXYZ = native.toXYZ(addWhite(q,0.2));
const mapped = full.importXYZ([0.8,1.2,0.1],{sourceWhiteNits:100});
// mapped.coordinates contains only H,R,L; mapped.events records import adjustments.
```

R is chromaticness, K=1-L and W=L-R. Level remains brilliance/inverse blackness, not luminance or GenSpace lightness. One learned coefficient bank per candidate applies across realizations. Native sRGB source geometry is unchanged; full uses the corrected unsimplified 1-nm observer hull. Ordinary mapped imports apply source-white scaling, a joint-XYZ luminance ceiling and boundary mapping. No extra intensity coordinate is used.

The reference cone covers the specified tabulated/piecewise-linear CIE observer domain for relative Y<=1, with explicit table provenance and limits. It does not claim an exact continuous biological gamut. Native P3 profile support is not newly claimed; nominal-primary XYZ inputs can be mapped normally.

## Reporting

Panel scores and the first report table use the **normal retained-pair COMBVD**: native 3,331 pairs, full 3,813, no mapping. ColorBench's all-input mapped scores are separately labeled and include all 3,813 pairs for native too. Raw masks, mapping events, source hashes and population counts are preserved. Only the 5 scored generation and 16 scored measurement ColorBench columns are evaluated.

All new path regularizers use the frozen full-vector HelmLab GenSpace ruler, not Oklab or the previous scalar power target. The starting charts retain their development history. COMBVD was fitted; GenSpace regularizers are synthetic, and other datasets have prior project exposure. No new human preference data are invented.

## Reproduction and logs

Use Node 22.16.0, Python 3.13, numpy 2.3.5, scipy 1.17.0, colour-science 0.4.7 and torch 2.10.0 CPU. The original ColorBench and data commits are recorded in results/colorbench.json. Source grid generation is needed only to rerun optimization, not to load the runtime models.

```sh
python v2/research/boundary-tonal/build-boundary.py
python v2/research/boundary-tonal/prepare-inputs.py
node v2/research/boundary-tonal/prepare-coordinates.mjs
node v2/research/boundary-tonal/verify-boundary.mjs
HUES=96 GRID=193 node v2/research/boundary-tonal/cache-grid.mjs
# Recorded command JSON files specify each fitting invocation.
node v2/research/boundary-tonal/verify.mjs
python v2/research/boundary-tonal/parity.py
python v2/research/boundary-tonal/verify-jacobian.py
```

The review ZIP delivered in this conversation preserves every original JSONL evaluation trace, console log and intermediate checkpoint, including labeled aborted runs. The repository preserves the complete fitted arrays, command records, execution status, trace hashes and sampled progress summaries. It does not claim the abbreviated progress summaries are the full original traces. The large diagnostic grids are reproducible and omitted from the portable runtime.

The original grid-generation runtime is preserved as recovery/grid-runtime.mjs.txt because a subsequent fullVivid alias/allocation fix changed its source hash without changing coordinate outputs. This provenance is explicit in results/runtime-finalization.json.

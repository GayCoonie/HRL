# Native-sRGB counterparts to the HRL 0.9 refits

[Live two-gamut refit lab](../../refits.html) · [Scored native results](results/REPORT.md) · [Numerical verification](results/verification.json) · [Selected checkpoints](results/SELECTION.json)

These are genuine native-sRGB balanced and metric-leaning profiles. They are not the full-gamut outputs clipped to a monitor, and the factory no longer returns the same old native C1 calibration for both names. Full-gamut refits and all accepted predecessor entry points remain unchanged.

## The native construction

Both profiles use the existing, separately generated **sRGB source atlas** from `v2/a-smooth/source-srgb.json`, with C1 interpolation. Its vivid reference is the actual intersection of the shared observer-fitted hue sheet with the sRGB boundary, not the full-domain spectral endpoint. Before integration the auxiliary appearance coordinates are normalized against that hue/gamut's own black, D65 white, and vivid point. The source method is preserved in the atlas and in `v2/a-smooth/build-atlas.mjs`.

The same angular hue identities and physical hue sheets are shared across profiles. Equal HRL addresses in different gamuts need not represent identical XYZ. We fit native Reach/Level coupling separately, retaining the native source atlas, hue field/ring, neutral progression, and all native vivid endpoints. No full-gamut lookup or output clipping is used to manufacture the native colors.

As in the full refits, there are three analytically invertible coupling layers with six angular harmonics: 195 native R/L coefficients. The regular-bicone distance remains

```text
E(H,R,L) = [L-R/2, sqrt(3)/2 R cos(H), sqrt(3)/2 R sin(H)]
```

The native solid remains `0 <= R <= L <= 1`. H is converted to radians only for sine/cosine.

## Native results

Actual JavaScript runtime results on the same ColorBench-prepared native subset, with no clipping:

| Native profile | Weighted COMBVD STRESS | Unweighted STRESS | Pairs |
|---|---:|---:|---:|
| Previous native C1 | 27.819289 | 28.780616 | 3,331 |
| **Balanced / smoother** | **26.156618** | **27.735136** | **3,331** |
| **Metric-leaning** | **25.272446** | **26.976822** | **3,331** |

COMBVD was fitted. These are in-sample results, not independent validation. The native mask is identical for every model. Full-gamut scores use 3,813 pairs and must not be compared as if they used the same subset. All benchmark computation is in the actual embedded geometry, never Euclidean distance between raw H/R/L triples.

The full balanced and metric profiles retain their previous weighted scores, 27.822994 and 26.711042 respectively. Their stored definitions are unchanged and the new unified factory is tested against the old full entry point.

## Visual progression and selection

We used the same distinction as the full counterparts: balanced uses synthetic smoothness weight 0.20, metric-leaning 0.10. A pure metric-only control achieved 24.609360 weighted STRESS but made native ramps rougher; it was not selected for the live comparison.

The synthetic regularizer uses Oklab step-size variation, neighboring step changes, concentrated steps, and direction penalties. The optimizer's differentiable approximation uses 48 hues and a 161-by-161 cosine-spaced grid of actual native source XYZ. Only this regularizer uses interpolated grid samples; production conversion and final diagnostics call the real JavaScript transform.

Exact output-path validation uses 48 interleaved hues, 288 Reach ramps and 288 Level ramps, 257 samples per ramp, with three endpoint steps excluded at each end. These settings differ from the fitting grid.

| Diagnostic | Previous Reach | Balanced Reach | Previous Level | Balanced Level |
|---|---:|---:|---:|---:|
| Mean step CV | 0.612838 | 0.328279 | 0.303826 | 0.227274 |
| Mean neighboring step jump | 0.015943 | 0.013418 | 0.008627 | 0.006858 |
| Worst sampled step jump | 1.334153 | 1.190365 | 1.415376 | 1.251319 |

Balanced mean step variation falls **46.4% in Reach and 25.2% in Level**; mean local step jumps fall **15.8% and 20.5%**. Both selected variants improve these mean diagnostics relative to the previous native C1. These are numerical proxies, not observer preference judgments, and they do not establish that every local path improved. No screen blur or RGB blending is used.

The native display is genuinely in sRGB. The full-domain display is explicitly sRGB-clipped and includes a mask; those previews must not be mistaken for a faithful rendering of every full-gamut color.

## Other scored checks

All five scored generation and sixteen measurement columns were run after freezing the two selections. Unsupported native inputs are rejected rather than silently clipped. Some native scores therefore have incomplete dataset support and are marked in the report; no whole-board rank is claimed.

This is not a universal improvement. Native OSA spacing on the supported subset rises from 0.236671 to 0.251473 for balanced, and Hong threshold CV rises from 0.241622 to 0.265294. Other difference/threshold tests improve. Read the complete table, not just the COMBVD result. OSA, MacAdam1974, Xiao, and threshold/tolerance data were not used in this refit, but inherited hue-field fitting and prior development exposure remain part of provenance.

The 100-nit and 300-nit runs agree for the same relative XYZ. Reference-white unit conversions are preserved; no new absolute-luminance appearance response is asserted.

## Unified API

```js
import {createHRLRefits} from './v2/refits.mjs';
const srgb = await createHRLRefits({gamut:'srgb', checkpoint:'balanced'});
const srgbMetric = await createHRLRefits({gamut:'srgb', checkpoint:'metric'});
const full = await createHRLRefits({gamut:'full', checkpoint:'balanced'});
const q = srgb.fromRGB([0.2, 0.5, 0.8]);
const rgb = srgb.toRGB(q);
const xyz = srgb.toXYZ(q);
```

`checkpoint:'baseline'` selects the pre-refit profile for that gamut. Save gamut and checkpoint together with coordinates. The live page defaults to native sRGB/balanced, exposes both refits and the prior calibration, supports color picking, exact relative-XYZ readout, hex import, JSON export, a shareable view URL, and the two scored benchmark tables.

## Reproducibility

Base: `a5afe600dc38b4d8a929d48de87973fab8408fce`. The executable source/data subset supplied in the preceding verified artifacts is retained. ColorBench: `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`; dataset pool: `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`.

`fit-recipe.sh` recreates the training lineage without overwriting the published selected files. `prepare-inputs.py` reads already-preserved numeric COMBVD endpoints. `cache.mjs` constructs the true native source grid. `fit.py` records the objective and each trial; `results/TRAINING.json` records metrics and runtime versions. Nonconvex optimization can vary with the numerical environment; the frozen parameter hashes identify the delivered models.

`test.mjs` verifies the actual JS scores, identical retained masks, 8,192 triangle round-trips per native model, exact 16-bit RGB round-trips, gray codes, fixed vivid and neutral points, same physical hue identity, and unchanged full profiles. `benchmark.py` runs only the scored ColorBench columns. `visual.mjs` produces exact-path diagnostics; `DENSE=1` selects the final interleaved grid. `make-summary.py` builds the live site's evidence table from executed results, not hand-entered web scores.

No original library definition or accepted picker is overwritten. The website adds first-class navigation from the root and research hub to `v2/refits.html`.

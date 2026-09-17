# HRL 0.9 R/L refit on the corrected solid

**Review candidate, not an accepted release.** The full-domain carrier and hue definition are frozen. Native sRGB and all prior entry points remain unchanged.

[Interactive comparison](viewer.html) · [Offline single-file viewer](standalone.html) · [Scored ColorBench report](results/REPORT.md) · [Numerical verification](results/verification.json)

## Result

All scores below use the same ColorBench-prepared continuous XYZ endpoints and all 3,813 COMBVD pairs, with no stimulus clipping or rejection. Lower is better.

| Full profile | Traditional weighted STRESS | Unweighted STRESS |
|---|---:|---:|
| Corrected solid, inherited C1 fit | 37.221658 | 39.597921 |
| **Balanced / smoother refit** | **27.822994** | **28.901216** |
| Metric-leaning refit | 26.711042 | 27.618625 |

For context, the prior C1 checkpoint on the OLD capped full solid scored 28.447720 weighted / 29.565423 unweighted under this same ColorBench convention. The balanced refit improves on those old-solid difference scores too, without restoring the old domain cutoff. Do not mix these values with the slightly different HRL-stored white-point convention.

COMBVD was fitted: these improvements are **in-sample**. The numerical implementation agrees with the differentiable fit to the checked tolerance; the published benchmark scores call the real JavaScript transform.

## What was fitted, and what was not

Only the full profile's invertible R/L coupling coefficients were fitted. A third coupling layer was added, bringing the full R/L coefficient count from 130 to **195** (six angular harmonics). The global neutral shift is unchanged. Each layer has an analytic inverse and retains the unit interval, black, white, and vivid boundaries.

The following are unchanged: the polygonized physical cone, the 0 <= relative Y <= 1 solid, pseudo-RGB carrier, source-white Bradford conversion, default 300-nit reference context, high-magnitude hue continuation, physical hue sheets, HRL hue ring, regenerated full-domain source atlas, and the neutral progression. The regular-bicone embedding is still

```
[L - R/2, sqrt(3)/2 * R*cos(H), sqrt(3)/2 * R*sin(H)]
```

No Euclidean distance between raw H/R/L triples and no alternative color-space distance is substituted in the benchmark. The native-sRGB branch returns the unchanged previous C1 model.

## Smoothness is an explicit fitting objective

A metric-only refit recovered COMBVD but made the R/L ramps rougher. It was retained as a control, not selected as the visual candidate.

The selected fit combines traditional weighted COMBVD with a synthetic inverse-path regularizer: variation of neighboring Oklab steps, local step-size changes, concentrated large steps, and penalties for reverse luminance/chroma movement along the respective controls. A small Fourier coefficient penalty discourages high-frequency deformation.

Optimization uses exact source XYZ sampled on an endpoint-resolving cosine grid (48 hues, 193 x 193 source-coordinate positions), with bilinear lookup **only for the differentiable regularizer**. Production conversion never substitutes that approximate grid for the real source model.

Selection used COMBVD and synthetic path diagnostics. `results/SELECTION.json` freezes the primary and alternate checkpoints before the new human-data benchmark evaluation. OSA-UCS, MacAdam1974, Xiao, and threshold/tolerance measurements were not used in this refit. They are development checks, not an independent preregistered validation; inherited hue-field training and earlier exposure still exist.

## Exact generated-path check

Final validation calls actual JS `toXYZ`, then measures Oklab step sizes without clipping XYZ. It uses **48 interleaved hues**, 288 constant-Level Reach ramps and 288 constant-Reach Level ramps, with 257 samples per ramp. The first/last three steps are omitted from the summary. These hues and opposite-axis settings differ from the main training grid.

| Statistic | Reach before | Reach balanced | Level before | Level balanced |
|---|---:|---:|---:|---:|
| Mean within-ramp step CV | 0.910803 | 0.358659 | 0.458338 | 0.237104 |
| Mean neighboring step jump | 0.019465 | 0.015390 | 0.012071 | 0.008294 |
| Worst sampled step jump | 1.520626 | 0.847659 | 1.792285 | 0.958731 |

Mean within-ramp step variation falls **60.6% in Reach** and **48.3% in Level**. Mean neighboring step-size jumps fall **20.9%** and **31.3%**, respectively. The worst sampled jumps also decrease on both axes.

These are model-based visual diagnostics, not human preference ratings or a proof that every local path is better. Local irregularities remain. The full solid includes colors outside sRGB: about half the final path samples are outside display sRGB. Therefore the viewer explicitly labels its colorimetric sRGB clipping and supplies a mask. Saturated display contours, especially around cyan/blue/magenta, must not be mistaken for a faithful rendering of the entire full gamut. No image blur is used to make one model look smoother.

## New ColorBench checks

The five scored generation and sixteen measurement columns are recorded in `results/REPORT.md`, with strict and clipping-enabled import results separated. Notable full-domain results with complete unchanged-stimulus support:

| Dataset | Before | Balanced refit |
|---|---:|---:|
| OSA-UCS spacing CV | 0.334980 | 0.252630 |
| MacAdam 1974 STRESS | 36.941120 | 30.986596 |
| MacAdam 1942 threshold CV | 0.357852 | 0.275755 |
| Regan threshold CV | 0.301323 | 0.227057 |
| Hong threshold CV | 0.301022 | 0.314120 |

Hong is a regression. The constant-hue scores remain unchanged, as intended. Some other dataset inputs require the already-declared clipping policy, so no overall whole-board rank is invented. All details and mapping counts are kept.

The 100- and 300-nit cases give identical results for identical relative XYZ. This refit does not invent absolute-luminance sensitivity. The unit conversions and default reference conditions are unchanged.

## API and review

```js
import {createRelativeRefit} from './v2/research/relative-refit/index.mjs';
const model = await createRelativeRefit({
  gamut: 'full', checkpoint: 'balanced', referenceWhiteNits: 300,
  overflow: 'clip', imaginary: 'clip'
});
const q = model.fromXYZ([0.2, 0.3, 0.1]);
const xyz = model.toXYZ(q);
const e = model.embed(q);
```

`checkpoint:'metric'` selects the fixed metric-leaning alternate. `gamut:'srgb'` returns the unchanged native C1 calibration. The viewer renders before/balanced/metric at matching HRL addresses and exposes true relative XYZ under the pointer. It is not blending the models in RGB.

`standalone.html` embeds only the required model data and our JS; it needs no network to render. The modular viewer requires HTTP serving (including GitHub Pages). For local use, serve the repository root with `python3 -m http.server 8000` and open `/v2/research/relative-refit/viewer.html`.

## Reproduction

Base HRL snapshot: `70cb77d14060b3231d817487e27413e0107e87ba`. ColorBench: `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`. Dataset pool: `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`.

Local fitting used Python 3.13.5, PyTorch 2.10.0+cpu, NumPy 2.3.5, SciPy 1.17.0, Colour 0.4.7, Node 22.16.0, CPU float64, and one Torch thread. `fit-recipe.sh` reproduces the selected training lineage without automatically overwriting the published frozen parameters. Nonconvex optimization can follow different trajectories with changed libraries or hardware; the supplied checkpoint bytes and JS tests identify the exact delivered models.

`cache.mjs` and `cache-fine.mjs` regenerate the training cache from the preserved COMBVD endpoints and the real source model. `fit.py` contains the objective. `test.mjs balanced metric` checks actual-runtime scores, random/extreme round-trips, anchors, hue, neutral progression, native equality, integer packing, and reference-white invariance. `visual.mjs` reproduces the screen; set `DENSE=1` for the final interleaved grid. `benchmark.py` runs scored ColorBench, only after a selection record exists.

The data and code were inspected and fitted without changing the accepted 0.8A/A Smooth/C1/relative-domain definitions. All additions live in this research directory.

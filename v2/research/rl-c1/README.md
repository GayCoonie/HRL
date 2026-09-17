# R/L C1 balanced — HRL v2 review candidate

**Experimental, additive, not an accepted release.** The approved A Smooth picker, definitions, core library, hue field, and root defaults are unchanged. The requested 0.8A ColorBench baseline was completed before this continuation was fitted.

[Open the four-way comparison](viewer.html) · [Baseline report](../colorbench-0.8a/README.md) · [Preview sheet](results/preview.png) · [Verified checkpoint](candidate.json)

## Result

Traditional weighted COMBVD on the repository’s unchanged stored inputs (lower is better):

| Model | Native sRGB, 3,331 pairs | Full domain, 3,813 pairs |
|---|---:|---:|
| 0.8A parent | 27.907880 | 28.607473 |
| Approved A Smooth | 28.172398 | 28.955307 |
| C1 interpolation only, on Smooth | 28.171477 | 28.968100 |
| **C1 balanced** | **27.833646** | **28.489588** |

These are real JavaScript runtime results, not only optimizer estimates. All retained-index masks are unchanged. COMBVD is training data; these gains must be described as in-sample.

ColorBench has a different, unweighted convention and slightly different D65 preprocessing. Its full-domain unweighted pooled COMBVD changes from **29.608930** (0.8A) to **29.565423** (candidate); native supported-pair scores change from **29.140616** to **28.780616**. Do not mix these values with the traditional table above.

## What changed

1. The frozen path atlas’s piecewise-linear parameter interpolation is replaced by monotone cubic Hermite interpolation, with an algebraic slope construction and safeguarded inverse. This removes path-parameter slope discontinuities at atlas knots.
2. The secondary coordinate uses an open/clamped cubic B-spline with nonnegative weights and Greville-sampled controls. This smooths interpolation between stored rows while preserving their order and exact endpoint rows. Hue interpolation is not replaced.
3. The existing two-layer Fourier R/L coupling is refitted with a trust-region penalty on displacement, first differences, and second differences, evaluated on actual A Smooth physical samples at a triangular R/L grid. The neutral shift is frozen.
4. Three regularization strengths (2, 0.5, 0.125) are preserved in `results/`. The strongest-regularized fit was selected, then its **native-sRGB coefficient change was halved** after output-ramp checks exposed a Level-tail tradeoff. The full-domain calibration retains the strength-2 fit. This is permitted by the existing separately calibrated profiles; no gamut relabeling or domain expansion occurred.

No OSA, Xiao, MacAdam1974, or threshold/tolerance dataset was fitted in this continuation. The candidate was fixed before evaluating its ColorBench held-out results. No claim is made that all of the inherited hue-field training data are held out.

## Actual generated R/L paths

The check generates continuous XYZ along 144 Reach ramps and 144 Level ramps: 24 hues, six fixed opposite-axis coordinates, 129 samples per ramp. It converts those colors to Oklab, omits the three endpoint steps on each end, and measures neighboring step-size jumps. This is a diagnostic proxy, **not observer testimony or an extra ColorBench score**.

| Statistic | Reach: A Smooth | Reach: C1 balanced | Level: A Smooth | Level: C1 balanced |
|---|---:|---:|---:|---:|
| Mean neighboring step jump | 0.029534 | 0.027377 | 0.014534 | 0.013829 |
| Mean per-ramp 95th-percentile jump | 0.091291 | 0.082091 | 0.056980 | 0.056556 |
| Worst sampled step jump | 1.271981 | 1.044215 | 1.056415 | 1.016818 |
| Mean within-ramp step CV | 0.531327 | 0.538619 | 0.255432 | 0.258918 |

Compared with A Smooth, mean adjacent step-size jumps fall **7.30% in Reach and 4.85% in Level**. The mean tail-jump statistic and worst sampled jump also improve for both axes. However, mean within-ramp CV becomes about **1.37% worse** on each axis: smoother local transitions are not identical to globally more equal perceptual spacing. All these aggregate path measures are better than 0.8A, but local per-ramp regressions remain possible; inspect the comparison rather than treating an average as universal.

## Scored ColorBench follow-up

Selected full-domain results, with complete dataset support for every row below:

| Dataset | 0.8A | A Smooth | C1 balanced |
|---|---:|---:|---:|
| OSA-UCS spacing | 0.309323 | 0.314833 | 0.300851 |
| MacAdam 1974 STRESS | 32.806409 | 31.914425 | 31.680924 |
| Leeds STRESS | 27.364162 | 27.368794 | 27.479856 |
| Huang tolerance CV | 0.291347 | 0.306890 | 0.306295 |

OSA and MacAdam improve without having entered this fit; Leeds and Huang demonstrate that it is not a clean sweep. OSA remains substantially worse than strong published spacing baselines. The constant-hue scores are unchanged, as they should be for a frozen-hue R/L-only edit.

All five generation and sixteen measurement columns are stored for the candidate in the adjacent benchmark results. Domain support remains limited exactly as before. In particular, some Hung–Berns inputs and Brown-1957 ellipsoid neighborhoods lie outside the bounded model. No overall leaderboard rank is manufactured from silently omitted inputs.

## Invariants and verification

`node v2/research/rl-c1/test.mjs` checks the published candidate directly. For each profile it verifies 4,096 random triangle round-trips, 1,024 exact integer-16 round-trips, 256 exact gray-8 round-trips, 720 unchanged vivid endpoints, 1,025 unchanged neutral samples, preserved hue identity, monotone atlas rows, and random interior atlas inverses. Full-domain integer tests use its existing carrier channels, not a claim of Rec.2020 coverage.

Maximum measured embedding round-trip error: **1.53e-11 native**, **1.86e-13 full**. Measured hue change and neutral XYZ change are zero. The triangle bicone metric is unchanged. Its existing physical gamut boundaries, bounded-brightness limitation, and inherited hue-field limitations remain. The numeric cubic bracket guard corrects floating-point roundoff only; it is not an input-color clipping operation.

## Use and reproduce

```js
import { createRLC1 } from './v2/research/rl-c1/index.mjs';
const model = await createRLC1({ gamut: 'srgb', variant: 'candidate' });
const q = model.fromRGB([0.2, 0.5, 0.8]);
const rgb = model.toRGB(q);
```

Use `variant:"smooth"` for the C1 interpolation-only model, or `variant:"parent"` for the C1 interpolation-only parent trial. These are experiments, not the original unchanged reference models. Obtain those through `createASmooth` in `v2/a-smooth/index.mjs`.

For local review, serve the repository root with `python3 -m http.server 8000` and open `/v2/research/rl-c1/viewer.html`. Four models are rendered through their actual inverse transforms in a worker; there is no image blur or cross-model RGB blend.

Fitting requires Node, NumPy, and CPU PyTorch. Run `cache-fit.mjs`, then `fit.py`, then `select_balanced.py`, then `test.mjs`. Retraining can vary with numerical-library versions; the published `candidate.json` and its verification hash identify the exact tested checkpoint. `visual-paths.mjs` and `visual-balanced.mjs` reproduce the output-path checks. ColorBench scored execution is documented in the adjacent baseline README.

## Provenance

All work is additive to HRL `5552223b1d51a07c869a01d3cae81847e4c0c13f`. ColorBench is pinned to `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`; its data pool to `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`. The baseline and candidate JSON files record versions, model/data hashes, every score, and domain rejections.

Full source training records and physical hue-field definitions are inherited, not independently re-estimated here. The held-out assays are a single development evaluation after selecting this candidate, not a preregistered external validation study.

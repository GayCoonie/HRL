# HRL 0.9 relative-domain correction

This is an additive research implementation. The original 0.8A, approved A Smooth, C1 candidate, and Release 1 entry points remain unchanged.

## The domain and carrier

The corrected full reference solid is explicitly the polygonized physical XYZ chromaticity cone intersected with **0 <= relative Y <= 1**. This is a reference-relative emissive solid, not a spectral-reflectance/object-color solid. X and Z are not individually capped at 1.

The previous white-completion gauge answers how much D65 light is needed to complete a stimulus. It is retained as a geometric quantity but is no longer treated as relative luminance or a physical admission limit. The bounded pseudo-RGB carrier instead has `max(channels) = relative Y` and encodes chromaticity through an independent spectral-boundary mapping. Every polygonized physical chromaticity has the whole declared Y range. Its integer packing and floating-point conversion are distinct operations.

The floating carrier additionally accepts `extended:true`, preserving Y > 1. The bounded H/R/L bicone does not grow an extra coordinate or above-white slot.

## Reference conditions and input policy

`referenceWhiteNits` defaults to **300**. Public XYZ is still relative. Multiplication/division by this scalar converts relative/absolute units. Bradford adaptation is applied when a caller declares a different source reference white. Input XYZ on a 0-to-100 scale must declare `xyzScale:100`; its units are not guessed.

```js
import {createRelativeHRL, D65} from './index.mjs';
const hrl = await createRelativeHRL({
  gamut: 'full', variant: 'candidate', referenceWhiteNits: 300,
  overflow: 'clip', imaginary: 'clip'
});
const q = hrl.fromXYZ([0.2, 0.3, 0.1]);
const absoluteXYZ = hrl.toAbsoluteXYZ(q);
const imported = hrl.importXYZ([20, 30, 10], {
  sourceWhite: [0.96422, 1, 0.82521], xyzScale: 100
});
console.log(imported.coordinates, imported.events);
```

The default above-white policy implements the requested clipping: for Y > 1, scale all three XYZ components together to make Y = 1, preserving chromaticity. This is reported as `luminance-clipped`, not mislabeled as an imaginary chromaticity. Relative Y=1.2 corresponds to 120 nits under a 100-nit reference; declaring absolute units does not magically bring it inside that same bounded reference solid.

A genuinely nonphysical chromaticity can be rejected or explicitly projected radially from D65 onto the polygonized spectral boundary. Nonpositive-Y imaginary inputs map to black in clip mode. These operations are separately counted. Nonfinite input always raises an error. `overflow:'reject', imaginary:'reject'` selects strict import; the unit-conversion context and extended floating carrier preserve larger physical intensities without clipping.

## Coordinate and appearance consequences

Correcting the physical domain necessarily changes its full-gamut vivid endpoints and relative coordinate allocation. The builder regenerates the original auxiliary brightness/chromatic-content path maps on the corrected solid. It does **not** refit any COMBVD or human-observer coefficients. Parent and C1 coupling coefficients remain identifiable inherited checkpoints. Native sRGB keeps its existing physical chart and fitted coordinates.

Inside the original hue field's fitted magnitude range, its hue labels are retained. Beyond that range, the final fitted magnitude slice is held constant. This is an explicit extrapolation rule, not evidence that those new colors were included in the original observer fit. The resulting constant-Y hue shells are numerically checked for order before building the atlas.

The metric is still the actual regular-bicone embedding:

```
[L - R/2, sqrt(3)/2 * R*cos(H), sqrt(3)/2 * R*sin(H)]
```

H is in radians only for sine/cosine. Neither raw H/R/L Euclidean distance nor a replacement perceptual metric is used.

## 100 versus 300 nits

Both settings are run through the scored benchmark with identical relative inputs. The inherited appearance calibration is relative and has no newly fitted absolute-luminance response. Identical outputs therefore establish unit-scale invariance, not an empirical preference for 300 over 100. Absolute inputs, by contrast, become different relative values when the reference white changes. No numerical nits sensitivity is invented by arbitrarily changing hue-field coefficients.

## Reproduction and evidence

From the repository root:

```sh
node v2/research/relative-domain/build.mjs
node v2/research/relative-domain/test.mjs
python v2/research/relative-domain/benchmark.py \
  --colorbench /path/to/colorbench \
  --pool /path/to/color-perception-datasets/datasets
```

ColorBench is pinned to `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`; the pool to `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`. The workflow only runs the five scored generation and sixteen scored measurement columns. It omits unscored appearance, application, HumanFB ordinal, and physics-gate suites. The separate numerical implementation tests cover the carrier, inverse mapping, clipping, Bradford, and unit conventions.

Results are generated under `results/`: `REPORT.md`, `colorbench.json`, `scores.csv`, raw per-pair COMBVD arrays, `verification.json`, and `build-audit.json`. Clipped-input and strict results are separate. No overall leaderboard rank is claimed from a clipped pipeline. Old full-profile results are rerun as controls. Benchmark datasets are not used for a new optimization.

Sources: W3C CSS Color 4, XYZ and Bradford conversion conventions; Colour's Jzazbz API for the distinction between relative XYZ and absolute-luminance input; the pinned ColorBench code for all scored judges. The new geometry and continuation policy are HRL modeling decisions, not claims imposed by these sources.

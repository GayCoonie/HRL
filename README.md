# HRL — Hue, Reach, Level

<!-- HRL DUAL REFITS START -->
## Current v2 refits: native sRGB and full gamut

[Open the live refit lab](https://gaycoonie.github.io/HRL/v2/refits.html) · [Native construction and fitting](v2/research/native-srgb-refit/README.md) · [Native scored report](v2/research/native-srgb-refit/results/REPORT.md) · [Full scored report](v2/research/relative-refit/results/REPORT.md).

Both balanced/smoother and metric-leaning profiles now have genuine native-sRGB calibrations. The native vivid endpoints and source maps belong to sRGB, not a clipped full solid. The full-gamut refits are unchanged. The new page defaults to native sRGB, includes a gamut switch, color selection/export, and both scored benchmark tables. These are named research checkpoints, not a replacement of Release 1 or the approved A Smooth prototype.

```js
import {createHRLRefits} from './v2/refits.mjs';
const native = await createHRLRefits({gamut:'srgb', checkpoint:'balanced'});
const metric = await createHRLRefits({gamut:'srgb', checkpoint:'metric'});
const full = await createHRLRefits({gamut:'full', checkpoint:'balanced'});
```

<!-- HRL DUAL REFITS END -->

<!-- HRL A SMOOTH APPROVED -->
## Approved v2 prototype: A Smooth

[Open A Smooth](https://gaycoonie.github.io/HRL/v2/a-smooth.html) · [Source and reproducibility](v2/a-smooth/README.md). The approved original-ring R/L fit is the default on this new page. A parent remains selectable. Weighted COMBVD: **28.1724** (3,331 sRGB pairs), **28.9553** (3,813 full-domain pairs). Magenta is an acknowledged follow-up, unchanged here. The Release 1 picker and prior v2 pages remain available.


This repository is the standalone JavaScript reference implementation of **HRL R15-D Release 1**. It contains the selected color-space definition itself, with no dependency on the HRL Studio website.

HRL is a bounded display-gamut color space whose slices are regular equilateral bicones:

- **Hue** is an observer-fitted angular coordinate in degrees.
- **Reach** runs from the grayscale axis to the vivid boundary.
- **Level** runs from black toward white, constrained by `0 ≤ Reach ≤ Level ≤ 1`.

Release 1 preserves the black, white, vivid, and grayscale anchors while applying the selected R15-D interior progression. The same R15-D coordinate layers are implemented for both sRGB and Rec.2020; the Rec.2020 base projection is HRL's existing wide-gamut appearance projector.

## Use

```js
import { createHRL } from './src/index.mjs';

const hrl = await createHRL({ gamut: 'srgb' });

const coordinates = hrl.fromRGB([1, 0.25, 0.1]);
// { H: degrees, R: 0..1, L: R..1 }

const rgb = hrl.toRGB(coordinates);
const xyz = hrl.toXYZ(coordinates);

const wide = await createHRL({ gamut: 'rec2020' });
const wideCoordinates = wide.fromRGB([0.8, 0.2, 0.95]);
```

Inputs and outputs use encoded channel values in the selected gamut. `fromXYZ()` and `toXYZ()` use relative CIE XYZ with D65 white.

## Regular-bicone metric

`embed()` maps HRL to Cartesian coordinates in ColorBench-compatible component order:

```text
neutral-axis = Level - Reach / 2
opponent-x   = (sqrt(3) / 2) Reach cos(Hue)
opponent-y   = (sqrt(3) / 2) Reach sin(Hue)
```

`distance()` is Euclidean distance in that regular bicone. `distanceRGB()` converts two colors through HRL first.

## API

- `createHRL({ gamut: 'srgb' | 'rec2020' })`
- `model.fromRGB([r, g, b])`
- `model.toRGB({ H, R, L })`
- `model.fromXYZ([X, Y, Z])`
- `model.toXYZ({ H, R, L })`
- `model.embed({ H, R, L })`
- `model.distance(a, b)`
- `model.distanceRGB(rgbA, rgbB)`

All release coefficients, fitted tables, ring calibration, and wide-gamut calibration needed by the implementation are included under `src/data/`.

## Verification

```sh
npm test
```

The test suite checks both profiles, the exact triangle corners, RGB/HRL and XYZ/HRL round trips, in-gamut output, and the regular-bicone metric.

The Rec.2020 transfer is executable and invertible, but Release 1's observer fitting data was sRGB-based; wide-gamut observer accuracy has not yet been independently validated.


<!-- HRL V2 RESEARCH -->
## HRL v2 research (separate from Release 1)

The root picker and `src/` library remain **R15-D Release 1**. New research pages and libraries live under `v2/`; they do not replace v1.

- [BASR 0.4 picker](https://gaycoonie.github.io/HRL/v2/basr.html): Black-Anchored Semantic Remap.
- [V2 research hub](https://gaycoonie.github.io/HRL/v2/): native 0.2 and observer 0.1 comparisons, version notes, and module links.
- [V2 library and reproducibility](v2/README.md).

Import `createHRLv2` from `./v2/lib/index.mjs` for the prototype. The default v1 entry point is unchanged.

## Equal-Span and OPAL research candidates

[OPAL 0.6](https://gaycoonie.github.io/HRL/v2/opal.html) and [Equal-Span 0.5](https://gaycoonie.github.io/HRL/v2/equal-span.html) are additional experimental pages. [Their separate library and numerical evidence](v2/research/equal-span/README.md) preserve the current v1 implementation and BASR 0.4. These candidates change path parameterization; OPAL additionally uses an experimental hue refit. They are not an across-the-board improvement on observer or COMBVD scores.

## OPAL 0.7 gamut-anchor research

[Open the 0.7 comparison picker](v2/opal-anchor.html) · [Methods, source intake and scores](v2/research/anchor-0.7/README.md). The default balances direct COMBVD fitting against the accepted OPAL 0.6 layout. Its own-gamut anchor controls normalization throughout the R/L construction. OPAL 0.6 and Release 1 are preserved. These are explicitly in-sample research fits, not an accepted Release 2.

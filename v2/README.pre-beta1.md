# HRL v2 research: Black-Anchored Semantic Remap

<!-- HRL DUAL REFITS START -->
## Current v2 refits: native sRGB and full gamut

[Open the live refit lab](https://gaycoonie.github.io/HRL/v2/refits.html) · [Native construction and fitting](research/native-srgb-refit/README.md) · [Native scored report](research/native-srgb-refit/results/REPORT.md) · [Full scored report](research/relative-refit/results/REPORT.md).

Both balanced/smoother and metric-leaning profiles now have genuine native-sRGB calibrations. The native vivid endpoints and source maps belong to sRGB, not a clipped full solid. The full-gamut refits are unchanged. The new page defaults to native sRGB, includes a gamut switch, color selection/export, and both scored benchmark tables. These are named research checkpoints, not a replacement of Release 1 or the approved A Smooth prototype.

```js
import {createHRLRefits} from './refits.mjs';
const native = await createHRLRefits({gamut:'srgb', checkpoint:'balanced'});
const metric = await createHRLRefits({gamut:'srgb', checkpoint:'metric'});
const full = await createHRLRefits({gamut:'full', checkpoint:'balanced'});
```

<!-- HRL DUAL REFITS END -->

<!-- HRL A SMOOTH APPROVED -->
## Approved v2 prototype: A Smooth

[Open A Smooth](https://gaycoonie.github.io/HRL/v2/a-smooth.html) · [Source and reproducibility](a-smooth/README.md). The approved original-ring R/L fit is the default on this new page. A parent remains selectable. Weighted COMBVD: **28.1724** (3,331 sRGB pairs), **28.9553** (3,813 full-domain pairs). Magenta is an acknowledged follow-up, unchanged here. The Release 1 picker and prior v2 pages remain available.


**Current named prototype: BASR 0.4 (Black-Anchored Semantic Remap).**

These are additional pages and modules. The root picker and `src/index.mjs` remain **R15-D Release 1**. No v1 color conversion, coefficient, or default is replaced.

## Pages

- [BASR 0.4](basr.html): the new global Level remap, exact sRGB import, native triangle gallery, un-clipped 0.2 comparison, and share readouts.
- [Native 0.2](native-0.2.html): preserved linear-light sRGB-native triangles, with the optional old clipped full-domain preview clearly distinguished.
- [Observer field 0.1](hue-field-0.1.html): preserved arbitrary-label full-domain hue inspector. Its clipped display preview is not an sRGB-native model.
- [Research hub](index.html).

All three generated viewers are standalone HTML: save/open them locally, with no network required for rendering. The modular library also runs in Node; for browser module imports serve the repository over HTTP or use GitHub Pages.

## The definition

For normalized coordinates `0 <= R <= L <= 1`, let `u = R/L` (zero at black). `u` is an internal vivid fraction, **not a replacement name or definition for the public Reach axis**.

The globally shared tonal function is the inverse normalized CIE L* curve:

```
Q(L) = 2700 L / 24389                 if L <= 0.08
       ((25 L + 4) / 29)^3           otherwise

L_base = Q(L)
R_base = Q(L) (R/L)                   for L > 0
R_base = L_base = 0                  at black
```

The existing gamut/hue solver receives those base coordinates. The observer coefficients, angle attachment, and boundary intersections are unchanged. This is a coordinate remap, not another observer refit.

Base-chart barycentric shares are:

```
black = 1 - Q(L)
vivid = Q(L) u
white = Q(L) (1-u)
```

They sum to one. Level fixes the black amount independently of Reach; changing Reach at fixed Level exchanges the nonblack amount between neutral and vivid. At fixed **R/L**, lowering Level preserves that exchange ratio while increasing black. At fixed **R**, R/L changes as Level changes. No unsupported claim of perceptually monotonic blackness for every possible path is made.

In native sRGB, `max(linear RGB) = Q(L)` and `min(linear RGB) = Q(L)(1-R/L)`. The remaining RGB-edge coordinate is solved again to stay on the original hue sheet. The shares are coordinates of that gamut chart, not a claim that the curved hue sheet is a straight mixture of one fixed XYZ vivid color and white.

The neutral axis remains straight: `XYZ = Q(L) * W_D65`. Its midpoint is `Y=0.18418651851244416`, or sRGB approximately `#777777`, not the earlier half-luminance `#BCBCBC`. This adopts CIE L* spacing on neutrals; it does **not** redefine all chromatic HRL Level values as CIELAB lightness or prove global perceptual uniformity.

### Boundaries and inverse

- Black-to-vivid: `R=L=t` becomes base `R=L=Q(t)`. Zero white share; the same physical arm, traversed with the new tonal progression.
- White-to-vivid: `L=1`, so base `R=R, L=1`. This arm and every vivid endpoint are unchanged.
- Gray axis: `R=0`, exactly `Q(L) W_D65` for every hue.
- Interior: the identical remap is applied everywhere, without a neutral-only special patch.

The inverse first obtains `(H,R_base,L_base)` from the existing model, then uses:

```
L = Q_inverse(L_base)
R = L (R_base / L_base)              for L_base > 0
R = L = 0                           at black
```

Both Q and the ratio transformation are invertible. The public distance is still the Euclidean chord distance in the regular equilateral bicone:

```
embed(H,R,L) = [L-R/2, sqrt(3)/2 R cos(H), sqrt(3)/2 R sin(H)]
```

H is converted to radians. **The embedding takes public BASR R/L, not remapped base coordinates.** The new model therefore changes distances between physical colors, as intended; it cannot inherit an old COMBVD number as its own.

## Library

ES modules, no dependencies:

```js
import {createHRLv2} from './v2/lib/index.mjs';

const hrl = await createHRLv2({gamut:'srgb', variant:'basr'});
const q = hrl.fromRGB([0.2, 0.5, 0.8]); // encoded sRGB, continuous precision
const rgb = hrl.toRGB(q);
const xyz = hrl.toXYZ(q);
const shares = hrl.shares(q);
const distance = hrl.distance(q, {H:270, R:0.4, L:0.7});

const prior = await createHRLv2({gamut:'srgb', variant:'linear'}); // native 0.2
const full = await createHRLv2({gamut:'full', variant:'basr'});
const fullCoordinates = full.fromXYZ(xyz); // stimulus-preserving, not coordinate reinterpretation
const pseudo = full.toPseudoRGB(fullCoordinates);
const recovered = full.fromPseudoRGB(pseudo);
```

Full-domain conversions do not silently render to sRGB. Use `toXYZ` or `toPseudoRGB`; a display preview is a distinct operation. Native XYZ import rejects out-of-sRGB colors, except for the previously declared tiny matrix-roundoff tolerance. The full carrier rejects colors outside its reference-relative solid.

The `BASRModel` wrapper and the pure functions `levelToNonblack`, `nonblackToLevel`, `toBaseCoordinates`, `fromBaseCoordinates`, and `basrShares` are also exported directly. The full-domain adapter uses the existing bounded 16-bit pseudo-RGB construction; it does not add HDR headroom.

## Reproduce

```sh
node v2/build.mjs                 # standalone pages
node v2/build.mjs --link-root     # also add v1 navigation/docs, idempotently
node v2/test/test.mjs             # extended numerical tests, about a few tens of seconds
node v2/test/test.mjs --quick     # shorter CI run
```

The browser smoke test under `test/` additionally requires Playwright and Chromium. It exercises the embedded standalone HTML. This environment blocks file/HTTP navigation, so the harness uses set_content; browser module-loading and remote-site behavior are not claimed. ES-module execution is verified separately in Node.

### Data and lineage

`lib/hue-field.mjs`, `lib/srgb-triangles.mjs`, and `data/hue-field.json` are unchanged from the 0.2 source bundle. The full coefficient-packet SHA-256 remains:

```
4b5c6af4bf3996275f39ddf99024d6d8357502f9be7782a4a0634a39f5a745d3
```

`data/release1-angles.json` stores all 1,530 original Release 1 angles. Their RGB8 coordinates and XYZ are regenerated from the fixed six-edge inventory and original sRGB matrix without rounding. The reconstructed entries were checked against the full extracted ring record, rather than replacing the released angles with an older calibration table. Source release: commit `77bfa09375ba8814f5caea3c3b05b2a9c96d1081`.

The physical full-domain boundary still uses the earlier declared 5 nm CIE 1931 spectral/purple-boundary approximation. The original observer fit and its extrapolation limits remain those described in `docs/`. No new hue training or difference-data training was performed for BASR.

The reproducible predecessor here is native **0.2**. The name **0.4** follows the subsequent semantic-remap discussion; no separate 0.3 artifact or result is asserted by this repository.

### Verification and benchmark status

`results/basr-verification.json` records the new extended run. It includes all 390,152 unique RGB8 boundary colors, all 393,210 RGB16 vivid-edge codes, all 65,536 RGB16 grays, 30,000 random RGB8 and 30,000 random RGB16 colors, 5,000 full-carrier code round trips, and structural checks. All tested integer round trips had zero mismatches. This is not an exhaustive RGB8 interior or 2^48 full-carrier census.

`historical-0.2-*` receipts refer to the earlier model and retain that labeling. Small computational errors are not human observer errors.

The requested COMBVD baseline for native/full profiles, individual subdatasets, and traditional weights remains **pending**. No new score is supplied or inferred from an old release. This change deliberately does not mix a benchmark or fit into the tonal remap.

## References

- CIE lightness equation: https://cie.co.at/eilvterm/17-23-076 . Q is the algebraic inverse with L*=100L.
- sRGB/XYZ matrix and display transfer conventions: https://www.w3.org/TR/css-color-4/#color-conversion-code .
- `docs/OBSERVER_FIELD_0_1_SOURCE_AUDIT.md` preserves the original dataset audit and distinctions between experiment, fitting, and continuation.

No font files, private chat transcripts, or credentials are part of this addition. The visual theme references locally installed fonts only. The v1 source and data are not modified.

## Later research candidates

[Equal-Span 0.5 and OPAL 0.6](research/equal-span/README.md) are implemented separately in `lib/research.mjs`. BASR 0.4 and this original definition are preserved. The [new benchmark record](research/equal-span/BENCHMARKS.md) supersedes the old pending status above with measured, explicitly scoped baselines.

## OPAL 0.7 gamut-anchor research

[Open the 0.7 comparison picker](opal-anchor.html) · [Methods, source intake and scores](research/anchor-0.7/README.md). The default balances direct COMBVD fitting against the accepted OPAL 0.6 layout. Its own-gamut anchor controls normalization throughout the R/L construction. OPAL 0.6 and Release 1 are preserved. These are explicitly in-sample research fits, not an accepted Release 2.

<!-- shared-rl -->
## Shared R/L dark-edge research

[Live comparison](shared.html) retains prior refits and adds one learned R/L bank per candidate across gamut realizations. See `research/shared-rl` under v2 for the plan, evidence, tests and explicit tradeoffs.

<!-- tonal-semantics -->
## GenSpace tonal operations research

[Black/white operations lab](research/tonal-semantics/) compares unchanged shared 0.10 candidates with a GenSpace ruler. It implements distinct black dilution, white dilution and fixed-Reach neutral exchange, plus local per-hue preference export. Definitions, source roles, raw audit and algebraic tests are in `v2/research/tonal-semantics`. This is a research/diagnostic addition, not a newly fitted colour-space release.

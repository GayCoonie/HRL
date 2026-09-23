# Fresh physical Reach/Level field — unfitted seed

This is a research factory for a new shared tonal model. It does not change Beta 1,
the frozen joint fit, the angular vivid ring, the hue field, import policy, or
the bounded pseudo-RGB carrier. Its two positive-density curves and one
chromatic lift coefficient use a single record for both native sRGB and full.
The gamut supplies its own physical chart. No Beta 1 or joint tonal coefficient
initializes the new field. The one inherited neutral shift is preserved so
the gray axis exactly matches Beta 1.

For public `0 <= R <= L <= 1`, let `G(L)` be the inherited gray ruler:

```text
G(L) = inverseNormalizedLstar(unitWarp(L, -neutral_shift))
```

For each hue `H`, `f_H` (Reach allocation) and `p_H` (chromatic Level lift)
are normalized integrals of a positive density. At the five knots in the seed,
the log density is a Fourier row (constant, first and second cosine/sine
harmonics) passed through `cap*tanh(raw/cap)`; density is interpolated linearly
between knots and integrated exactly. It follows that both curves increase,
are C1, and have exact endpoints 0 and 1. The seed's zero coefficient rows
make both curves identity. A third Fourier row supplies
`gain(H) = max_gain*sigmoid(row(H))`; its seed is 0.15 everywhere.

The forward map uses native `a=max(linear RGB)` and `s=1-min/max`, or full
`a=relative Y` and `s=physical boundary purity`:

```text
a = G(L) + (1-G(L))*gain(H)*p_H(R)
s = f_H(R)/f_H(L)
base = {H, R:a*s, L:a}
```

Black, white and the vivid vertex are exact. The complete neutral axis is
unchanged. At fixed public Reach, physical `a` increases with Level; at fixed
Level, `a` and physical purity increase with Reach. Positive derivatives of
`G`, `f`, and `p`, with `0 < gain < 1`, make the interior map one-to-one.
The inverse solves one monotone equation for public Level, then obtains Reach
using the inverse positive-density CDF. The full-domain case routes base XYZ
through the existing legacy-to-repaired boundary transport. The model is
installed on the existing wrapper object, preserving its importer and carrier.

```js
import {createFreshFieldHRL} from './index.mjs';

const native = await createFreshFieldHRL({gamut:'srgb'});
const full = await createFreshFieldHRL({gamut:'full'});
const color = native.toXYZ({H:60,R:.3,L:.6});
```

Pass `record` to either factory to evaluate a newly fitted bank. Construct a
new model for each bank; the hue curve cache assumes the record is not mutated
after construction. The `hrl-fresh-field-v1` schema deliberately contains no
interior hue displacement. If the visual and observer audit shows that fixed
interior hue labels limit quality, a separately versioned schema can add an
endpoint-vanishing invertible hue field without moving vivid-ring angles.

The positive-coordinate Jacobian does **not** guarantee monotone GenSpace J,
ideal blackness judgments, or perceptually even color steps. The 0.95 gain cap
also restricts how much chroma can raise physical `a`; an actual fit and
off-grid profile audit must decide whether that restriction is suitable.
The seed has no COMBVD or visual acceptance claim. Compare fitted records
against Beta 1 and joint with the existing separate native-retained,
native-mapped and full pair populations, direct sheet inspection, dense
fixed-Reach/Level paths, and inverse/condition checks.

Run focused checks from the repository root:

```sh
node --test v2/research/fresh-field/tests/test-model.mjs
```

# Conditional physical Reach/Level field — exploratory v3

This is a separate model capacity experiment, initialized with three zero
coefficient banks. It does not modify HRL v2 Beta 1, the frozen joint fit,
the vivid hue ring, the observer hue field, either physical gamut boundary,
or the bounded pseudoRGB carrier. A single fitted record governs native sRGB
and full, with each gamut supplying its own physical base chart.

## Coordinates and exact inverse

Public coordinates obey `0 <= R <= L <= 1`. At `L>0`, write `u=R/L`.
The shared neutral ruler is `G(L)=levelToNonblack(freeUnitWarp(L,-neutral_shift))`,
using Beta 1's neutral shift. Every positive-density curve below is the
normalized integral of a piecewise-linear density sampled at record knots:
`density_i=exp(cap*tanh(logit_i/cap))`. It is strictly increasing, C1, has
exact endpoints, and has a closed-form interval inverse.

At hue `H`, Fourier rows (`1, cos(H), sin(H), cos(2H), sin(2H)` for `K=2`)
form knot logits `C0_H(u_i)`, `C1_H(u_i)` and `B_H(z_i)`. The **physical purity**
and **physical nonblack amount** are

```text
s = F_H,L(u),  density knots for F: exp(cap*tanh((C0_H + (1-L)*C1_H)/cap))
z = G(L)
a = E_H,s(z),  density knots for E: exp(cap*tanh(s*B_H/cap))
base = {H, R:a*s, L:a}
```

`E_H,0(z)=z`, so `a=G(L)` exactly along gray. Both negative and positive
chromatic Level changes are possible; v1's strictly positive lift could not
represent darkening below gray. `F_H,L` independently allocates purity near
black and along the white edge. With zero banks, `s=R/L` and `a=G(L)`.
This is a different initialization and parameter family from both old fits.

Invert physical `{H,R:a*s,L:a}` without a two-dimensional solver:

```text
s = R/a
z = E_H,s.inverse(a)
L = G.inverse(z)
u = F_H,L.inverse(s)
R = L*u
```

At black, both coordinates equal zero. At white, `a=1`, at vivid `s=a=1`.
No interior hues are displaced; the 0/360 seam is continuous. For `L>0`,
the coordinate Jacobian is `F_u * E_z * G'(L) / L > 0`, including the terms
from conditioning on `L` and `s`; they cancel in the determinant. This gives
a genuine global triangular inverse without folding. It does **not** imply
perceptual brightness or GenSpace J is monotone at fixed public Reach, and
some fitted banks can make physical `a` retreat along that path. Reject such
banks through off-grid audits rather than claiming the Jacobian proves it.

Physical `z=G(L)` makes the conditional Level integral exact and cheap:
there is no quadrature approximation or inherited tonal atlas. The cap
limits log density for stable inversion, but extreme parameter banks can be
ill conditioned; validation only guarantees finite coefficients and topology.

```js
import {createConditionalFieldHRL} from './index.mjs';
const srgb = await createConditionalFieldHRL({gamut:'srgb'});
const full = await createConditionalFieldHRL({gamut:'full'});
const color = srgb.toXYZ({H:60,R:.3,L:.6});
// Supply an explicit frozen record to evaluate a fitted bank.
```

Run focused checks from the repository root with
`node --test v2/research/conditional-field/tests/test-model.mjs`. Direct
COMBVD and ColorBench evaluations must name both the candidate module and
record; results on fitted rows are training/development evidence, not an
independent observer holdout. No seed or fit is promoted by this factory.

# Conditional field with bounded interior hue — experimental v4

This model adds one hue coordinate flow to the separately versioned v3
conditional Reach/Level transport. It leaves Beta 1, the joint fit, vivid
ring angles and physical spectral boundary unchanged. One shared record
serves native sRGB and full; the gamut changes only the physical chart.

The v4 record contains every v3 Reach/Level field and adds a five-term
Fourier hue row. First, v3 converts public `(H,R,L)` to physical chart
amounts `a` (nonblack) and `s` (purity). Then

```text
delta(H) = 25*tanh((c0+c1*cos(H)+s1*sin(H)+c2*cos(2H)+s2*sin(2H))/25)
w(a,s)  = 4*a*s*(1-s)
physicalH = wrap(H+w(a,s)*delta(H))
```

Angles inside sine and cosine are radians; `H` and `delta` are degrees.
Every coefficient has absolute value at most 8 degrees. Since `w <= 1` and
`|delta'(H)| < 48*pi/180 < .838`, the hue map has positive derivative and
cannot fold the hue circle. The shifted hue is inverted first from the known
physical `a,s`, by solving a scalar monotone equation in a bracket of
`physicalH +/- 25` degrees. The v3 tonal map is inverted at the recovered
public H. No second gamut bank or XYZ interpolation is involved.

The weight vanishes exactly at black, along gray, and at physical `s=1`,
including the vivid vertex and the entire saturated black-vivid arm. It
can move colors along the white-vivid edge between the fixed endpoints.
Near neutral, hue movement shrinks with `s`; near black it shrinks with `a`.
Zero hue coefficients recover v3 exactly. The default seed has all zero
tonal and hue coefficients and preserves the Beta 1 gray ruler. Fitted banks
are documented separately in the [closed fit report](../conditional-hue-fit/RESULTS.md)
and [sheet review](RESULTS_VISUAL.md); none has been accepted for release.
The prototype factory's `version` and `checkpoint` strings contain `seed`
even when an explicit fitted record is supplied. Those strings name this
experimental factory, not its bank: use `definition` and the frozen record
SHA256 in the reports to identify each fit.

```js
import {createConditionalHueHRL} from './index.mjs';
const model = await createConditionalHueHRL({gamut:'srgb'});
const xyz = model.toXYZ({H:275,R:.3,L:.7});
```

Run focused checks from the repository root:

```sh
node --test v2/research/conditional-hue/tests/test-model.mjs
```

The fit must keep native retained, mapped native, and full COMBVD populations
separate, inspect sheets and fixed-Reach contours in both realizations, and
hold out visual and numeric probes. Positive hue orientation only establishes
invertibility. It cannot repair a bad v3 Level fit by itself or guarantee
perceptual smoothness. Full colors outside sRGB cannot be judged from a
display-clipped screenshot.

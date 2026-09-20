# Joint interior experiment

Only the vivid-ring angles and general HRL architecture are fixed in this wave.
The user's September 20 instruction explicitly reopens shared gray calibration,
interior hue paths, tonal shapes and fitting choices. Older constraints in prior
research notes do not apply to this new family.

## Representation

The deterministic own-anchor source chart supplies the physical realization for
each gamut. This restores the source normalization that the earlier raw physical
contour experiment removed. It is a geometric construction, not a separately
trained gamut head. One learned parameter bank, with no gamut input, maps this
source chart into the HRL bicone. PseudoRGB carrier and import policies are reused.
The expanded seed reproduces Beta 1 to floating-point tolerance, so the new family
contains the released baseline as well as genuinely different interior geometry.

Coordinates use U=R/L and the existing bicone embedding. Two neutral parameters
control a shared positive soft-power/logit calibration. Each triangular layer
first changes Level at fixed U/H, then U at fixed Level/H, then interior hue at
fixed U/Level. Hue-conditioned coefficient rows are Fourier expansions. The
positive-power map is

    f(x,p) = ((x+e)^p - e^p) / ((1+e)^p - e^p),  e=.02, p>0.

Unlike a raw x^p, it has finite positive slopes at both endpoints. Logit shifts
and soft powers have explicit inverses. The hue transform is an orientation-
preserving circle Möbius map. Its amount is multiplied by (1-LU), so it becomes
exactly identity everywhere on the vivid ring. Alternating phases avoid singling
out one interior hue direction. The final inherited dark continuation is also
learnable. Inversion undoes dark continuation, then each layer's hue, Reach and
Level in reverse order, then neutral calibration. Coefficients are not tethered
to Beta 1; black/white/gray and vivid boundary identities follow from the maps.
Gray colors at a numerical Level can change because gray calibration is open.

## Observer populations

The two equal-weight fitting populations are native-sRGB's **3331 retained pairs**
and the full realization's **3813 pairs**, using the existing COMBVD observer
weights. Both weighted and unweighted STRESS are measured directly. Native
all-input mapped 3,813 is a separate diagnostic: it includes gamut-mapped pairs and
must never be substituted for the retained 3,331 population. All these observer
pairs are training data; no held-out score or new ColorBench run is claimed.

## Visual objective and correction

Initial 30-hue fits improved both observer scores, but direct 72 offset hue audits
found substantial missed reversals. Those provisional files are retained as
failed visual candidates, not selected successes. An independent 2×2 analysis
separated public-hue coverage from Level-step coverage and source interpolation:
the coarse sampler already predicted the worst actual retreat within 0.00035 J.
Raw worst-adjacent-step penalties were also partition-dependent: adding samples
could reduce the number while leaving total backward travel unchanged.

The revised objective uses all public hues every 2.5 degrees plus a few known
critical offsets. Cyclic Voronoi quadrature gives each angular interval its
proper mean weight; denser diagnostic sampling does not increase a hue region's
weight. Global maximum terms still cover every sampled hue. It combines:

- Near-gray J backtracking, using low Levels and explicit samples very close to
  U=0, with all-hue mean-square and global-tail penalties.
- Whole-contour J backtracking and3D GenSpace color-step coefficient of variation.
- Integrated negative J travel and negative physical-Y travel along fixed-Reach
  Level paths, rather than only the largest adjacent step.
- A small near-gray vector-gradient variation term and frequency regularization.

J is a diagnostic of visible tonal reversals, not a new definition of Level.
Level still means absence of blackness; monotone changes in J are allowed.
Reducing a synthetic path objective does not establish subjective preference.

Physical regularization uses exact source-runtime samples followed by trilinear
interpolation. The coarse grid has 118 source hues × 81² cosine U/Level samples; the
fine grid has 396 source hues × 129² samples (1 degree globally, 0.25 degree around 284–296).
Fine hue sampling fixes material interpolation error around source H178–181;
it cannot by itself repair missing public-hue coverage. Source grids are
reproducible from prepare-coarse.mjs/prepare.mjs and bound by SHA256 metadata.
Large generated float64 arrays are omitted from git. Observer loss is analytic
and does not use these visual grids. Direct-runtime audits are authoritative.

## Verification boundaries

Analytic/JS/Python parity, active-parameter finite-difference gradients, inverse
checks, exact vivid anchors, and inherited import/carrier wiring are separate
checks from appearance. Dense deterministic geometry samples and offset-hue
checks give finite evidence, not a proof of uniform conditioning or ordering.
The comparison offers whole paths and both realizations; full-domain images
must be clipped for an sRGB display, but plotted curves use original physical XYZ.

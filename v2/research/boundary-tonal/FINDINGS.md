# Boundary and tonal comparison: gains and costs

This pass contains two separable changes: a geometric boundary repair, and new shared Reach/Level fits. The original 0.12 balanced and a boundary-only realization are controls. The new candidates are not approved replacements for an accepted default.

## Established boundary result

The 158-vertex unsimplified hull contains all 471 pinned CIE 1931 2-degree tabulated directions, all 1,410 sampled intermediate wavelengths, and all 4,096 sampled nonnegative spectral mixtures. This covers the declared tabulated/piecewise-linear XYZ-CMF cone, not an exact biological observer. The source table and all selected models are hashed. Ordinary mapped imports, source-white luminance conversion and the chromaticity-preserving relative Y ceiling remain; there is no new intensity coordinate.

The boundary-only native chart is bit-identical to 0.12. Its full realization changes because the physical edge changes. Keeping the boundary-only control makes this geometric effect distinguishable from new fitting.

## What the new candidates achieve

On the identical 14,378-point equilateral-coordinate conditioning grid, the conditioning-focused balanced fit reduces the maximum condition number from 122,404.54 to 25,197.87. The 95th percentile falls from 57.34 to 49.36 and the 99th percentile from 1,776.63 to 1,094.07. Its median rises slightly, from 2.493 to 2.519. The tail remains severe; a positive Jacobian and accurate round-trip are not proof of uniform visual contours.

Normal native retained-pair COMBVD improves from 29.281170 weighted STRESS to 29.244798 for balanced and 29.107048 for metric. Full COMBVD changes from 30.219766 in 0.12 to 30.208686 with the boundary alone, then 30.161429 for balanced and 29.948555 for metric. Unweighted retained scores improve too. These are modest in-sample gains, not a new observer study.

The metric candidate provides the larger difference-score improvement. The balanced candidate provides the stronger conditioning-tail reduction. Their learned banks remain shared across native/full and the untrained Adobe RGB realization.

## What does not improve

**Neither new candidate beats the boundary-only control on every smoothness diagnostic.** In fact, average GenSpace step-size CV increases in all four tested path families for both candidates and both gamuts. Those changes are in the full actual-inverse evaluation, not just the optimizer's approximate lookup.

For native balanced, black-path CV rises from 0.219080 to 0.221009, white-path CV from 0.194969 to 0.205703, fixed-Reach neutral-exchange CV from 0.206456 to 0.225524, and Reach-path CV from 0.320713 to 0.331516. The native mean sheet-bending statistic rises from 0.459986 to 0.546953; its blue-region mean rises from 0.498106 to 0.734603. The full blue-region bending average improves slightly, but the full overall bending average worsens. Thus the conditioning gain must not be relabeled as a universal sheet-smoothness gain.

The narrow deep-blue lower band around H=273-277 remains visible in the previews. The selected balanced view develops its dark-blue region more gradually in some neighboring sheets, but that visual reading is not a measured user preference, and the residual band is not declared repaired. The controls expose the troublesome neighboring hues rather than showing only H=270.

Mapped all-input native ColorBench COMBVD also distinguishes the tradeoff: balanced worsens from 34.631006 to 34.775043 weighted STRESS, while metric improves to 34.489196. This is a different 3,813-pair population from normal retained native COMBVD, whose fixed 3,331-pair mask is preserved prominently. Do not combine or interchange these scores.

## Scored evaluation

The original pinned five generation and sixteen measurement judges are unchanged. All 168 scored cells are finite, with no added HRL rejection of forwarded input. Upstream's own skips and preprocessing remain as before. The final report records the counts and mapping reasons, plus full-only and common-pair subsets. The boundary repair does not by itself fix or alter the finite-ellipsoid test construction.

Some scored changes beyond COMBVD are favorable, such as full balanced OSA spacing and MacAdam 1942/1974. Others regress, including full balanced Regan and RIT-DuPont. No additional fit was performed after seeing the new scored results. All benchmark datasets have earlier project exposure and are not described as pristine independent validation.

## Cross-gamut hue-transport limit

There is a small but real consequence of the geometry-only full-domain transport: it preserves the existing **latent hue labels**, not exact equality of the hue assigned to a fixed physical XYZ between native sRGB and repaired full. A separate deterministic test checks 4,095 chromatic sRGB samples in both realizations. The old native/full discrepancy is below 1.64e-9 degrees. The repaired full discrepancy has mean 0.005543 degrees, 95th percentile 0.026755 degrees, and maximum 0.225301 degrees on this sample.

This is not a measured observer error, but it is a geometric consistency limit that must not be hidden under the phrase "same hue field." The same R/L coefficient bank and hue-ring labels remain, while the physical full-domain realization shifts slightly. The new tonal fitting did not create this difference; the boundary-only control already has it. Exact physical cross-gamut hue identity needs a further shared-field normalization refinement. See hue-transport-audit.mjs and results/hue-transport.json. No coefficients were changed in response to this audit.

## Reproduction and provenance

The initial runner rebuilt identical CMFs and hull vertices but used a different BLAS dot-product rounding order for its half-space normalization. Forty-nine components differed by at most 2.22e-16. The generator now explicitly states the fused multiply-add order used by the originally frozen geometry. It reproduces the original boundary JSON byte-for-byte; the selection hash was not relaxed and no model was refitted.

The pre-fit plan, all completed and aborted local trial records, exact commands and actual evaluation traces are preserved. The original full JSONL traces are in the downloadable review package; the repository transfer retains final arrays, hashes and sampled progress. Local numerical checks, runner checks and actual public-browser verification have separate receipts.

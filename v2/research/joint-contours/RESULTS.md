# HRL joint visual and observer fit — 20 September 2026

The expanded shared model improves retained-pair COMBVD in both realizations while strongly reducing the near-gray ridges. The saved selection is **joint-spacing**. These are directly evaluated runtime results, not interpolated fitting statistics. Beta 1 remains the named release.

[Interactive comparison](../../joint.html) · [Model and objective](METHOD.md) · [Reproduction](REPRODUCE.md) · [Independent review](INDEPENDENT_REVIEW.md)

## Observer results

COMBVD weighted STRESS, lower is better. The native retained population is reported separately from the all-input mapped population.

| Population | Beta 1 | Joint fit | Change |
|---|---:|---:|---:|
| Native sRGB, **3,331 retained** | 29.107048 | 26.795161 | 7.94% lower |
| Full, **3,813 retained** | 29.948555 | 26.902322 | 10.17% lower |
| Native sRGB, 3,813 mapped inputs | 34.489196 | 33.358237 | 3.28% lower |

Unweighted retained STRESS: native 30.712588 → **28.474658**; full 32.127880 → **28.783792**. The observer pairs are training data. No held-out accuracy or fresh ColorBench run is claimed.

## Direct visual measurements

The primary near-gray audit uses 72 offset hues × seven dark Levels × 257 samples across U=R/L from 0 to .25. Mean J backtracking falls **97.17% in sRGB** and **97.19% in full**. Whole-contour checks use 360 paths with 129 points; fixed-Reach checks use 504 paths with 65 points. Each comparison uses identical sample sets for both models.

| Diagnostic | sRGB Beta 1 | sRGB joint | Full Beta 1 | Full joint |
|---|---:|---:|---:|---:|
| Mean near-gray J backtracking | 0.003737 | 0.000106 | 0.002827 | 0.000079 |
| Worst near-gray J backtracking | 0.038373 | 0.002116 | 0.036060 | 0.001598 |
| Paths exceeding .001 J, out of 504 | 238 | 17 | 205 | 12 |
| Near-gray vector-gradient variation | 0.113623 | 0.001923 | 0.069086 | 0.001301 |
| Mean whole-contour J backtracking | 0.019283 | 0.002799 | 0.037135 | 0.005521 |
| Mean whole-contour color-step CV | 0.521777 | 0.396269 | 0.541732 | 0.425832 |
| Worst relative adjacent color-step jump | 1.880102 | 1.928245 | 1.887456 | 1.952093 |
| Worst fixed-Reach adjacent J drop | 0.010297 | 0.005103 | 0.032952 | 0.003537 |
| Mean total fixed-Reach J retreat | 0.000183 | 0.000065 | 0.003129 | 0.000133 |
| Worst total fixed-Reach J retreat | 0.019691 | 0.005103 | 0.252049 | 0.012698 |
| Negative fixed-Reach J steps | 44 | 31 | 613 | 85 |
| Worst fixed-Reach adjacent Y drop | 0.017989 | 0.005557 | 0.039143 | 0.006617 |

J diagnoses tonal travel that reverses direction; it does not define Level. Level remains absence of blackness. Vector-gradient variation examines changes in all three GenSpace components. Color-step CV measures uneven spacing along entire contours. Integrated retreat avoids the misleading improvement that can occur when a bad descent is merely split into smaller adjacent steps. Scalar diagnostics complement actual hue-sheet and gradient inspection.

## Additional geometry coverage

The extra audit changes hue offsets to 1.25° plus multiples of 5°, uses seven different near-gray Levels and seven different fixed-Reach values. These geometry paths were absent from the optimization grid. This is additional synthetic coverage, not held-out observer evidence.

| Offset geometry check | Native sRGB | Full |
|---|---:|---:|
| Near-gray mean reduction | 97.34% | 97.35% |
| Worst Level-step J drop: Beta 1 → joint | 0.006327 → 0.004258 | 0.043612 → 0.028449 |
| Worst total J retreat: Beta 1 → joint | 0.018199 → 0.006086 | 0.270639 → 0.054406 |
| Worst Level-step Y drop: Beta 1 → joint | 0.004969 → 0.003782 | 0.035768 → 0.018809 |

A concrete residual is full H=171.25°, R=.35, L=.35→.36015625: the selected fit loses .028449 J while Beta 1 rises .004230 J at the same coordinates. Aggregate gains therefore coexist with a new local reversal. The worst relative adjacent color-step jump also remains a limitation despite improved mean CV. The raw audits record exact worst locations, all path rows and physical-Y measurements. Remaining negative steps, uneven spacing or counterexamples must remain visible; the result is not a proof of perfect ordering or a universal perceptual preference. Full-domain image pixels are clipped to an sRGB display, while curves are evaluated before clipping.

## Why the earlier apparent tradeoff was avoidable

The previous raw-contour family discarded deterministic own-anchor normalization and could not reproduce Beta 1's interior geometry. This experiment restores that scaffold and expands the invertible mapping around it: finite-endpoint positive powers, richer Level/Reach coupling, interior circle maps and a learnable shared gray calibration. The expanded seed exactly reproduces Beta 1. One coefficient bank serves both realizations; gamut identity never enters the learned mapping.

Only vivid-ring angles and the general bicone/pseudoRGB architecture were treated as fixed. Interior hue, gray calibration, tonal shapes, coefficients and the optimization method were open. The sampled vivid XYZ difference is exactly zero. Shared gray values at the same numerical Level change by up to 0.026760 in an XYZ component in the declared gray probe; this is an intended open degree of freedom.

Initial sparse fits obtained better COMBVD but missed sharp reversals between training hues. Independent diagnosis showed that public-hue coverage and a partition-dependent ordering statistic were the main causes. The corrected fit covers the entire hue circle every 2.5°, weights angular means by interval size, penalizes integrated negative travel, and uses a finer physical lookup. An Adam warm-up/alternative avoids relying solely on a stalled line search. All provisional records and their fitting-code versions are retained with honest failure scopes.

The earlier **joint-dense** is also inspectable: it scores 25.944051/26.472243 on retained sRGB/full and has strong contour gains, but whole-contour spacing remains less uniform than Beta 1. It is useful evidence that joint observer/contour gains were attainable before the later spacing refinement.

## Identity and verification

Selected record SHA256: `4dd69df0a18cc62b3b6b1b3a2a115609059d645cb4dec498512d6779842677a5`. The `joint.json` alias is byte-identical to its originating checkpoint; no coefficient averaging or unrecorded refit occurs. Runtime inversion, fixed ring, shared bank, Python/JS coordinate parity and finite-difference gradients are checked separately from visual measurements. Direct audits bind the selected record hash. Finite samples do not prove uniform numerical conditioning.

Use the interactive page to inspect fixed-Level Reach paths, fixed-Reach Level paths, full hue sheets and display-clipping marks. Source grids and fit statistics are approximate; the saved direct audits and actual rendering remain authoritative. The next research question is the residual structure visible in these exact records, not whether the earlier restricted family established an unavoidable tradeoff.

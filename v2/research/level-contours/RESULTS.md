# HRL physical Level contours — reconstructed experiment, 19 September 2026

The physical-contour redesign substantially reduces the measured near-gray fixed-Level ridge. It does **not** yet solve general Level ordering, and its COMBVD fit is worse than Beta 1. The comparison is a research delivery; no replacement release is promoted.

[Interactive comparison](https://hrl-color.coonie.chatgpt.site/v2/contours.html) · [Reproduction instructions](REPRODUCE.md) · [Independent review](INDEPENDENT_REVIEW.md)

## Recovery and provenance

The preceding chat exhausted its length. Published GitHub/Sites source was recovered, but its last unpublished contour records were absent from the available workspaces and saved handoff. This experiment reconstructs the architecture from published commit `4aac5291e4d7a124426a9d541f185165566903ca`. It is not an exact recovery of the lost fit. Earlier reported values of 31.70/32.04 and 3/504/22/504 were not reproduced and are not used as evidence here.

## Structural change

A raw physical hue chart replaces the inherited tonal atlases and learned Level–Reach coupling inside this experimental factory. The fixed vivid ring, pseudoRGB carrier, import/mapping policy and agreed gray ruler are inherited unchanged. Full uses the existing repaired spectral-boundary transport. A single coefficient bank serves sRGB and full.

The Level contour is defined as physical magnitude versus physical purity. Endpoint-preserving positive powers and logit warps specify it before Reach is assigned. Reach is a separate invertible redistribution along that contour. Four Fourier coefficient rows control the physical contours; the final Reach map has six rows. The strict and metric variants fit both retained COMBVD populations with different contour-turn weights. The ordering-penalty variant then changes only Reach, keeping strict's physical contours exactly fixed.

This guarantees algebraic separation and preserved anchors. It does not guarantee monotone GenSpace J along changing public Reach or Level. HRL Level means absence of blackness, not constant luminance or constant J. Lightness may change along an equal-Level path; the diagnostic targets reversals, not all lightness variation.

## Direct runtime measurements

Weighted/unweighted STRESS are training scores; lower is better. Native retains 3,331 COMBVD pairs; full retains all 3,813. Near-gray checks use 72 hues at 2.5° + 5°k, seven normalized Levels (.005, .01, .02, .04, .08, .12, .2), and 257 points over public U=R/L from 0 to .25. A turn is `(total variation of J − absolute endpoint change)/2`; counts use a .001 J threshold.

| Model | Realization | Weighted STRESS | Unweighted STRESS | Paths above threshold | Mean J turn |
|---|---|---:|---:|---:|---:|
| Beta 1 | srgb | 29.107048 | 30.712588 | 238/504 | 0.00373695 |
| Beta 1 | full | 29.948555 | 32.127880 | 205/504 | 0.00282658 |
| Contour first | srgb | 33.910527 | 33.292357 | 4/504 | 0.00002560 |
| Contour first | full | 34.132676 | 35.013740 | 0/504 | 0.00001038 |
| Metric compromise | srgb | 33.169201 | 33.143717 | 31/504 | 0.00020866 |
| Metric compromise | full | 32.391347 | 33.260378 | 2/504 | 0.00003506 |
| Ordering penalty | srgb | 34.521358 | 34.336637 | 7/504 | 0.00004003 |
| Ordering penalty | full | 34.778806 | 36.225011 | 0/504 | 0.00001686 |
| Unfitted base | srgb | 43.467344 | 40.843603 | 0/504 | 0.00000000 |
| Unfitted base | full | 45.507142 | 45.949710 | 0/504 | 0.00000217 |

Strict reduces mean near-gray J backtracking by **99.315% native / 99.633% full**. The original H300/L=.08 regression passes in both realizations. This is sampled diagnostic evidence, not a claim that every gray smear has disappeared or that the geometry is perceptually ideal.

The separate all-input mapped native population has 3,813 pairs: Beta1 34.489196, strict 36.276264, metric 36.258325, ordering-penalty 36.777026, seed 44.567770. These are not interchangeable with the retained native scores. No new ColorBench run or held-out observer evaluation was performed.

## Remaining Level-ordering defect

At fixed public Reach, increasing Level can still make GenSpace J decrease. This check uses the same 72 offset hues, seven fixed R values (.0001, .001, .01, .05, .2, .5, .8), and 65 Levels from R to 1: 32,256 steps per model/profile. Negative steps use a 1e-8 tolerance.

| Model | Realization | Negative steps | Worst J drop |
|---|---|---:|---:|
| Beta 1 | srgb | 44 | 0.01029663 |
| Beta 1 | full | 613 | 0.03295220 |
| Contour first | srgb | 0 | 0.00000000 |
| Contour first | full | 833 | 0.30493954 |
| Metric compromise | srgb | 234 | 0.10636317 |
| Metric compromise | full | 1187 | 0.52434635 |
| Ordering penalty | srgb | 47 | 0.00165511 |
| Ordering penalty | full | 582 | 0.07756632 |
| Unfitted base | srgb | 0 | 0.00000000 |
| Unfitted base | full | 190 | 0.10323224 |

The unguarded metric refinement is particularly poor in full. Strict's worst full drop is .30494; the explicit ordering penalty reduces it to .07757, but Beta1's sampled worst is .03295. The ordering trial is therefore **not accepted as a general ordering fix**. Its training-grid maximum (.00519) substantially understates the offset-hue direct-runtime maximum (.07757); the two checks differ in both hue and Level spacing, and the training sampling is inadequate to certify this constraint near some full-domain hue boundaries. More fitting against this same grid would not establish a fix.

The next structural investigation should directly evaluate the worst full-domain boundary paths, distinguish inherited physical geometry from Reach-induced changes, and use direct or adaptively refined constraints before another optimization. Keep the invariant anchor/carrier/semantic contracts; do not equate a low bending score or a completed audit with resolved Level behavior.

## Validation and limits

- Direct audit: exact gray and vivid XYZ changes are zero; analytic inverse and observer-pair/runtime parity checks pass for all saved candidates. The frozen Beta1 integrity suite passes; existing releases were not edited.
- Independent review of seed/strict/metric: 12,288 XYZ roundtrips, matching analytic roundtrips, 3,072 exact 16-bit carrier roundtrips, mapped-import policy probes and Python/JS parity. The worst observed native strict XYZ embedding roundtrip error was 8.11e-8; the smaller 300-point main audit alone would miss that conditioning tail.
- GenSpace regularization is a sampled scalar-J test, not a full three-dimensional smoothness test. An early inconsistent grid prefilter was caught by review; those records are excluded. Corrected fits restart from the seed. Exact-node interpolation checks and direct physical-contour checks support the corrected grid in their tested scope.
- Realizations share one bank. Full display clips to sRGB; diagnostic curves use original XYZ before clipping. Displays cannot show all full-domain colors faithfully.
- No subjective visual acceptance, universal monotonicity, uniformly good numerical conditioning, or observer generalization is claimed. See the independent review and its guarded-candidate addendum for scope.

## Reproducible records

The saved records and direct audits are authoritative; optimization stopped at the declared iteration budgets. Runtime: Node24.19.0, Python3.12.14, NumPy2.3.5, SciPy1.17.0. [REPRODUCE.md](REPRODUCE.md) gives preparation, fitting, refinement and audit commands. Grids are reproducible intermediates with hashes in cache.json. Superseded traces are retained and clearly excluded.

| Record | SHA256 |
|---|---|
| seed.json | `e37fe3712493362118bc57d5aa6b1d4e65f0a35b543ff57df8669f038d13ad39` |
| strict.json | `8bcdc399cbead8a1a2763bce50215804458141734cc487e23d63f672ec81956a` |
| metric.json | `ccd59034734e1857e636b0b35a56db06ecfaa0eae7b7b0ff0d409cd45dc37de6` |
| guarded.json | `d09f095a0f4c439716382b3aa1c26854e1e989d802ddc976d44ea44a109653b1` |

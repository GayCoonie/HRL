# HRL 0.13: repaired spectral boundary and shared tonal fitting

## Scope

This is a boundary repair followed by actual new Reach/Level fitting. The original 0.12 refined balanced model, an unchanged-coefficient boundary-only realization, and two selected shared fits are separately evaluated. Earlier models, pages and results are not overwritten. Ordinary mapped imports remain the default; no extra intensity coordinate is introduced.

The normal native-sRGB development COMBVD retains the same 3,331 supported pairs without mapping. ColorBench is a separate all-input mapped pipeline. Both are reported explicitly below.

## Boundary repair

The unsimplified convex hull contains 158 vertices from all 471 CIE 1931 2-degree 1-nm CMF rows (360–830 nm). It includes the purple closure. It is exact for the stated tabulated/piecewise-linear XYZ-CMF convention, not a claim of exact continuous biological spectral sensitivity. The table is the pinned colour-science 0.4.7 copy, with its byte hash preserved. The CIE data-page DOI is 10.25039/CIE.DS.xvudnb9b. Direct retrieval of the CIE CSV was unavailable during input preparation; no claim of a fresh byte comparison with that CSV is made.

The full source chart is transported at fixed relative Y, u-prime/v-prime direction and boundary-relative radial fraction. This is geometry-only, not a newly fitted hue field. The boundary-only native-sRGB rendering is unchanged. Absolute/source-white scaling, the relative Y ceiling and ordinary imaginary-input mapping remain in place.

Boundary verification: 471 tabulated directions, 1,410 between-wavelength samples, 4,096 nonnegative mixtures, 4,096 random HRL round-trips, and 2,048 exact 16-bit spectral-carrier round-trips. No added intensity methods. All prescribed luminance and source-white examples pass.

## Normal retained-pair COMBVD: no gamut mapping

Traditional weighted and unweighted STRESS, on a fixed pair population. Lower is better. COMBVD is fitted/in-sample. These are the ordinary development scores, not the all-input ColorBench aggregate.

| Realization | Checkpoint | Weighted STRESS | Unweighted STRESS | Retained pairs | Mapped pairs |
|---|---|---:|---:|---:|---:|
| srgb | 0.12 balanced | 29.281170 | 31.055225 | 3331 | 0 |
| srgb | Boundary only | 29.281170 | 31.055225 | 3331 | 0 |
| srgb | Refined balanced | 29.244798 | 30.964838 | 3331 | 0 |
| srgb | Metric-leaning | 29.107048 | 30.712588 | 3331 | 0 |
| full | 0.12 balanced | 30.219766 | 32.484473 | 3813 | 0 |
| full | Boundary only | 30.208686 | 32.465365 | 3813 | 0 |
| full | Refined balanced | 30.161429 | 32.369646 | 3813 | 0 |
| full | Metric-leaning | 29.948555 | 32.127880 | 3813 | 0 |

The native mask is identical for every checkpoint, with SHA256 c95b0a38cd038fff9163f0d38ed4924addb95b1156283cf4a2ed65909efa2251. The prepared XYZ and adaptation convention are unchanged from the preceding 0.12 retained-pair comparisons. Full totals include 482 additional pairs and should not be treated as a same-stimulus gamut comparison.

## What the new fits constrain

All fitted R/L coefficients remain in one bank per candidate, shared across gamuts. Hue identity/ring, neutral progression, vertices and the regular bicone geometry are fixed relative to the repaired source chart. No learned gamut identifier or separate native/full parameter bank is introduced.

The human-data objective is COMBVD. Synthetic terms use the complete frozen HelmLab GenSpace vector for black dilution, white dilution, fixed-Reach neutral exchange and fixed-Level Reach. Whole-sheet derivatives are transformed into equilateral coordinates. A new analytic Jacobian penalty targets extreme coordinate stretching, using the same normalized points regardless of gamut. No Oklab values or scalar lightness power target enter these new losses. The parent dark-side and already-good-hue safeguards are engineering choices, not new observer measurements.

Initial raw-Hessian/bilinear trials were numerically dominated by tiny near-edge stencils and were not selected. The successful family uses a bounded-influence log1p bending penalty and a bicubic GenSpace training surrogate; final measurements below use the actual inverse, not that surrogate. Recorded aborted runs and memory limits are preserved, not described as completed trials.

## Actual-inverse path diagnostics

Every old/new control uses the same 72 hues, offset 1 degrees, and 257 samples on each path. Twenty paths per hue, four models and two gamuts. These are synthetic numerical checks, not observer preference percentages. Two endpoint steps are excluded for CV/jump, not for direction checks. No display clipping in the measurements.

| Realization | Checkpoint | Black CV | White CV | Neutral-exchange CV | Reach CV |
|---|---|---:|---:|---:|---:|
| srgb | 0.12 balanced | 0.219080 | 0.194969 | 0.206456 | 0.320713 |
| srgb | Boundary only | 0.219080 | 0.194969 | 0.206456 | 0.320713 |
| srgb | Refined balanced | 0.221009 | 0.205703 | 0.225524 | 0.331516 |
| srgb | Metric-leaning | 0.222288 | 0.197266 | 0.211318 | 0.325705 |
| full | 0.12 balanced | 0.264628 | 0.307378 | 0.253099 | 0.368309 |
| full | Boundary only | 0.264690 | 0.307575 | 0.253109 | 0.368457 |
| full | Refined balanced | 0.274846 | 0.327590 | 0.274569 | 0.383238 |
| full | Metric-leaning | 0.269871 | 0.318393 | 0.259675 | 0.378060 |

CV is step-length standard deviation divided by the mean. A lower average does not guarantee that every hue improved.

### Whole-sheet regularity

| Realization | Checkpoint | Mean normalized bending | 95th-percentile hue | Blue mean (255–295°) |
|---|---|---:|---:|---:|
| srgb | 0.12 balanced | 0.459986 | 0.886019 | 0.498106 |
| srgb | Boundary only | 0.459986 | 0.886019 | 0.498106 |
| srgb | Refined balanced | 0.546953 | 1.289335 | 0.734603 |
| srgb | Metric-leaning | 0.464887 | 0.886545 | 0.506682 |
| full | 0.12 balanced | 0.653289 | 1.399451 | 0.264853 |
| full | Boundary only | 0.653031 | 1.399475 | 0.265417 |
| full | Refined balanced | 0.746121 | 1.450825 | 0.261194 |
| full | Metric-leaning | 0.718056 | 1.399919 | 0.279376 |

These nine-point stencils evaluate actual XYZ-to-GenSpace outputs, with vector derivatives expressed in x=sqrt(3)R/2 and z=L-R/2. They do not prove perceptual uniformity or a topological fold. Dense previews include adjacent deep-blue hues 263,269,273,275,277,281,285 and 293 degrees.

### Corner direction and dark-side progress

| Realization | Checkpoint | White retreat paths | Mean white retreat fraction | At R=L=.25, Gen L / own vivid Gen L |
|---|---|---:|---:|---:|
| srgb | 0.12 balanced | 49/360 | 0.00134596 | 0.160117 |
| srgb | Boundary only | 49/360 | 0.00134596 | 0.160117 |
| srgb | Refined balanced | 50/360 | 0.00179016 | 0.159967 |
| srgb | Metric-leaning | 50/360 | 0.00152183 | 0.165983 |
| full | 0.12 balanced | 60/360 | 0.00219727 | 0.165320 |
| full | Boundary only | 59/360 | 0.00219082 | 0.165313 |
| full | Refined balanced | 52/360 | 0.00249904 | 0.164303 |
| full | Metric-leaning | 56/360 | 0.00224913 | 0.171416 |

The last column is a diagnostic ratio, not the definition of Level. Approaching white need not increase scalar GenSpace lightness. Corner retreats use full 3D distance to the relevant endpoint. Counts and magnitudes are separate, and neither alone establishes perceptual significance.

## Common-coordinate conditioning

Identical normalized source H/R/L points for every model, transformed in both input and output to equilateral coordinates. This derivative is not the gamut-dependent XYZ derivative. It is the same learned map in every realization. All sampled determinants are positive, but severe tails remain possible.

| Checkpoint | Median condition | 95th percentile | 99th percentile | Maximum |
|---|---:|---:|---:|---:|
| 0.12 balanced | 2.49337 | 57.33672 | 1776.63040 | 122404.54182 |
| Boundary only | 2.49337 | 57.33672 | 1776.63040 | 122404.54182 |
| Refined balanced | 2.51874 | 49.35647 | 1094.06678 | 25197.86589 |
| Metric-leaning | 2.51635 | 55.00978 | 1779.36533 | 113447.92112 |

## ColorBench: original scored tests, mapped import

The original five generation and sixteen measurement columns are evaluated with unchanged Python judges/helper and unchanged finite-ellipsoid construction. All finite forwarded input tuples convert. † denotes mapping, not rejection. Mapping counts are per evaluation and may repeat a stimulus. Upstream skips and negative-XYZ preprocessing remain upstream, unaltered.

### All-input mapped COMBVD

| Realization | Checkpoint | Weighted STRESS | Unweighted STRESS | Pairs | Mapped pairs |
|---|---|---:|---:|---:|---:|
| srgb | 0.12 balanced | 34.631006 | 38.387967 | 3813 | 482 |
| srgb | Boundary only | 34.631006 | 38.387967 | 3813 | 482 |
| srgb | Refined balanced | 34.775043 | 38.557168 | 3813 | 482 |
| srgb | Metric-leaning | 34.489196 | 38.126339 | 3813 | 482 |
| full | 0.12 balanced | 30.219766 | 32.484473 | 3813 | 0 |
| full | Boundary only | 30.208686 | 32.465365 | 3813 | 0 |
| full | Refined balanced | 30.161429 | 32.369646 | 3813 | 0 |
| full | Metric-leaning | 29.948555 | 32.127880 | 3813 | 0 |

### srgb: generation

| Test | 0.12 parent | Boundary only | Balanced | Metric |
|---|---:|---:|---:|---:|
| hung_berns | 3.731617 † | 3.731617 † | 3.731617 † | 3.731617 † |
| ebner_fairchild | 2.242649 † | 2.242649 † | 2.242649 † | 2.242649 † |
| munsell | 4.116543 † | 4.116543 † | 4.116543 † | 4.116543 † |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.274856 † | 0.274856 † | 0.277997 † | 0.278031 † |

### srgb: measurement

| Test | 0.12 parent | Boundary only | Balanced | Metric |
|---|---:|---:|---:|---:|
| macadam1942 | 0.330274 † | 0.330274 † | 0.329984 † | 0.328946 † |
| luo_rigg_ellipses | 0.304980 † | 0.304980 † | 0.305437 † | 0.304153 † |
| alder1982 | 0.321430 † | 0.321430 † | 0.323154 † | 0.321836 † |
| regan_1994_cvd_ellipses | 0.214380 † | 0.214380 † | 0.220810 † | 0.215239 † |
| koenderink_2026_3d_metric_field | 0.318513 | 0.318513 | 0.319952 | 0.321287 |
| brown_1957_12obs_ellipsoids | 0.481063 † | 0.481063 † | 0.480610 † | 0.481852 † |
| wyszecki_fielder_1971_ellipsoids | 0.332046 † | 0.332046 † | 0.330702 † | 0.333487 † |
| brown_macadam_1949_ellipsoids | 0.468102 † | 0.468096 † | 0.469445 † | 0.470129 † |
| huang_2012_cielab_ellipses | 0.336483 † | 0.336483 † | 0.339773 † | 0.333996 † |
| berns_1991_rit_dupont_tolerance_vectors | 0.362035 † | 0.362035 † | 0.355290 † | 0.360634 † |
| hong_2025_ellipsoids | 0.262472 | 0.262472 | 0.263328 | 0.262983 |
| bfd | 39.350560 † | 39.350560 † | 39.518812 † | 39.060015 † |
| leeds | 27.834160 | 27.834160 | 26.947509 | 27.455547 |
| witt | 23.908648 † | 23.908648 † | 24.822319 † | 24.099002 † |
| rit | 33.649739 † | 33.649739 † | 33.675517 † | 34.036016 † |
| macadam | 27.933297 † | 27.933297 † | 27.590574 † | 28.160835 † |

### full: generation

| Test | 0.12 parent | Boundary only | Balanced | Metric |
|---|---:|---:|---:|---:|
| hung_berns | 3.397949 † | 3.398767 † | 3.398767 † | 3.398767 † |
| ebner_fairchild | 2.242869 | 2.241445 | 2.241445 | 2.241445 |
| munsell | 3.816220 | 3.814761 | 3.814761 | 3.814761 |
| xiao_unique_hues | 1.742566 | 1.741198 | 1.741198 | 1.741198 |
| osa_ucs_1974 | 0.290109 | 0.290049 | 0.287629 | 0.289962 |

### full: measurement

| Test | 0.12 parent | Boundary only | Balanced | Metric |
|---|---:|---:|---:|---:|
| macadam1942 | 0.346714 | 0.346420 | 0.340392 | 0.342848 |
| luo_rigg_ellipses | 0.324772 | 0.325073 | 0.325951 | 0.324861 |
| alder1982 | 0.328290 | 0.328319 | 0.325419 | 0.327763 |
| regan_1994_cvd_ellipses | 0.231635 | 0.231628 | 0.239189 | 0.231932 |
| koenderink_2026_3d_metric_field | 0.386478 | 0.386595 | 0.387435 | 0.388213 |
| brown_1957_12obs_ellipsoids | 0.352832 † | 0.352858 † | 0.352756 † | 0.356365 † |
| wyszecki_fielder_1971_ellipsoids | 0.325617 † | 0.325679 † | 0.324685 † | 0.324500 † |
| brown_macadam_1949_ellipsoids | 0.343313 † | 0.343282 † | 0.343236 † | 0.345158 † |
| huang_2012_cielab_ellipses | 0.309522 | 0.309149 | 0.307169 | 0.311075 |
| berns_1991_rit_dupont_tolerance_vectors | 0.342866 | 0.343520 | 0.333889 | 0.337349 |
| hong_2025_ellipsoids | 0.301474 | 0.301461 | 0.301247 | 0.300165 |
| bfd | 33.085089 | 33.064244 | 32.954939 | 32.707180 |
| leeds | 27.231447 | 27.223158 | 27.118386 | 26.939914 |
| witt | 22.725495 | 22.732435 | 22.582652 | 22.630294 |
| rit | 29.564720 | 29.598691 | 30.086887 | 29.717938 |
| macadam | 32.802504 | 32.815338 | 32.157952 | 32.563634 |

Scored differences caused by changing the boundary/mapping are not called fitting improvements. The boundary-only control isolates that change. Full raw mapping reasons and per-input event masks are retained. No overall rank is fabricated from these heterogeneous test columns.

## Numerical verification and provenance

Actual runtime checks include near-black and ordinary round-trips, exact integer conversions, preserved neutral/vivid/hue labels relative to the corrected geometry, cyclic continuity, shared-bank identity, untrained Adobe RGB transfer and relative 100/300-nit scaling. The normal mapped import tests are separate from the strict geometric coverage tests. Frozen selection preceded this scored run. Prior project evaluation exposure remains disclosed.

| Candidate | Native max embedding error | Full max embedding error | Untrained A98 RGB error |
|---|---:|---:|---:|
| balanced | 1.63568e-11 | 5.27894e-12 | 5.71643e-12 |
| metric | 1.67119e-11 | 4.31575e-12 | 3.27394e-12 |

Source-table hash: beed7b13cda04076b84c6fc6ee5746a15f44b28916a21989cb0ac39be827e38b.

ColorBench 12b2de215cc5020682e3d245a8c78bce5f0ebbc9; dataset pool 8641f4e8ebd9d85a34dc0fedc116fa0e58493190.

All executed trial logs and intermediate records are preserved in the review package, including explicitly labeled aborted experiments. Original source and decision history are in PLAN.md, DESIGN.md and EXECUTION.md. A local browser result is not a public deployment receipt; public verification is recorded separately.

```json
{
  "status": "Frozen before the new scored ColorBench run",
  "timeUTC": "2026-09-18T07:46:22.255441+00:00",
  "baseCommit": "16b87da59c91d9c4b30997631397bad4404c4d39",
  "parent": "0.12 refined balanced",
  "parent_sha256": "159f06a6ea8eeb1bbe6617318ff8057f540f6ea3919e99e8d364a2d7b990c605",
  "boundary_sha256": "20542ab516a311a68ba8ab4131542254ee899b6cccaef7c89baf9f2c4dd79e67",
  "runtime_sha256": "e5ddba19f1a752041f0781b2a21a1f449def0f3a8a37167f56da294a4306499d",
  "selectionBasis": "Training COMBVD, actual-inverse 24-hue/129-sample diagnostic, 14,378-point common-coordinate conditioning, native previews at 263/269/273/275/277 and magenta. No new non-COMBVD observer score used.",
  "candidates": {
    "balanced": {
      "trial": "conditioned-c",
      "sha256": "57b83046e0ce0f2058447d449e36236f26e5aa893addd703e9e89c1f9c72495a",
      "trial_sha256": "da7861f46584a81a38c433e336e08bd9f0ab93dcb636ff9ad0894ccbcbbb8042",
      "layers": 7
    },
    "metric": {
      "trial": "metric-b2",
      "sha256": "92aa2f9647b406239dd52cd22feed61794f3d6ed74a1c33ba9361516cff3bb72",
      "trial_sha256": "2ebc6f9b43852fa3e9d9c9d5bd7b14cded32318b8b1d5efa3c19a194c30a497d",
      "layers": 7
    }
  },
  "notSelected": {
    "smooth-b": "Completed initializer and regularity trial. Retained, but conditioned-c gives the stronger common-coordinate tail reduction.",
    "conditioned-a": "OOM-aborted intermediate from the raw-Hessian family.",
    "metric-a": "OOM-aborted intermediate from the raw-Hessian family.",
    "metric-b": "OOM during setup; no objective evaluations."
  },
  "priorExposure": "Earlier project work used evaluation datasets. New scored results are not pristine external validation.",
  "normalNativeMask": "3331 supported pairs, unchanged from 0.12; all-input ColorBench separately mapped."
}
```


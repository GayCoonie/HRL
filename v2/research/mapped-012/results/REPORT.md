# HRL 0.12: mapped-import ColorBench rerun

The frozen 0.12 balanced and gentle checkpoints were rerun with ordinary mapped import, alongside the unchanged 0.11 balanced control. No coefficient, hue field, source atlas, physical boundary or valid-address color generation changed. The separate pending 0.13 boundary repair was not included.

Only the five scored generation and sixteen scored measurement columns were run. The original Python judges and original forwarding helper are unchanged. There is no ellipsoid tensor rescaling or replacement with a local-derivative test. All forwarded inputs yielded finite coordinates; mappings are disclosed instead of dropping those inputs.

## COMBVD

Native mapped scores now cover all 3,813 pairs. Their historical strict results cover only 3,331, so those totals are not an optimization comparison. The same 3,331 supported native pairs reproduce their old scores. Full uses all 3,813 without mapping and reproduces its old scores. COMBVD is fitted/in-sample; other datasets have earlier project exposure.

| Model | Gamut | Weighted STRESS | Unweighted STRESS | Pairs | Mapped pairs | Historical supported-pair weighted STRESS |
|---|---|---:|---:|---:|---:|---:|
| 0.11 balanced control | srgb | 34.545013 | 38.128019 | 3813 | 482 | 29.410505 (3331 pairs) |
| 0.12 balanced | srgb | 34.631006 | 38.387967 | 3813 | 482 | 29.281170 (3331 pairs) |
| 0.12 gentle | srgb | 34.514042 | 38.222828 | 3813 | 482 | 29.244008 (3331 pairs) |
| 0.11 balanced control | full | 30.371858 | 32.354725 | 3813 | 0 | 30.371858 (3813 pairs) |
| 0.12 balanced | full | 30.219766 | 32.484473 | 3813 | 0 | 30.219766 (3813 pairs) |
| 0.12 gentle | full | 29.747558 | 31.776312 | 3813 | 0 | 29.747558 (3813 pairs) |

## Previously affected full-gamut tests

These are input evaluations, not necessarily distinct stimuli. Reason counts can overlap. Upstream-generated skips are not HRL rejections.

| Test | 0.12 balanced | 0.12 gentle | Mapped / forwarded input evaluations | HRL rejected | Contributing groups |
|---|---:|---:|---:|---:|---|
| hung_berns | 3.397949 | 3.397949 | 5/156 | 0 | {'n_loci': 12} |
| brown_1957_12obs_ellipsoids | 0.352832 | 0.353053 | 191/567 | 0 | {'n_centers': 21} |
| wyszecki_fielder_1971_ellipsoids | 0.325617 | 0.321312 | 41/2268 | 0 | {'n_centers': 84} |
| brown_macadam_1949_ellipsoids | 0.343313 | 0.344231 | 378/1836 | 0 | {'n_centers': 68} |

The upstream finite-ellipsoid generator still skips its original invalid centers and clamps negative XYZ before forwarding. That behavior is not changed here. The previous strict one-center Brown score is not a full-population comparison. The pending tensor-scale investigation remains separate; these are original-implementation pipeline scores.

## Complete scored boards

All values below are lower-is-better. A dagger means at least one input was mapped, not that the test failed. Mapping counts are per forward evaluation. Full strict-to-mapped differences are policy/population changes, not newly fitted improvements.

### srgb: generation

| Dataset | 0.12 balanced | 0.12 gentle | Balanced mapped / forwarded | Rejected |
|---|---:|---:|---:|---:|
| hung_berns | 3.731617 † | 3.731617 † | 78/156 | 0 |
| ebner_fairchild | 2.242649 † | 2.242649 † | 70/306 | 0 |
| munsell | 4.116543 † | 4.116543 † | 1232/2734 | 0 |
| xiao_unique_hues | 1.742566 | 1.742566 | 0/36 | 0 |
| osa_ucs_1974 | 0.274856 † | 0.272528 † | 19/558 | 0 |

### srgb: measurement

| Dataset | 0.12 balanced | 0.12 gentle | Balanced mapped / forwarded | Rejected |
|---|---:|---:|---:|---:|
| macadam1942 | 0.330274 † | 0.325754 † | 300/625 | 0 |
| luo_rigg_ellipses | 0.304980 † | 0.300811 † | 605/3300 | 0 |
| alder1982 | 0.321430 † | 0.317362 † | 364/2025 | 0 |
| regan_1994_cvd_ellipses | 0.214380 † | 0.218708 † | 8/375 | 0 |
| koenderink_2026_3d_metric_field | 0.318513 | 0.318719 | 0/945 | 0 |
| brown_1957_12obs_ellipsoids | 0.481063 † | 0.481275 † | 396/567 | 0 |
| wyszecki_fielder_1971_ellipsoids | 0.332046 † | 0.329361 † | 278/2268 | 0 |
| brown_macadam_1949_ellipsoids | 0.468102 † | 0.468514 † | 1045/1836 | 0 |
| huang_2012_cielab_ellipses | 0.336483 † | 0.337393 † | 34/459 | 0 |
| berns_1991_rit_dupont_tolerance_vectors | 0.362035 † | 0.357572 † | 16/175 | 0 |
| hong_2025_ellipsoids | 0.262472 | 0.256879 | 0/11037 | 0 |
| bfd | 39.350560 † | 39.174792 † | 843/5552 | 0 |
| leeds | 27.834160 | 27.905359 | 0/614 | 0 |
| witt | 23.908648 † | 23.806140 † | 4/836 | 0 |
| rit | 33.649739 † | 33.639972 † | 51/624 | 0 |
| macadam | 27.933297 † | 27.979313 † | 3/256 | 0 |

### full: generation

| Dataset | 0.12 balanced | 0.12 gentle | Balanced mapped / forwarded | Rejected |
|---|---:|---:|---:|---:|
| hung_berns | 3.397949 † | 3.397949 † | 5/156 | 0 |
| ebner_fairchild | 2.242869 | 2.242869 | 0/306 | 0 |
| munsell | 3.816220 | 3.816220 | 0/2734 | 0 |
| xiao_unique_hues | 1.742566 | 1.742566 | 0/36 | 0 |
| osa_ucs_1974 | 0.290109 | 0.275090 | 0/558 | 0 |

### full: measurement

| Dataset | 0.12 balanced | 0.12 gentle | Balanced mapped / forwarded | Rejected |
|---|---:|---:|---:|---:|
| macadam1942 | 0.346714 | 0.332752 | 0/625 | 0 |
| luo_rigg_ellipses | 0.324772 | 0.312109 | 0/3300 | 0 |
| alder1982 | 0.328290 | 0.320599 | 0/2025 | 0 |
| regan_1994_cvd_ellipses | 0.231635 | 0.227265 | 0/375 | 0 |
| koenderink_2026_3d_metric_field | 0.386478 | 0.390181 | 0/945 | 0 |
| brown_1957_12obs_ellipsoids | 0.352832 † | 0.353053 † | 191/567 | 0 |
| wyszecki_fielder_1971_ellipsoids | 0.325617 † | 0.321312 † | 41/2268 | 0 |
| brown_macadam_1949_ellipsoids | 0.343313 † | 0.344231 † | 378/1836 | 0 |
| huang_2012_cielab_ellipses | 0.309522 | 0.315738 | 0/459 | 0 |
| berns_1991_rit_dupont_tolerance_vectors | 0.342866 | 0.325912 | 0/175 | 0 |
| hong_2025_ellipsoids | 0.301474 | 0.299078 | 0/11037 | 0 |
| bfd | 33.085089 | 32.317767 | 0/5552 | 0 |
| leeds | 27.231447 | 27.117896 | 0/614 | 0 |
| witt | 22.725495 | 22.894471 | 0/836 | 0 |
| rit | 29.564720 | 29.376475 | 0/624 | 0 |
| macadam | 32.802504 | 32.468392 | 0/256 | 0 |

## Exact policy

Use the unchanged 0.12 physical boundary. Adapt declared source white to D65 and normalize absolute luminance to the HRL white. A sourceWhiteNits argument permits different source/target luminance scales. For upstream already-relative D65 test inputs those white luminances match, so there is no extra numerical rescaling or second Bradford adaptation.

Imaginary input chromaticity is projected radially from D65 in u-prime/v-prime onto the existing boundary, not claimed to be a perceptually nearest point. The relative Y ceiling scales XYZ together, retaining chromaticity. Native sRGB then explicitly clips linear channels into its cube if necessary. Invalid/nonfinite tuples remain programming errors; an unexpected runtime conversion error aborts rather than yielding null/NaN. No additional above-white intensity coordinate is used.

Clipped input cannot round-trip to the original out-of-range tuple. Already-supported conversions and generated colors are tested bit-identical. The tests verify 1.2 at a 100-nit source as 120 nits, represented at 0.4 relative to 300 nits or clipped to 1 relative to 100 nits. They also test declared-source-white adaptation and nominal P3/Rec.2020 input acceptance. This does not claim a new P3-native gamut profile.

## Preserved records

Original strict and previously mapped score files remain at ../hue-fair-refine/results/. The interactive 0.12 comparison loads these new mapped scores by default and provides a historical-strict selector. Its triangle rendering and inherited visual diagnostics are unchanged. Per-input event masks, raw COMBVD arrays, per-family mapping flags, source hashes and versions are retained. No overall leaderboard rank is inferred.

```json
{
  "colorbench": "12b2de215cc5020682e3d245a8c78bce5f0ebbc9",
  "pool": "8641f4e8ebd9d85a34dc0fedc116fa0e58493190",
  "scoredCells": 126,
  "failedForwardRows": 0,
  "frozenSourcesUnchanged": true
}
```

# Blue–yellow contact bank v4: failed observer gate

Closed contact bank scored 23 September 2026 through the **original pinned 21-column ColorBench board in each gamut**. Its 42 cells complete with zero rejected forwarded points and the upstream `_space_forward` unchanged. The candidate achieves selected local physical-contact aims, but it **fails pooled COMBVD** and must not be promoted. All judges are lower-is-better; their scores have different units and cannot be averaged.

## Exact direct JS COMBVD populations

| Population | Beta 1 | Frozen joint | v3 guarded | v4 coupled | v4 contact |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native retained (3,331; zero mapped) | 29.107048 | 26.795161 | 37.868645 | 38.477101 | 38.715122 |
| Native mapped all (3,813; 482 mapped) | 34.489196 | 33.358237 | 40.537667 | 40.809677 | 41.339157 |
| Full retained (3,813; zero mapped) | 29.948555 | 26.902322 | 34.809360 | 35.174370 | 35.773916 |

Native mapped all is the COMBVD population used by the original ColorBench judge; it is different from the fixed 3,331-pair native retained set. Per-six-family, unweighted scores and mapping events are in [the direct v4 contact receipt](combvd-conditional-v4-blue-yellow-contact.json). All pooled weighted values worsen against both frozen references **and** against the coupled v4 bank.

## Original scored judges

Flags compare the contact bank with Beta 1 / frozen joint / guarded v3 / coupled v4 (`↓` lower, `↑` higher, `=` tie within absolute 1e-8). The per-judge board includes both earlier v1 fits for context. Win counts are descriptive, never a release score.

| Gamut | Comparator | Contact win / loss / tie |
| --- | --- | ---: |
| srgb | Beta 1 | 11 / 10 / 0 |
| srgb | Frozen joint | 14 / 7 / 0 |
| srgb | Fresh v1 visual | 7 / 14 / 0 |
| srgb | Fresh v1 graded | 4 / 17 / 0 |
| srgb | Guarded v3 | 3 / 18 / 0 |
| srgb | Coupled v4 | 9 / 12 / 0 |
| full | Beta 1 | 13 / 8 / 0 |
| full | Frozen joint | 11 / 10 / 0 |
| full | Fresh v1 visual | 16 / 5 / 0 |
| full | Fresh v1 graded | 7 / 14 / 0 |
| full | Guarded v3 | 4 / 17 / 0 |
| full | Coupled v4 | 5 / 16 / 0 |

### Native sRGB

| Board / judge | Beta 1 | Joint | v1 visual | v1 graded | v3 | v4 coupled | v4 contact | contact vs B/J/v3/v4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| Generation / `hung_berns` | 3.731617 | 4.743006 | 3.731617 | 3.731617 | 3.731617 | 4.237047 | 4.228941 | ↑/↓/↑/↓ |
| Generation / `ebner_fairchild` | 2.242649 | 2.786859 | 2.242649 | 2.242649 | 2.242649 | 2.503194 | 2.498728 | ↑/↓/↑/↓ |
| Generation / `munsell` | 4.116543 | 4.372803 | 4.116543 | 4.116543 | 4.116543 | 3.978892 | 3.973083 | ↓/↓/↓/↓ |
| Generation / `xiao_unique_hues` | 1.742566 | 1.716810 | 1.742566 | 1.742566 | 1.742566 | 1.945703 | 1.943291 | ↑/↑/↑/↓ |
| Generation / `osa_ucs_1974` | 0.278031 | 0.273772 | 0.252541 | 0.246948 | 0.224786 | 0.235356 | 0.246295 | ↓/↓/↑/↑ |
| Measurement / `macadam1942` | 0.328946 | 0.364477 | 0.269417 | 0.293538 | 0.295870 | 0.297269 | 0.293718 | ↓/↓/↓/↓ |
| Measurement / `luo_rigg_ellipses` | 0.304153 | 0.319349 | 0.242130 | 0.239773 | 0.240999 | 0.244719 | 0.247463 | ↓/↓/↑/↑ |
| Measurement / `alder1982` | 0.321836 | 0.330083 | 0.259863 | 0.248469 | 0.256298 | 0.265137 | 0.269193 | ↓/↓/↑/↑ |
| Measurement / `regan_1994_cvd_ellipses` | 0.215239 | 0.279222 | 0.157868 | 0.177222 | 0.200643 | 0.234527 | 0.229346 | ↑/↓/↑/↓ |
| Measurement / `koenderink_2026_3d_metric_field` | 0.321287 | 0.344847 | 0.278053 | 0.282157 | 0.288121 | 0.297182 | 0.309801 | ↓/↓/↑/↑ |
| Measurement / `brown_1957_12obs_ellipsoids` | 0.481852 | 0.507998 | 0.456774 | 0.466580 | 0.471453 | 0.471189 | 0.465985 | ↓/↓/↓/↓ |
| Measurement / `wyszecki_fielder_1971_ellipsoids` | 0.333487 | 0.328235 | 0.286522 | 0.279202 | 0.293479 | 0.294787 | 0.296733 | ↓/↓/↑/↑ |
| Measurement / `brown_macadam_1949_ellipsoids` | 0.470129 | 0.468558 | 0.453960 | 0.451513 | 0.456251 | 0.456842 | 0.456515 | ↓/↓/↑/↓ |
| Measurement / `huang_2012_cielab_ellipses` | 0.333996 | 0.337027 | 0.322367 | 0.329446 | 0.340363 | 0.348241 | 0.347165 | ↑/↑/↑/↓ |
| Measurement / `berns_1991_rit_dupont_tolerance_vectors` | 0.360634 | 0.366315 | 0.378545 | 0.349764 | 0.381549 | 0.389978 | 0.397727 | ↑/↑/↑/↑ |
| Measurement / `hong_2025_ellipsoids` | 0.262983 | 0.334746 | 0.234763 | 0.178008 | 0.183513 | 0.188297 | 0.202800 | ↓/↓/↑/↑ |
| Measurement / `bfd` | 39.060015 | 37.238793 | 46.305067 | 40.343925 | 39.658144 | 39.826498 | 40.708317 | ↑/↑/↑/↑ |
| Measurement / `leeds` | 27.455547 | 24.752678 | 51.838285 | 32.621275 | 32.704813 | 34.768532 | 35.510923 | ↑/↑/↑/↑ |
| Measurement / `witt` | 24.099002 | 21.719567 | 50.071081 | 38.205502 | 41.280634 | 42.074226 | 42.288264 | ↑/↑/↑/↑ |
| Measurement / `rit` | 34.036016 | 37.716026 | 43.400722 | 39.639460 | 44.995402 | 44.768007 | 45.027462 | ↑/↑/↑/↑ |
| Measurement / `macadam` | 28.160835 | 29.260219 | 28.699523 | 27.591330 | 25.914066 | 26.298559 | 26.697885 | ↓/↓/↑/↑ |

### Full

| Board / judge | Beta 1 | Joint | v1 visual | v1 graded | v3 | v4 coupled | v4 contact | contact vs B/J/v3/v4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| Generation / `hung_berns` | 3.398767 | 3.518030 | 3.398767 | 3.398767 | 3.398767 | 3.569103 | 3.564269 | ↑/↑/↑/↓ |
| Generation / `ebner_fairchild` | 2.241445 | 2.243248 | 2.241445 | 2.241445 | 2.241445 | 2.325024 | 2.322933 | ↑/↑/↑/↓ |
| Generation / `munsell` | 3.814761 | 3.621149 | 3.814761 | 3.814761 | 3.814761 | 3.772835 | 3.767196 | ↓/↑/↓/↓ |
| Generation / `xiao_unique_hues` | 1.741198 | 1.720468 | 1.741198 | 1.741198 | 1.741198 | 1.735127 | 1.736419 | ↓/↑/↓/↑ |
| Generation / `osa_ucs_1974` | 0.289962 | 0.293547 | 0.268520 | 0.223511 | 0.215845 | 0.212873 | 0.228013 | ↓/↓/↑/↑ |
| Measurement / `macadam1942` | 0.342848 | 0.322748 | 0.304368 | 0.275222 | 0.281029 | 0.294808 | 0.309340 | ↓/↓/↑/↑ |
| Measurement / `luo_rigg_ellipses` | 0.324861 | 0.308967 | 0.257292 | 0.199398 | 0.206401 | 0.205743 | 0.218187 | ↓/↓/↑/↑ |
| Measurement / `alder1982` | 0.327763 | 0.295065 | 0.293372 | 0.220841 | 0.225729 | 0.233772 | 0.259937 | ↓/↓/↑/↑ |
| Measurement / `regan_1994_cvd_ellipses` | 0.231932 | 0.246845 | 0.249605 | 0.194524 | 0.214576 | 0.225533 | 0.257147 | ↑/↑/↑/↑ |
| Measurement / `koenderink_2026_3d_metric_field` | 0.388213 | 0.389138 | 0.311521 | 0.283671 | 0.268555 | 0.274460 | 0.296335 | ↓/↓/↑/↑ |
| Measurement / `brown_1957_12obs_ellipsoids` | 0.356365 | 0.380615 | 0.357798 | 0.348391 | 0.349606 | 0.355609 | 0.360698 | ↑/↓/↑/↑ |
| Measurement / `wyszecki_fielder_1971_ellipsoids` | 0.324500 | 0.316225 | 0.303870 | 0.243826 | 0.269760 | 0.271149 | 0.284721 | ↓/↓/↑/↑ |
| Measurement / `brown_macadam_1949_ellipsoids` | 0.345158 | 0.355955 | 0.346632 | 0.329939 | 0.339191 | 0.343582 | 0.339227 | ↓/↓/↑/↓ |
| Measurement / `huang_2012_cielab_ellipses` | 0.311075 | 0.300202 | 0.322020 | 0.282768 | 0.270667 | 0.276184 | 0.281642 | ↓/↓/↑/↑ |
| Measurement / `berns_1991_rit_dupont_tolerance_vectors` | 0.337349 | 0.315045 | 0.398585 | 0.342735 | 0.343526 | 0.338571 | 0.338888 | ↑/↑/↓/↑ |
| Measurement / `hong_2025_ellipsoids` | 0.300165 | 0.343185 | 0.294125 | 0.217144 | 0.235575 | 0.245974 | 0.261656 | ↓/↓/↑/↑ |
| Measurement / `bfd` | 32.707180 | 29.291189 | 48.518062 | 39.585463 | 36.192268 | 36.758450 | 37.806399 | ↑/↑/↑/↑ |
| Measurement / `leeds` | 26.939914 | 24.517147 | 44.052548 | 31.787016 | 32.669131 | 33.564591 | 33.904468 | ↑/↑/↑/↑ |
| Measurement / `witt` | 22.630294 | 20.339660 | 52.837061 | 34.124943 | 33.889428 | 33.828082 | 33.638481 | ↑/↑/↓/↓ |
| Measurement / `rit` | 29.717938 | 26.722042 | 35.680411 | 30.624143 | 28.517939 | 28.255728 | 28.693924 | ↓/↑/↑/↑ |
| Measurement / `macadam` | 32.563634 | 31.617701 | 41.791617 | 28.390453 | 29.525687 | 28.903942 | 30.956626 | ↓/↓/↑/↑ |

## Contact audit and within-source WITT check

A separate [direct runtime contact audit](../../conditional-hue-fit/results/audit-contact-v0.json) used actual JS XYZ without display clipping (SHA256 `8b6ff088d3655d4b0e811808276f4887298d7d368c0ed01d483d71d19f195d13`). In native sRGB at public `H=273,R=.1,L=.5`, physical `s=Rbase/Lbase` rises coupled `0.205288` → contact `0.328620`. Nearby held-out blue mean `s` 0.186770 → 0.320654; nearby held-out yellow mean relative luminance `Y` native 0.535045 → 0.602424 and full 0.591541 → 0.662661. These are **local contact measurements**, not independently rated color appearance.

The WITT traditional-weight-seven group was excluded from contact pair-loss training (416 native retained and 418 full rows). It is a development holdout inside a previously exposed source, not a pristine new observer group. Native mapped includes two additional WITT pairs.

| WITT population | Beta 1 | Frozen joint | Coupled v4 | Contact v4 |
| --- | ---: | ---: | ---: | ---: |
| Native retained (416; zero mapped) | 23.567931 | 21.149113 | 41.820549 | 42.049381 |
| Native mapped all (418; 2 mapped) | 24.099002 | 21.719567 | 42.074226 | 42.288264 |
| Full retained (418; zero mapped) | 22.630294 | 20.339660 | 33.828082 | 33.638481 |

## Source identity and interpretation

- Source Git commit `069bc01df0aed664d9913cd23840f31b66aec1b0`, tracked `v2` clean; entry SHA256 `a42dfc8ea2c0d9ebe02f386ca64a80089a58c1347a5bf3c7b7759e572214616c`, sibling model `8164861ec50eb6be55a969206a549227416697368386162a29cefdd81d9f400c`, frozen contact bank `7bc1152def66706089e0a07c8ea8a6957a72654b84c897327d168381cc888e51`.
- Exactly the same imported 24 JS files and ten inherited runtime JSON resource bytes as coupled v4: JS manifest SHA256 `3a94d274dc43698ca119777791a43bc0f8804de9f85594a28bc37a357671ad04`, resource manifest SHA256 `954794a4080c5b6e1aca9acd77826e3b97fc8500d048f18aa93f341bfb47ddce`. The paired bank change is a controlled comparison at the same model and data source identity. [Full manifest](conditional-v4-blue-yellow-contact-source-manifest.json) includes paths and per-file hashes.
- The original five generation and sixteen measurement judges were unchanged. ColorBench and the datasets were previously visible in HRL research; many generated stimuli undergo mapped import and other original judge preprocessing. Local gain and judged score changes do not establish release quality. The [full original contact board](colorbench-conditional-v4-blue-yellow-contact.json), [execution log](colorbench-conditional-v4-blue-yellow-contact.log), and [coupled v4 report](CONDITIONAL_V4_COLORBENCH.md) preserve the audit.

**Disposition: FAILED observer gate.** Keep this bank as a constrained visual and tradeoff study; require a later closed fit with physical-sheet/edge and observer improvement before any integration.

# Conditional v3 guarded: pinned ColorBench comparison

Closed conditional bank scored 23 September 2026 using the original ColorBench judges (commit `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`) and dataset pool (commit `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`). All 42 scored cells completed with zero forwarded rejection; original `_space_forward` stayed unchanged. The full bank was closed before these judge runs. Every value below is lower-is-better; judge scores use different units and must not be averaged. These are development observations, **not release qualification**.

## Direct JS COMBVD populations

| Population | Beta 1 | Frozen joint | Fresh visual-neutral v1 | Fresh joint-graded v1 | Conditional guarded v3 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native retained (3,331; zero mapped) | 29.107048 | 26.795161 | 47.162313 | 36.176614 | 37.868645 |
| Native mapped all (3,813; 482 mapped) | 34.489196 | 33.358237 | 48.075028 | 39.274594 | 40.537667 |
| Full retained (3,813; zero mapped) | 29.948555 | 26.902322 | 48.638045 | 36.677658 | 34.809360 |

Full native/mapped and all six family scores, unweighted values, and import event counts are in [direct v3 JSON](combvd-conditional-v3-guarded.json). The original ColorBench COMBVD column is **mapped all** for native sRGB, so it cannot replace the retained 3,331-row score.

## Original 21 scored judges per gamut

Ties use absolute score difference ≤1e-8. In the table, `↓` is lower, `↑` is higher, and `=` is a tie; flags compare guarded v3 to Beta 1 / frozen joint / fresh v1 graded, respectively. The two v1 columns use the repaired one-ulp `model.mjs` run with explicit frozen records.

| Gamut | Comparator | v3 win / loss / tie |
| --- | --- | ---: |
| srgb | Beta 1 | 11 / 6 / 4 |
| srgb | Frozen joint | 14 / 7 / 0 |
| srgb | Fresh visual-neutral v1 | 8 / 9 / 4 |
| srgb | Fresh joint-graded v1 | 3 / 14 / 4 |
| full | Beta 1 | 13 / 4 / 4 |
| full | Frozen joint | 14 / 7 / 0 |
| full | Fresh visual-neutral v1 | 17 / 0 / 4 |
| full | Fresh joint-graded v1 | 6 / 11 / 4 |

### Native sRGB

| Board / judge | Beta 1 | Joint | v1 visual | v1 graded | v3 guarded | v3 vs B/J/G |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| Generation / `hung_berns` | 3.731617 | 4.743006 | 3.731617 | 3.731617 | 3.731617 | =/↓/= |
| Generation / `ebner_fairchild` | 2.242649 | 2.786859 | 2.242649 | 2.242649 | 2.242649 | =/↓/= |
| Generation / `munsell` | 4.116543 | 4.372803 | 4.116543 | 4.116543 | 4.116543 | =/↓/= |
| Generation / `xiao_unique_hues` | 1.742566 | 1.716810 | 1.742566 | 1.742566 | 1.742566 | =/↑/= |
| Generation / `osa_ucs_1974` | 0.278031 | 0.273772 | 0.252541 | 0.246948 | 0.224786 | ↓/↓/↓ |
| Measurement / `macadam1942` | 0.328946 | 0.364477 | 0.269417 | 0.293538 | 0.295870 | ↓/↓/↑ |
| Measurement / `luo_rigg_ellipses` | 0.304153 | 0.319349 | 0.242130 | 0.239773 | 0.240999 | ↓/↓/↑ |
| Measurement / `alder1982` | 0.321836 | 0.330083 | 0.259863 | 0.248469 | 0.256298 | ↓/↓/↑ |
| Measurement / `regan_1994_cvd_ellipses` | 0.215239 | 0.279222 | 0.157868 | 0.177222 | 0.200643 | ↓/↓/↑ |
| Measurement / `koenderink_2026_3d_metric_field` | 0.321287 | 0.344847 | 0.278053 | 0.282157 | 0.288121 | ↓/↓/↑ |
| Measurement / `brown_1957_12obs_ellipsoids` | 0.481852 | 0.507998 | 0.456774 | 0.466580 | 0.471453 | ↓/↓/↑ |
| Measurement / `wyszecki_fielder_1971_ellipsoids` | 0.333487 | 0.328235 | 0.286522 | 0.279202 | 0.293479 | ↓/↓/↑ |
| Measurement / `brown_macadam_1949_ellipsoids` | 0.470129 | 0.468558 | 0.453960 | 0.451513 | 0.456251 | ↓/↓/↑ |
| Measurement / `huang_2012_cielab_ellipses` | 0.333996 | 0.337027 | 0.322367 | 0.329446 | 0.340363 | ↑/↑/↑ |
| Measurement / `berns_1991_rit_dupont_tolerance_vectors` | 0.360634 | 0.366315 | 0.378545 | 0.349764 | 0.381549 | ↑/↑/↑ |
| Measurement / `hong_2025_ellipsoids` | 0.262983 | 0.334746 | 0.234763 | 0.178008 | 0.183513 | ↓/↓/↑ |
| Measurement / `bfd` | 39.060015 | 37.238793 | 46.305067 | 40.343925 | 39.658144 | ↑/↑/↓ |
| Measurement / `leeds` | 27.455547 | 24.752678 | 51.838285 | 32.621275 | 32.704813 | ↑/↑/↑ |
| Measurement / `witt` | 24.099002 | 21.719567 | 50.071081 | 38.205502 | 41.280634 | ↑/↑/↑ |
| Measurement / `rit` | 34.036016 | 37.716026 | 43.400722 | 39.639460 | 44.995402 | ↑/↑/↑ |
| Measurement / `macadam` | 28.160835 | 29.260219 | 28.699523 | 27.591330 | 25.914066 | ↓/↓/↓ |

### Full

| Board / judge | Beta 1 | Joint | v1 visual | v1 graded | v3 guarded | v3 vs B/J/G |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| Generation / `hung_berns` | 3.398767 | 3.518030 | 3.398767 | 3.398767 | 3.398767 | =/↓/= |
| Generation / `ebner_fairchild` | 2.241445 | 2.243248 | 2.241445 | 2.241445 | 2.241445 | =/↓/= |
| Generation / `munsell` | 3.814761 | 3.621149 | 3.814761 | 3.814761 | 3.814761 | =/↑/= |
| Generation / `xiao_unique_hues` | 1.741198 | 1.720468 | 1.741198 | 1.741198 | 1.741198 | =/↑/= |
| Generation / `osa_ucs_1974` | 0.289962 | 0.293547 | 0.268520 | 0.223511 | 0.215845 | ↓/↓/↓ |
| Measurement / `macadam1942` | 0.342848 | 0.322748 | 0.304368 | 0.275222 | 0.281029 | ↓/↓/↑ |
| Measurement / `luo_rigg_ellipses` | 0.324861 | 0.308967 | 0.257292 | 0.199398 | 0.206401 | ↓/↓/↑ |
| Measurement / `alder1982` | 0.327763 | 0.295065 | 0.293372 | 0.220841 | 0.225729 | ↓/↓/↑ |
| Measurement / `regan_1994_cvd_ellipses` | 0.231932 | 0.246845 | 0.249605 | 0.194524 | 0.214576 | ↓/↓/↑ |
| Measurement / `koenderink_2026_3d_metric_field` | 0.388213 | 0.389138 | 0.311521 | 0.283671 | 0.268555 | ↓/↓/↓ |
| Measurement / `brown_1957_12obs_ellipsoids` | 0.356365 | 0.380615 | 0.357798 | 0.348391 | 0.349606 | ↓/↓/↑ |
| Measurement / `wyszecki_fielder_1971_ellipsoids` | 0.324500 | 0.316225 | 0.303870 | 0.243826 | 0.269760 | ↓/↓/↑ |
| Measurement / `brown_macadam_1949_ellipsoids` | 0.345158 | 0.355955 | 0.346632 | 0.329939 | 0.339191 | ↓/↓/↑ |
| Measurement / `huang_2012_cielab_ellipses` | 0.311075 | 0.300202 | 0.322020 | 0.282768 | 0.270667 | ↓/↓/↓ |
| Measurement / `berns_1991_rit_dupont_tolerance_vectors` | 0.337349 | 0.315045 | 0.398585 | 0.342735 | 0.343526 | ↑/↑/↑ |
| Measurement / `hong_2025_ellipsoids` | 0.300165 | 0.343185 | 0.294125 | 0.217144 | 0.235575 | ↓/↓/↑ |
| Measurement / `bfd` | 32.707180 | 29.291189 | 48.518062 | 39.585463 | 36.192268 | ↑/↑/↓ |
| Measurement / `leeds` | 26.939914 | 24.517147 | 44.052548 | 31.787016 | 32.669131 | ↑/↑/↑ |
| Measurement / `witt` | 22.630294 | 20.339660 | 52.837061 | 34.124943 | 33.889428 | ↑/↑/↓ |
| Measurement / `rit` | 29.717938 | 26.722042 | 35.680411 | 30.624143 | 28.517939 | ↓/↑/↓ |
| Measurement / `macadam` | 32.563634 | 31.617701 | 41.791617 | 28.390453 | 29.525687 | ↓/↓/↑ |

## Development holdout: WITT (traditional weight 7)

The v3 fit excluded the WITT multiplicity group from its pair-loss training set: 416 native retained pairs and 418 full pairs. This is a within-source development holdout; WITT and the ColorBench datasets had been visible in prior HRL research, so the result is not external observer validation. The native mapped board includes two additional mapped WITT pairs.

| WITT population | Beta 1 | Frozen joint | v3 guarded |
| --- | ---: | ---: | ---: |
| Native retained (416; 0 mapped) | 23.567931 | 21.149113 | 41.011112 |
| Native mapped all (418; 2 mapped) | 24.099002 | 21.719567 | 41.280634 |
| Full retained (418; 0 mapped) | 22.630294 | 20.339660 | 33.889428 |

The fresh conditional bank substantially worsens all three WITT populations and pooled COMBVD. Despite geometric judge wins, it fails the paired observer gate and cannot be promoted as an HRL v2 replacement. The pinned judged native WITT value uses the 418 mapped pair population, not the 416 held-out retained subset.

## Provenance and scope

- Candidate conditional source Git commit `83530ddb1fd8eb8795a8a2669ffb86619f626765` with clean tracked `v2` tree; 22 recursively imported local JS modules have manifest SHA256 `2439fd73f366f722e13b3b5be33d78769ef48cac7f017c6d1122ae79cd183fa3`.
- The ten inherited runtime JSON resources have manifest SHA256 `75b89e37f1225b7743c4dea53ad09d2d28f5aad3dab5063231e89ce3c1e02370`. The bank SHA256 is `e1ccedbbe177b4cc2325a701e0abada269654754effd1b0cf7cd65f2c11476ff`. The entry SHA256 is `c6d4da23756a1a7dda132869b74750ec59ae27bf912e4b799ee51f415cfe496f` and sibling model SHA256 is `2e934f5b31f5f86cdb12f0f32d0987fa6fb4a593f6a4390fd3366384c73fd585`.
- Fresh-field v1 repaired entry SHA256 `0d14a7aa92457f9dfe1ea198d5b88d9dca96298158719580f26ed6fb23de8940`, model SHA256 `ee40a6aff5805c50c5805ba64f800306104d83d001fd0343e3f865d8f6bf4329`; 20 imported JS modules manifest SHA256 `d4917ab0d610e1c02200bffbfbe4ea8387ada5a6e1226b97defb36aa63eea936`, ten resource manifest SHA256 `1fea6de77672e770b183206fc6921fb4c9da550edfe7aec26f63b4fb04ec6807`. The two explicit records each carry a separate SHA256 in their JSON receipts.
- The candidate board records runtime versions, upstream judge file hashes, dataset workbook SHA256, every score and mapped-input audit, the parser/source checker hash, and model/source/record manifest. The JS scorer and Python board verify identity before and after each gamut; the board's JS bridge separately verifies before runtime import. Static imported JS and the ten known inherited JSON resources are pinned; arbitrary computed dynamic imports remain outside this manifest and require a frozen source revision.
- [Complete guarded v3 board](colorbench-conditional-v3-guarded.json), [log](colorbench-conditional-v3-guarded.log), [direct COMBVD by family](combvd-conditional-v3-guarded.json), and [standalone source manifest](conditional-v3-source-manifest.json). [Baseline boards](colorbench-beta1-joint.json), [v1 visual board](colorbench-fresh-visual-neutral.json) and [v1 graded board](colorbench-fresh-joint-graded.json) provide exact comparison values.

The historical scored board includes imported or clipped generated colors under its original judge rules. This report preserves those rules and per-judge import audit; some scores need visual and physical-domain validation before they can be interpreted as design improvements.

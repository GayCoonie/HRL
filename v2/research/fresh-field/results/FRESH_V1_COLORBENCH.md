# Frozen fresh-field v1: pinned ColorBench comparison

Scored 23 September 2026 using the original ColorBench judges at `12b2de215cc5020682e3d245a8c78bce5f0ebbc9` and its dataset pool at `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`. Both records were closed before these judge runs. The repaired runtime uses entry SHA256 `0d14a7aa92457f9dfe1ea198d5b88d9dca96298158719580f26ed6fb23de8940` and model SHA256 `ee40a6aff5805c50c5805ba64f800306104d83d001fd0343e3f865d8f6bf4329` copied byte-exact from the Site source into an isolated checkout. Closed record SHA256 values: visual-neutral `8b1115ccaeba0c2d1b5688e26a34b717fca026c2def56c5f39c2a4c42ed13626`; joint-graded `b7ce6f464f4ca09263ba0b8299bbe96129f23f286d8605405dcab3d70b4bfb90`.

The boards and direct COMBVD receipts were rerun with recursive source checks: their 20 imported local JS modules have manifest SHA256 `d4917ab0d610e1c02200bffbfbe4ea8387ada5a6e1226b97defb36aa63eea936`; ten inherited runtime JSON resources have manifest SHA256 `1fea6de77672e770b183206fc6921fb4c9da550edfe7aec26f63b4fb04ec6807`. Every judge score matched the initial run exactly; both new receipts include file-by-file paths and hashes. The candidate module and records are provided explicitly even though the repaired v1 model is staged only in this isolated checkout.

## Exact COMBVD populations

Weighted STRESS; lower is better. Unweighted scores, all six source-family rows, per-input mapping events and hashes are in the linked JSON. All scores are development data that informed earlier HRL work.

| Population | Beta 1 | Frozen joint | Fresh visual-neutral | Fresh joint-graded |
| --- | ---: | ---: | ---: | ---: |
| Native retained (3,331) | 29.107048 | 26.795161 | 47.162313 | 36.176614 |
| Native mapped (3,813) | 34.489196 | 33.358237 | 48.075028 | 39.274594 |
| Full retained (3,813) | 29.948555 | 26.902322 | 48.638045 | 36.677658 |

All three populations completed with finite coordinates. Native mapped evaluates the 482 remapped pairs; native retained holds the 3,331 originally supported pairs fixed. Full has no mapped COMBVD pairs. The ordinary scored ColorBench board reports **mapped 3,813** for native; do not substitute its aggregate for native retained.

## Scored judge comparison

Each candidate was run through five generation and sixteen measurement columns in **both** gamuts, using upstream judge functions and its original `_space_forward` helper. No forwarded row was rejected. `↓` means lower/better, `↑` higher/worse, and `=` a tie within absolute 1e-8; each candidate flag compares against **Beta 1 / frozen joint**, in that order. Separate judges have different units, so counts are descriptive rather than an averaged score.

| Gamut | Candidate | vs Beta 1 win/loss/tie | vs joint win/loss/tie |
| --- | --- | ---: | ---: |
| srgb | Fresh visual-neutral | 11/6/4 | 15/6/0 |
| srgb | Fresh joint-graded | 13/4/4 | 16/5/0 |
| full | Fresh visual-neutral | 7/10/4 | 11/10/0 |
| full | Fresh joint-graded | 12/5/4 | 14/7/0 |

### Native sRGB

| Board / judge | Beta 1 | Frozen joint | Visual-neutral | vs B/J | Joint-graded | vs B/J |
| --- | ---: | ---: | ---: | :---: | ---: | :---: |
| Generation / `hung_berns` | 3.731617 | 4.743006 | 3.731617 | =/↓ | 3.731617 | =/↓ |
| Generation / `ebner_fairchild` | 2.242649 | 2.786859 | 2.242649 | =/↓ | 2.242649 | =/↓ |
| Generation / `munsell` | 4.116543 | 4.372803 | 4.116543 | =/↓ | 4.116543 | =/↓ |
| Generation / `xiao_unique_hues` | 1.742566 | 1.716810 | 1.742566 | =/↑ | 1.742566 | =/↑ |
| Generation / `osa_ucs_1974` | 0.278031 | 0.273772 | 0.252541 | ↓/↓ | 0.246948 | ↓/↓ |
| Measurement / `macadam1942` | 0.328946 | 0.364477 | 0.269417 | ↓/↓ | 0.293538 | ↓/↓ |
| Measurement / `luo_rigg_ellipses` | 0.304153 | 0.319349 | 0.242130 | ↓/↓ | 0.239773 | ↓/↓ |
| Measurement / `alder1982` | 0.321836 | 0.330083 | 0.259863 | ↓/↓ | 0.248469 | ↓/↓ |
| Measurement / `regan_1994_cvd_ellipses` | 0.215239 | 0.279222 | 0.157868 | ↓/↓ | 0.177222 | ↓/↓ |
| Measurement / `koenderink_2026_3d_metric_field` | 0.321287 | 0.344847 | 0.278053 | ↓/↓ | 0.282157 | ↓/↓ |
| Measurement / `brown_1957_12obs_ellipsoids` | 0.481852 | 0.507998 | 0.456774 | ↓/↓ | 0.466580 | ↓/↓ |
| Measurement / `wyszecki_fielder_1971_ellipsoids` | 0.333487 | 0.328235 | 0.286522 | ↓/↓ | 0.279202 | ↓/↓ |
| Measurement / `brown_macadam_1949_ellipsoids` | 0.470129 | 0.468558 | 0.453960 | ↓/↓ | 0.451513 | ↓/↓ |
| Measurement / `huang_2012_cielab_ellipses` | 0.333996 | 0.337027 | 0.322367 | ↓/↓ | 0.329446 | ↓/↓ |
| Measurement / `berns_1991_rit_dupont_tolerance_vectors` | 0.360634 | 0.366315 | 0.378545 | ↑/↑ | 0.349764 | ↓/↓ |
| Measurement / `hong_2025_ellipsoids` | 0.262983 | 0.334746 | 0.234763 | ↓/↓ | 0.178008 | ↓/↓ |
| Measurement / `bfd` | 39.060015 | 37.238793 | 46.305067 | ↑/↑ | 40.343925 | ↑/↑ |
| Measurement / `leeds` | 27.455547 | 24.752678 | 51.838285 | ↑/↑ | 32.621275 | ↑/↑ |
| Measurement / `witt` | 24.099002 | 21.719567 | 50.071081 | ↑/↑ | 38.205502 | ↑/↑ |
| Measurement / `rit` | 34.036016 | 37.716026 | 43.400722 | ↑/↑ | 39.639460 | ↑/↑ |
| Measurement / `macadam` | 28.160835 | 29.260219 | 28.699523 | ↑/↓ | 27.591330 | ↓/↓ |

### Full

| Board / judge | Beta 1 | Frozen joint | Visual-neutral | vs B/J | Joint-graded | vs B/J |
| --- | ---: | ---: | ---: | :---: | ---: | :---: |
| Generation / `hung_berns` | 3.398767 | 3.518030 | 3.398767 | =/↓ | 3.398767 | =/↓ |
| Generation / `ebner_fairchild` | 2.241445 | 2.243248 | 2.241445 | =/↓ | 2.241445 | =/↓ |
| Generation / `munsell` | 3.814761 | 3.621149 | 3.814761 | =/↑ | 3.814761 | =/↑ |
| Generation / `xiao_unique_hues` | 1.741198 | 1.720468 | 1.741198 | =/↑ | 1.741198 | =/↑ |
| Generation / `osa_ucs_1974` | 0.289962 | 0.293547 | 0.268520 | ↓/↓ | 0.223511 | ↓/↓ |
| Measurement / `macadam1942` | 0.342848 | 0.322748 | 0.304368 | ↓/↓ | 0.275222 | ↓/↓ |
| Measurement / `luo_rigg_ellipses` | 0.324861 | 0.308967 | 0.257292 | ↓/↓ | 0.199398 | ↓/↓ |
| Measurement / `alder1982` | 0.327763 | 0.295065 | 0.293372 | ↓/↓ | 0.220841 | ↓/↓ |
| Measurement / `regan_1994_cvd_ellipses` | 0.231932 | 0.246845 | 0.249605 | ↑/↑ | 0.194524 | ↓/↓ |
| Measurement / `koenderink_2026_3d_metric_field` | 0.388213 | 0.389138 | 0.311521 | ↓/↓ | 0.283671 | ↓/↓ |
| Measurement / `brown_1957_12obs_ellipsoids` | 0.356365 | 0.380615 | 0.357798 | ↑/↓ | 0.348391 | ↓/↓ |
| Measurement / `wyszecki_fielder_1971_ellipsoids` | 0.324500 | 0.316225 | 0.303870 | ↓/↓ | 0.243826 | ↓/↓ |
| Measurement / `brown_macadam_1949_ellipsoids` | 0.345158 | 0.355955 | 0.346632 | ↑/↓ | 0.329939 | ↓/↓ |
| Measurement / `huang_2012_cielab_ellipses` | 0.311075 | 0.300202 | 0.322020 | ↑/↑ | 0.282768 | ↓/↓ |
| Measurement / `berns_1991_rit_dupont_tolerance_vectors` | 0.337349 | 0.315045 | 0.398585 | ↑/↑ | 0.342735 | ↑/↑ |
| Measurement / `hong_2025_ellipsoids` | 0.300165 | 0.343185 | 0.294125 | ↓/↓ | 0.217144 | ↓/↓ |
| Measurement / `bfd` | 32.707180 | 29.291189 | 48.518062 | ↑/↑ | 39.585463 | ↑/↑ |
| Measurement / `leeds` | 26.939914 | 24.517147 | 44.052548 | ↑/↑ | 31.787016 | ↑/↑ |
| Measurement / `witt` | 22.630294 | 20.339660 | 52.837061 | ↑/↑ | 34.124943 | ↑/↑ |
| Measurement / `rit` | 29.717938 | 26.722042 | 35.680411 | ↑/↑ | 30.624143 | ↑/↑ |
| Measurement / `macadam` | 32.563634 | 31.617701 | 41.791617 | ↑/↑ | 28.390453 | ↓/↓ |

## Scope and records

- [Complete visual-neutral board](colorbench-fresh-visual-neutral.json) and [execution log](colorbench-fresh-visual-neutral.log); [direct COMBVD and six families](combvd-fresh-visual-neutral.json).
- [Complete joint-graded board](colorbench-fresh-joint-graded.json) and [execution log](colorbench-fresh-joint-graded.log); [direct COMBVD and six families](combvd-fresh-joint-graded.json).
- [Frozen Beta 1 and joint board](colorbench-beta1-joint.json) and [direct COMBVD baselines](combvd-beta1-joint.json).

The full original scored board has four mapped-input COMBVD family columns, not a second native retained score. Other generation and measurement probes can also be mapped by the documented import policy; each result records its count. The upstream finite-ellipsoid judges keep their own invalid-center skips and negative-XYZ preprocessing. This work retained those judges unchanged.

These other datasets were seen in previous project development and cannot be presented as pristine external validation. Both fresh v1 candidates improve some discrimination scores while substantially regressing COMBVD. Neither is a release candidate on the stated joint visual and observer objective. Full-domain rendering on an sRGB screen is not evidence of full-gamut visual superiority.

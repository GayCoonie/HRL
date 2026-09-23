# Coupled v4 guarded: pinned ColorBench and COMBVD

Closed bank scored 23 September 2026 with original ColorBench judges (commit `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`) and the original dataset pool (commit `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`). Both native sRGB and full used the same bank. All 42 judge cells completed, with zero rejected forwarded points and the original `_space_forward` helper unchanged. These results are **development evidence for a bank that fails the paired observer gate**. Lower scores are better within each judge; different judges use different units.

## Direct JS COMBVD

| Population | Beta 1 | Frozen joint | Fresh v1 visual | Fresh v1 graded | v3 guarded | v4 coupled guarded |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Native retained (3,331; 0 mapped) | 29.107048 | 26.795161 | 47.162313 | 36.176614 | 37.868645 | 38.477101 |
| Native mapped all (3,813; 482 mapped) | 34.489196 | 33.358237 | 48.075028 | 39.274594 | 40.537667 | 40.809677 |
| Full retained (3,813; 0 mapped) | 29.948555 | 26.902322 | 48.638045 | 36.677658 | 34.809360 | 35.174370 |

The original ColorBench native COMBVD column is mapped all, whereas the fixed 3,331 native retained pairs are a distinct development population. The guarded v4 bank worsens all three pooled weighted populations versus both frozen references and also versus v3. The [direct v4 receipt](combvd-conditional-v4-coupled-guarded.json) records unweighted scores, all six source-family splits, mapped counts and events.

## Original 21 judged columns per gamut

Flags in the detailed rows compare v4 to Beta 1 / frozen joint / fresh v1 graded / guarded v3: `↓` lower, `↑` higher, `=` absolute difference ≤1e-8. Counts are descriptive and do not combine judges into a new score.

| Gamut | Comparator | v4 win / loss / tie |
| --- | --- | ---: |
| srgb | Beta 1 | 11 / 10 / 0 |
| srgb | Frozen joint | 14 / 7 / 0 |
| srgb | Fresh v1 visual | 7 / 14 / 0 |
| srgb | Fresh v1 graded | 4 / 17 / 0 |
| srgb | Guarded v3 | 3 / 18 / 0 |
| full | Beta 1 | 15 / 6 / 0 |
| full | Frozen joint | 12 / 9 / 0 |
| full | Fresh v1 visual | 19 / 2 / 0 |
| full | Fresh v1 graded | 9 / 12 / 0 |
| full | Guarded v3 | 8 / 13 / 0 |

### Native sRGB

| Board / judge | Beta 1 | Joint | v1 visual | v1 graded | v3 guarded | v4 guarded | v4 vs B/J/G/v3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| Generation / `hung_berns` | 3.731617 | 4.743006 | 3.731617 | 3.731617 | 3.731617 | 4.237047 | ↑/↓/↑/↑ |
| Generation / `ebner_fairchild` | 2.242649 | 2.786859 | 2.242649 | 2.242649 | 2.242649 | 2.503194 | ↑/↓/↑/↑ |
| Generation / `munsell` | 4.116543 | 4.372803 | 4.116543 | 4.116543 | 4.116543 | 3.978892 | ↓/↓/↓/↓ |
| Generation / `xiao_unique_hues` | 1.742566 | 1.716810 | 1.742566 | 1.742566 | 1.742566 | 1.945703 | ↑/↑/↑/↑ |
| Generation / `osa_ucs_1974` | 0.278031 | 0.273772 | 0.252541 | 0.246948 | 0.224786 | 0.235356 | ↓/↓/↓/↑ |
| Measurement / `macadam1942` | 0.328946 | 0.364477 | 0.269417 | 0.293538 | 0.295870 | 0.297269 | ↓/↓/↑/↑ |
| Measurement / `luo_rigg_ellipses` | 0.304153 | 0.319349 | 0.242130 | 0.239773 | 0.240999 | 0.244719 | ↓/↓/↑/↑ |
| Measurement / `alder1982` | 0.321836 | 0.330083 | 0.259863 | 0.248469 | 0.256298 | 0.265137 | ↓/↓/↑/↑ |
| Measurement / `regan_1994_cvd_ellipses` | 0.215239 | 0.279222 | 0.157868 | 0.177222 | 0.200643 | 0.234527 | ↑/↓/↑/↑ |
| Measurement / `koenderink_2026_3d_metric_field` | 0.321287 | 0.344847 | 0.278053 | 0.282157 | 0.288121 | 0.297182 | ↓/↓/↑/↑ |
| Measurement / `brown_1957_12obs_ellipsoids` | 0.481852 | 0.507998 | 0.456774 | 0.466580 | 0.471453 | 0.471189 | ↓/↓/↑/↓ |
| Measurement / `wyszecki_fielder_1971_ellipsoids` | 0.333487 | 0.328235 | 0.286522 | 0.279202 | 0.293479 | 0.294787 | ↓/↓/↑/↑ |
| Measurement / `brown_macadam_1949_ellipsoids` | 0.470129 | 0.468558 | 0.453960 | 0.451513 | 0.456251 | 0.456842 | ↓/↓/↑/↑ |
| Measurement / `huang_2012_cielab_ellipses` | 0.333996 | 0.337027 | 0.322367 | 0.329446 | 0.340363 | 0.348241 | ↑/↑/↑/↑ |
| Measurement / `berns_1991_rit_dupont_tolerance_vectors` | 0.360634 | 0.366315 | 0.378545 | 0.349764 | 0.381549 | 0.389978 | ↑/↑/↑/↑ |
| Measurement / `hong_2025_ellipsoids` | 0.262983 | 0.334746 | 0.234763 | 0.178008 | 0.183513 | 0.188297 | ↓/↓/↑/↑ |
| Measurement / `bfd` | 39.060015 | 37.238793 | 46.305067 | 40.343925 | 39.658144 | 39.826498 | ↑/↑/↓/↑ |
| Measurement / `leeds` | 27.455547 | 24.752678 | 51.838285 | 32.621275 | 32.704813 | 34.768532 | ↑/↑/↑/↑ |
| Measurement / `witt` | 24.099002 | 21.719567 | 50.071081 | 38.205502 | 41.280634 | 42.074226 | ↑/↑/↑/↑ |
| Measurement / `rit` | 34.036016 | 37.716026 | 43.400722 | 39.639460 | 44.995402 | 44.768007 | ↑/↑/↑/↓ |
| Measurement / `macadam` | 28.160835 | 29.260219 | 28.699523 | 27.591330 | 25.914066 | 26.298559 | ↓/↓/↓/↑ |

### Full

| Board / judge | Beta 1 | Joint | v1 visual | v1 graded | v3 guarded | v4 guarded | v4 vs B/J/G/v3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| Generation / `hung_berns` | 3.398767 | 3.518030 | 3.398767 | 3.398767 | 3.398767 | 3.569103 | ↑/↑/↑/↑ |
| Generation / `ebner_fairchild` | 2.241445 | 2.243248 | 2.241445 | 2.241445 | 2.241445 | 2.325024 | ↑/↑/↑/↑ |
| Generation / `munsell` | 3.814761 | 3.621149 | 3.814761 | 3.814761 | 3.814761 | 3.772835 | ↓/↑/↓/↓ |
| Generation / `xiao_unique_hues` | 1.741198 | 1.720468 | 1.741198 | 1.741198 | 1.741198 | 1.735127 | ↓/↑/↓/↓ |
| Generation / `osa_ucs_1974` | 0.289962 | 0.293547 | 0.268520 | 0.223511 | 0.215845 | 0.212873 | ↓/↓/↓/↓ |
| Measurement / `macadam1942` | 0.342848 | 0.322748 | 0.304368 | 0.275222 | 0.281029 | 0.294808 | ↓/↓/↑/↑ |
| Measurement / `luo_rigg_ellipses` | 0.324861 | 0.308967 | 0.257292 | 0.199398 | 0.206401 | 0.205743 | ↓/↓/↑/↓ |
| Measurement / `alder1982` | 0.327763 | 0.295065 | 0.293372 | 0.220841 | 0.225729 | 0.233772 | ↓/↓/↑/↑ |
| Measurement / `regan_1994_cvd_ellipses` | 0.231932 | 0.246845 | 0.249605 | 0.194524 | 0.214576 | 0.225533 | ↓/↓/↑/↑ |
| Measurement / `koenderink_2026_3d_metric_field` | 0.388213 | 0.389138 | 0.311521 | 0.283671 | 0.268555 | 0.274460 | ↓/↓/↓/↑ |
| Measurement / `brown_1957_12obs_ellipsoids` | 0.356365 | 0.380615 | 0.357798 | 0.348391 | 0.349606 | 0.355609 | ↓/↓/↑/↑ |
| Measurement / `wyszecki_fielder_1971_ellipsoids` | 0.324500 | 0.316225 | 0.303870 | 0.243826 | 0.269760 | 0.271149 | ↓/↓/↑/↑ |
| Measurement / `brown_macadam_1949_ellipsoids` | 0.345158 | 0.355955 | 0.346632 | 0.329939 | 0.339191 | 0.343582 | ↓/↓/↑/↑ |
| Measurement / `huang_2012_cielab_ellipses` | 0.311075 | 0.300202 | 0.322020 | 0.282768 | 0.270667 | 0.276184 | ↓/↓/↓/↑ |
| Measurement / `berns_1991_rit_dupont_tolerance_vectors` | 0.337349 | 0.315045 | 0.398585 | 0.342735 | 0.343526 | 0.338571 | ↑/↑/↓/↓ |
| Measurement / `hong_2025_ellipsoids` | 0.300165 | 0.343185 | 0.294125 | 0.217144 | 0.235575 | 0.245974 | ↓/↓/↑/↑ |
| Measurement / `bfd` | 32.707180 | 29.291189 | 48.518062 | 39.585463 | 36.192268 | 36.758450 | ↑/↑/↓/↑ |
| Measurement / `leeds` | 26.939914 | 24.517147 | 44.052548 | 31.787016 | 32.669131 | 33.564591 | ↑/↑/↑/↑ |
| Measurement / `witt` | 22.630294 | 20.339660 | 52.837061 | 34.124943 | 33.889428 | 33.828082 | ↑/↑/↓/↓ |
| Measurement / `rit` | 29.717938 | 26.722042 | 35.680411 | 30.624143 | 28.517939 | 28.255728 | ↓/↑/↓/↓ |
| Measurement / `macadam` | 32.563634 | 31.617701 | 41.791617 | 28.390453 | 29.525687 | 28.903942 | ↓/↓/↑/↓ |

## WITT multiplicity-seven development holdout

The closed v4 fit excluded WITT multiplicity-seven pairs from pair-loss training: 416 native retained rows and 418 full rows. The native mapped column includes two additional mapped WITT pairs. This split is a within-source development check because earlier HRL research already exposed the source; it cannot be called an independent observer validation.

| WITT population | Beta 1 | Frozen joint | v3 guarded | v4 guarded |
| --- | ---: | ---: | ---: | ---: |
| Native retained (416; no mapping) | 23.567931 | 21.149113 | 41.011112 | 41.820549 |
| Native mapped all (418; 2 mapped) | 24.099002 | 21.719567 | 41.280634 | 42.074226 |
| Full retained (418; no mapping) | 22.630294 | 20.339660 | 33.889428 | 33.828082 |

The full fitted source-grid diagnostic reports worst fixed-Reach retreat `0.016712`, versus approximately `0.064670` in guarded v3. This is a source-grid diagnostic, not a direct-runtime visual result. The v4 bank still has worse observer scores than the frozen references and worse native WITT than v3. Native judge comparisons with v3 are 3 wins and 18 losses; full comparisons are 8 wins and 13 losses.

## Model and benchmark identities

- v4 model source Git commit `069bc01df0aed664d9913cd23840f31b66aec1b0` with tracked `v2` clean; entry SHA256 `a42dfc8ea2c0d9ebe02f386ca64a80089a58c1347a5bf3c7b7759e572214616c`, sibling model `8164861ec50eb6be55a969206a549227416697368386162a29cefdd81d9f400c`, explicit bank `35838487659b664d363bd1e01bf154221126577889bc561828bd2b1607d3e85c`.
- The recursive 24-file local JS import manifest has SHA256 `3a94d274dc43698ca119777791a43bc0f8804de9f85594a28bc37a357671ad04`; ten inherited runtime JSON resources SHA256 `954794a4080c5b6e1aca9acd77826e3b97fc8500d048f18aa93f341bfb47ddce`. [Standalone manifest](conditional-v4-source-manifest.json) and the full board JSON include every source path/hash; JS scorer and Python board check before and after each gamut, while the bridge checks before runtime import.
- v4 adds two hue modules to the v3 source tree. Two inherited module byte identities also differ: `conditional-field/index.mjs` changes checkpoint/version metadata and `fresh-field/model.mjs` carries a one-ulp inverse boundary repair. The ten inherited JSON file contents match v3; because the two source checkouts differ, absolute-path manifest hashes differ. The v4-v3 result is therefore **not a controlled isolated hue-flow ablation**.
- [v4 full original board](colorbench-conditional-v4-coupled-guarded.json), [execution log](colorbench-conditional-v4-coupled-guarded.log), [direct COMBVD family splits](combvd-conditional-v4-coupled-guarded.json); [v3 report](CONDITIONAL_V3_COLORBENCH.md) and [v1 report](FRESH_V1_COLORBENCH.md) show the preceding experiments.

All scored ColorBench datasets were previously visible in HRL project development. Generated elliptical stimuli may include mapped input, and the original judge skips and preprocessing were preserved; consult the per-judge point and mapping audits before interpreting a score change. Full-domain numeric scores on an sRGB display are not a visual proof. The paired observer and sheet/edge gates need a newly closed candidate.

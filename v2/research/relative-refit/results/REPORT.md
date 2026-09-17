# Corrected-solid R/L refit: ColorBench

Same corrected physical solid, carrier, hue field/ring, source atlas, and neutral progression. Only full-profile R/L coupling coefficients were fitted. Three layers (195 coefficients) rather than the previous two (130).

The selected checkpoint was frozen before running these human-data judges. COMBVD was fitted; OSA-UCS, MacAdam1974, Xiao, and threshold/tolerance datasets were not used in this refit. Inherited hue-field training contamination still applies.

**Lower is better within each row.** † includes declared clipping; ‡ has incomplete strict support. Neither flag denotes an unchanged full-dataset score. No overall rank is claimed.

| Dataset | Before refit | Refit / clip | Refit / strict |
|---|---:|---:|---:|
| hung_berns | 3.397949 † | 3.397949 † | N/A |
| ebner_fairchild | 2.242869 | 2.242869 | 2.242869 |
| munsell | 3.816220 | 3.816220 | 3.816220 |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.334980 | 0.252630 | 0.252630 |
| bfd | 40.195463 | 29.189331 | 29.189331 |
| leeds | 34.710625 | 26.817570 | 26.817570 |
| witt | 27.310520 | 24.102805 | 24.102805 |
| rit | 37.010658 | 26.992010 | 26.992010 |
| macadam | 36.941120 | 30.986596 | 30.986596 |
| macadam1942 | 0.357852 | 0.275755 | 0.275755 |
| luo_rigg_ellipses | 0.292293 | 0.250370 | 0.250370 |
| alder1982 | 0.325327 | 0.301126 | 0.301126 |
| regan_1994_cvd_ellipses | 0.301323 | 0.227057 | 0.227057 |
| koenderink_2026_3d_metric_field | 0.389297 | 0.334432 | 0.334432 |
| brown_1957_12obs_ellipsoids | 0.410117 † | 0.347406 † | 0.330679 ‡ |
| wyszecki_fielder_1971_ellipsoids | 0.362710 † | 0.284355 † | 0.286166 ‡ |
| brown_macadam_1949_ellipsoids | 0.372421 † | 0.329997 † | 0.307893 ‡ |
| huang_2012_cielab_ellipses | 0.330894 | 0.307215 | 0.307215 |
| berns_1991_rit_dupont_tolerance_vectors | 0.418826 | 0.328794 | 0.328794 |
| hong_2025_ellipsoids | 0.301022 | 0.314120 | 0.314120 |

## COMBVD, same ColorBench-prepared inputs

| Model | Unweighted | Traditional weighted | Retained |
|---|---:|---:|---:|
| baseline-full-300-clip | 39.597921 | 37.221658 | 3813/3813 |
| refit-full-300-clip | 28.901216 | 27.822994 | 3813/3813 |
| metric-full-300-clip | 27.618625 | 26.711042 | 3813/3813 |
| refit-full-300-reject | 28.901216 | 27.822994 | 3813/3813 |
| refit-full-100-clip | 28.901216 | 27.822994 | 3813/3813 |
| refit-srgb-300-clip | 28.780616 | 27.819289 | 3331/3813 |
| refit-srgb-100-clip | 28.780616 | 27.819289 | 3331/3813 |

## Reference-white scale check

Both contexts were actually evaluated with the same relative XYZ. The refit does not add an absolute-luminance appearance response. Identical scores do not select 300 over 100 nits.

```json
{
  "full": {
    "maximum_score_difference": 0.0,
    "combvd_difference": 0.0,
    "meaning": "Relative calibration is scale-invariant. This does not empirically identify an optimal white luminance."
  },
  "srgb": {
    "maximum_score_difference": 0.0,
    "combvd_difference": 0.0,
    "meaning": "Relative calibration is scale-invariant. This does not empirically identify an optimal white luminance."
  }
}
```

Only the five scored generation and sixteen measurement columns were run. See verification.json and visual diagnostics for the separate implementation and synthetic-path checks.

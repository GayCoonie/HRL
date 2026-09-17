# Native sRGB refits: ColorBench

Separate native calibration on the existing sRGB own-anchor source atlas. Shared physical hue sheets/ring, unchanged black/white/vivid anchors and neutral shift. The full profiles are unchanged.

COMBVD was fitted, using exactly the same 3,331 retained pairs. OSA, MacAdam1974, Xiao, and threshold/tolerance data were not used in this refit. Prior exposure and inherited hue-field training still apply.

**Lower is better within each row.** A dagger marks incomplete native-sRGB support, not clipping. Unsupported stimuli are rejected, not gamut-mapped. No native score is ranked against a full-coverage leaderboard.

| Dataset | Previous native C1 | Balanced native | Metric native |
|---|---:|---:|---:|
| hung_berns | N/A | N/A | N/A |
| ebner_fairchild | N/A | N/A | N/A |
| munsell | N/A | N/A | N/A |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.236671 † | 0.251473 † | 0.241386 † |
| bfd | 29.046938 † | 28.223624 † | 27.496118 † |
| leeds | 26.483363 | 25.821342 | 24.117515 |
| witt | 24.689223 † | 21.060954 † | 20.841966 † |
| rit | 28.476497 † | 26.390619 † | 25.205027 † |
| macadam | 25.639594 † | 25.734213 † | 27.924979 † |
| macadam1942 | 0.312438 † | 0.271039 † | 0.262476 † |
| luo_rigg_ellipses | 0.248558 † | 0.242985 † | 0.255665 † |
| alder1982 | 0.242815 † | 0.261385 † | 0.261134 † |
| regan_1994_cvd_ellipses | 0.253579 † | 0.188017 † | 0.201601 † |
| koenderink_2026_3d_metric_field | 0.332151 | 0.335947 | 0.345328 |
| brown_1957_12obs_ellipsoids | N/A | N/A | N/A |
| wyszecki_fielder_1971_ellipsoids | 0.305608 † | 0.282921 † | 0.281397 † |
| brown_macadam_1949_ellipsoids | N/A | N/A | N/A |
| huang_2012_cielab_ellipses | 0.301883 † | 0.309925 † | 0.302967 † |
| berns_1991_rit_dupont_tolerance_vectors | 0.337014 † | 0.338918 † | 0.313233 † |
| hong_2025_ellipsoids | 0.241622 | 0.265294 | 0.263628 |

## COMBVD, identical ColorBench-prepared native subset

| Model | Weighted | Unweighted | Retained |
|---|---:|---:|---:|
| baseline-srgb-300-reject | 27.819289 | 28.780616 | 3331/3813 |
| refit-srgb-300-reject | 26.156618 | 27.735136 | 3331/3813 |
| metric-srgb-300-reject | 25.272446 | 26.976822 | 3331/3813 |
| refit-srgb-100-reject | 26.156618 | 27.735136 | 3331/3813 |

No COMBVD inputs are clipped. The same source-data white conversion, scale-optimal STRESS, and multiplicities are used for every column.

## 100/300-nit unit invariance

Same relative inputs, independent real runs. This is not a test of an absolute-luminance appearance response.

```json
{
  "srgb": {
    "maximum_score_difference": 0.0,
    "combvd_difference": 0.0,
    "meaning": "Relative calibration is scale-invariant. This does not empirically identify an optimal white luminance."
  }
}
```

Only the five scored generation and sixteen scored measurement columns were run. Native full-atlas path diagnostics and numeric round-trips are separate checks.

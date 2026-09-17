# Relative-domain ColorBench rerun

Run commit: `46c8718b913065eb17de6466219841c8284e7f7e`. ColorBench `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`. Pool `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`.

No observer refit was performed. The old checkpoints remain unchanged. New full-domain coordinates use regenerated path maps on the physical chromaticity cone with 0 <= relative Y <= 1.

**† marks explicitly clipped inputs; ‡ marks incomplete strict support.** Missing results are N/A, not zero. The high-magnitude hue continuation is separately counted in the JSON audits. No overall rank is claimed for a clipped-input pipeline.

| Dataset | 0.8A old | C1 old | 0.8A corrected/clip | C1 corrected/clip | C1 corrected/strict |
|---|---:|---:|---:|---:|---:|
| hung_berns | N/A | N/A | 3.397949 † | 3.397949 † | N/A |
| ebner_fairchild | 2.242869 | 2.242869 | 2.242869 | 2.242869 | 2.242869 |
| munsell | 3.816220 | 3.816220 | 3.816220 | 3.816220 | 3.816220 |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.309323 | 0.300851 | 0.346812 | 0.334980 | 0.334980 |
| bfd | 29.899816 | 29.876351 | 39.297806 | 40.195463 | 40.195463 |
| leeds | 27.364162 | 27.479856 | 36.795001 | 34.710625 | 34.710625 |
| witt | 23.520950 | 22.991591 | 31.369154 | 27.310520 | 27.310520 |
| rit | 30.503707 | 30.205857 | 37.327361 | 37.010658 | 37.010658 |
| macadam | 32.806409 | 31.680924 | 38.041039 | 36.941120 | 36.941120 |
| macadam1942 | 0.344632 ‡ | 0.322756 ‡ | 0.336006 | 0.357852 | 0.357852 |
| luo_rigg_ellipses | 0.287903 ‡ | 0.272802 ‡ | 0.299751 | 0.292293 | 0.292293 |
| alder1982 | 0.314055 ‡ | 0.313812 ‡ | 0.338571 | 0.325327 | 0.325327 |
| regan_1994_cvd_ellipses | 0.303371 | 0.253079 | 0.332464 | 0.301323 | 0.301323 |
| koenderink_2026_3d_metric_field | 0.389347 | 0.367715 | 0.398782 | 0.389297 | 0.389297 |
| brown_1957_12obs_ellipsoids | N/A | N/A | 0.390320 † | 0.410117 † | 0.458824 ‡ |
| wyszecki_fielder_1971_ellipsoids | 0.369105 ‡ | 0.356820 ‡ | 0.375670 † | 0.362710 † | 0.365875 ‡ |
| brown_macadam_1949_ellipsoids | 0.367528 ‡ | 0.333052 ‡ | 0.372662 † | 0.372421 † | 0.344567 ‡ |
| huang_2012_cielab_ellipses | 0.291347 | 0.306295 | 0.328129 | 0.330894 | 0.330894 |
| berns_1991_rit_dupont_tolerance_vectors | 0.400739 | 0.394521 | 0.427782 | 0.418826 | 0.418826 |
| hong_2025_ellipsoids | 0.283809 | 0.280531 | 0.317497 | 0.301022 | 0.301022 |

## COMBVD

| Model | Unweighted | Traditional weighted | Retained |
|---|---:|---:|---:|
| legacy-parent-full-300-reject | 29.608930 | 28.561281 | 3813/3813 |
| legacy-candidate-full-300-reject | 29.565423 | 28.447720 | 3813/3813 |
| relative-parent-full-300-clip | 38.922328 | 37.478234 | 3813/3813 |
| relative-candidate-full-300-clip | 39.597921 | 37.221658 | 3813/3813 |
| relative-candidate-full-100-clip | 39.597921 | 37.221658 | 3813/3813 |
| relative-candidate-full-300-reject | 39.597921 | 37.221658 | 3813/3813 |
| relative-candidate-srgb-300-clip | 28.780616 | 27.819289 | 3331/3813 |
| relative-candidate-srgb-100-clip | 28.780616 | 27.819289 | 3331/3813 |

## 100 versus 300 nits

Both contexts were actually run on the same relative XYZ inputs. The existing relative calibration has no newly fitted absolute-luminance response; identical results are therefore a unit-invariance check, not evidence that either white luminance is better.

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

## Scope

Only the five scored generation and sixteen scored measurement columns were evaluated. Appearance diagnostics, ordinal HumanFB, application scenarios, and unscored physics gates were excluded. Separate numerical round-trip/unit tests validate the implementation.

The original COMBVD, hue-field fitting, and inherited development-data contamination still apply. Newly admitted stimuli may be outside the hue model’s original fitted magnitude interval; continuation is not additional observer evidence.

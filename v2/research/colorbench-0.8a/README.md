# HRL 0.8A — scored ColorBench baseline

Pinned baseline: `5552223b1d51a07c869a01d3cae81847e4c0c13f`. ColorBench: `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`. Dataset pool: `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`.

The requested **0.8A checkpoint is `createASmooth({variant:"parent"})`**, not the approved newer Smooth profile. Both are reported, separately. The baseline was run before the R/L C1 experiment.

## Scope and computation

Only the five generation and sixteen measurement score columns defined in upstream `research/leaderboard.py` were run. The 39 application scenarios, ordinal-only HumanFB score, appearance diagnostics, and unscored robustness gate were omitted.

The adapter calls the actual JavaScript model, continuously in double precision. Forward coordinates are the native unit bicone `[L-R/2, sqrt(3)/2 R cos(H), sqrt(3)/2 R sin(H)]`. Neither raw H/R/L nor a different color-space metric is substituted. No additional coordinate rescaling or input gamut clipping is performed. Upstream preprocessing (including its own clipping where present) remains as written.

`run_scored.py` uses the numpy input path rather than the upstream torch-first dispatch (which would immediately convert back to numpy). Its memory-bounded worksheet reader was checked against every numeric record in the upstream raw COMBVD JSON: exact equality for all 3,813 records. It uses the same worksheet, row selection, dataset labels, XYZ units, Bradford conversion, STRESS, and bootstrap routines as the upstream measurement board.

## Domain coverage is not a score

0.8A is bounded. Some ColorBench stimuli exceed its white-relative brightness envelope or physical cone; the native-sRGB profile additionally excludes out-of-sRGB stimuli. Unsupported inputs are recorded as NaN and audited. Some upstream judges consequently skip whole neighborhoods, while the hue judge propagates NaN. **A subset score is not a full-dataset score and is not ranked against full-coverage entrants.** No overall leaderboard placement is claimed.

For example, the full profile rejects 18 of 156 Hung–Berns inputs, including Y=1.0041 stimuli. None of the 21 Brown-1957 ellipsoids has complete supported neighborhoods; some generated inputs have Y several times reference white. These are recorded as unsupported, not clipped or silently repaired.

## Generation — lower is better

Values followed by † have incomplete support. `N/A` means the literal upstream judge could not produce a finite score. Full per-dataset audits are in the JSON files.

| Dataset | 0.8A full | Smooth full | 0.8A sRGB | Smooth sRGB |
|---|---:|---:|---:|---:|
| hung_berns | N/A | N/A | N/A | N/A |
| ebner_fairchild | 2.242869 | 2.242869 | N/A | N/A |
| munsell | 3.816220 | 3.816220 | N/A | N/A |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.309323 | 0.314833 | 0.253739 † | 0.238442 † |

## Measurement — lower is better

The first five columns here are STRESS; discrimination and tolerance values are coefficients of variation.

| Dataset | 0.8A full | Smooth full | 0.8A sRGB | Smooth sRGB |
|---|---:|---:|---:|---:|
| bfd | 29.899816 | 30.405726 | 29.481316 † | 29.498161 † |
| leeds | 27.364162 | 27.368794 | 26.395035 | 26.420868 |
| witt | 23.520950 | 23.503638 | 24.270943 † | 25.062004 † |
| rit | 30.503707 | 31.036805 | 28.131772 † | 28.848541 † |
| macadam | 32.806409 | 31.914425 | 26.574751 † | 25.693543 † |
| macadam1942 | 0.344632 † | 0.334767 † | 0.345854 † | 0.313356 † |
| luo_rigg_ellipses | 0.287903 † | 0.275906 † | 0.268562 † | 0.249988 † |
| alder1982 | 0.314055 † | 0.312091 † | 0.274191 † | 0.245718 † |
| regan_1994_cvd_ellipses | 0.303371 | 0.252212 | 0.336565 † | 0.263538 † |
| koenderink_2026_3d_metric_field | 0.389347 | 0.374064 | 0.365544 | 0.332900 |
| brown_1957_12obs_ellipsoids | N/A | N/A | N/A | N/A |
| wyszecki_fielder_1971_ellipsoids | 0.369105 † | 0.359065 † | 0.320922 † | 0.307990 † |
| brown_macadam_1949_ellipsoids | 0.367528 † | 0.334889 † | N/A | N/A |
| huang_2012_cielab_ellipses | 0.291347 | 0.306890 | 0.311781 † | 0.300850 † |
| berns_1991_rit_dupont_tolerance_vectors | 0.400739 | 0.402127 | 0.352220 † | 0.341605 † |
| hong_2025_ellipsoids | 0.283809 | 0.287916 | 0.255869 | 0.243074 |

## COMBVD conventions

Do not compare these two conventions as if they were the same run.

| Profile | Official ColorBench unweighted | ColorBench-input traditional weighting | Retained pairs |
|---|---:|---:|---:|
| parent-full | 29.608930 | 28.561281 | 3813/3813 |
| parent-srgb | 29.140616 | 27.902581 | 3331/3813 |
| smooth-full | 30.082816 | 28.917886 | 3813/3813 |
| smooth-srgb | 29.205588 | 28.155037 | 3331/3813 |

The unchanged repository publication gate was also re-run successfully: traditional weighting with its own stored, exact-HRL-white inputs reproduces parent **27.907880 sRGB / 28.607473 full** and Smooth **28.172398 sRGB / 28.955307 full**. Its small differences from ColorBench-input weighted values come from different preprocessing conventions, not a replacement embedding. Traditional multiplicities: BFD-P 1, LEEDS 9, RIT-DuPont 9, WITT 7.

## Interpretation

COMBVD is training data, so improvement is an in-sample fit result. Hung–Berns, Ebner–Fairchild, and part of Munsell informed the existing hue field. Xiao and OSA were not used in this continuation fit; neither were MacAdam1974 or threshold/tolerance datasets. RIT-DuPont tolerance is related in source family to COMBVD RIT-DuPont and should not be sold as wholly independent evidence.

OSA spacing is a genuine weakness of these checkpoints: full 0.8A is 0.309323 and Smooth 0.314833. The pinned published board reports IPT at 0.078102 and OKLab at 0.212394. Those comparator values are published cached results, not new comparator runs. Hue scores are unchanged by the R/L-only Smooth warp, as expected.

## Reproduce

```sh
git clone https://github.com/Grkmyldz148/colorbench.git ../colorbench
git -C ../colorbench checkout 12b2de215cc5020682e3d245a8c78bce5f0ebbc9
git clone https://github.com/Grkmyldz148/color-perception-datasets.git ../color-perception-datasets
git -C ../color-perception-datasets checkout 8641f4e8ebd9d85a34dc0fedc116fa0e58493190
python -m pip install numpy scipy colour-science
python v2/research/colorbench-0.8a/run_scored.py \
  --colorbench ../colorbench --pool ../color-perception-datasets/datasets \
  --gamut full --variant parent
```

Repeat with `--gamut srgb` and/or `--variant smooth`. Results are saved under `results/`. A partially completed run resumes existing same-checkpoint score records. Production HRL definitions and approved defaults are not edited.

# HRL 0.11: GenSpace-trained tonal checkpoints

These are newly fitted coefficients, not a rerating or relabeling of the unchanged 0.10 candidates. Previous models and entry points are retained. The source geometry, hue field and ring, neutral progression, vivid endpoints and one-bank-per-candidate architecture are unchanged.

## What was fitted

Human training: supported COMBVD pairs only. Synthetic regularizers: full three-dimensional frozen HelmLab 1.0.0 GenSpace trajectories for black dilution, white dilution, neutral exchange and fixed-Level Reach. Oklab and the former scalar lightness power target are absent from this fit. ZCAM motivates the semantics but its predicted attribute ratings were not relabeled as new human observations.

The traditional weighted STRESS-squared objective has equal native/full weights. Each recipe records its path, corner-retreat and dark-envelope weights. The broad dark continuation envelope uses previous user-reviewed candidates, not a paper-derived curve. R=chromaticness, K=1-L and W=L-R remain the meaning of the coordinates.

## COMBVD: actual runtime, unchanged support

| Candidate | Native weighted | Native unweighted | Full weighted | Full unweighted |
|---|---:|---:|---:|---:|
| 0.10 balanced | 32.116410 | 33.687327 | 31.449030 | 33.306056 |
| 0.10 metric | 29.318042 | 30.939439 | 29.630885 | 31.234386 |
| Gen tonal balanced | 29.410505 | 30.958686 | 30.371858 | 32.354725 |
| Gen tonal metric | 28.195015 | 29.831797 | 28.941919 | 30.712210 |

Native retains the same 3,331/3,813 supported pairs, full retains all 3,813. No COMBVD clipping. The native and full overall values have different support and are not a same-stimulus gamut comparison. COMBVD is in-sample. Earlier project development exposed other evaluation results; the scored rerun is not pristine independent validation.

## Direct GenSpace paths

72 hues offset 2.5 degrees from the nominal grid, five paths in each of four families, 257 samples, four models, two gamuts: 2,960,640 XYZ evaluations including repeated endpoints. Actual inverse runtime, not the training lookup grid. Two endpoint steps are trimmed for step-variation statistics, but not for direction checks. No display clipping or unavailable-path deletion.

| Gamut | Candidate | Black CV | White CV | Neutral-exchange CV | Reach CV |
|---|---|---:|---:|---:|---:|
| srgb | 0.10 balanced | 0.301139 | 0.211282 | 0.208745 | 0.424390 |
| srgb | 0.10 metric | 0.324342 | 0.324999 | 0.341595 | 0.614340 |
| srgb | Gen tonal balanced | 0.224184 | 0.194377 | 0.216303 | 0.351099 |
| srgb | Gen tonal metric | 0.263517 | 0.239179 | 0.254157 | 0.425698 |
| full | 0.10 balanced | 0.340153 | 0.332053 | 0.254905 | 0.518515 |
| full | 0.10 metric | 0.364574 | 0.481534 | 0.422154 | 0.679926 |
| full | Gen tonal balanced | 0.257496 | 0.309925 | 0.257108 | 0.381203 |
| full | Gen tonal metric | 0.299973 | 0.362927 | 0.322332 | 0.449612 |

CV is step-size standard deviation divided by its mean. Lower is more even by this external ruler, not proof of human preference. Unlike the preceding audit, the path ratios and offset hues are revised; all old controls are rerun on the identical new diagnostic sample set.

### Step jumps and corner direction

| Gamut | Candidate | Black mean step jump | White mean step jump | Black retreat paths / 360 | White retreat paths / 360 | Mean white retreat / start distance |
|---|---|---:|---:|---:|---:|---:|
| srgb | 0.10 balanced | 0.016350 | 0.009160 | 5 | 103 | 0.00586705 |
| srgb | 0.10 metric | 0.019966 | 0.012289 | 42 | 139 | 0.01677504 |
| srgb | Gen tonal balanced | 0.014857 | 0.007621 | 1 | 54 | 0.00214253 |
| srgb | Gen tonal metric | 0.016947 | 0.009475 | 15 | 68 | 0.00221179 |
| full | 0.10 balanced | 0.017339 | 0.011199 | 22 | 110 | 0.00521406 |
| full | 0.10 metric | 0.020495 | 0.014693 | 55 | 120 | 0.01418519 |
| full | Gen tonal balanced | 0.015798 | 0.009515 | 17 | 58 | 0.00237571 |
| full | Gen tonal metric | 0.017780 | 0.011241 | 25 | 85 | 0.00413726 |

A corner retreat is movement back toward black on a black-origin path, or away from the endpoint on a white-directed path in full GenSpace distance. It is not a topological fold. Both counts and magnitudes matter. A larger or smaller scalar Gen lightness value is not substituted for blackness or whiteness.

### Matching-role changes

| Gamut | New candidate vs same-role 0.10 | Weighted COMBVD change | Black CV change | White CV change |
|---|---|---:|---:|---:|
| srgb | balanced | -2.705904 | -25.55% | -8.00% |
| srgb | metric | -1.123026 | -18.75% | -26.41% |
| full | balanced | -1.077171 | -24.30% | -6.66% |
| full | metric | -0.688967 | -17.72% | -24.63% |

Do not infer that every hue or every local step improved from an average. Raw per-hue and per-path results are in direct-final.json, including worst-step measures and residual reversals. Interleaved synthetic samples are a numerical out-of-grid check, not independent observer data.

## Scored ColorBench

Only the five scored generation and sixteen scored measurement columns. The scored judges are unchanged, not redefined in GenSpace. Strict native/full inputs are shown below. A dagger denotes incomplete or mapped support; N/A is unavailable, not zero. Full clipped results are a separate pipeline. No overall leaderboard rank is constructed.

### srgb: strict inputs

| Test | 0.10 balanced | 0.10 metric | Gen tonal balanced | Gen tonal metric |
|---|---:|---:|---:|---:|
| hung_berns | N/A | N/A | N/A | N/A |
| ebner_fairchild | N/A | N/A | N/A | N/A |
| munsell | N/A | N/A | N/A | N/A |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.276680 † | 0.288432 † | 0.269081 † | 0.265768 † |
| macadam1942 | 0.289835 † | 0.300937 † | 0.286494 † | 0.280401 † |
| luo_rigg_ellipses | 0.274304 † | 0.272051 † | 0.270416 † | 0.263813 † |
| alder1982 | 0.302525 † | 0.296686 † | 0.295601 † | 0.287421 † |
| regan_1994_cvd_ellipses | 0.216452 † | 0.220428 † | 0.198435 † | 0.199005 † |
| koenderink_2026_3d_metric_field | 0.344856 | 0.365400 | 0.322989 | 0.333155 |
| brown_1957_12obs_ellipsoids | N/A | N/A | N/A | N/A |
| wyszecki_fielder_1971_ellipsoids | 0.329856 † | 0.336116 † | 0.316854 † | 0.314055 † |
| brown_macadam_1949_ellipsoids | N/A | N/A | N/A | N/A |
| huang_2012_cielab_ellipses | 0.325183 † | 0.321219 † | 0.319746 † | 0.326660 † |
| berns_1991_rit_dupont_tolerance_vectors | 0.397861 † | 0.343361 † | 0.359584 † | 0.343553 † |
| hong_2025_ellipsoids | 0.282949 | 0.301334 | 0.250620 | 0.258596 |
| bfd | 34.186052 † | 31.449752 † | 31.469872 † | 30.361380 † |
| leeds | 30.837878 | 27.744421 | 28.499639 | 25.868871 |
| witt | 25.864378 † | 23.221099 † | 23.676903 † | 22.719906 † |
| rit | 34.566391 † | 31.387185 † | 31.678904 † | 30.799590 † |
| macadam | 27.843703 † | 29.179381 † | 25.988935 † | 28.913900 † |

### full: strict inputs

| Test | 0.10 balanced | 0.10 metric | Gen tonal balanced | Gen tonal metric |
|---|---:|---:|---:|---:|
| hung_berns | N/A | N/A | N/A | N/A |
| ebner_fairchild | 2.242869 | 2.242869 | 2.242869 | 2.242869 |
| munsell | 3.816220 | 3.816220 | 3.816220 | 3.816220 |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.281138 | 0.286840 | 0.275654 | 0.282705 |
| macadam1942 | 0.303628 | 0.332891 | 0.327829 | 0.305680 |
| luo_rigg_ellipses | 0.303629 | 0.321214 | 0.308851 | 0.280578 |
| alder1982 | 0.311239 | 0.328873 | 0.319009 | 0.297136 |
| regan_1994_cvd_ellipses | 0.239882 | 0.239276 | 0.224486 | 0.224497 |
| koenderink_2026_3d_metric_field | 0.384238 | 0.392253 | 0.368102 | 0.381774 |
| brown_1957_12obs_ellipsoids | 0.420611 † | 0.495451 † | 0.380514 † | 0.408395 † |
| wyszecki_fielder_1971_ellipsoids | 0.338199 † | 0.346874 † | 0.329580 † | 0.339981 † |
| brown_macadam_1949_ellipsoids | 0.334002 † | 0.323109 † | 0.306312 † | 0.311929 † |
| huang_2012_cielab_ellipses | 0.320552 | 0.314363 | 0.309939 | 0.343965 |
| berns_1991_rit_dupont_tolerance_vectors | 0.360299 | 0.360035 | 0.336730 | 0.360516 |
| hong_2025_ellipsoids | 0.316349 | 0.320339 | 0.302807 | 0.299210 |
| bfd | 33.800983 | 31.670834 | 32.885875 | 31.187128 |
| leeds | 27.778236 | 27.290987 | 28.063204 | 26.629974 |
| witt | 25.254441 | 23.535872 | 23.728116 | 22.955480 |
| rit | 32.529187 | 31.038975 | 29.976732 | 29.169058 |
| macadam | 32.483718 | 29.690126 | 30.790536 | 32.143491 |

### Full: explicitly mapped pipeline

| Test | Gen tonal balanced | Gen tonal metric |
|---|---:|---:|
| hung_berns | 3.397949 † | 3.397949 † |
| ebner_fairchild | 2.242869 | 2.242869 |
| munsell | 3.816220 | 3.816220 |
| xiao_unique_hues | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.275654 | 0.282705 |
| macadam1942 | 0.327829 | 0.305680 |
| luo_rigg_ellipses | 0.308851 | 0.280578 |
| alder1982 | 0.319009 | 0.297136 |
| regan_1994_cvd_ellipses | 0.224486 | 0.224497 |
| koenderink_2026_3d_metric_field | 0.368102 | 0.381774 |
| brown_1957_12obs_ellipsoids | 0.361332 † | 0.365960 † |
| wyszecki_fielder_1971_ellipsoids | 0.318144 † | 0.329796 † |
| brown_macadam_1949_ellipsoids | 0.349303 † | 0.349738 † |
| huang_2012_cielab_ellipses | 0.309939 | 0.343965 |
| berns_1991_rit_dupont_tolerance_vectors | 0.336730 | 0.360516 |
| hong_2025_ellipsoids | 0.302807 | 0.299210 |
| bfd | 32.885875 | 31.187128 |
| leeds | 28.063204 | 26.629974 |
| witt | 23.728116 | 22.955480 |
| rit | 29.976732 | 29.169058 |
| macadam | 30.790536 | 32.143491 |

## Same-pair overlap and full-only check

| Candidate | Realization / subset | Pairs | Weighted STRESS |
|---|---|---:|---:|
| 0.10 balanced | srgb / common | 3331 | 32.116410 |
| 0.10 balanced | full / common | 3331 | 31.197584 |
| 0.10 balanced | full / full-only | 482 | 32.429838 |
| 0.10 metric | srgb / common | 3331 | 29.318042 |
| 0.10 metric | full / common | 3331 | 29.574688 |
| 0.10 metric | full / full-only | 482 | 29.796871 |
| Gen tonal balanced | srgb / common | 3331 | 29.410505 |
| Gen tonal balanced | full / common | 3331 | 29.973645 |
| Gen tonal balanced | full / full-only | 482 | 31.938055 |
| Gen tonal metric | srgb / common | 3331 | 28.195015 |
| Gen tonal metric | full / common | 3331 | 28.676896 |
| Gen tonal metric | full / full-only | 482 | 30.059155 |

## Verification

The actual JavaScript checks cover 8,192 random triangle round-trips per model/gamut (256 near black), 4,096 exact 16-bit round-trips, 1,025 neutrals, 720 vivid anchors, 1,200 interior Jacobians, and circular continuity. Also: 2,048 identical normalized tuples across gamuts, 2,048 untrained Adobe RGB linear round-trips, and 1,024 relative 100/300-nit identity checks per candidate.

| Candidate | Native maximum embedding error | Full maximum embedding error | Native min determinant | Full min determinant |
|---|---:|---:|---:|---:|
| balanced | 1.253e-11 | 4.292e-12 | 0.195869 | 0.0944331 |
| metric | 9.92e-12 | 1.299e-11 | 0.059314 | 0.0685555 |

The Python training equations were separately compared against JavaScript, and the implicit inverse derivative was checked by finite differences. This verifies the training math, not the psychophysical validity of its synthetic targets.

Inherited limitations: full is still the polygonized physical solid with relative Y<=1. Canonical P3 remains explicitly outside that polygon at red; this pass does not claim new P3 support. High-magnitude hue continuation is retained and separately counted by the benchmark adapter. Source/white/neutral/hue definitions were not refitted.

## Records

PLAN.md was committed before optimization. All five trial recipes and final coefficient arrays are retained in the downloadable review bundle; per-evaluation JSONL traces are preserved there and hashed in trials/registry.json. They are actual logs of this turn, not reconstructed logs from the previous interruptions. The differentiable grid is reproducible through cache.mjs and not required by the runtime library.

Frozen selection:

```json
{
  "status": "Frozen before the new scored ColorBench run",
  "timeUTC": "2026-09-17T18:15:08.784134+00:00",
  "baseCommit": "bf43587e620c97a660a6f4d3da76ae41472446f8",
  "human_training": [
    "COMBVD"
  ],
  "syntheticRuler": "frozen HelmLab 1.0.0 GenSpace",
  "selectionBasis": "joint training objective, 36-hue direct-runtime diagnostics and native hue-sheet review; not new held-out scores",
  "candidates": {
    "balanced": {
      "trial": "g2-balanced",
      "sha256": "109555996bc49629f35397c9bdbc1c8edac8f4ce753fb86caf8ce885e43892f8",
      "layers": 5
    },
    "metric": {
      "trial": "g2-metric",
      "sha256": "11b2c1039943cf31925ec7df22f4071859bb8ed3d00e4df8e7cae6403e045f5c",
      "layers": 5
    }
  },
  "priorDataExposure": "Earlier development used/scored these datasets; this is not pristine external validation.",
  "notSelected": {
    "g2-smooth": "Stronger smoothing remains a retained trial, but gives up the full-gamut COMBVD gains of the chosen pair.",
    "g1-balanced": "Earlier coarse-hue continuation.",
    "g1-metric": "Earlier coarse-hue continuation."
  }
}
```

Pinned ColorBench: `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`. Pinned pool: `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`.

## Sampling and dark-edge interpretation

The diagnostic samples 72 hues at 5-degree intervals with a 2.5-degree offset. **48 are absent from the 48-hue training grid; 24 coincide with it.** The entire set is therefore not a held-out hue set. All path families also use finer parameter sampling and the actual inverse instead of the fit lookup.

These fits redistribute the dark-side progression; they do not force every low-Level colour to get darker. In particular, the mean R=L=.25 output is lighter by the same GenSpace ruler than in 0.10 balanced. This is a real change of the colours, not merely a switch of rulers: both controls and candidates below are rerated identically.

| Gamut | Candidate | Mean Gen lightness / vivid Gen lightness at R=L=.25 | Mean Gen distance from black / vivid distance |
|---|---|---:|---:|
| srgb | old-balanced | 0.090456 | 0.162878 |
| srgb | old-metric | 0.143584 | 0.208764 |
| srgb | balanced | 0.165905 | 0.228624 |
| srgb | metric | 0.168416 | 0.231230 |
| full | old-balanced | 0.088250 | 0.155433 |
| full | old-metric | 0.148674 | 0.205875 |
| full | balanced | 0.170004 | 0.224672 |
| full | metric | 0.172077 | 0.226455 |

Neither diagnostic is the definition of Level. The new balanced and metric versions are closer to each other on this dark-edge progress measure; human preference is still a separate question. Blue and cyan should be inspected against both old controls rather than declared universally repaired.

The balanced candidate has slightly larger fixed-Reach neutral-exchange CV than its same-role predecessor (native and full), despite smaller mean adjacent step jumps. Its full-gamut black-family mean total retreat magnitude also increases slightly even though the number of affected paths decreases. These are counterexamples to a blanket all-metrics-improved claim. The raw per-path and worst-step data remain available.

# HRL 0.12: balanced-parent hue-sheet refinement

This is a new, fully logged continuation of Gen tonal balanced. It keeps one learned bank across gamuts and adds per-hue risk and whole-sheet regularity to the GenSpace tonal fit. Previous models are unchanged. The original interrupted transfer did not preserve its selected trial arrays; these are new runs, not invented reconstruction of those missing logs. See RECOVERY.md and the preserved PLAN.md.

## Actual COMBVD

Traditional weighted STRESS, same ColorBench-prepared pairs and source adaptation. COMBVD is fitted, not independent validation. Lower is better.

| Candidate | Native weighted | Native unweighted | Full weighted | Full unweighted |
|---|---:|---:|---:|---:|
| 0.11 Gen tonal balanced | 29.410505 | 30.958686 | 30.371858 | 32.354725 |
| Refined balanced | 29.281170 | 31.055225 | 30.219766 | 32.484473 |
| Lighter regularization | 29.244008 | 30.933368 | 29.747558 | 31.776312 |

Native: 3,331 supported pairs. Full: all 3,813 pairs. No COMBVD clipping and no change in retained masks. The two gamut totals have different support and are not a same-stimulus comparison.

## Exact-runtime tonal paths

All controls and candidates use identical samples through the real inverse, not the differentiable fit lookup. GenSpace is the external model-based ruler, not a definition of Level or a source of new observer ratings. R is chromaticness; K=1-L; W=L-R. Black dilution, white dilution, neutral exchange and Reach paths stay distinct.

| Gamut | Candidate | Black CV | White CV | Neutral-exchange CV | Reach CV |
|---|---|---:|---:|---:|---:|
| srgb | 0.11 Gen tonal balanced | 0.224111 | 0.191486 | 0.212333 | 0.348444 |
| srgb | Refined balanced | 0.219080 | 0.194969 | 0.206456 | 0.320713 |
| srgb | Lighter regularization | 0.222239 | 0.195111 | 0.224236 | 0.334769 |
| full | 0.11 Gen tonal balanced | 0.259964 | 0.315686 | 0.261818 | 0.386163 |
| full | Refined balanced | 0.264628 | 0.307378 | 0.253099 | 0.368309 |
| full | Lighter regularization | 0.268882 | 0.315205 | 0.272278 | 0.379962 |

CV is standard deviation of step lengths divided by their mean. Step jumps, reversals, and whole-sheet bending are separate measurements. A lower average does not prove all hues improved.

### Hue-by-hue and whole-sheet checks

The nine-point sheet stencil transforms derivatives to x=sqrt(3)R/2 and z=L-R/2 before computing the vector Hessian/gradient ratio at reference scale 1/32. These are synthetic numerical checks, not perceptual folds diagnosed from screenshots.

| Gamut | Candidate | Hues with lower path CV / total | Mean sheet bending | 95th-percentile hue bending | Blue-region mean bending |
|---|---|---:|---:|---:|---:|
| srgb | 0.11 Gen tonal balanced | control | 1.076867 | 2.034149 | 0.728936 |
| srgb | Refined balanced | 42/72 | 0.459986 | 0.886019 | 0.498106 |
| srgb | Lighter regularization | 39/72 | 0.566147 | 1.187330 | 0.515028 |
| full | 0.11 Gen tonal balanced | control | 1.433466 | 2.731780 | 0.374398 |
| full | Refined balanced | 36/72 | 0.653289 | 1.399451 | 0.264853 |
| full | Lighter regularization | 29/72 | 0.780267 | 1.431216 | 0.253384 |

Blue in this summary means H=255 through 295 degrees on the declared sample grid. The preview additionally inspects 273, 275 and 277 degrees, not only a round-number blue. Residual structures in those narrow sheets must not be hidden by aggregate gains.

### Step jumps, corner retreats and dark-edge progress

| Gamut | Candidate | Black step jump | White step jump | White retreat paths | Mean white retreat fraction | Gen L / vivid Gen L at R=L=.25 |
|---|---|---:|---:|---:|---:|---:|
| srgb | 0.11 Gen tonal balanced | 0.014861 | 0.007556 | 54/360 | 0.00210505 | 0.166175 |
| srgb | Refined balanced | 0.014687 | 0.007765 | 49/360 | 0.00134596 | 0.160117 |
| srgb | Lighter regularization | 0.014814 | 0.007925 | 53/360 | 0.00164466 | 0.160452 |
| full | 0.11 Gen tonal balanced | 0.015888 | 0.009643 | 56/360 | 0.00240849 | 0.170499 |
| full | Refined balanced | 0.015589 | 0.009808 | 60/360 | 0.00219727 | 0.165320 |
| full | Lighter regularization | 0.015774 | 0.009923 | 50/360 | 0.00218653 | 0.165031 |

Path sampling: 72 hues, offset 1 degrees, 257 samples per path, 20 paths per hue, three models and two gamuts. 0 sampled hues coincide with the 96-hue training grid. Numerical out-of-grid checks are not independent observer validation. Sheet sampling: 72 hues and 121 stencils per hue. No output clipping enters these calculations.

## Scored ColorBench

Only five scored generation and sixteen scored measurement columns. The judges, bicone embedding and support policies are unchanged. A dagger denotes incomplete or changed input support. N/A is unavailable, never zero. Full clipping is reported as a separate pipeline.

### srgb, strict inputs

| Test | Parent | Refined | Lighter regularization |
|---|---:|---:|---:|
| hung_berns | N/A | N/A | N/A |
| ebner_fairchild | N/A | N/A | N/A |
| munsell | N/A | N/A | N/A |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.269081 † | 0.274856 † | 0.272528 † |
| macadam1942 | 0.286494 † | 0.295459 † | 0.284914 † |
| luo_rigg_ellipses | 0.270416 † | 0.276192 † | 0.270859 † |
| alder1982 | 0.295601 † | 0.295722 † | 0.289993 † |
| regan_1994_cvd_ellipses | 0.198435 † | 0.207504 † | 0.209504 † |
| koenderink_2026_3d_metric_field | 0.322989 | 0.318513 | 0.318719 |
| brown_1957_12obs_ellipsoids | N/A | N/A | N/A |
| wyszecki_fielder_1971_ellipsoids | 0.316854 † | 0.318365 † | 0.312641 † |
| brown_macadam_1949_ellipsoids | N/A | N/A | N/A |
| huang_2012_cielab_ellipses | 0.319746 † | 0.319207 † | 0.319354 † |
| berns_1991_rit_dupont_tolerance_vectors | 0.359584 † | 0.356954 † | 0.352094 † |
| hong_2025_ellipsoids | 0.250620 | 0.262472 | 0.256879 |
| bfd | 31.469872 † | 31.627326 † | 31.478761 † |
| leeds | 28.499639 | 27.834160 | 27.905359 |
| witt | 23.676903 † | 23.372388 † | 23.274511 † |
| rit | 31.678904 † | 31.259044 † | 31.444994 † |
| macadam | 25.988935 † | 27.184619 † | 27.222119 † |

### full, strict inputs

| Test | Parent | Refined | Lighter regularization |
|---|---:|---:|---:|
| hung_berns | N/A | N/A | N/A |
| ebner_fairchild | 2.242869 | 2.242869 | 2.242869 |
| munsell | 3.816220 | 3.816220 | 3.816220 |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.275654 | 0.290109 | 0.275090 |
| macadam1942 | 0.327829 | 0.346714 | 0.332752 |
| luo_rigg_ellipses | 0.308851 | 0.324772 | 0.312109 |
| alder1982 | 0.319009 | 0.328290 | 0.320599 |
| regan_1994_cvd_ellipses | 0.224486 | 0.231635 | 0.227265 |
| koenderink_2026_3d_metric_field | 0.368102 | 0.386478 | 0.390181 |
| brown_1957_12obs_ellipsoids | 0.380514 † | 0.341896 † | 0.356113 † |
| wyszecki_fielder_1971_ellipsoids | 0.329580 † | 0.337324 † | 0.332068 † |
| brown_macadam_1949_ellipsoids | 0.306312 † | 0.310287 † | 0.308028 † |
| huang_2012_cielab_ellipses | 0.309939 | 0.309522 | 0.315738 |
| berns_1991_rit_dupont_tolerance_vectors | 0.336730 | 0.342866 | 0.325912 |
| hong_2025_ellipsoids | 0.302807 | 0.301474 | 0.299078 |
| bfd | 32.885875 | 33.085089 | 32.317767 |
| leeds | 28.063204 | 27.231447 | 27.117896 |
| witt | 23.728116 | 22.725495 | 22.894471 |
| rit | 29.976732 | 29.564720 | 29.376475 |
| macadam | 30.790536 | 32.802504 | 32.468392 |

### Full, explicitly clipped inputs

| Test | Refined | Lighter regularization |
|---|---:|---:|
| hung_berns | 3.397949 † | 3.397949 † |
| ebner_fairchild | 2.242869 | 2.242869 |
| munsell | 3.816220 | 3.816220 |
| xiao_unique_hues | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.290109 | 0.275090 |
| macadam1942 | 0.346714 | 0.332752 |
| luo_rigg_ellipses | 0.324772 | 0.312109 |
| alder1982 | 0.328290 | 0.320599 |
| regan_1994_cvd_ellipses | 0.231635 | 0.227265 |
| koenderink_2026_3d_metric_field | 0.386478 | 0.390181 |
| brown_1957_12obs_ellipsoids | 0.352832 † | 0.353053 † |
| wyszecki_fielder_1971_ellipsoids | 0.325617 † | 0.321312 † |
| brown_macadam_1949_ellipsoids | 0.343313 † | 0.344231 † |
| huang_2012_cielab_ellipses | 0.309522 | 0.315738 |
| berns_1991_rit_dupont_tolerance_vectors | 0.342866 | 0.325912 |
| hong_2025_ellipsoids | 0.301474 | 0.299078 |
| bfd | 33.085089 | 32.317767 |
| leeds | 27.231447 | 27.117896 |
| witt | 22.725495 | 22.894471 |
| rit | 29.564720 | 29.376475 |
| macadam | 32.802504 | 32.468392 |

## Same-pair and full-only COMBVD

| Candidate | Realization/subset | Pairs | Weighted STRESS |
|---|---|---:|---:|
| 0.11 Gen tonal balanced | native/common | 3331 | 29.410505 |
| 0.11 Gen tonal balanced | full/common | 3331 | 29.973645 |
| 0.11 Gen tonal balanced | full/full-only | 482 | 31.938055 |
| Refined balanced | native/common | 3331 | 29.281170 |
| Refined balanced | full/common | 3331 | 29.832651 |
| Refined balanced | full/full-only | 482 | 31.842514 |
| Lighter regularization | native/common | 3331 | 29.244008 |
| Lighter regularization | full/common | 3331 | 29.574763 |
| Lighter regularization | full/full-only | 482 | 30.446042 |

## Invariants and record

Actual JS tests check random and near-black inverses, exact 16-bit conversions, hue labels, neutral progression, vivid anchors, positive sampled coordinate Jacobians and conditioning, circular continuity, shared-bank identity and an untrained Adobe RGB realization. Full is still the inherited polygonized cone with relative Y<=1; canonical P3 remains outside the current polygon at red. No boundary, source-white or hue-field changes are claimed.

Detailed receipts: verification.json, python-js-parity.json, direct-final.json, sheet-final.json, and colorbench.json. A runner-browser pass is not a public Pages pass; public verification has its own receipt. All new trial arrays and evaluation JSONL logs are retained under trials/. Historical interrupted drafts are only under recovery/.

```json
{
  "status": "Frozen before new scored ColorBench evaluation",
  "timeUTC": "2026-09-18T03:07:03.923308+00:00",
  "parent_sha256": "109555996bc49629f35397c9bdbc1c8edac8f4ce753fb86caf8ce885e43892f8",
  "basis": "Balanced-parent continuation. New runs, not recovered missing arrays. Choice uses training and native visual checks; no newly computed non-COMBVD observer score used.",
  "candidates": {
    "balanced": {
      "trial": "resume-b",
      "sha256": "159f06a6ea8eeb1bbe6617318ff8057f540f6ea3919e99e8d364a2d7b990c605"
    },
    "gentle": {
      "trial": "resume-a",
      "sha256": "d560a5891234d1baa59908a8d2ae694dc7c810728bc47cb15d7d7b562b95baf0"
    }
  },
  "priorDataExposure": "All benchmark sets have project development exposure; this is not pristine external validation."
}
```

Pinned ColorBench: 12b2de215cc5020682e3d245a8c78bce5f0ebbc9. Pool: 8641f4e8ebd9d85a34dc0fedc116fa0e58493190. Prior development exposed these evaluation datasets; no pristine external validation or overall leaderboard rank is claimed.


See [matched-coordinate conditioning and residual blue limits](../NUMERICAL-LIMITS.md). The denser common-coordinate audit retains severe near-boundary tails; positive invertibility is not a uniform-conditioning guarantee.

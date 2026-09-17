# Shared R/L and dark-edge refinement: executed results

The pre-fit plan is retained in `../PLAN.md`; literature roles are in `../EVIDENCE.md`, and trial history and limitations in `../EXECUTION.md`.

## Main tradeoff

One R/L bank operates across native sRGB, the full relative-Y solid, and an untrained third gamut. The balanced candidate is substantially darker on the low-Level black-to-vivid edge, particularly native blue. **COMBVD is worse than the separately fitted predecessors. Whole-sheet regularity is mixed, not uniformly improved.**

COMBVD was fitted; no other observer dataset enters this continuation objective. A first scored round and earlier development exposure remain disclosed. This is not pristine external validation. All scores use the actual bicone embedding.

## COMBVD: identical retained pairs, no clipping

| Realization | Candidate | Weighted STRESS | Unweighted STRESS | Pairs |
|---|---|---:|---:|---:|
| srgb | Previous separate balanced | 26.156618 | 27.735136 | 3331/3813 |
| srgb | Shared dark-edge balanced | 32.116410 | 33.687327 | 3331/3813 |
| srgb | Shared metric-leaning | 29.318042 | 30.939439 | 3331/3813 |
| full | Previous separate balanced | 27.822994 | 28.901216 | 3813/3813 |
| full | Shared dark-edge balanced | 31.449030 | 33.306056 | 3813/3813 |
| full | Shared metric-leaning | 29.630885 | 31.234386 | 3813/3813 |

Native retains the same 3,331 supported pairs; full retains all 3,813. These are ColorBench-preprocessed inputs, not the legacy exact-HRL-white convention.

## Common and full-only COMBVD

| Candidate | Realization / subset | Pairs | Weighted STRESS |
|---|---|---:|---:|
| Previous separate balanced | srgb / common | 3331 | 26.156618 |
| Previous separate balanced | full / common | 3331 | 27.924807 |
| Previous separate balanced | full / full-only | 482 | 26.991760 |
| Shared dark-edge balanced | srgb / common | 3331 | 32.116410 |
| Shared dark-edge balanced | full / common | 3331 | 31.197584 |
| Shared dark-edge balanced | full / full-only | 482 | 32.429838 |
| Shared metric-leaning | srgb / common | 3331 | 29.318042 |
| Shared metric-leaning | full / common | 3331 | 29.574688 |
| Shared metric-leaning | full / full-only | 482 | 29.796871 |

## Dark edge and conditioning

The edge statistic is Oklab lightness divided by the lightness of the same hue/gamut ray endpoint, not the definition of Level. Curves use 72 hues, four ratios R/L, and 129 samples through actual XYZ without display clipping. Blue means H=260 through 295 degrees at five-degree intervals.

| Realization | Candidate | Mean at R=L=.25 | Blue mean at .25 | Mean edge step jump | Min determinant | Worst condition number |
|---|---|---:|---:|---:|---:|---:|
| srgb | Previous separate balanced | 0.521550 | 0.786151 | 0.016290 | 0.0381965 | 3048.166 |
| srgb | Shared dark-edge balanced | 0.255041 | 0.301481 | 0.014341 | 0.117072 | 195.915 |
| srgb | Shared metric-leaning | 0.304697 | 0.380465 | 0.014675 | 0.0505016 | 627.699 |
| full | Previous separate balanced | 0.269671 | 0.256044 | 0.019828 | 0.140071 | 2883.016 |
| full | Shared dark-edge balanced | 0.206321 | 0.192518 | 0.019994 | 0.117072 | 195.915 |
| full | Shared metric-leaning | 0.258269 | 0.258184 | 0.020049 | 0.0505016 | 627.699 |

Jacobians are normalized source R/L to final R/L at 900 interior samples, excluding the black singularity. The previous fits also have positive sampled determinants: apparent folds were not proof of a negative Jacobian. Local Y decreases remain and are separately counted in the raw audit.

## Actual generated-path check

48 interleaved hues; 288 Reach and 288 Level ramps per realization; 257 samples each. Fitting used an interpolated surrogate, but these diagnostics use the actual inverse.

| Realization | Candidate | Reach CV | Level CV | Reach step jump | Level step jump |
|---|---|---:|---:|---:|---:|
| srgb | Previous separate balanced | 0.328279 | 0.227274 | 0.013418 | 0.006858 |
| srgb | Shared dark-edge balanced | 0.335274 | 0.209625 | 0.016703 | 0.007699 |
| srgb | Shared metric-leaning | 0.524520 | 0.317087 | 0.021727 | 0.010999 |
| full | Previous separate balanced | 0.358659 | 0.237104 | 0.015390 | 0.008294 |
| full | Shared dark-edge balanced | 0.431506 | 0.254542 | 0.016539 | 0.008992 |
| full | Shared metric-leaning | 0.604960 | 0.385115 | 0.020574 | 0.012671 |

Darker edges do not imply every interior metric improves. Full blue retains inherited trajectory irregularities. The metric alternate is rougher than balanced and is not presented as a universal visual improvement.

## Scored ColorBench panels

Only five generation and sixteen measurement columns were run. No unscored appearance, application, ordinal or physics-gate suite was added. † = mapped input; ‡ = incomplete strict support. N/A is not zero.

### srgb: strict inputs

| Dataset | Previous separate | Shared balanced | Shared metric |
|---|---:|---:|---:|
| hung_berns | N/A | N/A | N/A |
| ebner_fairchild | N/A | N/A | N/A |
| munsell | N/A | N/A | N/A |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.251473 ‡ | 0.276680 ‡ | 0.288432 ‡ |
| macadam1942 | 0.271039 ‡ | 0.289835 ‡ | 0.300937 ‡ |
| luo_rigg_ellipses | 0.242985 ‡ | 0.274304 ‡ | 0.272051 ‡ |
| alder1982 | 0.261385 ‡ | 0.302525 ‡ | 0.296686 ‡ |
| regan_1994_cvd_ellipses | 0.188017 ‡ | 0.216452 ‡ | 0.220428 ‡ |
| koenderink_2026_3d_metric_field | 0.335947 | 0.344856 | 0.365400 |
| brown_1957_12obs_ellipsoids | N/A | N/A | N/A |
| wyszecki_fielder_1971_ellipsoids | 0.282921 ‡ | 0.329856 ‡ | 0.336116 ‡ |
| brown_macadam_1949_ellipsoids | N/A | N/A | N/A |
| huang_2012_cielab_ellipses | 0.309925 ‡ | 0.325183 ‡ | 0.321219 ‡ |
| berns_1991_rit_dupont_tolerance_vectors | 0.338918 ‡ | 0.397861 ‡ | 0.343361 ‡ |
| hong_2025_ellipsoids | 0.265294 | 0.282949 | 0.301334 |
| bfd | 28.223624 ‡ | 34.186052 ‡ | 31.449752 ‡ |
| leeds | 25.821342 | 30.837878 | 27.744421 |
| witt | 21.060954 ‡ | 25.864378 ‡ | 23.221099 ‡ |
| rit | 26.390619 ‡ | 34.566391 ‡ | 31.387185 ‡ |
| macadam | 25.734213 ‡ | 27.843703 ‡ | 29.179381 ‡ |

### full: strict inputs

| Dataset | Previous separate | Shared balanced | Shared metric |
|---|---:|---:|---:|
| hung_berns | N/A | N/A | N/A |
| ebner_fairchild | 2.242869 | 2.242869 | 2.242869 |
| munsell | 3.816220 | 3.816220 | 3.816220 |
| xiao_unique_hues | 1.742566 | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.252630 | 0.281138 | 0.286840 |
| macadam1942 | 0.275755 | 0.303628 | 0.332891 |
| luo_rigg_ellipses | 0.250370 | 0.303629 | 0.321214 |
| alder1982 | 0.301126 | 0.311239 | 0.328873 |
| regan_1994_cvd_ellipses | 0.227057 | 0.239882 | 0.239276 |
| koenderink_2026_3d_metric_field | 0.334432 | 0.384238 | 0.392253 |
| brown_1957_12obs_ellipsoids | 0.330679 ‡ | 0.420611 ‡ | 0.495451 ‡ |
| wyszecki_fielder_1971_ellipsoids | 0.286166 ‡ | 0.338199 ‡ | 0.346874 ‡ |
| brown_macadam_1949_ellipsoids | 0.307893 ‡ | 0.334002 ‡ | 0.323109 ‡ |
| huang_2012_cielab_ellipses | 0.307215 | 0.320552 | 0.314363 |
| berns_1991_rit_dupont_tolerance_vectors | 0.328794 | 0.360299 | 0.360035 |
| hong_2025_ellipsoids | 0.314120 | 0.316349 | 0.320339 |
| bfd | 29.189331 | 33.800983 | 31.670834 |
| leeds | 26.817570 | 27.778236 | 27.290987 |
| witt | 24.102805 | 25.254441 | 23.535872 |
| rit | 26.992010 | 32.529187 | 31.038975 |
| macadam | 30.986596 | 32.483718 | 29.690126 |

### Full: explicitly clipped pipeline

| Dataset | Shared balanced / clip | Shared metric / clip |
|---|---:|---:|
| hung_berns | 3.397949 † | 3.397949 † |
| ebner_fairchild | 2.242869 | 2.242869 |
| munsell | 3.816220 | 3.816220 |
| xiao_unique_hues | 1.742566 | 1.742566 |
| osa_ucs_1974 | 0.281138 | 0.286840 |
| macadam1942 | 0.303628 | 0.332891 |
| luo_rigg_ellipses | 0.303629 | 0.321214 |
| alder1982 | 0.311239 | 0.328873 |
| regan_1994_cvd_ellipses | 0.239882 | 0.239276 |
| koenderink_2026_3d_metric_field | 0.384238 | 0.392253 |
| brown_1957_12obs_ellipsoids | 0.369742 † | 0.371186 † |
| wyszecki_fielder_1971_ellipsoids | 0.330091 † | 0.339812 † |
| brown_macadam_1949_ellipsoids | 0.373841 † | 0.359370 † |
| huang_2012_cielab_ellipses | 0.320552 | 0.314363 |
| berns_1991_rit_dupont_tolerance_vectors | 0.360299 | 0.360035 |
| hong_2025_ellipsoids | 0.316349 | 0.320339 |
| bfd | 33.800983 | 31.670834 |
| leeds | 27.778236 | 27.290987 |
| witt | 25.254441 | 23.535872 |
| rit | 32.529187 | 31.038975 |
| macadam | 32.483718 | 29.690126 |

## Invariants and scope

`verification.json` records exact round-trips, neutral/vivid/hue preservation, one-bank identity, and an untrained Adobe RGB (1998) linear-RGB realization. `source-gamut-verification.json` records regeneration of both source caches with the same algorithm. Canonical P3 red lies slightly outside the inherited polygon and is explicitly rejected, not silently clipped.

The full solid remains the physical polygon over 0<=relative Y<=1. The 300-nit context and relative 100-nit invariance are retained. High-magnitude hue continuation remains a declared limitation, not new observer evidence.

## Frozen selection

```json
{
  "status": "Recovered frozen selection; runtime verification pending at creation",
  "selection_basis": "COMBVD joint fit plus direct dark-edge and generated-path checks from the interrupted work",
  "balanced": {
    "record": "balanced.json",
    "trial": "fine-balanced",
    "prior_commit": "ba89fc8bcf26c2e4c8d3efe3596a7d735fe70e44"
  },
  "metric": {
    "record": "metric.json",
    "trial": "joint-metric",
    "prior_commit": "23364a997542a28e14e4c20a1f74344bd6d0410d"
  },
  "human_training": [
    "COMBVD"
  ],
  "learned_gamut_specific_banks": false,
  "dark_target_is_engineering_preference": true,
  "heldout_caveat": "Earlier development and the interrupted work may have exposed evaluation scores. Do not call this pristine external validation. No new scored evaluation is used to alter the recovered coefficients during completion.",
  "recovery_limits": "The fitted coefficients, trial recipes, aggregate optimizer statistics and source code were committed. Full shared-trial optimizer traces were not committed before the interruptions. They must not be reconstructed as though they were original logs. New verification logs will be retained separately."
}
```

ColorBench `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`; pool `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`. Full runtime source hashes and versions are in `colorbench.json`.

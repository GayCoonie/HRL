# Review findings and remaining limits

This is a shared GenSpace R/L continuation of 0.11 balanced, not a hue-field or gamut-boundary refit. A fitted transform changes actual output colours; the previews are not blurred. Only their explicit full-gamut display conversion clips to sRGB.

## Identical-sample comparisons

| Realization | Candidate | Weighted COMBVD change | Black-path CV change | White-path CV change | Sheet-bending change | Blue-sheet bending change |
|---|---|---:|---:|---:|---:|---:|
| srgb | balanced | -0.129335 | -2.25% | +1.82% | -57.28% | -31.67% |
| srgb | gentle | -0.166498 | -0.84% | +1.89% | -47.43% | -29.35% |
| full | balanced | -0.152092 | +1.79% | -2.63% | -54.43% | -29.26% |
| full | gentle | -0.624300 | +3.43% | -0.15% | -45.57% | -32.32% |

Negative changes indicate a lower numerical value. They are not human preference percentages. The whole-sheet statistic uses the actual inverse and the equilateral embedding; it is distinct from path CV, hue matching and perceived blackness.

The blue-neighbor controls expose 263, 269, 273, 275, 277, 281 and 285 degrees directly. A clean result at 270 degrees alone does not establish that the neighboring deep-blue sheets are clean. The inherited hue field and source paths were not changed, and residual edge/interior structure must remain visible in review. The numerical checks do not prove every local contour is perceptually regular.

## Regressions and scope

The full scored table in results/REPORT.md is authoritative, including regressions. No newly computed non-COMBVD observer result was used to adjust these frozen records. All datasets have earlier project exposure, so they are not called pristine holdouts. Strict and mapped pipelines, support masks, and common/full-only pair subsets are separate.

The lower-regularization candidate is named gentle in the API; the name does not assert lighter physical colours. Public exports identify the unchanged parent as profile HRL-0.11-gen-tonal, checkpoint balanced, while retaining viewCheckpoint=parent for the comparison interface. New outputs identify HRL-0.12-hue-fair. Gamut remains part of the record.

The original interrupted code drafts are kept under recovery/ and are not used as evidence of recovered trial arrays. Both newly executed trial arrays and every objective-evaluation log entry are committed under trials/. PLAN.md is unchanged.

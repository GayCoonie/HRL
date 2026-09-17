# Completed domain repair and benchmark status

The implementation and numerical checks completed successfully in GitHub Actions run `35175640693`. Generated evidence was committed in `87ae90a3d354b71c4726e35168b719b21ae74ba5`. Subsequent edits corrected report notation only; the scored computations were not changed.

**The carrier/domain repair works, but the inherited full-gamut perceptual fit regresses substantially. This is a research checkpoint, not an approved replacement for A Smooth or C1.**

The full reference solid now covers the polygonized physical chromaticity cone for relative Y in [0,1]. The carrier uses max(pseudoRGB)=Y and does not exclude a physical color merely because its white-completion magnitude exceeds one. Source-white Bradford conversion and a 300-nit default reference context are explicit. Above-white clipping, imaginary-chromaticity projection, strict rejection, and high-magnitude hue continuation are separately audited.

## Measured results

Using identical ColorBench-prepared COMBVD inputs, all 3,813 pairs:

| Full profile | Unweighted STRESS | Traditional weighted STRESS |
|---|---:|---:|
| Original 0.8A | 29.608930 | 28.561281 |
| Previous C1 | 29.565423 | 28.447720 |
| 0.8A coefficients on corrected domain | 38.922328 | 37.478234 |
| C1 coefficients on corrected domain | 39.597921 | 37.221658 |

No COMBVD inputs were clipped, rejected, or evaluated beyond the original hue-field magnitude range. Thus this regression is not a change of sample count, clipping, or hue extrapolation: the new full-domain anchors and source path parameterization change the placement of colors within the bicone while retaining coefficients fitted for the previous construction. No observer or COMBVD refit was performed in this turn.

Native sRGB C1 is unchanged on the same 3,331 retained COMBVD pairs: 28.780616 unweighted, 27.819289 weighted. These values use ColorBench preprocessing, not the slightly different stored HRL-white convention.

Both scored boards were executed: five generation and sixteen measurement columns. The corrected full clip pipeline yields finite results in all 21 columns, with no input mapping in 17. Four datasets include explicitly clipped inputs, and those scores must not be represented as unchanged-stimulus scores. Strict results are supplied separately. There is no overall leaderboard rank.

The 100-nit and 300-nit cases produce identical scores for identical relative XYZ inputs. This verifies the existing relative calibration's scale invariance, not an optimum white luminance. Absolute-input conversions do change correctly with the assigned reference white.

## Verification and limitations

The carrier passed 21,600 sampled round-trips, including 5,527 colors above the old completion cutoff. Maximum carrier XYZ error was 2.98e-12. The H/R/L test passed 2,048 random round-trips with maximum embedding error 5.59e-12, plus 2,048 exact 16-bit carrier round-trips. The formerly rejected green regression input is now accepted without clipping.

At completion magnitudes above the original fit range, the last fitted hue slice is held constant. This is a declared continuation, not new observer evidence. Broader domain coverage does not by itself establish perceptual accuracy.

Next calibration should operate on the corrected reference solid and explicitly test R/L smoothness, rather than restoring the old cutoff to recover its scores. All accepted predecessor files and entry points remain unchanged.

See [the complete report](results/REPORT.md), [raw scores and audits](results/colorbench.json), [numerical verification](results/verification.json), and [implementation specification](README.md).

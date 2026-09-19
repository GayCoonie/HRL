# Bounded review: sheet candidates' common-map conditioning

**Confirmed for the declared same-point grid.** Both candidates retain severe fixed-H common-map anisotropy, with small but numerically resolved reductions in the maximum versus metric/Beta1. No material derivative disagreement or provenance mismatch was found.

| Model | Maximum condition | Location H, R, L | Maximum reduction versus metric/Beta1 |
|---|---:|---|---:|
| metric / Beta1 | 113447.181723 | 269, .000999, .001 | Baseline |
| sheet-raw | 112526.691904 | 269, .000999, .001 | 0.811382% |
| sheet-robust | 112617.042579 | 269, .000999, .001 | 0.731741% |

All maxima occur at the identical source point, so these are both sampled-maximum and same-point comparisons. At the other historical extreme, H216/R=.04995/L=.05, conditions are 65063.390173 for metric, 64620.695179 for sheet-raw, and 64657.785248 for sheet-robust.

The improvements are not uniform. Relative to metric over 325 points, sheet-raw improves 207 and worsens 118; sheet-robust improves 225 and worsens 100. The largest pointwise increases are 5.83% for raw at H216/R=.24975/L=.25 and 11.47% for robust at H285/R=.000999/L=.001.

## Numerical agreement

| Candidate | Worst JS relative condition error, factor 1e-3 | Worst error, factor 1e-4 | Factor 1e-4 error at maximum |
|---|---:|---:|---:|
| sheet-raw | 1.2636e-5 | 2.9663e-6 | 7.15e-8 |
| sheet-robust | 1.2600e-5 | 1.9510e-6 | 3.89e-7 |

Factors multiply `min(R,L-R,1-L)`. Thus the approximately 0.7–0.8% reductions are much larger than the stable-step disagreements. At factor 1e-6 the maximum errors rise to 2.1290e-4 and 3.3577e-4 respectively, consistent with the established small-step noise limitation.

Candidate forward Python/JS differences are at most 2.232e-14. Analytic/autograd scaled matrix differences are below 9.845e-11; log-condition differences are below 1.852e-10. All sampled analytic determinants are positive, with minima .1013691 and .1017912. All recorded implementation checks pass.

I independently recomputed the SVD condition from every candidate's saved raw R/L numerical Jacobian after the equilateral basis transformation. All 3,250 numerical conditions reproduced their stored values exactly in this runtime, and recomputed worst-error summaries matched. The commands exited 0. This was a receipt-integrity and agreement check, not a new forward evaluation of the full grid. No new high-precision run was needed because there was no material disagreement; the earlier independent high-precision review of the unchanged audit pathways remains applicable to their implementation.

## Provenance and scope

All seven source hashes and all five model hashes match current files. Every model has exactly the same 325 source points and ordering. The parent, balanced and metric model blocks are exactly equal to the original audit's control blocks. Receipt SHA-256: `f7eaf942d56d15d86149a4c342816a7d9c215e9fac9361692f9eda334f90843a`.

Model SHA-256 values:

- sheet-raw: `00ac61139a31515280d005d2fdac45c5dd218f6b76ca4549c7f91f6cae408e8f`
- sheet-robust: `374a16778b6bc192273a0e4821ca20eaf87caa66f4893a7a7221cdc539812e3c`

The result concerns the fixed-H 2-by-2 common-coordinate map, with source and destination both expressed as `x=sqrt(3)R/2, z=L-R/2`. It is not a global bound, full H/R/L or XYZ Jacobian, visual bending measurement, perceptual metric or observer result. It neither establishes nor rules out improvement in native-space geometry. Candidate publication still requires the consolidated review of all six candidates and their separate acceptance criteria.

Only this scratch review report was written. No repository files or model records were changed.

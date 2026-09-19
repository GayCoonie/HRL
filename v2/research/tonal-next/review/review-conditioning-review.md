# Independent conditioning review

**Verdict: confirmed for the sampled common-coordinate map. No blocking defect found.** Severe existing anisotropy at the reported points is real; the old tiny finite-difference step does not explain it. This verdict does not extend to a full physical XYZ or perceptual Jacobian.

Contract: confirmed. I reviewed the two new audit programs, their inherited analytic/autograd and JavaScript implementations, the raw receipt and handoff, and freshly reproduced four decisive model/point combinations. No repository files were changed. Only the requested review artifacts were written outside the repository.

Quality: confirmed for this conclusion, with one nonblocking validation-gate limitation below. The analytic chain rule, equilateral basis transformation and SVD condition definition are consistent. Actual-JavaScript central stencils remain inside the legal domain and compare derivatives at the same source point. Analytic and autograd are correctly identified as sharing the existing implicit inverse derivative; they are not three fully independent pathways.

## Fresh independent reproduction

Command, exit **0**:

```sh
/workspace/scratch/20abb8fd27ac/hrl-opt-env/bin/python /workspace/scratch/20abb8fd27ac/hrl-optimization/review-conditioning-reproduce.py > /workspace/scratch/20abb8fd27ac/hrl-optimization/review-conditioning-result.json
```

The reproducer implements the scalar forward map independently in mpmath 1.3.0 at 80 decimal digits. It solves the final scalar inverse with high-precision Newton iterations and a checked residual below 1e-65; it does not import either repository derivative implementation. Central R/L differences use boundary-distance factors 1e-20 and 1e-25. Their condition estimates agree within 1.51e-40 relatively across the four cases. Conditions are computed from the larger Gram eigenvalue divided by the positive determinant, avoiding subtraction to recover a small singular value. The actual JavaScript numeric runner was also executed afresh, exit **0**.

| Model | H, R, L | Independent condition | Stored analytic relative error | Worst fresh JS relative error, factors 1e-3 and 1e-4 |
|---|---|---:|---:|---:|
| Parent | 269, .000999, .001 | 122403.7478915268 | 2.63e-11 | 3.97e-7 |
| Metric | 269, .000999, .001 | 113447.1817229929 | 3.13e-12 | 8.96e-7 |
| Balanced | 216, .04995, .05 | 25197.9516308581 | 1.26e-12 | 5.68e-7 |
| Balanced, relocated-tail control | 269, .000999, .001 | 714.7464294894 | 1.49e-10 | 1.47e-6 |

At the three model maxima, the stored analytic equilateral matrices agree with the independent matrices to at most 2.64e-12 under the audit's scaled maximum-entry error. Independent determinants remain positive: about 14.3903, 10.9818 and .998609 respectively. This distinguishes a very large singular-value ratio from a singular or orientation-reversing map at those points.

The whole stored 325-point grid per model shows actual-JavaScript condition errors at factor 1e-4 no larger than 1.702e-6 (parent), 4.606e-6 (balanced) and 3.833e-6 (metric), consistent with the fresh subset. I inspected these full-grid receipts; I did not freshly rerun all 975 analytic/autograd evaluations. Error increasing again at the smallest factors is consistent with cancellation and finite inverse-solver precision. It does not erase the stable severe condition values.

## Nonblocking limitation in the reusable validator

Quality / coverage, low severity, high confidence: `conditioning-audit.py:171` builds success checks for forward parity and analytic/autograd agreement, but does not gate on any actual-JavaScript derivative error. Numerical discrepancies are recorded at line 153. Consequently exit 0 alone does not establish independent numerical derivative agreement for a future candidate. The present conclusion is supported by inspected numeric evidence and the fresh reproduction. A future automated acceptance gate should explicitly enforce a predeclared stable-step agreement criterion or require its review.

## Scope and provenance

- The measured quantity is the spectral condition of the fixed-H 2-by-2 source-to-destination common-coordinate Jacobian, with both bases `x=sqrt(3)R/2, z=L-R/2`. It is not the physical source/XYZ map, a full H/R/L Jacobian, or a perceptual metric. No visual bending, hue fidelity or observer-performance claim follows directly.
- These are finite interior samples. This review establishes the severe conditions at the reproduced points, not a global maximum, a bound over all hues and boundaries, or the historical grid's distributional quantiles.
- Positive determinants at sampled points establish local orientation preservation there; this audit alone is not a global no-fold proof.
- Stable finite differences still have truncation, floating-point and inverse-solver errors. Their nominal 2h denominators and tiniest steps need the stated qualification. The independent high-precision result removes those concerns as an explanation of the severe values at the decisive points.
- All seven source hashes and all three model hashes in the raw receipt matched current files. Reviewed receipt SHA-256: `ec6d73c94b7beabe6461103ad6044667d5575007b33a7f2114ae4cc466c0f7f6`. The verdict is bound to that receipt and its recorded source/model state.
- Reproduction source: `review-conditioning-reproduce.py`. Fresh machine-readable evidence: `review-conditioning-result.json`. Both are in `/workspace/scratch/20abb8fd27ac/hrl-optimization/`.

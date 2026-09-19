# Fresh bounded C2 conditioning review

Verdict: C2's derivative diagnosis is supported for the declared 325-point fixed-H common-coordinate sample grid. No blocking discrepancy found. The severe conditioning is real at the independently reproduced extreme points and does not disappear when the finite-difference step is changed. This is neither a global bound nor an XYZ/perceptual conditioning result.

Both sources and destinations use equilateral coordinates x=sqrt(3)R/2, z=L-R/2. The measured Jacobian is 2-by-2 at fixed H. Analytic and autograd pathways share the implicit inverse derivative; they are not fully independent. Actual JavaScript finite differences and the independent scalar mpmath reconstruction supply independent derivative evidence.

## Fresh commands and results

Executed unchanged, exit 0, nested Node exit 0:

```sh
/workspace/scratch/20abb8fd27ac/hrl-opt-env/bin/python /workspace/scratch/20abb8fd27ac/hrl-optimization/review-conditioning-blue-reproduce.py > /workspace/scratch/13a5381bdd70/review/conditioning-fresh.json
```

The scalar forward map runs at 80 decimal digits with central R/L differences at 1e-20 and 1e-25 times the minimum distance to the triangular boundary. The inverse-solve residual is asserted below 1e-65. Both blue candidate maxima occur at H=269, R=.000999, L=.001.

| Candidate | Independent condition | Independent determinant | Stored analytic relative error | Largest fresh JS relative error (1e-3, 1e-4) |
|---|---:|---:|---:|---:|
| blue-raw | 114567.439790724942 | 10.979695059333956 | 2.505e-11 | 9.373e-7 |
| blue-robust | 113643.042801773579 | 10.989137684390685 | 6.844e-12 | 4.624e-7 |

Two high-precision step results differ by at most 3.209e-41 relatively. Scaled matrix error versus the stored analytic Jacobian is at most 4.748e-12. All seven source hashes and all five model hashes in the blue receipt match current files.

Executed unchanged, exit 0:

```sh
/workspace/scratch/20abb8fd27ac/hrl-opt-env/bin/python /workspace/scratch/20abb8fd27ac/hrl-optimization/review-conditioning-blue-check.py > /workspace/scratch/13a5381bdd70/review/conditioning-all-six-fresh.json
```

This recomputes saved matrix arithmetic and receipt identity; it does not rerun the full forward or derivative grid. All 1,950 candidate rows and 13,650 matrices reproduce with zero normalized arithmetic difference in this runtime. All source/model hashes match; every frozen control model block is exactly equal to the original baseline receipt; all models use identical source points and ordering. All recorded implementation checks pass. Existing earlier independent review reports and their distinction between high-precision evaluation and saved-arithmetic checks are consistent with these receipts.

## Six-candidate conclusions

Metric/Beta1 sampled maximum: 113447.18172334721.

| Candidate | Sampled maximum | Change versus Beta1 maximum | H of maximum | Points lower / higher than Beta1 | Worst recorded JS relative error at factor 1e-4 |
|---|---:|---:|---:|---:|---:|
| smooth-mild | 60097.315771 | -47.026171% | 269 | 164 / 161 | 2.010e-6 |
| smooth-conditioned | 21738.547222 | -80.838178% | 216 | 197 / 128 | 1.497e-6 |
| sheet-raw | 112526.691904 | -0.811382% | 269 | 207 / 118 | 2.967e-6 |
| sheet-robust | 112617.042579 | -0.731741% | 269 | 225 / 100 | 1.951e-6 |
| blue-raw | 114567.439794 | +0.987471% | 269 | 199 / 126 | 5.317e-6 |
| blue-robust | 113643.042801 | +0.172645% | 269 | 238 / 87 | 2.911e-6 |

All H269 maxima have R=.000999, L=.001. The smooth-conditioned maximum moves to H216, R=.04995, L=.05. The first four lower the sampled maximum, but none improves every sampled point. The final pair worsens the sampled maximum slightly. Calling either final candidate a maximum-conditioning improvement would be incorrect.

The small positive changes for the final pair are much larger than the stable-step disagreement and are independently confirmed at the maxima. These diagnostics cannot stand in for native blue-sheet bending, appearance, or observer performance.

## Gate limitation and scope

`conditioning-audit.py` implementation gates check forward parity, analytic/autograd consistency, propagated formulas, and positive determinants. They do not gate actual-JavaScript derivative disagreement. Therefore exit 0 alone is insufficient for C2; the explicit numerical comparisons and independent reproduction are necessary evidence. This is a nonblocking reusable-validator limitation for the present reviewed claims.

Positive determinants at sampled points do not establish a global no-fold proof. Finite points do not identify continuous-domain maxima or reproduce the historical larger-grid quantiles. This review freshly evaluates only the two final maxima; the first four conclusions use saved-grid arithmetic, source identity, and their earlier independent reports. No fits, full tests, source changes, or new candidate generation were performed.

## SHA-256 provenance

| File | SHA-256 |
|---|---|
| conditioning-audit.json | ec6d73c94b7beabe6461103ad6044667d5575007b33a7f2114ae4cc466c0f7f6 |
| conditioning-candidates.json | 50941a634fc16fd318073598a747ea02de4c45290d2aa6bce851a51a4b2fc91f |
| conditioning-sheet-candidates.json | f7eaf942d56d15d86149a4c342816a7d9c215e9fac9361692f9eda334f90843a |
| conditioning-blue-candidates.json | 9d96e9be5a85577e99722ddce9a5d1606ade8a6b64c19e5d27281f35a43e55e6 |
| review-conditioning-blue-reproduce.py | c87e4e02369935b9386d4e792c04705573bda040347d5bad09b52669ff40a169 |
| review-conditioning-blue-check.py | 7252952467e573bcb0de518a826c61f731f8ed3ae98229cf2bf0afa18192d556 |
| conditioning-fresh.json | 42924763d6b7e850a66f6ebc1e59113e31646eb43cdc7202176ff45623e6ec19 |
| conditioning-all-six-fresh.json | 139185d79ec44dad1cc18751c09bc9a0b98aaf39c2d50d7311d840f08992872b |

The first six files above are in the prior workspace's `hrl-optimization/`; the final two are fresh outputs in `/workspace/scratch/13a5381bdd70/review/`. Individual model hashes and all source hashes are retained in those machine-readable outputs.

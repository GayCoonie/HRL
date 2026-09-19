# Independent candidate conditioning review

**Confirmed: on the same 325 source points, smooth-mild reduces the maximum fixed-H common-map condition by 47.03%, and smooth-conditioned by 80.84%, relative to metric/Beta1.** Stable actual-JavaScript differences and fresh independent 80-digit calculations support both candidate maxima. No blocker to this bounded conditioning claim was found. This does not establish improved XYZ geometry, native-space bending or perceptual performance.

## Same-grid maxima, with metric/Beta1 as the baseline

| Model | Maximum analytic condition | Location H, R, L | Maximum reduction versus metric/Beta1 |
|---|---:|---|---:|
| metric / Beta1 | 113447.181723 | 269, .000999, .001 | Baseline |
| smooth-mild | 60097.315771 | 269, .000999, .001 | 47.0262% |
| smooth-conditioned | 21738.547222 | 216, .04995, .05 | 80.8382% |

The metric baseline and mild candidate share a maximum location; the conditioned candidate's maximum moves to H216. Comparing the exact historical extreme points makes that shift explicit:

| Source point H, R, L | Metric / Beta1 | Smooth-mild | Smooth-conditioned |
|---|---:|---:|---:|
| 269, .000999, .001 | 113447.181723 | 60097.315771 | 413.742245 |
| 216, .04995, .05 | 65063.390173 | 57894.392865 | 21738.547222 |

At H269 the conditioned candidate reduces condition by 99.6353% versus metric; at H216 it reduces it by 66.5887%. These are pointwise statements; the 80.8382% figure compares maxima over the identical declared grid.

For secondary context, parent and balanced have sampled maxima 122403.747895 at H269 and 25197.951631 at H216. Mild's maximum is 50.9024% below parent but 138.5008% above balanced; conditioned is 82.2403% below parent and 13.7289% below balanced.

**The reduction is not uniform.** Against metric/Beta1, mild improves 164 of 325 points and worsens 161; conditioned improves 197 and worsens 128. Thus neither candidate dominates the baseline pointwise, and a smaller sampled maximum must not be described as improvement everywhere.

## Numerical verification

Across all 325 points, the largest actual-JavaScript relative condition errors versus analytic are:

| Candidate | Step factor 1e-3 | Step factor 1e-4 | Step factor 1e-6 |
|---|---:|---:|---:|
| smooth-mild | 1.2885e-5 | 2.0096e-6 | 1.6561e-4 |
| smooth-conditioned | 1.7095e-5 | 1.4961e-6 | 3.8201e-4 |

Factors multiply `min(R,L-R,1-L)`. The stable range agrees tightly; the smallest steps are noisier. Candidate forward Python/JS differences remain below 6.06e-15, analytic/autograd scaled matrix differences below 2.93e-10, and analytic determinants are positive at every sampled point. All recorded implementation checks pass. As in the first review, program exit 0 alone does not gate independent JS derivative agreement; the numeric rows were inspected explicitly here.

The two candidate maxima were independently reproduced with the separate 80-digit scalar-forward implementation from the first review, using central steps at boundary-distance factors 1e-20 and 1e-25. The two step estimates agree within 7.58e-41 relatively.

| Candidate maximum | Independent condition | Stored analytic relative error | Largest fresh JS relative error at factors 1e-3 and 1e-4 |
|---|---:|---:|---:|
| smooth-mild | 60097.3157706828 | 9.72e-12 | 2.13e-7 |
| smooth-conditioned | 21738.5472219003 | 3.57e-12 | 6.85e-7 |

Reproduction command, exit **0**; nested actual-JavaScript execution also exited **0**:

```sh
/workspace/scratch/20abb8fd27ac/hrl-opt-env/bin/python /workspace/scratch/20abb8fd27ac/hrl-optimization/review-conditioning-candidates-reproduce.py > /workspace/scratch/20abb8fd27ac/hrl-optimization/review-conditioning-candidates-result.json
```

## Provenance and limitations

All seven recorded source hashes and all five model hashes match current files. All models use exactly the same 325 point coordinates and ordering. The three frozen-control model blocks are exactly equal to those in the original `conditioning-audit.json`, including raw rows and summaries. Reviewed candidate receipt SHA-256: `50941a634fc16fd318073598a747ea02de4c45290d2aa6bce851a51a4b2fc91f`.

The reviewed quantity is the spectral condition of the fixed-H 2-by-2 common-coordinate source-to-destination Jacobian in equilateral coordinates, on finite interior samples. It is not a global bound, full 3D H/R/L Jacobian, source-to-XYZ Jacobian, perceptual metric, visual assessment or observer result. The review freshly reproduces the two maxima, not all analytic/autograd grid evaluations. A separate native-space bending regression would not contradict these verified common-map condition reductions; candidate acceptance must retain the independent geometry and appearance criteria.

Only scratch review artifacts were written. No repository files or model records were changed.

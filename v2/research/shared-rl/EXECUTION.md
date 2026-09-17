# Shared R/L execution and recovery record

The original plan remains unchanged in PLAN.md. This file records what survived the interruptions and what the completion run actually executes.

## Recovered implementation

The prior turns committed the evidence intake, common source builder, single-bank core, differentiable joint fitter, source/edge/inverse tests, two selected records, report compiler and site builders. The previous compressed multi-part publication transfer stopped after its first part. The implementation was subsequently written as ordinary source files. That incomplete transfer is not executable evidence and is not used by the completion workflow.

The two records are retained exactly as recovered. No coefficient is altered in the completion run to improve a newly seen evaluation score. The pre-interruption aggregate statistics in each record are checked against the actual JavaScript calculation.

## Recoverable trial lineage

The balanced record identifies the trial `fine-balanced`: four coupling layers; initialized from `joint-balanced`; 800 requested LBFGS iterations; visual objective weight 0.2; edge weight 1.25; engineering target exponent 1.08; fine cache (48 hues, 161 by 161 cosine-spaced source grid). Its record says 804 objective evaluations and approximately 233.27 seconds. Its preserved weighted fit estimates are 32.1164095134 native and 31.4490295696 full.

The alternate identifies `joint-metric`: four coupling layers; initialized from `joint-four`; 1200 requested iterations; visual weight 0.015; edge weight 0.25; target exponent 1.08; coarse cache (24 hues, 129 by 129). Its record says 1204 evaluations and approximately 149.17 seconds. Its preserved weighted estimates are 29.3180415361 native and 29.6308851319 full.

Those are facts about the retained optimizer records, not newly executed optimization logs. The intermediate shared trial coefficients and full iteration traces were not committed before the interruption and were not recovered. They are not fabricated. The preserved fit.py writes coefficients and traces for subsequent runs; cache.mjs rebuilds its numerical inputs. Exact reproduction of the original initialization lineage requires the missing intermediate checkpoints. Re-running a fresh fit is possible but is a new experiment.

## Completion run

The completion workflow prepares the original ColorBench-adapted XYZ pairs from the retained NPZ, regenerates exact normalized source tuples, verifies both frozen shared records, rebuilds the source caches from the common algorithm, and tests an untrained Adobe RGB (1998) boundary. It runs the five scored generation and sixteen scored measurement columns, with strict and explicitly clipped pipelines separated. No unscored benchmark suite is added.

The exact inverse generates dense Reach/Level trajectories and the R=L / near-edge rays. The audit reports normalized lightness progression, local Y decreases, coordinate Jacobian determinants and conditioning separately. It renders native/full review sheets and builds the actual served comparison, including explicit edge strips and a neutral-surround toggle. Public Pages verification has a separate receipt; a source commit alone is not proof that deployment succeeded.

## Findings and interpretation boundary

The new shared coefficients trade worse COMBVD performance for common-gamut calibration and explicit dark-side control. Previous per-gamut balanced fits are the main controls, not the older C1 calibration. The final measured results are in results/REPORT.md; the raw arrays and JSON preserve support and mapping information.

The normalized source-to-HRL mapping is invertible by construction, but inverse stability is still tested numerically. A positive sampled determinant is not proof of even perceptual contours. Negative Y increments along a nominal Level path are not automatically a coordinate fold, nor are they hidden by that distinction.

The engineering dark target and Oklab path diagnostics do not redefine HRL Level. The attached papers constrain terminology and interpretation but do not prescribe the new polynomial or supply its numerical target. The single-bank result remains a review checkpoint, with local and wide-gamut trajectory limitations made explicit.

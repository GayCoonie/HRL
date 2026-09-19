# Reproducing this experiment

This is a fresh reconstruction from published commit `4aac5291e4d7a124426a9d541f185165566903ca`. The earlier chat's unpublished fitted files could not be recovered. Its reported scores are not results of this experiment.

From the repository root, with Node and Python (NumPy/SciPy) available:

```sh
node v2/research/level-contours/prepare.mjs
python3 v2/research/level-contours/fit.py --name metric --start seed
python3 v2/research/level-contours/fit.py --name strict --start seed
python3 v2/research/level-contours/refine-reach.py --name metric
python3 v2/research/level-contours/refine-reach.py --name strict
python3 v2/research/level-contours/refine-order.py
node v2/research/level-contours/audit.mjs beta1 seed metric strict guarded
node v2/research/level-contours/regression.mjs
node site/test-beta1.mjs
```

Run fitting in a separate checkout: it overwrites coefficient records and traces. `prepare.mjs` also overwrites the seed/cache and regenerates two ignored physical grids; cache.json records the exact grid and observer-input SHA256 identities. The checked-in fitted records are the authoritative measured snapshots. Platform differences in floating-point optimization can change a new fit.

The first two fits use 180 L-BFGS iterations each. Reach-only refinement uses 220 iterations; the ordering trial uses 100. Each iteration budget was reached; none is claimed globally optimal. The physical-grid regularizer is approximate; pair transforms and final audits use the actual analytic/runtime conversions. COMBVD is training evidence, not held out.

Superseded folders retain rejected/interrupted fitting provenance. In particular, `superseded-grid-prefilter` used an inconsistent interpolation prefilter and its scores must not be used. The accepted fits restarted from the seed with the corrected full three-dimensional prefilter. `superseded-logit-only` is preliminary work before the final model family. Direct Beta1, final-seed, and final-candidate audit files supersede all preliminary audits.

The fixed-Level regression checks one reproduced H300 low-Level near-gray ridge. A pass does not establish universal ordering or subjective visual quality. The audit separately reports 504 near-gray paths and 32,256 fixed-Reach Level steps per model/profile. It intentionally reports perceptual violations instead of treating a completed audit as an ordering pass.

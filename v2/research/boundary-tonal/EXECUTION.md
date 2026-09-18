# Execution record: boundary and shared tonal continuation

The pre-fit plan was committed as 6fb195e255db081f22c3e06f3f399a88eba5bb24. The input snapshot is from 5a160b684d369a0adb483b65548eda27deb2bd2f, including the unchanged 0.12 mapping and previous fitted records.

## Boundary and source preparation

The pinned colour-science 0.4.7 wheel was obtained through an authenticated GitHub Actions input snapshot because the local runtime has no network DNS. A direct CIE CSV download attempt failed. The boundary was rebuilt from the bundled 471-row table and checked before fitting. The normal sRGB pair mask is unchanged. Full source coordinates were regenerated for the repaired geometry.

The 96-hue, 193-by-193 source grids were built from actual inverse outputs in GenSpace. One initial tool-bound execution stopped before completion; the build was restarted as a monitored process and completed for both gamuts. Only the complete final grids were fitted. Their hashes and timings are in results/grid.json.

## Trials and interruptions

| Trial | Status | Actual objective evaluations |
|---|---|---:|
| conditioned-a | Aborted by OOM killer, exit -9; last saved intermediate and all completed objective logs retained; not selected | 315 |
| conditioned-c | Completed; original full trace and final array preserved | 421 |
| metric-a | Aborted by OOM killer, exit -9; last saved intermediate and all completed objective logs retained; not selected | 308 |
| metric-b | Aborted by OOM killer during setup; zero objective evaluations | 0 |
| metric-b2 | Completed; original full trace and final array preserved | 667 |
| smooth-b | Completed; original full trace and final array preserved | 679 |

The local memory limit is 4 GiB. Starting additional fits while two were active caused the OOM killer to terminate conditioned-a, metric-a, and the metric-b setup. Their surviving intermediate records, actual console outputs and completed trace rows are preserved in the review ZIP. They were not selected. Subsequent coarse fits were limited to two concurrently; the dense conditioned-c fit ran alone. The zero-evaluation setup is not counted as a completed fitting trial.

The raw-Hessian family was also poorly balanced near very small stencils. The successful fit-v2.py switches its sheet penalty to bounded-influence log1p bending and a bicubic surrogate. fit-v3.py adds exact critical blue angles and weighted mean/RMS conditioning-tail risk. Both use the same invertible runtime map, not a different hidden gamut-specific conversion.

Completed trials: smooth-b, metric-b2 and conditioned-c, totaling 1767 objective evaluations. Including aborted experiments, 2390 original trace entries are retained. Command JSON files and script hashes identify the actual algorithms and weights.

## Selection

The final comparison uses conditioned-c as balanced and metric-b2 as the accuracy-oriented alternate. smooth-b remains a completed initializer/control trial. Selection used COMBVD, 24-hue direct-inverse checks, matched-coordinate conditioning and exact native-blue/magenta previews. Some ordinary path averages regress; selection is a tradeoff, not a declaration that all metrics improve. The severe conditioning maximum is reduced but remains large. The deep-blue lower-boundary band remains visible.

The frozen selection timestamp and exact record hashes are in results/SELECTION.json and precede the new non-COMBVD scored run. No fitted coefficient changes during benchmark evaluation or publication. The boundary-only control shares the 0.12 coefficient hash and isolates geometry.

## Source/runtime identity

After grid generation, the inner fullVivid alias was pointed at the corrected XYZ path and an unchanged continuation cone was cached rather than reconstructed for every native import. These do not alter coordinate outputs; the grid-generation source text and both hashes are preserved in recovery/grid-runtime.mjs.txt and results/runtime-finalization.json. The public benchmark records the finalized runtime hash.

The repository includes complete coefficient arrays, commands, hashes, statuses, and sampled progress. Full original JSONL traces and console logs are in the downloadable review ZIP; sampled progress must not be called the complete trace. This storage distinction is intentional and documented, not a claim that missing logs were reconstructed.

## Verification and publication

Numerical receipts cover spectral geometry, actual inverses, exact integer conversions, hue/neutral/vivid preservation relative to the repaired chart, common-bank identity, third-gamut transfer, implicit-gradient parity and analytic Jacobian parity. The original mapped Python ColorBench and finer actual-output diagnostics are run on frozen models. Public site/content verification has a separate receipt and is not inferred from a local pass.

The local Chromium navigation attempt was blocked by the sandbox administrator before the page loaded. No local-browser pass is claimed; served and public browser tests are performed on the GitHub runner. The complete local error log is retained in the review ZIP.

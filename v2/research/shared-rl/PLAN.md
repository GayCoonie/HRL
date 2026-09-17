# Shared R/L and dark-edge refinement: plan before fitting

Status: planned, then executed in the accompanying results and implementation log. This file records the starting plan; discoveries and changes belong in EXECUTION.md rather than silently rewriting the plan.

## Request and continuity

Coonie/Adam asked for actual implementation, not another proposed future pass. Preserve the previous refits, fix the too-bright dark portion of R=L and the apparent blue near-black bunching, use the attached papers with explicit provenance, and replace separate native/full learned coefficients with one calibration. A gamut change must supply geometry, not select another learned color space.

Starting repository: a5806a6552c019a0dbb9e096859709c236eae046. Full and native refits were separate at this point. Their benchmark numbers are controls, not acceptance targets to achieve at any visual cost.

## Definitions and corrections to the preceding proposal

Unit HRL: blackness K=1-L; whiteness W=L-R; chromaticness R. R=L has zero whiteness. R/L is a derived saturation-like coordinate, not the meaning of Reach. Level is brilliance/inverse blackness, not luminance Y, CIELAB L*, Jz, or ordinary lightness. These native shares are not literal RGB mixing proportions.

The existing OPAL couplings ALREADY use t=L and u=R/L and have algebraic inverses. Do not claim to invent that parameterization now. A screenshot cannot establish a negative Jacobian. Diagnose visual bunching, poor conditioning, physical trajectory curvature and quantization separately. The preceding claim that a fold was 'almost certainly' occurring was unsupported.

The direction of any warp must be explicit: to make a fixed displayed HRL address darker, its inverse map must request a darker source point. A smaller forward slope is not automatically the right correction.

The current 'full' realization is the polygonized physical cone with 0<=relative Y<=1, not literally unlimited luminance. Keep that contract and the extended floating carrier; do not reopen the already repaired completion cutoff. Reference white is D65 and 300 nits, with relative values remaining relative.

## Implementation

1. Make a single gamut-parameterized source construction: shared hue field, shared auxiliary appearance readout, shared nested path-integration/normalization algorithm. Its vivid endpoint and physical sheet boundary come from the selected gamut. Existing deterministic source atlases may be caches, but not extra fitted parameters. Expose a custom linear-RGB-to-XYZ gamut descriptor and test at least one untrained third gamut.
2. Fit ONE coefficient bank jointly on the native sRGB and full source charts. No learned gamut ID, separate head, interpolation between native/full coefficient banks, or hidden profile-specific correction. The same normalized source tuple must produce bit-identical corrected coordinates independent of gamut.
3. Add an explicit, monotone dark-side refinement. Candidate inverse curve is phi(t)=t-a(H,u)*t*(1-t)^2 with 0<=a<1, smooth periodic hue dependence and a factor vanishing at u=0. Its derivative is at least 1-a>0; it fixes black, t=1 and the neutral side. This is a design family, not a formula claimed to appear in the papers. Use safeguarded inversion of the same curve. Retain the actual position-dependent interactions of the common R/L couplings.
4. Joint loss: traditional weighted COMBVD in the regular bicone, with equal per-gamut objective weights; generated-path smoothness and conditioning; and explicit black-to-vivid/near-edge tonal constraints. Evaluate overlap pairs separately from full-only pairs. COMBVD remains in-sample.
5. Dark-edge targets use own-hue/gamut endpoint-normalized progress, not one luminance for all hues. The exact strength/shape of the preferred darker edge is an engineering response to the user's screenshots, not fabricated observer measurements. Use brightness/lightness proxies as diagnostics and bounded regularizers, never rename them Level.
6. Keep source hue labels, ring, vertices, neutral progression, white handling and input policies fixed. Changing the mapping of R/L addresses must not be presented as a change in a stimulus's hue label.

## Papers and evidence boundary

Read the supplied ten papers, including relevant diagrams and limitations, and record their roles in EVIDENCE.md. Preserve differences between blackness, lightness, saturation, chromaticness, and brightness. Distinguish experimental data from authors' theory and from our design choices. Do not import Nayatani's Munsell-indexed chromatic-strength numbers into HRL angle indices. Do not use clipped HDR data as evidence for SDR constant-hue behavior. No new observer observations are implied by numerical proxy tests.

## Selection and verification

Preserve all trial specifications, seeds, coefficients and optimizer logs. Select a balanced shared candidate and, only if useful, a metric-leaning shared alternate from COMBVD plus direct visual/edge checks. Freeze them before the scored ColorBench rerun. OSA, Xiao, MacAdam and threshold/tolerance boards do not enter this fit; prior development exposure remains disclosed.

Verification: exact runtime forward/inverse, integer channel round-trips, black/white/vivid invariance, neutral invariance, circular hue continuity, positive interior Jacobian and its conditioning, source-boundary containment without display clipping, native/full shared-bank identity, and a new gamut without retraining. Dense interleaved-hue ramp checks, exact R=L and near-edge curves, and blue/purple/magenta preview panels are mandatory. Negative derivative tests must exclude the coordinate singularity at black and report their sample range.

Re-run only ColorBench's five scored generation and sixteen scored measurement columns with the same pinned benchmark and pool; keep strict/clipped policies separate and the actual bicone embedding. Report regressions, exclusions, clipping and high-magnitude hue continuation. Do not create an overall rank from incomparable support.

## Deliverables

Preserved plan, literature intake, implementation log, one shared calibration per candidate, generic gamut/source factory, reproducible fitting and tests, raw/summary scored results, visual edge/corner evidence, and an actual served site comparison with the earlier separate refits retained. Publish only verified additions. A successful local test is not by itself a claim that Pages deployed; check the public files and browser path separately.

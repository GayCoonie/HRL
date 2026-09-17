# Shared GenSpace tonal fit: pre-fit plan

Starting repository: bf43587e620c97a660a6f4d3da76ae41472446f8. User authorizes actual new fitted checkpoints based on the published tonal-semantics work. Earlier conversions, plans and results remain unchanged.

## Contract

R is chromaticness, K=1-L, W=L-R. Level is brilliance/inverse blackness, not luminance or scalar GenSpace lightness. Black dilution scales R,L; white dilution maps R to (1-a)R and L to a+(1-a)L. Fixed-Reach Level is neutral exchange, a distinct family. One learned coefficient bank per candidate operates after deterministic own-gamut source normalization. No gamut identity or separately learned gamut head enters that map.

## Actual fitting experiment

Retain the exact invertible shared 0.10 runtime as the initial model family. Refit all R/L coupling coefficients and the bounded dark-curve coefficients using the frozen HelmLab 1.0.0 GenSpace ruler. Its complete 3D vector, not Oklab and not only scalar Gen L, supplies the generated-path regularizers. The old t^1.08 lightness target is removed.

Fit joint traditional weighted COMBVD on the same 3,331 native and 3,813 full supported pairs, with equal objective weight per gamut. Include black-origin rays, white-directed rays, fixed-Reach neutral-exchange paths and fixed-Level Reach paths. Penalize relative step variation, neighboring-step concentration, excessive vector curvature, and retreats from the relevant black/white corner in GenSpace. A weak broad dark-edge continuation guard may use the previous metric candidate as an upper envelope; this is preservation of user-reviewed appearance, not a new observer target. Record every actual loss term and weight in each trial.

Use smooth periodic hue coefficients, retaining hue identity, the ring, neutral progression, vertices, source atlases, physical solid and white handling. The same numerical law must work for sRGB, full and an untrained Adobe RGB realization. Test more flexible or symmetric controls only if diagnostics justify them, with their exact definitions recorded separately.

## Evidence boundary

ZCAM (2021), Section 2 and Equations 17-19, informs the distinction between blackness/whiteness and scalar lightness. Its fitted correlates are not pasted into HRL shares or treated as new human observations. Briggs and Nayatani inform boundary-relative tonal semantics. The derived dilution operators and local bicone metric come from tonal-semantics/DEFINITIONS.md. The new human-data training remains COMBVD only. GenSpace-derived penalties are explicitly synthetic/model-based. User per-hue preferences have not been supplied as a measured table and will not be invented.

## Verification and publication

Preserve all trial recipes, actual checkpoints, seeds, per-evaluation logs and source hashes. Use an explicitly approximate source-coordinate grid only for differentiable fitting; verify Python/JS coordinate parity and direct-runtime GenSpace outputs, including interleaved hues and near-black regions. Check round-trips, exact 16-bit conversions, endpoints, hue/neutral invariance, Jacobian sign and conditioning, and identical shared-bank behavior across gamuts.

Choose balanced and metric-leaning candidates using COMBVD and direct numerical/visual training diagnostics. Freeze them before running the five scored generation and sixteen scored measurement ColorBench columns at the same pinned revisions. No unscored suite. Preserve strict/clipped policies, support masks and common/full-only comparisons. Prior evaluation exposure is disclosed; new scores are not pristine independent validation.

Publish additive source, logs, results and an actual interactive site comparison, leaving prior accepted entry points intact. Verify both local and actual public browser behavior. Report gains and regressions separately; do not imply that one ruler or round-trip success proves perceptual correctness.

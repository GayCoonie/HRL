# Independent validation-harness review

Reviewed UTC: 2026-09-19T10:19:47.097502+00:00

Contract verdict: confirmed for the audit harness and corrected selection gates. Candidate outcome: not yet reviewed; no running fit output or candidate receipt was read in this pass.
Quality verdict: no remaining blocking finding within this scope. One reproduced reducer failure was fixed by the parent implementer and the corrected actual script passed the same real baseline schema plus targeted threshold cases.

## Source identity

- `tonal-next/audit.mjs`: `c3b96ecf9697e813c742512d8d99bd8e0475c41df611c0156f2921f157f84902`.
- `tonal-next/make-comparison.py`: `c5cfd3a6c6fd7970845c404fec5d8461b2228702f0284a8daff627071680e9b6`.
- Baseline receipt: `09a12a76cb70e90a338ae89c67e3ce4be9ff87678cfda49faf258334c45bf7ea`.
- Baseline-recorded audit, cache, input, ruler, and both immutable reference-evaluator hashes match the current files; see `review-runtime-source-identity.json`.

## Findings

1. Resolved, contract/reliability, high confidence, medium severity: original reducer line 12 required `mappedAllInput` in every profile, while audit line 81 writes it for srgb only. Running the original actual reducer with baseline receipt as both arms exited 1 with `KeyError: 'mappedAllInput'`. Parent changed the reducer to `.get()`. Corrected actual reducer returns null for full; it neither fabricates a full mapping result nor conflates mapping with retained scores.
2. Nonblocking precondition, quality/coverage, high confidence: reducer lines 7–10 check completed status but trust receipt schema, source identity, sampling, model-label uniqueness and population counts. Synthetic receipts with the necessary score fields are accepted. This is acceptable only with separately verified completed receipts from the reviewed harness. Fresh candidate receipt validation must verify those identities before the reduced comparison is treated as evidence. No arbitrary/untrusted receipt hardening was requested.

## Decisive checks

- `node --check v2/research/tonal-next/audit.mjs`: exit 0.
- `python hrl-optimization/review-runtime-gates.py`: exit 0, 15 expected outcomes matched. Exact 5% blue improvement, +0.15 weighted STRESS and 1.03 CV ratios pass. Just-outside blue, both separate STRESS guards, and all eight gamut-by-family CV guards fail independently. Critical-angle and mapped-input scores do not enter eligibility. Ten guards per candidate.
- `node hrl-optimization/review-runtime-narrow.mjs`: exit 0. Reproduced complete metric retained scores from unchanged cache and actual model: srgb 3331 pairs, weighted 29.107047807815334; full 3813 pairs, weighted 29.948554645320474. Separate actual srgb import pipeline: 3813 pairs, 482 mapped, weighted 34.489196386295546.
- Same narrow runtime command: H281, all 20 paths at 257 points per gamut, direct `toXYZ` into frozen `pathStats`, maximum CV delta 0. All 121 nine-point equilateral sheet stencils per gamut: maximum value delta 3.4638958368304884e-14 srgb and 7.105427357601002e-15 full.
- Reaggregated all saved baseline raw regular rows for metric/balanced and both gamuts: 72 regular hues, 360 paths per family, 79 total unique hues. Regular blue subset is exactly H256,261,266,271,276,281,286,291. Metric srgb blue mean exactly 0.5066819042384556; historical path and sheet receipts match within 1e-12.

## Static contract review

Audit lines 30–36 preserve retained populations and hash the native mask; lines 78–81 keep native retained3331, full3813, and native mapped3813 separate. Lines 53–65 match immutable direct-runtime path and sheet formulas; both call actual inverse `toXYZ` before frozen GenSpace diagnostics. Lines 84–85 keep regular, critical and control summaries separate. Lines 87–90 sanity-check frozen baselines. Lines 67–74 sample inverse/legal-domain, neutral, vivid, hue seam and rejection contracts; line 94 checks identical shared-bank maps across gamuts. The full baseline receipt records 148 frozen checks with no mismatch.

Reducer lines 14–21 implement the predeclared srgb regular-blue mean improvement >=5%, both retained weighted STRESS deltas <=0.15, and each of four global regular family CV ratios <=1.03 in each gamut. COMBVD reuse and synthetic nature are disclosed.

## Limits and pending evidence

No six-minute audit was rerun. Fresh runtime reproduction is deliberately restricted to all score populations plus H281 path/sheet diagnostics; complete baseline regularity was independently reaggregated from raw recorded rows. No candidate-fit outputs or completed candidate receipts were inspected. The parent reported unrelated regression tests regenerating historical verification artifacts; this pass did not change or restore them, and current relevant runtime/cache hashes remain equal to baseline. Candidate receipt identity and actual selection outcome remain for a follow-up after completed candidate receipts arrive.

Evidence: `review-runtime-gate-evidence.json`, `review-runtime-narrow-evidence.json`, `review-runtime-reaggregation.json`, `review-runtime-source-identity.json`. Reproduction scripts: `review-runtime-gates.py`, `review-runtime-narrow.mjs`. Synthetic gate fixtures and outputs are explicitly named `review-runtime-gate-*` and are not candidate research evidence.

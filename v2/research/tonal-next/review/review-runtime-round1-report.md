# Independent first-round candidate receipt review

UTC: 2026-09-19T10:25:45.000577+00:00

Contract verification: confirmed. Candidate eligibility: both rejected under the fixed rule. Quality: no blocking evidence-integrity contradiction found.

All current 148 frozen files match the immutable manifest. Both completed candidate receipts match the baseline schema, sampling, source/cache/input/ruler hashes, native retained 3331 and full 3813 populations, and separate native mapped 3813 population with 482 mapped pairs. Candidate record files match the recorded SHA256. Shared-bank 256-sample checks and every recorded inverse/anchor/seam/input-rejection contract satisfy the harness thresholds. Independent reaggregation of every raw regular/critical/control path and sheet summary matches the saved summaries. Comparison input receipt hashes and every reduced model and selection value match the raw receipts.

| Candidate | Native blue bending change | Accuracy guards | Path guards | Verdict |
|---|---:|---|---|---|
| smooth-mild | +1.3848444502% worse | Both pass | All eight pass | Rejected: does not improve blue bending >=5% |
| smooth-conditioned | +45.7363832291% worse | Both pass | Four fail | Rejected: blue improvement and srgb/full white/exchange CV |

Conditioned failed CV ratios: srgb white 1.0486745375860569, srgb exchange 1.0631196003585688, full white 1.0434102391576725, full exchange 1.0529846033365164. Required maximum 1.03. Weighted STRESS deltas remain within +0.15: mild native +0.05097609686907134/full +0.050985739053221124; conditioned native +0.05547989836718159/full +0.05714204044629412.

Fresh narrow runtime reproduction also passed for both candidates: all retained and mapped weighted/unweighted scores match exactly; H281, all 20 paths × 257 samples per gamut have maximum CV delta 0; all 121 nine-point sheet stencils per gamut match with maximum absolute value error 4.121147867408581e-13. This is a fresh bounded reproduction, not a second full multi-hue audit.

`comparison.json` status `no-eligible-candidate` is correct. Its `selectedCandidate: smooth-mild` chooses the displayed research comparison; it does not make mild eligible or replace Beta 1 as the default.

Evidence: `review-runtime-round1-evidence.json`, preserved `review-runtime-round1-comparison.json`, `review-runtime-smooth-mild-narrow-evidence.json`, `review-runtime-smooth-conditioned-narrow-evidence.json`. Commands: `python review-runtime-candidates.py --candidate audit-mild.json --candidate audit-conditioned.json --comparison <repo>/v2/research/tonal-next/results/comparison.json --out review-runtime-round1-evidence.json`; `node review-runtime-candidate-narrow.mjs audit-mild.json smooth-mild`; `node review-runtime-candidate-narrow.mjs audit-conditioned.json smooth-conditioned`. All exited 0. Exact input paths are recorded in JSON and source scripts.

This report preserves the negative first-round findings. Further targeted fits were not inspected and cannot retroactively change these outcomes.

# Independent second-round candidate receipt review

UTC: 2026-09-19T10:37:21.987324+00:00

Core contract verification: confirmed. Candidate eligibility: both rejected under the unchanged 5% native-blue improvement requirement. Core quality: no blocking evidence-integrity contradiction found.

The completed `audit-sheet-raw.json` and `audit-sheet-robust.json` receipts match baseline schema, every recorded source/input/cache/ruler hash, sampling, and population contracts. All 148 current frozen files match the manifest. Candidate record files match receipt SHA256 values. Inverse/anchor/seam/input-rejection contracts and shared-bank identity checks pass. Reaggregation of all raw regular/critical/control path and sheet summaries matches each receipt. The repository comparison still contained first-round results at review time, so the actual reducer generated the isolated `review-runtime-round2-comparison.json`; an independent review script confirmed every reduced metric and gate.

| Candidate | Native blue improvement | Native weighted STRESS delta | Full weighted STRESS delta | Eight path guards | Verdict |
|---|---:|---:|---:|---|---|
| sheet-raw | 0.7445759802% | +0.037102089560125506 | +0.00020872860943654814 | All pass | Ineligible: below 5% improvement |
| sheet-robust | 0.3654938244% | +0.02592296054997334 | -0.0013182373343738618 | All pass | Ineligible: below 5% improvement |

Every weighted STRESS delta is <=0.15 and every per-gamut family CV ratio is <=1.03. Largest CV ratios are full reach: 1.0008418029968746 for raw and 1.0006385473002322 for robust. No failed guard was omitted, averaged away, or replaced with a critical-angle, edge, conditioning, mapped-input, or unweighted metric.

Fresh bounded actual-runtime reproduction (`review-runtime-candidate-narrow.mjs`) also passed for each: all retained/mapped scores reproduced exactly; H281 all 20 paths at 257 samples in each gamut had CV delta 0; 121 nine-point sheet stencil values per gamut reproduced within 2.2737367544323206e-13. This does not represent a second full multi-hue audit.

Evidence: `review-runtime-round2-evidence.json`, `review-runtime-round2-comparison.json`, `review-runtime-sheet-raw-narrow-evidence.json`, `review-runtime-sheet-robust-narrow-evidence.json`. All review commands exited 0. Main receipt hashes and candidate record hashes are recorded in the evidence file.

Supplemental edge and conditioning integrity findings will be appended after the separate read-only review. Further planned warm-start/critical-source fits and their outcomes were not inspected.

## Supplemental review completed

The separate supplemental review confirmed receipt identity and saved arithmetic: 186 recorded source/model/frozen hash comparisons, 316 edge rows containing 6,320 stencil values, and 1,625 conditioning rows with 11,375 matrices. All 35 recorded implementation booleans reaggregate; no contradiction was found. Full details and hashes are in `review-runtime-round2-supplemental-report.md` and `review-runtime-round2-supplemental-evidence.json`.

The supplemental grid has 20 centres disjoint from the historical 121 centres, and all stencil points are legal. Its values remain separate from eligibility. Conditioning maxima remain 112526.69190396069 (raw) and 112617.04257873626 (robust), both at H269, R0.000999, L0.001. These are fixed-H coordinate Jacobian conditions, not XYZ/perceptual conditions. Numerical comparisons at five step factors are recorded diagnostics, not Boolean acceptance gates.

Supplemental verification recomputed saved edge summaries and conditioning matrix arithmetic; it did not regenerate edge inverse XYZ/GenSpace vectors or rerun analytic/autograd/JavaScript derivatives. This limitation is separate from the fresh main-audit H281 and population-score reproduction reported above.

The current reducer changed only the failure-note wording from “Neither research candidate” to “No research candidate.” Its current SHA256 is `d4dbec95546c4d252a8143768e15a576437b72319f88cb791b7057a75a9ce8f4`. All 15 threshold/schema tests were rerun successfully against that version; refreshed evidence is `review-runtime-gate-evidence.json`. Selection equations and eligibility rules are unchanged.

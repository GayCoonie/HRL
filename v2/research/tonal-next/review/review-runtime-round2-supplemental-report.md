# Second-round supplemental receipt review

**Contract: confirmed within the requested read-only scope. Quality: confirmed for receipt identity and saved arithmetic; runtime regeneration was outside scope.** No integrity contradiction found.

Reviewed only completed `audit-edge-sheet-raw.json`, `audit-edge-sheet-robust.json`, and `conditioning-sheet-candidates.json`; main candidate audits supplied record identity only. No repository edits, new/running fit outputs, Sites, GitHub, full audit runs, or autograd reruns.

Evidence: `review-runtime-round2-supplemental-check.py` produced `review-runtime-round2-supplemental-evidence.json`: **267,740 assertions, zero failures**, including 186 source/record/frozen-manifest hash comparisons. The largest normalized arithmetic residual was 6.03e-16.

## Identity and populations

- Both supplemental candidate hashes match current record bytes and the corresponding main-audit and conditioning model hashes. All 148 current frozen manifest entries match. Edge receipts are explicitly `completed`; conditioning has no schema/status field, but contains the expected full payload, command/version metadata, Node exit 0, and all expected rows/checks.
- Edge: 316 rows and 6,320 stencil values across two candidates and two gamuts. Each gamut has 79 unique hues (72 regular plus 8 critical with H=281 shared), 20 distinct supplemental centres, and 1,580 stencil values. The centres are disjoint from the historical 121; all stencil points are legal.
- Conditioning: five models × 325 shared points = 1,625 rows; all analytic/autograd matrices plus five numerical matrices per point are present (11,375 matrices, including 8,125 numerical). Point identities, labels, factor order, step sizes, transformed matrices, SVD quantities, determinants, error comparisons, summary extrema, and all 35 implementation booleans reaggregate.

## Supplemental edge values

| Candidate | Gamut | Regular mean | Critical mean | Largest stencil |
|---|---|---:|---:|---:|
| sheet-raw | srgb | 2209.889474 | 2634.923501 | 1037426.198201 |
| sheet-raw | full | 2830.931330 | 1129.760572 | 885339.950034 |
| sheet-robust | srgb | 2160.408452 | 2592.482371 | 967423.229928 |
| sheet-robust | full | 2770.919450 | 1127.403440 | 819407.175340 |

`edge-audit.mjs` lines 26–40 define the supplemental grid, exact nine-point normalized bending equation, and independent regular/critical summaries. Its formula matches `boundary-tonal/sheet-audit.mjs` lines 14–16. The receipt does not contain the raw XYZ/GenSpace stencil vectors; reaggregation verifies saved bending values, not fresh inverse evaluations.

`make-comparison.py` lines 12–21 uses the main audit’s native historical `sheet.globalRegular.blueMean`, retained weighted STRESS, and four path CV guards in both gamuts. It does not consume supplemental edge or conditioning fields. Edge results therefore remain diagnostic and cannot alter eligibility.

## Conditioning values

| Candidate | Maximum condition | Minimum propagated determinant | Max analytic/autograd scaled Jacobian error | Max numerical scaled Jacobian error, factor 1e-4 |
|---|---:|---:|---:|---:|
| sheet-raw | 112526.691904 | 0.101369063730 | 9.844e-11 | 1.685e-06 |
| sheet-robust | 112617.042579 | 0.101791242604 | 4.010e-11 | 1.760e-06 |

Both candidate condition maxima occur at H=269, R=0.000999, L=0.001. All seven recorded implementation gates pass for each of the five models. The numerical comparisons are fully recorded at all five factors, but are **not acceptance gates** in `conditioning-audit.py` lines 171–178. The candidate worst numerical scaled Jacobian errors rise to 6.418e-5 (raw) and 3.399e-4 (robust) at factor 1e-6.

The conditioning quantity is a fixed-H source-to-destination coordinate Jacobian in equilateral bases, not XYZ/perceptual conditioning. Analytic and autograd share the existing implicit dark-inverse derivative; only the recorded JavaScript finite differences avoid that derivative. These were arithmetic and source-identity checks of saved evidence, not fresh execution of those three derivative paths. Finite samples do not prove continuous-domain regularity or observer preference. No candidate eligibility verdict is made here.

## Receipt hashes

| Receipt | SHA-256 |
|---|---|
| audit-edge-sheet-raw.json | `b12093a9041191bc517adfde61f68a9fc95b8889cf897cfaab928344f9968199` |
| audit-sheet-raw.json | `063496f6196660df68e6e4c5bb3bd7c4142e18572a0920cdeca430905c4345e1` |
| audit-edge-sheet-robust.json | `259277b5523cdc9b91cc9601eb1958de9ee0a3a814c5ac45294486db3527b103` |
| audit-sheet-robust.json | `7dfa5383adaa1f77007ae0e97dd26d0a46f54b462473826aa168d634ae2fefa0` |
| conditioning-sheet-candidates.json | `f7eaf942d56d15d86149a4c342816a7d9c215e9fac9361692f9eda334f90843a` |

Current reviewed selector SHA-256: `d4dbec95546c4d252a8143768e15a576437b72319f88cb791b7057a75a9ce8f4`. Full source and record hash evidence is retained in the JSON. Changes to these source/receipt bytes make this review stale.

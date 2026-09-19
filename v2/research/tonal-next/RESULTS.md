# HRL v2 tonal continuation: six rejected candidates

**No candidate met the declared eligibility rule. Beta 1 remains the default.** The largest native regular-blue sheet improvement was **0.744576%**, from `sheet-raw`, against a required **5%**. The experiment established that the severe sampled common-coordinate anisotropy is real, and that reducing it can make the native blue sheets worse. The six records are retained as research evidence, with no release promotion.

The final [comparison receipt](results/comparison.json) has `status: no-eligible-candidate`. Its `selectedCandidate: sheet-raw` identifies the comparison displayed for inspection; it does not mean that candidate was accepted. This report closes the bounded pass recorded in [RESEARCH.md](RESEARCH.md). The earlier “No experiment results yet” line in that append-only record belongs to its initial state.

## Scope and decision rule

This pass continued the existing seven-layer shared tonal map. It kept the source charts, physical boundary, hue family, neutral progression, anchors and single coefficient bank shared between native sRGB and the full realization. COMBVD was reused development/training data. GenSpace paths, sheet bending and coordinate conditioning are synthetic diagnostics; none supplies new observer evidence or a held-out result. No fresh upstream ColorBench run was performed.

Before candidate outcomes, the protocol fixed eligibility to all of:

1. At least 5% lower **native sRGB regular-blue mean bending**, using the historical 121-centre sheet diagnostic.
2. Retained weighted COMBVD STRESS no more than **+0.15 points** above Beta 1, separately for native sRGB and full.
3. Each global regular path-family mean CV no more than **1.03 times** its own baseline, for black, white, exchange and reach in each gamut: eight separate guards.

The first criterion uses the eight regular hues H256, 261, 266, 271, 276, 281, 286 and 291. Exact critical hues H263, 269, 273, 275, 277, 281, 285 and 293 are reported separately. The initially mentioned alternative “worst path risk” branch was explicitly excluded before outcomes, so it cannot rescue a rejected candidate. The [reducer](make-comparison.py) and [gate review](review/review-runtime-report.md) document this interpretation.

All reported decisions use actual JavaScript evaluation of the frozen candidate records, including inverse `toXYZ` followed by the frozen GenSpace ruler for paths and sheets. They do not use the fitter's interpolated surrogate scores. The audit covers 72 regular hues plus seven additional unique critical hues, 20 paths of 257 samples per hue, and 121 nine-point sheet stencils per hue, in each gamut. The two control hues are already in the regular set. See [audit.mjs](audit.mjs).

## Executed trials and eligibility

| Candidate | Native regular-blue bending | Improvement from Beta 1 | Native weighted STRESS delta | Full weighted STRESS delta | Eight path guards | Decision |
|---|---:|---:|---:|---:|---|---|
| Beta 1 | 0.506681904 | — | — | — | Reference | Retain |
| smooth-mild | 0.513698660 | −1.384844% | +0.050976 | +0.050986 | All pass | Reject: blue worsens |
| smooth-conditioned | 0.738419882 | −45.736383% | +0.055480 | +0.057142 | Four fail | Reject: blue and path guards |
| sheet-raw | 0.502909272 | +0.744576% | +0.037102 | +0.000209 | All pass | Reject: below 5% |
| sheet-robust | 0.504830013 | +0.365494% | +0.025923 | −0.001318 | All pass | Reject: below 5% |
| blue-raw | 0.505563466 | +0.220738% | +0.047845 | −0.018854 | All pass | Reject: below 5% |
| blue-robust | 0.504677943 | +0.395507% | +0.037339 | −0.011674 | All pass | Reject: below 5% |

Positive improvement means lower bending. Every candidate passes both retained weighted STRESS guards. `smooth-conditioned` fails native white and exchange CV, at ratios **1.048675** and **1.063120**, and full white and exchange CV, at **1.043410** and **1.052985**. The largest of the eight ratios for the other candidates is 1.008100 for `smooth-mild`, 1.000842 for `sheet-raw`, 1.000639 for `sheet-robust`, 1.002299 for `blue-raw`, and 1.000961 for `blue-robust`. All are below 1.03.

The sequence was exploratory, with each pivot declared before its own results:

- **Trials 1–2:** `smooth-mild` and `smooth-conditioned` started from Beta 1, each with a 450-step LBFGS limit. Their settings differed only in conditioning weight, 0.003 versus 0.015. Both reduced sampled maximum condition substantially; both worsened native blue bending.
- **Trials 3–4:** `sheet-raw` and `sheet-robust` restarted from Beta 1 with 450-step limits. Inspection had found that the inherited training sheet objective pooled 141 centres while the historical direct audit used 121. These trials aligned the core objective with the historical 121 and separately penalized regressions at the additional 20 edge centres. Raw versus `log1p` core bending was the ablation. The best native gain was under 1%.
- **Trials 5–6:** `blue-raw` and `blue-robust` warm-started `sheet-raw`, with 600-step limits and stronger blue, accuracy, path and edge weights. Accuracy/path/edge references remained Beta 1. Seven exact critical-angle slices were appended to the 96-slice source cache, preserving its original prefix bytes; the fitting hue set grew from 48 to 55. The final pair did not beat `sheet-raw` on the declared native-blue criterion.

These six fits close this pass. No seventh or eighth trial was run. LBFGS closure evaluation counts can exceed the iteration limit because of line searches; the records retain both the requested step limit and evaluation counts. Exact settings, source identities, coefficients and objective statistics are in the six [trial records](trials/), with the corresponding [first-round](fit-first-round.py), [second-round](fit-sheet-round.py) and [final](fit.py) fitters. The [initial](results/grid-initial.json) and [augmented](results/grid-critical.json) grid receipts preserve cache provenance.

## Observer-score populations remain separate

Lower STRESS is better. “Weighted” uses the recorded COMBVD weights; “unweighted” is shown for context and does not replace the weighted guard.

| Model | Native retained 3,331: weighted | Native retained: unweighted | Full retained 3,813: weighted | Full retained: unweighted |
|---|---:|---:|---:|---:|
| Beta 1 | 29.107048 | 30.712588 | 29.948555 | 32.127880 |
| smooth-mild | 29.158024 | 30.871648 | 29.999540 | 32.211298 |
| smooth-conditioned | 29.162528 | 30.866300 | 30.005697 | 32.273768 |
| sheet-raw | 29.144150 | 30.755614 | 29.948763 | 32.127928 |
| sheet-robust | 29.132971 | 30.732744 | 29.947236 | 32.121424 |
| blue-raw | 29.154893 | 30.756988 | 29.929700 | 32.102562 |
| blue-robust | 29.144386 | 30.751174 | 29.936881 | 32.116575 |

The native all-input import pipeline below evaluates **3,813 pairs**, of which **482** have a mapping event in at least one endpoint. It is a separate pipeline result, with a different population and import treatment from native retained 3,331. It is not an additional full-gamut result and does not enter eligibility.

| Model | Native mapped/all-input: weighted | Native mapped/all-input: unweighted |
|---|---:|---:|
| Beta 1 | 34.489196 | 38.126339 |
| smooth-mild | 34.674289 | 38.452574 |
| smooth-conditioned | 34.719747 | 38.509227 |
| sheet-raw | 34.523231 | 38.165220 |
| sheet-robust | 34.509019 | 38.138869 |
| blue-raw | 34.527619 | 38.160666 |
| blue-robust | 34.521151 | 38.157898 |

The comparison receipt stores unrounded values and all seven source audit hashes. Raw receipts are [baseline](results/audit-baseline.json.gz), [mild](results/audit-mild.json.gz), [conditioned](results/audit-conditioned.json.gz), [sheet-raw](results/audit-sheet-raw.json.gz), [sheet-robust](results/audit-sheet-robust.json.gz), [blue-raw](results/audit-blue-raw.json.gz) and [blue-robust](results/audit-blue-robust.json.gz). Hashes in `comparison.json` identify the decompressed JSON bytes, not the gzip containers.

## Whole-sheet, critical-angle and edge qualifications

The regular-blue acceptance measure describes one region. Broader or more targeted summaries can move differently:

| Model | Native whole-sheet mean | Full whole-sheet mean | Native exact-critical mean | Full exact-critical mean |
|---|---:|---:|---:|---:|
| Beta 1 | 0.464887 | 0.718056 | 0.571187 | 0.287537 |
| smooth-mild | 0.468591 | 0.691466 | 0.579535 | 0.297606 |
| smooth-conditioned | 0.535850 | 0.725669 | 1.058624 | 0.295171 |
| sheet-raw | 0.463680 | 0.698026 | 0.569503 | 0.287358 |
| sheet-robust | 0.463940 | 0.716898 | 0.569737 | 0.287049 |
| blue-raw | 0.463937 | 0.700629 | 0.562190 | 0.287069 |
| blue-robust | 0.464584 | 0.705254 | 0.571680 | 0.286888 |

Here whole-sheet means are over the 72 regular hues and historical 121 centres; exact-critical means use the separate eight critical angles. `blue-raw` improves its native critical mean more than `sheet-raw`, but its native regular-blue mean improves less. This is a measured sampling distinction, not grounds to replace the preregistered criterion after seeing outcomes.

The 20 additional edge centres are disjoint from the historical 121. Their separate [edge audit](edge-audit.mjs) uses the same normalized bending equation and preserves regular/critical summaries. These values are large and uneven, so they must not be folded into the historical means or used to claim general dark-edge smoothness.

| Model | Native edge regular mean | Native edge critical mean | Full edge regular mean | Full edge critical mean |
|---|---:|---:|---:|---:|
| Beta 1 | 2167.141867 | 2577.107711 | 2776.137374 | 1125.704574 |
| smooth-mild | 2140.086819 | 3406.592221 | 2595.223012 | 1135.912271 |
| smooth-conditioned | 3060.163205 | 10453.105748 | 3527.219821 | 2936.025382 |
| sheet-raw | 2209.889474 | 2634.923501 | 2830.931330 | 1129.760572 |
| sheet-robust | 2160.408452 | 2592.482371 | 2770.919450 | 1127.403440 |
| blue-raw | 2147.783051 | 2589.924747 | 2777.514402 | 1115.924288 |
| blue-robust | 2146.662814 | 2576.266954 | 2761.525302 | 1123.207534 |

`sheet-raw`, the displayed comparison, worsens all four edge means. Its largest regular edge stencil rises from 982,593.047 to 1,037,426.198 in native sRGB and from 833,777.882 to 885,339.950 in full. Soft training penalties do not guarantee pointwise nonregression. `blue-robust` lowers all four edge means, but that does not make it eligible or establish improvement at every point. Edge receipts: [baseline](results/audit-edge-baseline.json.gz), [first pair](results/audit-edge-candidates.json.gz), [sheet-raw](results/audit-edge-sheet-raw.json.gz), [sheet-robust](results/audit-edge-sheet-robust.json.gz), [final pair](results/audit-edge-blue-candidates.json.gz).

Passing mean-CV guards also does not bound worst path behavior. For example, `sheet-raw`'s largest full regular-path retreat fraction rises from 0.182719 to 0.187657, while `blue-raw`'s largest native regular-path step jump rises from 1.402489 to 1.405772. The raw path summaries retain these tails and the separate critical/control diagnostics.

## Conditioning: a real issue, an insufficient objective

The conditioning audit measures the spectral condition of a **fixed-H, 2×2 common-coordinate source-to-destination Jacobian**. Both source and destination use the equilateral basis `x = sqrt(3) R / 2`, `z = L − R / 2`. It is neither the source-to-XYZ Jacobian nor a full three-dimensional H/R/L or perceptual Jacobian.

| Model | Maximum condition over the same 325 points | Reduction from Beta 1 | Location H, R, L |
|---|---:|---:|---|
| Beta 1 | 113447.181723 | — | 269, 0.000999, 0.001 |
| smooth-mild | 60097.315771 | +47.026171% | 269, 0.000999, 0.001 |
| smooth-conditioned | 21738.547222 | +80.838178% | 216, 0.04995, 0.05 |
| sheet-raw | 112526.691904 | +0.811382% | 269, 0.000999, 0.001 |
| sheet-robust | 112617.042579 | +0.731741% | 269, 0.000999, 0.001 |
| blue-raw | 114567.439794 | −0.987471% | 269, 0.000999, 0.001 |
| blue-robust | 113643.042801 | −0.172645% | 269, 0.000999, 0.001 |

Independent 80-digit calculations and stable actual-JavaScript finite differences reproduce the decisive baseline and first-pair extrema. The severe baseline values survive the change of method and step size: they are not explained by the old tiny finite-difference step. See the [baseline review](review/review-conditioning-review.md), [candidate review](review/review-conditioning-candidates.md), and [sheet-pair review](review/review-conditioning-sheet-candidates.md). The saved full-grid derivative receipts are [baseline](results/conditioning-audit.json.gz), [first pair](results/conditioning-candidates.json.gz), [sheet pair](results/conditioning-sheet-candidates.json.gz), and [final pair](results/conditioning-blue-candidates.json.gz).

For the final pair, the saved maximum relative condition disagreement between analytic and actual-JavaScript numerical derivatives at boundary-distance factor `1e-4` is 5.316326e-6 for `blue-raw` and 2.910789e-6 for `blue-robust`. These are much smaller than their measured increases in maximum condition. Smaller steps can become noisier; convergence is assessed across steps rather than by choosing the smallest one.

Several limits matter. Analytic and autograd pathways share the implicit dark-inverse derivative; the numerical JavaScript pathway does not. The audit's exit status gates forward parity and analytic/autograd agreement, but does **not** gate numerical derivative agreement, so the numerical rows require explicit review. All sampled analytic determinants are positive; that establishes orientation at those points, not a global no-fold proof. Sampled maxima are not global bounds, and reductions are not uniform across points. In particular, the large condition reduction in `smooth-conditioned` coexists with a 45.736383% native blue-bending regression and four failed path guards.

## Validation and reproducibility

The completed main receipts record the unchanged 148-file frozen manifest, exact source/input/ruler hashes, candidate record hashes, retained populations, legal-domain/inverse checks, neutral and vivid anchors, hue seam, invalid-input rejection and 256 shared-bank identity samples. The original report preparation completed **499 receipt/hash/arithmetic checks, exit 0**: all seven main receipts matched the comparison hashes and then-current source/model bytes; score populations, regular path CV means and regular/critical/control sheet means reaggregated; all selection values and decisions agreed; conditioning maxima and positive sampled determinants matched raw rows. These checks verified the recorded evidence, rather than running a new fit or a second full runtime audit. They precede reconstruction of this report and are not a claim that the reconstructed text has the same bytes as the earlier draft.

Independent [first-round](review/review-runtime-round1-report.md) and [second-round](review/review-runtime-round2-report.md) reviews also freshly reproduced every retained/mapped score and a bounded H281 path/sheet sample from the actual runtime. The [second-round supplemental review](review/review-runtime-round2-supplemental-report.md) checked edge and conditioning identity/arithmetic without rerunning their complete forward or derivative evaluations. Those scopes should not be inflated into a fresh complete audit of every hue or every trial.

The [final evidence review](review/final-evidence-review.md) freshly evaluated Beta 1, `sheet-raw`, `blue-raw` and `blue-robust` in both gamuts. All retained/mapped scores matched; H281 path CVs across 20 paths × 257 samples matched exactly; the 121 sheet-stencil values differed by at most 2.274e-13. It also checked 120 finite geometry cases per profile, an exported H275 grid, and exact identity between the public Beta 1 factory and its explicit record. The [final conditioning review](review/conditioning-review.md) confirmed the final pair's maxima with fresh high-precision calculations and checked saved conditioning arithmetic for all six candidates. These remain bounded reproductions, not exhaustive continuous-domain tests.

A historical third-round supplemental checker recorded one failure, `selector_unchanged`, because it expected the older selector hash beginning `c5cfd3` while the already reviewed selector began `d4dbec`. The final review reconstructed the older bytes and found that the sole change was rejection-message prose, “Neither” to “No”; numerical and eligibility outputs of both versions matched. This resolves the stale identity expectation without changing the original failure record, selection equations or rejected-candidate outcomes.

For a new actual-runtime receipt, run from the repository root with a fresh absolute output filename, for example:

```sh
node v2/research/tonal-next/audit.mjs \
  --out /tmp/hrl-sheet-raw-audit.json \
  sheet-raw=v2/research/tonal-next/trials/sheet-raw.json

python v2/research/tonal-next/conditioning-audit.py \
  --output /tmp/hrl-sheet-raw-conditioning.json \
  --record sheet-raw=v2/research/tonal-next/trials/sheet-raw.json
```

Use an unused output path to preserve earlier receipts. The runtime audit reads the frozen training inputs/cache and historical checks already in the repository. Fitting additionally needs the separate binary source grids and the versioned Python environment described in [README.md](README.md); a report reproduction does not require fitting. To reproduce the final selection from the packaged raw evidence, decompress the seven main receipt files into a temporary directory, then run `make-comparison.py` with the baseline and all six candidates:

```sh
python v2/research/tonal-next/make-comparison.py \
  --baseline /tmp/hrl-receipts/audit-baseline.json \
  --candidate /tmp/hrl-receipts/audit-mild.json \
  --candidate /tmp/hrl-receipts/audit-conditioned.json \
  --candidate /tmp/hrl-receipts/audit-sheet-raw.json \
  --candidate /tmp/hrl-receipts/audit-sheet-robust.json \
  --candidate /tmp/hrl-receipts/audit-blue-raw.json \
  --candidate /tmp/hrl-receipts/audit-blue-robust.json \
  --out /tmp/hrl-comparison-reproduced.json
```

The generated timestamp will differ; model metrics, gates, selection and input hashes should agree. A reducer success alone does not verify source identity or raw receipt integrity; those checks precede interpretation.

## What this pass contributes, and the next question

**H1 is supported at the sampled points:** severe common-coordinate derivative anisotropy is numerically real. **H2 is rejected for these six executed candidates under the fixed rule:** none supplies the required native-blue improvement while meeting the other gates. This does not prove that every possible continuation must fail. **H3 is supported within the sampled contract checks:** the trials preserve the shared-bank and geometric/input contracts checked by the audit; continuous-domain behavior is not proved by finite sampling.

The useful contributions are the verified derivative diagnosis, a candidate-aware actual-runtime audit, explicit population separation, corrected Beta 1 guard reference, an identified 121-versus-141 sheet-objective mismatch, separate extreme-edge diagnostics, and exact critical-angle cache coverage. The failed conditioning ablation also rules out using a smaller common-map condition maximum as sufficient evidence of a better displayed blue sheet.

The next research question is whether the remaining blue behavior is dominated by the shared tonal map, the source/XYZ transformation, or their composition, and how accurately the cached fitting surrogate predicts direct-runtime derivatives and bending in that region. A useful next pass would first compare those components at matched legal points and stencils, with exact critical angles and edge cases kept explicit. That diagnosis can distinguish an objective/sampling limitation from a limitation in the map family before another optimization run. Revising the three-dimensional hue/source field remains a separate empirical change requiring its own protocol. No such revision, new observer dataset or additional fit is claimed here.

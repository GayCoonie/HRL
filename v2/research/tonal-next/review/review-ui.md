# Independent comparison UI review

Reviewed 2026-09-19. Scope: `v2/tonal-next.html`, `.css`, `.mjs`, their explicit-record runtime links, and the current two-candidate `comparison.json`. No UI source edits by this reviewer.

**Contract: confirmed at source level; browser behavior remains inconclusive. Quality: no open material source findings after the bounded correction below.** This is not a browser, visual, real Worker, deployment, or end-to-end approval.

## Resolved finding

**Contract / reliability; medium severity, high confidence — stale pixels after engine failure.** In the reviewed intermediate module (`394d7b0112433a459ebca2f7500a2d7bc20c21f452ddddb2d896d812b79d2d0e`), `render()` changed the candidate title and profile description before returning on `engineFailure` (lines 166–175), while `failure()` left existing `.ready` sheets visible. A worker error after a sheet was ready followed by candidate/profile selection could label old pixels with the new model/profile.

The author corrected `failure()` to remove both `.ready` classes, hide both cursors, and set both clipping readings unavailable (`tonal-next.mjs:186–193`). Reinspection confirms the CSS visibility gate then hides old canvases (`tonal-next.css:91`). The separate UI reviewer's same Node-VM harness first reproduced the defect and then passed the corrected case: `candidateSheetReady: false`, `cursorHidden: true`. Current `ui-review.json` records 20 passes, zero failures, and matches the final module/receipt hashes below. Its synthetic colors test request and visibility logic only; table assertions use the actual receipt.

## Source findings

- Worker/model construction supplies the fetched exact record to `createSpectralTonalHRL`; the factory's fallback runs only without a record (`tonal-next.mjs:51–63`; `research/boundary-tonal/index.mjs:43–45`). Rendering and samples use the actual `toXYZ` output.
- Pending rendering coalesces requests; page request IDs reject old sheets/samples, including during hue debounce. Retry replaces the worker. An independent subordinate source pass found no additional worker-ordering issue.
- Triangle sampling, pointer inversion and cursor mapping agree: `x=R`, `y=1-L+R/2`; inputs enforce `0 <= R <= L <= 1`. Equal 241×279 rasters retain their aspect ratio through CSS. Quarter-degree hue quantization keeps number/range values aligned. Arrow and pointer paths preserve legal coordinates.
- Display conversion clips linear sRGB channels before encoding; XYZ readouts remain unclipped. Full-solid screen limitations and optional triangle clipping marks are explicit.
- The table binds selected gamut/candidate keys and computes candidate-minus-baseline. It displays only `retained_combvd` STRESS; separate `mappedAllInput` values are not substituted. Current rejection and training/synthetic limits are stated. Candidate IDs are discovered from receipt keys, with safe record paths, so additional compatible trial IDs need no selector-code change.
- `git diff --name-only` produced no tracked-file changes during final review; these additive UI files do not alter frozen APIs or coefficient records.

## Evidence and limits

Fresh command from `hrl-v2-next`: `node --check v2/tonal-next.mjs` exited 0 with no output. All three new UI files were read; final error-path changes were reread. `sha256sum` and the inspected VM receipt bind this review to:

| File | SHA-256 |
| --- | --- |
| `v2/tonal-next.html` | `6b1c2404ffc12de4b04df14bea9fc251d49ca2255eca685c03de2c8ca11c49d7` |
| `v2/tonal-next.css` | `3ed0afe70a57e98e01ddcb458db046a1e135df4ee6d4aa0d0ce11c8d2a1bfc83` |
| `v2/tonal-next.mjs` | `083d33aba97bf369cba87c95232e1b882248103a5cb5d586572d3359fda5e7a7` |
| `v2/research/tonal-next/results/comparison.json` | `87074c676d1bba83373fa2ab18653e25e042709e5dcf4523a2569b8f3f2adac0` |

No browser was available to this review. Responsive layout, actual module-worker loading, pointer capture, keyboard focus, and screen-reader behavior remain unverified. Smallest remaining check: run the existing browser checks at the declared desktop/intermediate/mobile widths, including load failures/retry and a candidate/profile change after worker failure. Four-candidate receipt behavior is supported by source inspection; the current real receipt contains two trials only.

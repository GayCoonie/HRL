# Global tonal research wave — 2026-09-19

This experiment reopens the shared tonal fit across the whole solid. It keeps the user's vivid-ring spacing, pseudo-RGB carrier and exact current grayscale. Both full and native sRGB use one coefficient bank. The inherited source hue sheets and triangular coupling family are retained for this first finite wave as an experimental choice, not a permanent constraint or a claim that the user required them.

## Why the previous search was local

The tonal-next fitter penalized any hue with path-risk growth beyond 2% plus 0.001, permitted only +0.05 weighted STRESS versus Beta1, preserved a narrow Beta1 dark-edge envelope, and applied a blue Gaussian in both appearance and map-conditioning penalties. Those interacting restrictions rewarded staying near an already developed solution. A blue-only 5% acceptance gate did not answer whether the entire geometry could improve.

This wave removes baseline-relative metric, path and dark-envelope penalties, removes blue weighting, and has no coefficient tether. There is only a weak frequency-decay regularizer and an absolute map-conditioning-tail penalty. Source profiles contribute equally (0.5 each). Black, white, exchange and reach path families contribute equally. Forty-eight evenly spaced training hues have equal weights, with a mean/RMS objective discouraging sacrificing whole hue sheets for average gains. Equilateral sheet bending supplements path-step uniformity; it cannot replace that criterion.

## Finite candidates

- `metric-global`: Beta1 start, 8 coupling layers and 8 Fourier harmonics, path 0.075, sheet 0.02, corner-retreat 0.5.
- `uniform-global`: Beta1 start, same capacity, path 0.55, sheet 0.15, corner-retreat 0.5.
- `fresh-global`: near-identity random shared start (seed 260919), same capacity, path 0.35, sheet 0.10, corner-retreat 0.5. This tests a different basin rather than a small continuation.

All trials also include weighted COMBVD squared STRESS plus 0.2 times unweighted squared STRESS. The grayscale shift is exactly frozen at 0.02686567756674324. Every layer's Level change vanishes on the neutral edge; dark correction vanishes there too. Hue is an identity map. The bijective coupling construction and dark cap below one preserve the closed triangle, although sampled runtime checks remain necessary for numerical behavior.

## Measurement contract

The fitting regularizer uses a bicubic surrogate of source XYZ followed by frozen HelmLab 1.0.0 GenSpace. This is synthetic geometry, not new human evidence. Actual JavaScript inverse XYZ evaluation is authoritative for the reported geometry. `audit.mjs` reports native retained 3331-pair, full 3813-pair, and mapped native all-input 3813-pair COMBVD separately. These are training data, not held-out evidence. No new ColorBench run is claimed.

The audit's primary global panel is 72 offset regular hues (1, 6, ..., 356 degrees), 257 points per path, 20 paths per hue, and 121 nine-point sheet stencils. It preserves the inherited critical-angle and control panels for transparency, but they are not fit weights or selection gates. Every candidate is retained and compared without a blue acceptance threshold. Research results do not overwrite frozen Beta1.

## Reproduction

Install NumPy and PyTorch 2.10.0+cpu in a scratch environment. Generate the source grid outside the repository:

```sh
HUES=48 GRID=193 GRID_ROOT=/absolute/scratch/grid node v2/research/global-tonal/cache-grid.mjs
python v2/research/global-tonal/fit.py --name metric-global --gridroot /absolute/scratch/grid --steps 240 --visual .075 --sheet .02 --corner .5
python v2/research/global-tonal/fit.py --name uniform-global --gridroot /absolute/scratch/grid --steps 240 --visual .55 --sheet .15 --corner .5
python v2/research/global-tonal/fit.py --name fresh-global --gridroot /absolute/scratch/grid --steps 320 --start fresh --visual .35 --sheet .10 --corner .5
```

The fit refuses to overwrite trials. Records contain initialization, source hashes, grid identities, settings, seed, dependency versions and best-evaluation identity. JSONL traces contain every objective closure, including rejected line-search evaluations. The final selected record is the best encountered objective, not necessarily the last closure. Generated grid binaries are reproducible scratch caches and are not published.

## Adaptive fourth candidate: raw sheet tails

The actual JavaScript native audit found that `uniform-global` improved all four mean path CVs and mean sheet bending, but raised worst-hue sheet bending from 1.296 to 2.655. That measured regression justified one bounded follow-up, `uniform-tail-global`; it is not an unbounded parameter sweep.

`fit-tail.py` starts from the completed uniform candidate and uses raw sheet bending mean plus RMS, both within each hue and across the equal-weight hue panel. Its 121 stencils match the historical audit stencil locations, replacing the initial fitter's extra 0.02-Level stencils. It retains the all-hue path objective and balanced native/full observer terms, with no blue weighting or baseline-relative guard. The source maps and exact neutral shift remain unchanged. The first three code/record identities stay intact: `fit.py` is preserved, and this adaptation has its own script and unique trial ID.

```sh
PYTHONDONTWRITEBYTECODE=1 python v2/research/global-tonal/fit-tail.py --name uniform-tail-global --gridroot /absolute/scratch/grid --steps 240 --start uniform --visual .35 --sheet .04 --corner .5
```

The raw-tail candidate is evaluated on exactly the same 72 offset hue panel and separate observer populations. No fifth trial is planned in this wave.

Because the tail refinement changes the sheet fitting stencil from 125 to the historical 121, `edge-audit.mjs` separately measures the four additional Level=0.02 stencils in actual JavaScript for every candidate and both modes. This near-black panel stays separate from the historical score, exposing any regression at the removed stencils. It adds no fitting round.

Large completed audits, parity fixtures and traces are published as deterministic gzip (`mtime=0`). `results/compressed-payloads.json` gives hashes of both the stored gzip bytes and decompressed payloads. `compare.mjs` reads these compressed audits. `verify-records.mjs` cross-checks record/source/trace identities and runtime receipts. `results/runtime-parity-final-receipt.json` records four-model Python/runtime parity; independent review remains separate.

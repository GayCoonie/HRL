# Execution and lineage

The pre-fit plan was committed at 227c092ee2f63d69d7d2f2ef48b5ca732e36a9b3, before fitting. The starting checkpoint is 0.11 Gen tonal balanced, SHA256 109555996bc49629f35397c9bdbc1c8edac8f4ce753fb86caf8ce885e43892f8. The earlier metric checkpoint is not a seed.

## Actual completed trials

1. `fair-a`: parent -> five layers, coarse 24-hue sampling, strong whole-sheet weight 0.08. 664 objective evaluations. Native/full weighted COMBVD 30.8948969610 / 32.0934014391. Cleaner sheet bending but unacceptable metric cost; not selected.
2. `fair-b`: parent -> six layers, coarse 24-hue sampling, sheet weight 0.004. 653 evaluations. Scores 29.4819530430 / 29.6417797931. Useful lighter-shaping seed, with a small native regression; not selected directly.
3. `fair-d`: fair-b -> six layers, 48 training hues, sheet weight 0.001 and stronger blue weight 2. 1,013 evaluations. Scores 29.1302679890 / 28.9082172170. Selected as the lighter-regularized alternate (`gentle`).
4. `fair-c`: fair-a -> six layers, newly rebuilt 96-hue source grid, sheet weight 0.006, blue weight 2 and a soft per-gamut parent-COMBVD ceiling. 804 evaluations. Scores 29.2347539627 / 30.1071439071. Selected as refined balanced.

All 3,134 original objective-evaluation entries are retained in the supplied review ZIP, alongside final trial arrays, versioned source and console logs. The registry stores their exact hashes and line counts. These are actual logs, not reconstructed accounts of earlier interrupted work. Fitting-only source grids can be regenerated from the frozen source model and are omitted from the runtime/review package because of their size.

## Diagnosis and selection

The parent showed a pale diagonal/near-neutral band in blue around 263-269 degrees, plus a vivid-side ridge around 273-277 degrees. Both selected continuations soften the former; the latter remains visible. This was checked on eight neighboring hues rather than only the round-number 270-degree sheet. No claim of universal blue repair follows from the selected previews.

Coarse training sampled narrow blue behavior incompletely. Moving to 48 and 96 hues exposed larger local stencil penalties. Those coarse/fine surrogate loss values cannot be compared as though their sample support were identical. The final direct-inverse report reruns the parent and both continuations on one common sample set and distinguishes path variation from whole-sheet bending.

Selection used COMBVD (the training dataset), synthetic direct-runtime diagnostics, and native visual review. Records were frozen before the new scored ColorBench run. The selection receipt timestamps this boundary. No candidate was subsequently optimized against newly revealed threshold, tolerance, OSA or hue scores. Prior project exposure to those datasets remains disclosed.

## Numerical and publication gates

The local runtime runs exact model checks, Python/JavaScript coordinate parity and inverse-gradient checks, strict/clipped scored ColorBench, dense offset-hue paths, whole-sheet stencils, and exact previews. The source-grid surrogate is not used for the reported final diagnostics.

The local Chromium environment blocked localhost via administrator network policy before the app was reached. That block was not bypassed and does not count as a local browser pass. The normal authorized GitHub Actions runner performs the served browser tests and public Pages checks. Those have separate machine-readable receipts and must not be claimed successful until their outputs confirm them.

The publication is additive: parent models, old APIs and old comparison pages stay available. A stale Oklab caption on the 0.11 comparison is corrected to GenSpace; this is a documentation correction only, with no change to its coefficients or results. The new page includes per-hue evidence and buttons for the parent's highest-error native hues so local defects are not concealed by a global average.

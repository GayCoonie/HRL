# Conditional Reach/Level v3: closed exploratory fits

These records test whether a separately fitted, Level-conditional purity curve
and purity-conditional nonblack ruler can help where Beta 1 and the frozen
joint fit trade quality across sheets. The model has a positive Jacobian,
exact shared gray/black/white/vivid anchors and an analytic inverse. Those
topological facts alone do **not** guarantee even perceptual progression.
None of the records here qualifies to replace Beta 1.

## Direct JS COMBVD results

Weighted STRESS, lower is better. Every row uses the ordinary runtime,
mapped import, actual bicone distance, D65 relative XYZ, pinned COMBVD
inputs and six family labels. Native retained contains 3,331 originally
supported pairs; native mapped all contains 3,813 pairs including 482
remapped pairs; full retained contains all 3,813 with no mapped pairs.
The complete receipts also include unweighted scores, each family, all
mapping event counts and hashes.

| Model | Native retained | Native mapped all | Full retained |
| --- | ---: | ---: | ---: |
| Beta 1 | 29.107048 | 34.489196 | 29.948555 |
| Frozen joint | 26.795161 | 33.358237 | 26.902322 |
| Conditional zero-bank seed | 43.467344 | 44.567770 | 45.507142 |
| Conditional joint w7 holdout v0 | 37.307936 | 41.179734 | 32.610459 |
| Conditional joint guarded v0 | 37.868645 | 40.537667 | 34.809360 |

Direct receipts: [seed](results/seed-combvd.json),
[joint with w7 holdout](results/joint-w7holdout-combvd.json), and
[guarded joint](results/joint-guarded-combvd.json). All include the
same separately evaluated Beta 1 and frozen joint references. The evaluator
was updated from its first receipts to the full source/data closure in
benchmark code commit `eb6c8fd7b7ca536f83141680023aa1425eb78b28`;
the three direct receipts linked here were rerun with that adapter and retain
the same scores. Its separate [guarded ColorBench report](../fresh-field/results/CONDITIONAL_V3_COLORBENCH.md)
records the 42 original judge cells and full manifest. For this factory,
the transitive closure contains 22 imported JS modules and ten inherited JSON
resources, in addition to the explicit record. The entry SHA256 is
`c6d4da23756a1a7dda132869b74750ec59ae27bf912e4b799ee51f415cfe496f`,
and model SHA256 is
`2e934f5b31f5f86cdb12f0f32d0987fa6fb4a593f6a4390fd3366384c73fd585`.
The receipts' candidate paths reflect the Site checkout used to run them;
the hashes identify portable bytes. The evaluator checks the candidate entry,
transitive source modules, inherited runtime resources and explicit record
before and after evaluation; it also pins benchmark inputs.

With the pinned benchmark adapter installed, repeat any scored bank from the
repository root, changing the record path and candidate name as needed:

```sh
node v2/research/fresh-field/benchmark.mjs \
  --models beta1,joint,candidate \
  --candidate-module ./v2/research/conditional-field/index.mjs \
  --candidate-export createConditionalFieldHRL \
  --candidate-record ./v2/research/conditional-field/results/conditional-joint-guarded-v0.json \
  --candidate-name conditional-joint-guarded-v0
```

## Frozen records and fit provenance

| Record | SHA256 | Purpose |
| --- | --- | --- |
| [Zero-bank seed](records/seed.json) | `2fae765fa5623df7c8fc88438abe607ff9c770e3a9596e335f25ca25e60872cc` | Independent physical start; no earlier tonal coefficients. |
| [Visual v0](results/conditional-visual-v0.json) | `b854f06d2e8947d51d02be483f86d0c6b10cac292a63d1346e02dd9a1b6b88b8` | 12 visual-only iterations; warm start for both joint fits. |
| [Joint w7 holdout v0](results/conditional-joint-w7holdout-v0.json) | `9a1ca2bfa81fd204993be1ea3eb7f61f31fab3e133fa02fc3ba09c79b6d7eae8` | 80 joint iterations from visual v0, with w7 pair loss excluded. |
| [Joint guarded v0](results/conditional-joint-guarded-v0.json) | `e1ccedbbe177b4cc2325a701e0abada269654754effd1b0cf7cd65f2c11476ff` | 150 joint iterations from visual v0, stronger visual loss, same pair split. |

The records retain full optimizer traces, objective summaries, input grid
and transformed pair hashes. Pair loss held out COMBVD multiplicity `w=7`,
which exactly coincides with the WITT family here: 416 native and 418 full
pairs. Training counts are 2,915 native and 3,395 full. On the excluded
WITT subset the first joint bank scores 43.528 native / 30.045 full;
the guarded bank scores 41.011 / 33.889. Those scores are **diagnostic
development checks**, not independent observer confirmation: candidates
were inspected and adjusted after this split was known, and other COMBVD
families directly enter optimization.

The current fitter is [fit.py](../conditional-fit/fit.py) and
[core.py](../conditional-fit/core.py), with its own
[record seed](../conditional-fit/records/seed.json). Its SHAs are
`48ebc82efeebc858eae89831c61004fd14fa4c6c5ff89445b263d1b18deadee1`,
`80c37f740c61d4e18aa643382ad0b014d53e6e37da9922fde97845dec7e2ee14`,
and `5568f7f5a1dea976ed098d2caa381f6a0d4d01b75b1cdac1707de9e40a80465d`.
The first joint and warm-start visual records embed earlier fitter hashes.
Exact historical bytes are preserved in
[`history/fit-first-joint.py`](../conditional-fit/history/fit-first-joint.py),
[`history/fit-visual.py`](../conditional-fit/history/fit-visual.py), and
[`history/core-visual.py`](../conditional-fit/history/core-visual.py), with
SHAs `d3e2e4a81bf8ac28549fdfc6b8bdb44d89931b1a0089a062c551ea38e7fba4b1`,
`c83b5364fc6942e6ead6661324e5c6dbc081ea8c7e39413786abb2c39fb33db1`,
and `360de9c3e69e9f70564a3d80c967026546259c4f39a18e5e694cedb82b66e07d`.
Their names preserve the original bytes and hashes; to replay a historical
fit in a disposable checkout, copy its `fit-*.py` to `conditional-fit/fit.py`,
and for the visual fit also copy `core-visual.py` to `conditional-fit/core.py`.
Then supply the record's `--start-record`, its recorded optimizer flags,
and an explicit `--grid-root` matching the saved input manifest. The
guarded fit uses the current fitter/core/seed unchanged. Platform and
dependency differences can still alter optimizer trajectories; the frozen
record bytes and direct JS scoring are the primary reproducible evidence.

The physical source was prepared from `getBoundarySource(g).base.toXYZ`
(full also routes through `source.fromLegacyXYZ`) and GenSpace readout,
with pairs mapped into that base chart. The [input manifest](results/base-input-manifest.json)
has SHA256 `e4b23000726fa34bdd5bf0a4a3c5e3444347cf5be689b0c38c5c02eab105e1a3`;
[native](results/base-grid-srgb.json) and
[full](results/base-grid-full.json) metadata carry binary grid hashes.
The 14 MB source grids and pair files can be regenerated with the fitter's
`--prepare --grid-root <directory>`; compare binary and pair hashes against
the frozen input manifest. The generated manifest's `generatingCodeSHA256`
reflects whichever fitter prepared it; retain the saved manifest when
reproducing these records' exact source identity.
Fitted visual proxies interpolate that grid, while the table above uses
the real JS runtime.

## Visual and monotonicity failures

The source-grid proxy's white-edge speed coefficient of variation (lower
means more even) goes from `.431/.498` native/full in the first joint bank
to `.222/.233` in the guarded bank. The guarded proxy still sees a maximum
fixed-Reach GenSpace J retreat of `.06467` in full; the first bank's maximum
was `.16448`. This proxy is sampled at chosen hues and uses interpolation;
it is a candidate filter, not a visual verdict.

A separate direct-runtime [audit program](../conditional-fit/audit-fixed-reach.mjs)
(SHA256 `381f8d9ae7f73c7c10a34c197aaed069ae60eb77870b2b6c609585eb6229eac0`)
checked each closed bank on 504 paths per gamut on each of two 72-hue grids,
one shifted by 2.5 degrees. Both receipts bind the exact entry and record
hashes and sample 65 points per path:

| Bank / gamut | Worst regular J step drop | Worst shifted J step drop | Regular / shifted decreasing steps |
| --- | ---: | ---: | ---: |
| [Joint w7 / native](results/audit-joint-w7holdout-v0.json) | .00388 | .00387 | 45 / 44 |
| Joint w7 / full | .08496 | .10152 | 114 / 77 |
| [Guarded / native](results/audit-joint-guarded-v0.json) | .00209 | .00172 | 9 / 9 |
| Guarded / full | .03308 | .06114 | 127 / 76 |

The joint w7 full shifted failure peaks at `H=287.5,R=.05,L=.05→.06484375`;
guarded full also fails on that segment, despite a smaller `.06114` J drop.
Physical Y still increases along that full path: a positive chart Jacobian
cannot prevent apparent GenSpace J retreat. Guarded native additionally
has small physical Y retreats along some whiteward paths.
The guarded bank completed the pinned 42-cell ColorBench board in both
gamuts; [judge-by-judge results](../fresh-field/results/CONDITIONAL_V3_COLORBENCH.md)
do not offset its COMBVD and WITT regressions. A board for the first joint
bank and direct sheet review of both v3 records remain pending.

## Current decision

Both fitted v3 banks are strictly worse than Beta 1 and frozen joint
on every full-population COMBVD metric, and the guarded bank still shows
visible-path reversal risk. Keep these records as capacity and failure
evidence. Next fit work should constrain off-grid fixed-Reach J progression,
inspect yellow and blue plus the worst failed sheets, and evaluate any next
closed candidate against the same pinned ColorBench and visual gates before
discussing promotion.

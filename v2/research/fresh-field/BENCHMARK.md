# Fresh-field benchmark baseline and candidate adapters

These tools evaluate the actual HRL JavaScript runtime. COMBVD was exposed to,
and fitted by, earlier development; its scores are **in-sample**. The historical
ColorBench datasets were also seen during earlier HRL work. Their scores can be
made prospective for a *new* fit by freezing the new model and evaluation rules
first, but are not pristine external validation.

## Exact populations

`benchmark.mjs` reads the pinned 3,813 prepared D65 XYZ pairs, observer
differences and traditional per-family weights. It verifies the source NPZ,
the exact 3,331-index native mask, the independently saved row labels, and all
six family sizes before invoking a candidate. Every gamut reports weighted and
unweighted STRESS, plus both values for all six families:

| Population | Pairs | Mapping |
| --- | ---: | --- |
| Native sRGB retained | 3,331 | No pair mapped |
| Native sRGB mapped all | 3,813 | 482 pairs mapped under frozen import |
| Full retained | 3,813 | No pair mapped |

The population-specific best-fit scale is used in each STRESS calculation. A
subset's STRESS is calculated from its own distances and observer differences;
it is not a contribution to pooled STRESS. `mappedPairs`, `mappedEndpoints`,
and mapping event counts are recorded separately.

From repository root:

```sh
node --test v2/research/fresh-field/benchmark.test.mjs
node v2/research/fresh-field/benchmark.mjs --models beta1,joint > /tmp/hrl-combvd-baselines.json
node v2/research/fresh-field/benchmark.mjs --models beta1,joint,candidate \
  --candidate-module ./v2/research/fresh-field/index.mjs \
  --candidate-export createFreshFieldHRL \
  --candidate-record ./v2/research/fresh-field/results/frozen-candidate.json \
  --candidate-name candidate-name > /tmp/hrl-combvd-candidate.json
```

The candidate factory is called as `factory({gamut,referenceWhiteNits:300,
record})`; it must return a model with `importXYZ()` and `distance()` methods.
Candidate runs **require** `--candidate-record`: no implicit default seed is
accepted. The entry must directly import sibling `./model.mjs`. Both adapters
use Node's parser to hash a deterministic, recursively resolved local JS
static-import/export dependency manifest, plus the explicit record, and reject
changes during a run. The board checks the manifest at every process startup
and after every gamut. For the inherited boundary-tonal model family, ten
specific JSON resources loaded by its factory (including the spectral boundary,
metric checkpoint, and native/full atlases) are also hashed and checked.
External nonstandard packages and non-JS local imports fail closed; Node
built-ins are pinned by the recorded Node version. Dynamic imports outside
these explicit resources and the static closure remain a scope limit, so also
freeze the full candidate source revision.
Neither command changes the model or historical results. The baseline run is preserved
at [results/combvd-beta1-joint.json](results/combvd-beta1-joint.json).

## Original ColorBench scored board

The original 5 generation and 11 geometric judge functions, original
`_space_forward`, 4 COMBVD family STRESS columns and MacAdam 1974 supply the 21
scored columns. `benchmark.py` checks the upstream Git commit IDs, re-extracts
the original COMBVD workbook, verifies every prepared input against the frozen
source, and refuses an output path inside `v2/research`.

Pinned upstream Git checkouts: ColorBench
`12b2de215cc5020682e3d245a8c78bce5f0ebbc9`; dataset pool
`8641f4e8ebd9d85a34dc0fedc116fa0e58493190`. With NumPy 2.3.5,
SciPy 1.17.0 and `colour-science==0.4.7` available:

```sh
python3 -u v2/research/fresh-field/benchmark.py \
  --colorbench /path/to/colorbench \
  --pool /path/to/color-perception-datasets/datasets \
  --models beta1,joint \
  --output /tmp/hrl-fresh-colorbench-board.json
```

Add `candidate` to `--models` and the same three mandatory candidate arguments as the
JavaScript evaluator to run a frozen candidate. `benchmark.py` writes one new
JSON file after each complete model/gamut and never overwrites an existing
destination. PyTorch is optional for this NumPy-forward HRL adapter: the
original helper tries PyTorch, then its original NumPy fallback. Do not modify
the helper or tensor units to remove a regression. Keep mapped event counts and
contributing scores visible.

## Reproduced baselines, 23 September 2026

| Population | Beta 1 weighted | Joint weighted | Beta 1 unweighted | Joint unweighted |
| --- | ---: | ---: | ---: | ---: |
| Native retained | 29.107048 | 26.795161 | 30.712588 | 28.474658 |
| Native mapped all | 34.489196 | 33.358237 | 38.126339 | 36.431192 |
| Full retained | 29.948555 | 26.902322 | 32.127880 | 28.783792 |

The joint fit improves pooled COMBVD but worsens **full BFD-P( C )** from
47.612708 to 50.001910. Among the 21 other scored ColorBench columns, joint
improves 7 and worsens 14 in native sRGB; in full, it improves 13 and worsens
8. Native Hung–Berns changes 3.731617 → 4.743006, Ebner–Fairchild 2.242649
→ 2.786859, Regan 0.215239 → 0.279222 and Hong 0.262983 → 0.334746.
Full Munsell improves 3.814761 → 3.621149 and Alder 0.327763 → 0.295065,
while Hong worsens 0.300165 → 0.343185. All these columns are lower-is-better.
This is why pooled COMBVD alone is an inadequate release criterion.

All **84 scored cells** (21 × 2 gamuts × 2 baselines) completed, without
forward rejection. Against the previously archived Beta 1 results, the largest
absolute difference is 2.27e-13 in native sRGB and 1.71e-13 in full. Original
forward-helper identity remained unchanged. The [complete board](results/colorbench-beta1-joint.json)
and [execution log](results/colorbench-beta1-joint.log) preserve the individual
scores, import counts, upstream SHA256 identities, runtime versions, and exact
adapter source hashes. HRL source was `3d44152c2276cd05374b393f3b7dbaf48ea757bd`;
the frozen Beta 1 and joint definition SHA256 values are in the COMBVD JSON.

The board is a scored pipeline evaluation, not a claim that all generated probes
are physical. Upstream ellipsoid generation retains its original skips and
negative-XYZ preprocessing. The HRL ordinary bounded import maps such inputs
and records the event; an older strict run with fewer contributing centers is
not comparable with a full-population mapped score.

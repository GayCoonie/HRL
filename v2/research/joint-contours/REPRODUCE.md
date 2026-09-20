# Reproduce the shared interior experiment

Use Node 22 or 24, Python 3.12, NumPy 2.3.5 and CPU PyTorch 2.8.0.
Figures additionally use Matplotlib and Pillow. No GPU is required.
The fit uses float64, one Torch thread, deterministic algorithms, and a fixed
seed. Do not treat iteration budgets as completed iterations: L-BFGS may stop
before its cap and may call the objective more than once per iteration.
Saved records give exact source, code, cache and grid hashes plus best-call state.

## Source grids

From repository root:

```sh
node v2/research/joint-contours/prepare-coarse.mjs srgb
node v2/research/joint-contours/prepare-coarse.mjs full
node v2/research/joint-contours/prepare.mjs srgb
node v2/research/joint-contours/prepare.mjs full
```

Fine preparation uses four workers per realization. The generated `.f64` arrays
are reproducible intermediates excluded from git; the metadata records their
exact hashes. Source geometry is inherited from parent commit
`e7d6f699610141451b40883d7133132266867763`.

## Trial provenance

Each checkpoint's `research.fit` object records the original command arguments.
Paths are relative to `v2/research/joint-contours`. Archived fit scripts preserve
the implementation that produced each research checkpoint:

| Checkpoint | Fitter | Purpose |
|---|---|---|
| joint-beta, joint-global | fit-provisional.py | Initial shared-family starts; sparse visual coverage failed direct audits |
| joint-balanced | fit-balanced.py | Correct angular mean weighting; still sparse and visually rejected |
| joint-dense, fine-start snapshot | fit-dense.py | Dense public hues, integrated ordering and speed regularization |
| joint-fine | fit-lbfgs.py | Fine source grid and stronger ordering/spacing; early solver stop |
| joint-hybrid, joint-spacing | fit-optimizer.py | Initial Adam/hybrid optimizer implementation; final-update limitation documented below |
| Later refinements | fit.py | Corrected final-update assessment; explicit solver and objective weights |

`fine-start.json` is an immutable intermediate copy of joint-dense at call 151;
it is not the final joint-dense checkpoint. Its ID retains the originating name.
`joint.json`, once selected, is a byte-identical alias of its selected checkpoint,
not a refit or an average. Use its SHA256 and direct audit to identify the model.
The expanded `seed.json` contains Beta1 exactly in the new coordinate family.

Examples of the revised fitting commands:

```sh
python3 v2/research/joint-contours/fit-dense.py --name joint-dense --start results/joint-balanced.json --steps 250 --order 30 --grid coarse
python3 v2/research/joint-contours/fit-lbfgs.py --name joint-fine --start results/fine-start.json --steps 350 --order 100 --speed .03
python3 v2/research/joint-contours/fit-optimizer.py --name joint-hybrid --start results/joint-fine.json --steps 450 --order 150 --speed .03 --optimizer hybrid
```

The spacing run uses `fit-optimizer.py --name joint-spacing --start results/spacing-start.json --steps 300 --order 150 --speed .08 --optimizer adam --turn 2000`.

The archived `fit-balanced.py` differs from final `fit.py`: it reads the original
coarse arrays and uses the earlier sparse path objective. Keep each recorded
fitter hash with its corresponding record. Traces are deterministically gzipped
for publication and contain objective calls, not just accepted steps. Replaying
writes new outputs; use a disposable checkout or a new `--name` to preserve the
published records.

## Direct audit and invariants

```sh
node v2/research/joint-contours/parity.mjs seed
python3 v2/research/joint-contours/parity.py seed
node v2/research/joint-contours/parity.mjs joint
python3 v2/research/joint-contours/parity.py joint
node v2/research/joint-contours/audit.mjs beta1 joint
node v2/research/joint-contours/audit.mjs --offgrid beta1 joint
node v2/research/joint-contours/joint-gate.mjs
```

The gate expects separately saved `audit-beta1.json` and `audit-joint.json`, so
run the audit with each name separately when regenerating the gate inputs.
The primary audit matches the preceding comparison's 72 offset hues, seven dark
Levels and 257 near-gray samples. The additional audit changes hue offsets,
Levels and fixed-Reach values. Neither is held-out COMBVD: observer pairs remain
training data, while these extra geometry probes check interpolation/generalization.

```sh
node v2/research/joint-contours/visual.mjs joint
python3 v2/research/joint-contours/plot.py joint /absolute/path/to/figures
```

Full-domain image pixels are display-clipped to sRGB. All curves and diagnostics
use the original XYZ. Inspect images and multiple interactive paths in
`v2/joint.html` before inferring visual preference from scalar summaries.

The initial Adam/hybrid implementation is archived as `fit-optimizer.py` for
`joint-hybrid` and `joint-spacing`. It assessed each state before updating, so its
last Adam update was not considered for best-state selection. All saved states
and losses are valid; current `fit.py` fixes this by assessing after the loop too.
A mocked optimizer-control regression verifies that `--steps 1` now considers the
updated state. This limitation does not affect L-BFGS-only `joint-dense`.
`spacing-start.json` preserves joint-hybrid's best state at call 201 exactly.

# HRL 0.12: balanced-parent hue-sheet refinement

This is a continuation of **0.11 Gen tonal balanced**, not an initialization from the metric candidate. The parent remains unchanged, alongside both new candidates. No accepted default is replaced.

[Comparison page](../../hue-fair.html) · [Complete scores and diagnostics](results/REPORT.md) · [Pre-fit plan](PLAN.md) · [Evidence and equations](EVIDENCE.md) · [Execution record](EXECUTION.md)

## Meaning and runtime

Reach remains chromaticness: `K=1-L`, `W=L-R`. Level is brilliance/inverse blackness, not relative luminance or a scalar lightness correlate. Black dilution, white dilution, neutral exchange and Reach-at-fixed-Level remain distinct operations. The frozen HelmLab GenSpace 1.0.0 vector supplies the synthetic ruler; no Oklab value enters this continuation loss.

Each candidate uses one coefficient bank across sRGB and full. The only gamut-dependent inputs are inherited boundary geometry and deterministic own-anchor source charts. The hue field, hue ring, neutral progression, vivid endpoints and white handling remain fixed. Adobe RGB (1998) is tested without training. The inherited physical polygon still excludes canonical Display P3 red slightly; no new P3 support is claimed.

```js
import {createHueFairHRL, ADOBE_RGB1998, addBlack, addWhite} from './index.mjs';
const native = await createHueFairHRL({gamut:'srgb', checkpoint:'balanced'});
const full = await createHueFairHRL({gamut:'full', checkpoint:'balanced'});
const third = await createHueFairHRL({gamut:ADOBE_RGB1998, checkpoint:'balanced'});
const q = native.fromRGB([0.3, 0.2, 0.7]);
const darker = native.toXYZ(addBlack(q, 0.2));
const whiter = native.toXYZ(addWhite(q, 0.2));
```

The `gentle` checkpoint means lighter **regularization**, not a guarantee of lighter colours. It is also descended from the balanced parent. Both selected records have six invertible coupling layers: 390 coupling coefficients and seven dark-curve coefficients. No learned gamut identifier or native/full switch enters their normalized transformation.

## Why the objective changed

A mean path score can improve while a few hue sheets retain a bright band, bend or compressed patch. This continuation therefore evaluates mean and RMS per-hue risks, penalizes local vector bending across the triangle, and gives the user-identified blue region extra weight. The blue emphasis is a periodic Gaussian centred at 273 degrees with sigma 20 degrees. This is explicit engineering feedback, not an invented observer dataset or prescribed unique-blue angle.

The new whole-sheet penalty uses nine-point finite-difference stencils, including near-black and near-neutral interior sites. The derivatives are transformed from public R,L to equilateral coordinates `x=sqrt(3)R/2`, `z=L-R/2`. The squared vector Hessian norm is divided by squared gradient magnitude and scaled by `(1/32)^2`. It therefore does not pretend R,L are orthogonal Cartesian axes. See EVIDENCE.md for the chain-rule equations.

The other synthetic terms measure GenSpace step variation, adjacent-step concentration, black/white corner retreats, departures from the parent's dark-edge envelope, and excessive regressions on previously satisfactory hue paths. They do not redefine public tonal shares or impose equal luminance across hues.

COMBVD remains the only human-data training objective, using traditional weighted STRESS squared with equal native/full weights and unchanged pair masks. The synthetic source grid is used only by the differentiable regularizer. Every final path and sheet measurement uses the actual JavaScript inverse. GenSpace's numerical coverage of the full physical solid is not independent evidence of its perceptual validity there.

## Trials and reproducibility

All four completed trial records, their actual objective-evaluation JSONL logs, code-version snapshots and console logs are preserved in the downloadable review archive. The repository retains all four final trial coefficient records and their hashes, and a trace registry. It does not pretend the original JSONL logs are remote files when they are only in the supplied archive.

`fit-v1.py` produced fair-a and fair-b; `fit-v2.py` produced fair-d; the final `fit.py` produced fair-c. The latter added a soft per-gamut COMBVD ceiling near the parent's score. The exact loss and numerical grid differ by trial and remain explicit in every record.

The first two trials used 24 hues from a 48-hue source grid. The continuations increased this to 48 and 96 hues to expose narrow blue-region behavior that coarse sampling missed. This changes the diagnostic scale of some training terms, so cross-trial aggregate losses are not directly comparable. Final comparisons use the same exact-runtime samples for every candidate.

The source grids can be regenerated from the unchanged model; they are not learned gamut heads. They are large fitting-only artifacts and are not required by the runtime library or included in the review download.

```sh
mkdir -p v2/research/hue-fair-refine/{results,trials}
# Rebuild inherited 48-hue grid, then the denser 96-hue grid.
node v2/research/gen-tonal-fit/cache.mjs
HUES=96 GRID=193 node v2/research/hue-fair-refine/cache.mjs
bash v2/research/hue-fair-refine/reproduce-fit.sh
node v2/research/hue-fair-refine/verify.mjs
python v2/research/hue-fair-refine/parity.py
python v2/research/hue-fair-refine/prepare-benchmark.py
python v2/research/hue-fair-refine/benchmark.py --colorbench /path/to/colorbench --pool /path/to/color-perception-datasets/datasets
```

Reproduction writes new trial outputs, not replacements for the frozen selected records. Pinned versions: Node 22.16.0; numpy 2.3.5; torch 2.10.0 CPU; scipy 1.17.0; colour-science 0.4.7. ColorBench commit `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`, pool `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`.

Only the five scored generation and sixteen scored measurement columns are rerun. The judges themselves remain unchanged. Strict, clipped, incomplete-support and common/full-only cases are separated. Prior development exposed these evaluation datasets; the continuation does not claim pristine independent validation.

## Verification boundaries

A positive Jacobian, small inverse error, smooth sheet, and good observer-difference score answer different questions. The numerical tests report them separately. No screenshot is used as proof of a topological fold, and no average erases a per-hue regression.

The local browser was blocked by its environment's administrator network policy before reaching the app. That block was not bypassed, and is not recorded as a successful local browser check. Served-app and public Pages verification are delegated to the normal authorized GitHub Actions runner. Public success is claimed only with a returned receipt.

The full realization remains the inherited physical polygon for `0<=relative Y<=1`; default D65 reference luminance is 300 nits. Relative 100/300-nit invariance and explicit source-white handling are inherited. Display clipping affects full-gamut previews only and is labelled, never used to compute the reported diagnostics.

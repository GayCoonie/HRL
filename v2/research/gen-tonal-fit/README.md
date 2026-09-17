# HRL 0.11: shared GenSpace tonal fits

Two newly fitted checkpoints extend the shared 0.10 work. They are not the unchanged models with a new diagnostic label. The old shared and separate fits remain available, and no accepted default is replaced.

[Live four-way comparison](../../gen-tonal.html) · [Scored report](results/REPORT.md) · [Frozen selection](results/SELECTION.json) · [Numerical checks](results/verification.json) · [Pre-fit plan](PLAN.md)

## Semantics and architecture

Reach is chromaticness, blackness K=1-L, whiteness W=L-R. Level is brilliance/inverse blackness, not Y or GenSpace lightness. The internal U=R/L ratio is not a redefinition of Reach.

Whole-colour black dilution scales R and L by (1-a). White dilution scales R by (1-a) and maps L to a+(1-a)L. Fixed-Reach Level exchanges black and white shares without diluting chromaticness. The new fit constrains all of these paths, plus Reach at fixed Level.

Each selected candidate contains one bank of five invertible coupling layers (325 Fourier coefficients) and seven coefficients for the bounded dark curve. The same bank applies to sRGB, full and any supported deterministic gamut chart. There is no learned gamut ID, gamut-specific head, or switch between native/full coefficients.

Source atlases, the inherited hue field and ring, neutral progression, vivid endpoints, physical boundary and white handling are fixed. Adobe RGB (1998) is tested as an untrained third realization. The existing physical polygon still slightly excludes canonical P3 red; this pass does not add P3 support or disguise that restriction.

```js
import {createGenTonalHRL, ADOBE_RGB1998, addBlack, addWhite} from './index.mjs';
const native = await createGenTonalHRL({gamut:'srgb', checkpoint:'balanced'});
const full = await createGenTonalHRL({gamut:'full', checkpoint:'balanced'});
const third = await createGenTonalHRL({gamut:ADOBE_RGB1998, checkpoint:'balanced'});
const q = native.fromRGB([0.3,0.2,0.7]);
const darker = native.toXYZ(addBlack(q,0.2));
const whiter = native.toXYZ(addWhite(q,0.2));
```

Relative XYZ uses D65, with referenceWhiteNits=300 by default. Relative coordinates remain invariant when only the 100/300-nit bookkeeping scale changes. The full realization is still the inherited polygonized physical solid for 0<=relative Y<=1, not unlimited absolute luminance.

## What actually changed in fitting

The new human-data objective uses the same COMBVD pairs: 3,331 supported native pairs and all 3,813 full pairs, with equal per-gamut objective weights and the regular-bicone metric. Traditional weighted STRESS squared is fitted.

All new path regularizers use the **complete three-dimensional frozen HelmLab 1.0.0 GenSpace vector**, with the existing neutral-correction-off convention. Neither Oklab nor the old scalar t^1.08 lightness target enters this loss. Initial coefficients and source geometry are inherited, so the new fit is not portrayed as having no prior Oklab influence in its history.

Four families are sampled: black-origin dilution rays, white-directed dilution rays, neutral exchange, and fixed-Level Reach. Relative step variation, adjacent-step concentration, vector curvature, and retreat from the relevant black/white corner enter the objective. Scalar lightness is not required to rise toward white. A broad soft dark-edge envelope derived from the previously reviewed 0.10 candidates preserves approximate dark-side behavior. That envelope is an engineering safeguard, not a paper-derived appearance rating.

The differentiable source grid contains exact-runtime GenSpace values at 48 hues and 193-by-193 cosine-spaced U/L positions. Bilinear sampling is used only during fitting. All published final path diagnostics use the actual JavaScript inverse with 72 offset hues and 257 points per path. The grid is not needed to run the library.

## Evidence, not relabeling

ZCAM (Safdar, Hardeberg and Luo, 2021, DOI 10.1364/OE.413659), Section 2, motivates joint lightness/chroma-dependent blackness and whiteness. Its actual fitted Equations 17-19 are not substituted for HRL shares. No ZCAM predictions are labeled as new observer measurements.

Briggs (2023), The elements of colour II, and Nayatani and Sakai (2011, DOI 10.1002/col.20596) inform the distinction between tonal attributes and ordinary lightness, with boundary/hue dependence. The operational dilution laws, their invariants, the local equilateral metric, and the limits of these inferences are preserved in [the preceding definitions](../tonal-semantics/DEFINITIONS.md). These sources do not uniquely prescribe this fit's coefficients or loss weights.

The only new human-data fitting is COMBVD. GenSpace regularizers are synthetic/model-based. Earlier project development exposed other evaluation datasets; the scored rerun is not pristine independent validation. User preferences for particular hues are not invented from the model's rankings.

## Execution and trial preservation

PLAN.md was committed in f76de9c before optimization. Five actual trials completed: g1-balanced, g1-metric, g2-balanced, g2-metric and g2-smooth. The selected two are the five-layer g2-balanced and g2-metric. The stronger four-layer g2-smooth was retained as an exploratory trial but not selected because it gives up the full COMBVD gains.

The registry stores the exact hashes, recipes and objective-evaluation counts for all trial records and JSONL traces. Original per-evaluation logs and all five original coefficient arrays are preserved in the downloadable chat review archive under trials/. The public runtime carries the two frozen selected records. No missing pre-interruption optimization log is reconstructed or presented as original evidence.

Two initial setup attempts stopped before fitting because the fixed neutral shift was passed as a Python float to a tensor exponential. The shift was converted to a float64 tensor; both setup-error logs are retained in the review archive. The completed optimizer uses one torch thread, deterministic algorithms, seed 170917 and LBFGS with safeguarded implicit differentiation of the existing dark curve. Python/JS parity and numerical gradient checks are included.

## Reproduce

Runtime: Node 22.16.0. Fitting: Python, numpy 2.3.5, torch 2.10.0 CPU. Benchmark: numpy 2.3.5, scipy 1.17.0, colour-science 0.4.7. Pinned ColorBench 12b2de215cc5020682e3d245a8c78bce5f0ebbc9 and pool 8641f4e8ebd9d85a34dc0fedc116fa0e58493190. Browser verification uses Playwright 1.57.0.

```sh
mkdir -p v2/research/gen-tonal-fit/{results,trials}
node v2/research/gen-tonal-fit/cache.mjs
bash v2/research/gen-tonal-fit/reproduce-fit.sh
node v2/research/gen-tonal-fit/verify.mjs
python v2/research/gen-tonal-fit/parity.py
python v2/research/gen-tonal-fit/prepare-benchmark.py
python v2/research/gen-tonal-fit/benchmark.py --colorbench /path/to/colorbench --pool /path/to/color-perception-datasets/datasets
HUES=72 SAMPLES=257 node v2/research/gen-tonal-fit/evaluate.mjs old-balanced old-metric balanced metric
```

Reproduction writes new trial outputs, not replacements for the selected frozen records. Runtime scores are checked against the preserved training estimates. Small optimizer differences across hardware/software do not invalidate a matching runtime implementation and should be reported, not hidden.

Only the five scored generation and sixteen scored measurement columns are run. Input clipping/rejection and high-magnitude hue continuation remain explicit, with full clipped results separated from strict results. No artificial overall rank is computed from different support masks.

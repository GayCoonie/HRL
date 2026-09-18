# HRL 0.12: balanced-parent hue-sheet refinement

This continuation starts from the actual 0.11 Gen tonal balanced checkpoint. It adds per-hue mean/RMS risk, an equilateral whole-sheet bending penalty and additional blue-region attention, using the frozen HelmLab GenSpace ruler. One six-layer coefficient bank per candidate applies across gamuts. R is chromaticness, K=1-L and W=L-R; Level is not scalar lightness.

The recovered original fitter is preserved as fit-v1.py and fit-v2.py. New fits resume-a and resume-b use fit.py with an explicit soft per-gamut COMBVD ceiling. All new trial coefficients and JSONL objective logs are committed. They are not reconstructions of lost fair-c/fair-d arrays. RECOVERY.md distinguishes recovered sources from new experiments.

[Live comparison](../../hue-fair.html) | [Actual results](results/REPORT.md) | [Preserved plan](PLAN.md) | [Evidence and equations](EVIDENCE.md) | [Recovery](RECOVERY.md)

```js
import {createHueFairHRL, ADOBE_RGB1998} from './index.mjs';
const native = await createHueFairHRL({gamut:'srgb',checkpoint:'balanced'});
const full = await createHueFairHRL({gamut:'full',checkpoint:'balanced'});
const third = await createHueFairHRL({gamut:ADOBE_RGB1998,checkpoint:'balanced'});
```

The gentle candidate has lighter regularization, not necessarily lighter colours. Existing entry points and model coefficients remain unchanged. Actual inverse tests, scored-only ColorBench and UI checks are separate receipts. GenSpace and whole-sheet derivatives are synthetic diagnostics, not new observer ratings. User feedback motivates the blue weight; no per-hue user-preference table is invented. The inherited source-field and physical-polygon limitations remain.

The completion workflow contains exact commands and pinned versions. The large source grids can be rebuilt from cache.mjs and are not required by the runtime. Use the frozen model records for reproducing published numbers; rerunning optimization creates new log timestamps and may vary slightly across hardware.

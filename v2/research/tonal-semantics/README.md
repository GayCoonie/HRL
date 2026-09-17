# GenSpace and black/white operations

[Live lab](https://gaycoonie.github.io/HRL/v2/research/tonal-semantics/) compares the unchanged shared 0.10 balanced and metric candidates using a GenSpace diagnostic ruler and explicit tonal operations.

This is an executed research and semantics pass, not a new HRL conversion fit. The previous shared calibrations and ColorBench results remain intact. The new diagnostics do not use Oklab. Existing coefficients trained with the earlier regularizer are not relabeled as GenSpace-trained.

- [Definitions and primary-source roles](DEFINITIONS.md)
- [Plan](PLAN.md) and [execution/recovery record](EXECUTION.md)
- [Measured report](results/REPORT.md), [raw audit](results/genspace-audit.json), [per-hue CSV](results/per-hue.csv)
- [Operation tests](results/operation-tests.json), [runner browser receipt](results/browser-runner/verification.json), and [public browser receipt](results/browser-live/verification.json)

The native unit shares remain `R=chromaticness`, `W=L-R`, `K=1-L`. The explicit appearance-share operators are

```js
import {addBlack, addWhite, exchangeNeutral} from './operations.mjs';
const q = {H:270, R:0.65, L:0.65};
addBlack(q, 0.5); // {H:270, R:0.325, L:0.325}
addWhite(q, 0.5); // {H:270, R:0.325, L:0.825}
exchangeNeutral(q, 0.1); // {H:270, R:0.65, L:0.75}
```

The amount is a replacement share under the proposed appearance operation, not a paint-mass or luminance fraction. The algebra is exact; its mapping to observed blackness/whiteness is a calibration problem, not settled by those identities alone. `zcamAttributes` implements the paper's fitted Equations 17-19 on ZCAM Jz/Cz inputs; it is not a complete XYZ-to-ZCAM model and does not reinterpret GenSpace inputs as ZCAM units.

The GenSpace audit uses 72 hues, five start ratios, 129 points, two operation families, two candidates and two gamuts. The actual XYZ is measured; display clipping occurs only in previews. Each candidate keeps the same learned bank across gamuts.

```sh
mkdir -p v2/research/tonal-semantics/results
node v2/research/tonal-semantics/test.mjs
node v2/research/tonal-semantics/audit.mjs
python v2/research/tonal-semantics/report.py
python -m http.server 8765
```

Open `/v2/research/tonal-semantics/` on the local server. The page can record informal per-hue preferences in localStorage and export them as JSON. There is no server-side collection. The saved record uses the completed rendered state and retains model hashes when loaded. Display calibration is unknown and no population-level observer claim is made.

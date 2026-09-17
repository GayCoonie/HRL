## Sampling and dark-edge interpretation

The diagnostic samples 72 hues at 5-degree intervals with a 2.5-degree offset. **48 are absent from the 48-hue training grid; 24 coincide with it.** The entire set is therefore not a held-out hue set. All path families also use finer parameter sampling and the actual inverse instead of the fit lookup.

These fits redistribute the dark-side progression; they do not force every low-Level colour to get darker. In particular, the mean R=L=.25 output is lighter by the same GenSpace ruler than in 0.10 balanced. This is a real change of the colours, not merely a switch of rulers: both controls and candidates below are rerated identically.

| Gamut | Candidate | Mean Gen lightness / vivid Gen lightness at R=L=.25 | Mean Gen distance from black / vivid distance |
|---|---|---:|---:|
| srgb | old-balanced | 0.090456 | 0.162878 |
| srgb | old-metric | 0.143584 | 0.208764 |
| srgb | balanced | 0.165905 | 0.228624 |
| srgb | metric | 0.168416 | 0.231230 |
| full | old-balanced | 0.088250 | 0.155433 |
| full | old-metric | 0.148674 | 0.205875 |
| full | balanced | 0.170004 | 0.224672 |
| full | metric | 0.172077 | 0.226455 |

Neither diagnostic is the definition of Level. The new balanced and metric versions are closer to each other on this dark-edge progress measure; human preference is still a separate question. Blue and cyan should be inspected against both old controls rather than declared universally repaired.

The balanced candidate has slightly larger fixed-Reach neutral-exchange CV than its same-role predecessor (native and full), despite smaller mean adjacent step jumps. Its full-gamut black-family mean total retreat magnitude also increases slightly even though the number of affected paths decreases. These are counterexamples to a blanket all-metrics-improved claim. The raw per-path and worst-step data remain available.

# HRL tonal semantics: GenSpace audit

## What ran

The same shared 0.10 balanced and metric candidates were rerated using the repository's pinned HelmLab 1.0.0 GenSpace forward transform (neutral correction disabled). This is **not a new colour-space fit**. No Oklab value enters these new diagnostics. Historical coefficients and ColorBench results were not changed or relabeled.

72 hues, five start ratios, 129 samples per path, two families, two candidates, two gamuts: **371,520 evaluated XYZ samples**, including repeated endpoints. All sampled paths had full numerical GenSpace domain support; no display clipping was used in the analysis. This is not proof of perceptual validity throughout the full physical solid.

Black family: black → upper-edge tint, reversing addBlack. White family: black-vivid shade → white, using addWhite. R/L share dilution is the proposed operation contract. Fixed-Reach Level is neutral exchange and is not the same as general white dilution. See [DEFINITIONS.md](../DEFINITIONS.md).

## Full-path step statistics

CV is step-size standard deviation divided by its mean. Step jump is the absolute difference of adjacent step lengths divided by their mean. Two endpoint steps are trimmed at each end for these statistics. Both use full 3D GenSpace distance; lower means more even by this ruler, not more preferred by a human.

| Gamut | Candidate | Black-family CV | White-family CV | Black-family step jump | White-family step jump |
|---|---|---:|---:|---:|---:|
| srgb | balanced | 0.314810 | 0.197691 | 0.030771 | 0.014250 |
| srgb | metric | 0.330290 | 0.299947 | 0.037560 | 0.020103 |
| full | balanced | 0.355887 | 0.331400 | 0.032413 | 0.019155 |
| full | metric | 0.374524 | 0.459923 | 0.038436 | 0.025950 |

## Hue-specific differences

Each hue compares the mean over five start ratios. Counts are out of 72 hues; they do not identify Coonie's preferences. The user's own per-hue choices are separate evidence.

| Gamut | Family | Balanced lower CV | Metric lower CV | Balanced lower step jump | Metric lower step jump |
|---|---|---:|---:|---:|---:|
| srgb | black | 37 | 35 | 51 | 21 |
| srgb | white | 67 | 5 | 62 | 10 |
| full | black | 39 | 33 | 53 | 19 |
| full | white | 71 | 1 | 64 | 8 |

## Direction and endpoint diagnostics

For black-origin paths, a corner retreat is a decrease in 3D GenSpace distance from black as the path leaves black. For white-directed paths, it is an increase in distance to white while adding white. Threshold: 1e-8 GenSpace units per step; all steps, not endpoint-trimmed. These are ruler-dependent trajectory diagnostics, not proofs of a topological fold or a perceptual reversal.

| Gamut | Candidate | Black paths with corner retreat / 360 | White paths with corner retreat / 360 |
|---|---|---:|---:|
| srgb | balanced | 6 | 81 |
| srgb | metric | 46 | 119 |
| full | balanced | 22 | 94 |
| full | metric | 61 | 100 |

This exposes small local departures that are missed by endpoint and round-trip tests. Their perceptual importance is not established simply by counting them. The raw JSON retains the per-path counts and statistics.

### Scalar lightness is not whiteness

The raw audit also records decreases in Gen L, but these are not automatically failures of white addition. On the full vivid boundary, some chromatic endpoints exceed reference white on the Gen L correlate. Moving from them toward white can therefore decrease Gen L without moving away from white in the full 3D ruler.

| Gamut | Vivid endpoints with Gen L above white / 72 | Minimum vivid Gen L | Maximum vivid Gen L |
|---|---:|---:|---:|
| srgb | 0 | 0.369167 | 0.962423 |
| full | 42 | 0.904332 | 1.904737 |

Reference white Gen L is 0.999998985144. These are model outputs, not measurements that those physical colours actually have that perceived lightness. GenSpace is not being presented as a fully validated appearance model of every high-purity colour.

At R=L=.25, mean endpoint-normalized Gen L is srgb/balanced: 0.090894, srgb/metric: 0.144216, full/balanced: 0.089352, full/metric: 0.149466. These are not directly comparable units to the old Oklab-ruler numbers. No colour became darker merely because the ruler changed.

## Algebra and source interpretation

The operator test passed 10,000 seeded random cases for simplex containment, same-endpoint composition, cross-endpoint order, corner-distance contraction and fixed-Reach neutral exchange. Maximum recorded composition error: 2.220446049250313e-16.

ZCAM Equations 17–19 were implemented as Jz/Cz-input attribute functions, not a full XYZ-to-ZCAM replacement. Ideal neutral white gives Kz=20, Wz=100, Vz=42. This is why raw ZCAM correlates must not be inserted as HRL shares. The conceptual two-distance construction has a separate boundary-normalization issue, derived in the definitions record.

## Scope and next experiment

The interactive page makes addBlack, addWhite and neutral exchange visible on both existing candidates and records informal per-hue preferences locally. It does not introduce a new candidate under an old name. The next fit should combine both operation families with GenSpace path diagnostics and separately justified appearance constraints, retaining one common coefficient bank. Simply substituting Gen L into the former arbitrary t^1.08 target would still not define blackness and whiteness.

Only existing transform outputs and algebraic contracts were evaluated. No new observer training, appearance-board score, COMBVD rerun or overall leaderboard rank is claimed. The earlier development-data exposure and inherited physical-boundary limitations remain.

## Reproduction

```sh
node v2/research/tonal-semantics/test.mjs
node v2/research/tonal-semantics/audit.mjs
python v2/research/tonal-semantics/report.py
```

[Raw audit](genspace-audit.json) · [Per-hue CSV](per-hue.csv) · [Operation tests](operation-tests.json) · [Interactive page](../index.html)

Source hashes:

```json
{
  "../../../src/base/appearance-runtime.mjs": "4609ef4aa6bb08357298424ef61c863f66d34f2e622f92cd01fef61395dc74b8",
  "../../../src/base/gen-parameters.mjs": "4827ed16f69196dfb6d7b73c2ce72dd06f48c73a63e55515f1ba7ef4e3053808",
  "../shared-rl/source.mjs": "f3ffcf056869b1941d39294893752d6bd87bb40fe48240899f9fe291fdd170dd",
  "../shared-rl/core.mjs": "293fb0994bd460283ab28467ea5d71b7c350766a8272a78e90349db1d056d1e4",
  "../shared-rl/results/balanced.json": "a5d15ca185b147c7d97ad9db7ca1891cf8dc2adda08b1577073a1fec9ccd7f35",
  "../shared-rl/results/metric.json": "2348ccddb6b2844f2c81e484d15a14a75fb52e64d1824e1740a85cb0d7c2883b"
}
```

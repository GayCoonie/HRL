# Whole-solid shared HRL fit: results — 2026-09-19

The raw-tail candidate substantially improves measured triangle-sheet mean, RMS and worst hue in both modes, with a modest COMBVD accuracy cost. The metric candidate improves all three reported observer pipelines but worsens most geometry. Both remain research options; frozen Beta1 is unchanged.

The first three all-hue trials were followed by one bounded fourth trial after exact runtime evaluation exposed a worse sheet tail. The fourth directly penalized raw bending mean/RMS. There is no blue-specific objective or acceptance gate, coefficient tether, baseline metric guard, good-hue regret or dark-edge envelope. One shared 8-layer/8-harmonic bank drives both modes. The exact neutral shift, vivid hue spacing and pseudo-RGB carrier remain fixed. Retaining inherited source hue sheets and the coupling family is this wave’s experimental choice, not a permanent requirement.

## Main tradeoff

- **Native sRGB:** tail sheet mean improves 25.25%, RMS 21.98%, worst hue 15.30%. Weighted retained STRESS changes 29.107048 → 29.840087.
- **Full:** tail sheet mean improves 27.32%, RMS 30.01%, worst hue 50.52%. Weighted retained STRESS changes 29.948555 → 30.036361.

Six of eight mode-by-family mean path CVs improve. Native black-path CV rises 1.34%; full reach-path CV rises 4.44%. The separate Level=0.02 panel improves in mean/RMS for both modes, while native worst-hue bending rises 12.95%. These are remaining tradeoffs, not a universally better geometry.

## Observer populations

Actual JavaScript COMBVD training-pair STRESS is reported below; lower is better. Native retained 3331, full 3813 and mapped-native all-input 3813 are distinct populations. The mapped native pipeline clips 482 pairs; its score must not be substituted for retained native. No new held-out or ColorBench result is claimed.

| Candidate | Native weighted / unweighted (3331) | Full weighted / unweighted (3813) | Mapped native weighted / unweighted (3813) |
|---|---:|---:|---:|
| beta1 | 29.107048 / 30.712588 | 29.948555 / 32.127880 | 34.489196 / 38.126339 |
| metric-global | 27.482566 / 29.029774 | 28.689473 / 30.370193 | 32.039069 / 35.154557 |
| uniform-global | 29.861631 / 31.341924 | 30.346472 / 32.491848 | 34.882584 / 38.222815 |
| fresh-global | 35.307178 / 34.942724 | 39.208686 / 40.191072 | 38.090650 / 39.414238 |
| uniform-tail-global | 29.840087 / 31.343474 | 30.036361 / 32.066217 | 35.012595 / 38.232954 |

## Whole-triangle geometry

Actual inverse XYZ is evaluated in frozen HelmLab 1.0.0 GenSpace, without display clipping or the fitting grid. These synthetic measures are not new observer evidence. The primary panel uses 72 offset regular hues (1, 6, …, 356°), 257 points per path, 20 paths per hue and 121 nine-point equilateral sheet stencils. Lower is better. Sheet RMS is RMS across each hue’s mean bending, not a robust-log fitted score.

### Native sRGB

| Candidate | Black CV | White CV | Exchange CV | Reach CV | Sheet mean | Sheet RMS | Worst hue |
|---|---:|---:|---:|---:|---:|---:|---:|
| beta1 | 0.222288 | 0.197266 | 0.211318 | 0.325705 | 0.464887 | 0.529599 | 1.295716 |
| metric-global | 0.254728 | 0.216481 | 0.246377 | 0.358461 | 0.532703 | 0.660829 | 2.046750 |
| uniform-global | 0.212707 | 0.181467 | 0.188263 | 0.299543 | 0.448553 | 0.600881 | 2.655116 |
| fresh-global | 0.177768 | 0.172669 | 0.137882 | 0.324000 | 0.266973 | 0.505712 | 3.106033 |
| uniform-tail-global | 0.225267 | 0.186416 | 0.202841 | 0.319932 | 0.347504 | 0.413214 | 1.097484 |
### Full

| Candidate | Black CV | White CV | Exchange CV | Reach CV | Sheet mean | Sheet RMS | Worst hue |
|---|---:|---:|---:|---:|---:|---:|---:|
| beta1 | 0.269871 | 0.318393 | 0.259675 | 0.378060 | 0.718056 | 0.959150 | 4.811390 |
| metric-global | 0.293424 | 0.361078 | 0.312623 | 0.412489 | 0.791929 | 1.026181 | 3.371639 |
| uniform-global | 0.255320 | 0.294202 | 0.234168 | 0.361607 | 0.750156 | 1.191475 | 7.386266 |
| fresh-global | 0.211306 | 0.336013 | 0.235896 | 0.406488 | 0.484812 | 0.792727 | 3.007421 |
| uniform-tail-global | 0.264224 | 0.305764 | 0.248392 | 0.394839 | 0.521909 | 0.671269 | 2.380571 |

## Separate very-dark panel

The raw-tail refinement used historical 121 stencils instead of the initial 125-stencil training panel. All candidates were also audited at the four additional Level=0.02 stencils at the same 72 offset hues, exposing any consequences. Their high curvature stays separate from the historical score.

| Candidate | Native mean / RMS / worst hue | Full mean / RMS / worst hue |
|---|---:|---:|
| beta1 | 44.464670 / 51.441561 / 134.049119 | 54.324303 / 64.237091 / 168.350011 |
| metric-global | 52.473581 / 93.554058 / 645.574837 | 59.071172 / 74.496701 / 255.986033 |
| uniform-global | 48.908896 / 72.658749 / 431.056249 | 53.617931 / 64.709755 / 185.377788 |
| fresh-global | 31.816710 / 80.851095 / 568.295576 | 47.680117 / 137.567611 / 1079.602115 |
| uniform-tail-global | 35.299025 / 43.059100 / 151.412993 | 43.789717 / 51.974169 / 133.227949 |

## Numerical and identity checks

All five main audit runs completed. Each checked 148 frozen source hashes with zero mismatches. Each candidate passed 1024 sampled embedding roundtrips per mode, including 64 near-black samples; 129 neutral and 79 vivid samples have exactly zero XYZ difference from Beta1. Audits also check seam continuity, invalid-input rejection and 256 exact shared-bank identity samples between modes. Finite tests do not prove continuous-domain numerical behavior.

| Candidate | Native max embedding error | Full max embedding error |
|---|---:|---:|
| beta1 | 5.749e-12 | 2.205e-12 |
| metric-global | 4.527e-12 | 1.996e-12 |
| uniform-global | 6.813e-12 | 2.781e-12 |
| fresh-global | 3.369e-12 | 4.424e-12 |
| uniform-tail-global | 5.874e-12 | 2.257e-12 |

Python and JavaScript shared maps agree within 5.685e-14 on 133 points in each direction for all four finalized records. Source/record/trace hashes, evaluation counts, selected objective rows and audit identities passed the producer-side cross-check. Independent review is separate. Sampled conditioning tails remain large; accurate roundtrips do not imply a uniformly well-conditioned map.

## Search budget and provenance

| Candidate | Start | Iteration budget | Objective evaluations | Best evaluation |
|---|---|---:|---:|---:|
| metric-global | beta1 | 240 | 242 | 242 |
| uniform-global | beta1 | 240 | 242 | 242 |
| fresh-global | fresh | 320 | 351 | 351 |
| uniform-tail-global | uniform | 240 | 244 | 244 |

Training uses equal weights for 48 hues and four path families, with native/full profile weights 0.5/0.5. Every closure, including rejected line-search evaluations, is retained. The fresh start reaches a materially different basin but has a large accuracy penalty; it is retained as evidence. The fourth trial addresses a measured tail regression and completes the finite wave.

The first three records identify fit.py; the fourth identifies fit-tail.py. Exact source SHA256, initialization, dependency and grid identities are embedded in each record. Large audits/traces use deterministic gzip (mtime=0), with stored/decompressed identities in results/compressed-payloads.json. The compact comparison’s initial visual-inspection choice is uniform-tail-global, without automatic promotion. EXECUTION.md records commands and exits.

No global optimum, guaranteed visual preference or superiority of the retained source hue geometry is claimed. The result is a concrete whole-solid research frontier with both modes in step.

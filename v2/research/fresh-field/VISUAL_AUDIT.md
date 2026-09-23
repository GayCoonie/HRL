# HRL v2 direct runtime hue sheet audit, version 1

The scripts [audit.mjs](audit.mjs) and [visuals.mjs](visuals.mjs) call each actual model's `toXYZ` at matched public hue H, Reach R and Level L. They compare the Beta 1 frozen release, frozen joint research fit, initial fresh seed and two closed experimental fresh banks. They do not change any release record or fit a model. The fresh banks are **failed candidates**, not proposed releases.

## Reproduce

Run from the HRL repository root. Choose a **new absolute output path** for each run; the scripts refuse to overwrite audit JSON or a panel directory.

```sh
node v2/research/fresh-field/audit.mjs --mode quick --gamut full --candidate-record "$PWD/v2/research/fresh-field/results/fresh-visual-neutral.json" --candidate-label fresh-visual-neutral-failed --out /absolute/new-visual-neutral-full.json
node v2/research/fresh-field/audit.mjs --mode quick --gamut srgb --candidate-record "$PWD/v2/research/fresh-field/results/fresh-joint-graded.json" --candidate-label fresh-joint-graded-failed --out /absolute/new-joint-graded-srgb.json
node v2/research/fresh-field/visuals.mjs --gamut srgb --hues 120,182.5,273 --candidate-record "$PWD/v2/research/fresh-field/records/seed.json" --candidate-label 'Fresh seed (calibration)' --compare-record "Visual-neutral FAILED COMBVD=$PWD/v2/research/fresh-field/results/fresh-visual-neutral.json" --compare-record "Joint-graded FAILED Beta 1=$PWD/v2/research/fresh-field/results/fresh-joint-graded.json" --out /absolute/new-panels
```

For the full-domain analog, pass `--gamut full` to both scripts. For a denser hue grid, pass `--mode dense` to `audit.mjs`. `visuals.mjs --release1` adds the Release 1 native sRGB comparison: it imports Beta 1's vivid XYZ with `release.fromXYZ`, then renders Release 1 at that approximate matched anchor's hue. Release 1's own H/R/L coordinates have a different definition, so its images are explicitly matched-anchor comparisons and are excluded from the equal-public-coordinate metric summary.

## Sampling and interpretation

- The quick grid has 24 regular hues at `2.5 + 15k` degrees, 24 shifted hues at `1.25 + 15k`, and 20 named critical hues, yielding 67 distinct base hues. A shared adaptive grid within each receipt probes ±0.625° around high white-edge variation and fixed-Reach J retreat found in any included model. Regular, shifted and critical angles are identical between receipts. **Adaptive angles can differ between independent receipts**; compare models on that grid only inside one receipt. Dense mode samples 72 regular and 72 shifted hues.
- A path uses 65 samples; near-gray uses 129. The paths include three triangle edges, six fixed public Levels (`.005`, `.02`, `.08`, `.2`, `.4`, `.8`), six fixed public Reaches (`.005`, `.02`, `.05`, `.2`, `.35`, `.65`), first-quarter near-gray paths and three dilution fans from each end. Fixed R means `R = constant; L = R + t(1 − R)`. It does not hold `U = R/L` constant.
- Every path converts actual, unclipped XYZ to the pinned HelmLab 1.0.0 GenSpace ruler. The step coefficient of variation is computed from 3D GenSpace distances after trimming the first and last two steps. Smaller is a smoothness proxy, not an observer preference. Separate J lightness and physical Y luminance step reversals are recorded. A worst J drop is a single negative increment; total J retreat sums all negative increments.
- The near-gray **area** measure samples 11×11 midpoints in `(L,U)` with `R = L×U`, weights cells by the area Jacobian L, and divides each sample's opponent-plane chroma from same-Level gray by its same-Level vivid-edge chroma. The fraction below `.2` measures sampled **relative** chroma, not a universal perceived-gray boundary. The two-scale, nine-point GenSpace Hessian measure samples critical hues and every fourth regular hue, including near-gray probes. A mean over regular hues therefore uses **six measured hues**, not 24.
- Panel pixels call the model's `toXYZ` and convert XYZ to display sRGB. Every panel uses the same triangular `(R,L)` coordinates. Out-of-range linear sRGB channels are clamped **for display only** and their pixel counts are shown. In the full-domain montage, as many as 6,643/8,481 valid pixels clip on one panel. Never derive full-gamut color or smoothness conclusions from its image; the JSON audit uses unclipped XYZ.

## Sampled regular-hue findings

The table uses the 24 regular hues for white-edge variation, gray area and worst fixed-R J drop. Lower white-edge CV, area under relative chroma `.2`, and J retreat indicate different features; none individually decides overall quality.

| Gamut | Model | Mean white-edge step CV | Mean near-gray area < .2 | Worst fixed-R J drop | H of worst drop |
|:--|:--|--:|--:|--:|--:|
| sRGB | Beta 1 | .198 | .298 | .00727 | 272.5° |
| sRGB | Frozen joint | .598 | .231 | .00213 | 182.5° |
| sRGB | Fresh visual-neutral, FAILED COMBVD | .208 | .239 | 0 sampled | — |
| sRGB | Fresh joint-graded, FAILED Beta 1 | .466 | .338 | 0 sampled | — |
| Full | Beta 1 | .275 | .290 | .04742 | 272.5° |
| Full | Frozen joint | .594 | .221 | .00608 | 167.5° |
| Full | Fresh visual-neutral, FAILED COMBVD | .205 | .178 | .10198 | 287.5° |
| Full | Fresh joint-graded, FAILED Beta 1 | .527 | .280 | .10937 | 287.5° |

The full-domain joint-graded record has a **.20391 integrated J retreat** at H287.5 on a fixed-public-Reach path. Its native sRGB rows sampled no fixed-R J drop, showing why the full-domain defect check matters. The visual-neutral full-domain bank also retreats by .10198 in one J step at H287.5. The fresh seed's full-domain worst fixed-R J drop was .12655 at H287.5. Sampling zeros do not prove continuous monotonicity.

Independent **direct JavaScript COMBVD** receipts from the fit engine give weighted retained scores visual-neutral sRGB **47.162313**, full **48.638045**; joint-graded sRGB **36.176614**, full **36.677658**. These banks fail the release baselines. The [visual-neutral](results/combvd-fresh-visual-neutral.json) and [joint-graded](results/combvd-fresh-joint-graded.json) direct runtime receipts also preserve each closed record and code SHA256. COMBVD remains an independent benchmark and is **not** inferred from GenSpace smoothness.

The five-column native and full-domain montages are in [focused panels](results/native-panels/index.html) and [full panels](results/full-panels/index.html); both directories include exact panel PNGs, `manifest.json` with hashes and clipping counts, `methods.html` and descriptive text for the contact image. Numeric receipts: [visual-neutral sRGB](results/visual-failed-srgb.json.gz), [visual-neutral full](results/visual-failed-full.json.gz), [joint-graded sRGB](results/visual-joint-graded-srgb.json.gz), [joint-graded full](results/visual-joint-graded-full.json.gz), [seed sRGB](results/visual-seed-srgb.json.gz), [seed full](results/visual-seed-full.json.gz). The published JSON receipts are deterministically gzip-compressed (`mtime=0`) without changing their JSON content. Each receipt carries model/record hashes and the source commit; later receipts also carry source file hashes. Finite hue grids, sampled paths, a frozen appearance ruler and screen conversion remain diagnostic rather than observer validation or a continuous-domain proof.

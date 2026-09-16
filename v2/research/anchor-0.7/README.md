# OPAL 0.7: gamut-anchored Reach and Level

Design: Coonie / Adam. Research and implementation: collaborative ChatGPT work, 16 September 2026. Additive prototype based on `2853c987e5be01491ab99a5e9e079d8fa2f4ca90`. OPAL 0.6 is the user's preferred visual baseline and remains available unchanged. This is not an accepted Release 2.

[Open the comparison picker](../../opal-anchor.html) · [Original OPAL](../../opal.html) · [Complete scores](results/benchmarks.json) · [Verification](results/verification.json)

## The issue and the controlled test

A selected gamut's vivid anchor is the full-scale reference for **that gamut's** hue triangle. A spectral boundary color is not a hidden full-scale reference for native sRGB. Both profiles still occupy the same regular native bicone. Same XYZ and same gamut-relative address are distinct cross-gamut operations.

The OPAL 0.6 code did compute independent sRGB and full-domain path integrals on their actual gamut boundaries. It did not merely clip the full-domain triangle for display. It also normalized the accumulated totals to the endpoints. However, the two-dimensional auxiliary appearance vector `[B, B*S/0.25]` retained a common absolute component scale before integration. It was not first normalized against the chosen hue's own B/W/V reference triangle.

The native/full score gap persists on identical data: 54.353100 versus 46.242083 on the same 3,331 pairs. The all-3,813 full-domain score is 45.979023. This isolates a difference in profile geometry/calibration rather than simply extra retained pairs.

Normalization alone is **not** an empirical cure: replacing the auxiliary metric by an own-anchor-normalized version while keeping the old readouts gives 56.319828 in sRGB and 46.746534 in the full domain. The record is [normalization-ablation.json](results/normalization-ablation.json). It would be false to attribute the eventual improvement wholly to fixing an anchor bug.

## Fixed construction

Public coordinates satisfy `0 <= R <= L <= 1`, and the distance embedding remains

```text
E(H,R,L) = [L-R/2, sqrt(3)*R*cos(H)/2, sqrt(3)*R*sin(H)/2]
```

H is converted to radians only for sine/cosine. Native distance is Euclidean distance between these embedded coordinates, never Euclidean distance between the raw H/R/L numbers and never a substituted color-space metric.

The OPAL 0.6 hue field, Release 1 angular allocation, spectral polygon, white-completion gauge, and independent spectral carrier are unchanged. The carrier's fake primary landmarks remain the purple-closure endpoints and maximum-y green. Black is zero light and the neutral axis retains `XYZ=Q(L)*W`, with Q the inverse normalized CIE L* curve. Both chromatic arms retain their original **physical loci**, though the placement of samples along them changes.

### Own-anchor normalization before integration

For each H and G, obtain `V=base_G(H,1,1)` from the actual gamut. Evaluate the auxiliary brightness B and chromatic-content C at V and at D65 W. Define

```text
c = C(XYZ)/C(V)
z = B(XYZ)/B(W) + (0.5 - B(V)/B(W))*c
x = sqrt(3)*c/2
```

This maps black, white and the actual vivid reference into `(0,0)`, `(1,0)`, and `(0.5,sqrt(3)/2)` respectively. The same normalization is used throughout the sheet. For native sRGB, every V is an sRGB anchor; for full-domain HRL it is the full-domain anchor. It is not based on carrier channel sums.

As in OPAL 0.6, first accumulate and normalize length along blackward paths at fixed physical chart purity; then, at each resulting Level, accumulate and normalize the neutral-to-chromatic-boundary contour to obtain `U=R/L`. The neutral row is explicitly fixed. Rows contain 0.1% identity to maintain strict increase. Grid size remains 72 hue rows, 33 secondary positions and 65 path positions; values are serialized to 12 significant digits. Interpolation is of coordinate progression, not of XYZ colors. Physical decoding still uses the exact fitted hue-sheet solver.

The affine normalization above is a declared reference-relative construction. B is not native Level and C is not native Reach. A fresh grid-convergence study has not been completed; the finite atlas is part of this prototype's definition.

## New evidence and its actual role

### Nayatani and Sakai (2011): auxiliary perceived-lightness calibration

*Predictions of Munsell Values with the Same Perceived Lightness at Any Specified Chroma Irrespective of Hues*, DOI **10.1002/col.20596**, PDF p7, Table A-II. Twenty-one nonself aggregate lightness matches were transcribed from the **observed** columns, alongside the two Corney brightness matches already used by OPAL. Table I predictions and the theoretical CS curves were not multiplied into extra observer data.

Experiments 1/2 used 24 observers and D65 fluorescent illumination at 1000 lx. Experiment 3 used four observers under north-sky daylight and reprints earlier 1994 data. It is not an additional independent replication. The measured chips' spectra were unavailable, so the reported Munsell notations were reconstructed from the real 1943 renotation, interpolating only inside available brackets, then Bradford-adapting C to D65. This is a colorimetric approximation to the reported chips, not recovered measurement of them. The source subset and its BSD license are retained.

A Fourier HK correlate through harmonic 4, constrained nonnegative at 720 angular samples, is fitted to equal-equivalent-luminance relationships:

```text
Yeq = Y * exp(3*rho*k(theta)); B = Lstar(Yeq)/100
```

Theta and rho are the physical field coordinates, not native H/R/L. Study-level weights are Corney 1, Nayatani Exp1 1, Exp2 1, Exp3 0.5, with smoothing toward the previous correlate. The selected ridge is 0.01; alternatives 0.001/0.05 remain in the record. Log-equivalent-Y mismatch RMS over these 23 aggregate matches falls from 1.7971 to 0.2598. This is the defined calibration residual, not a native color-difference score or broad brightness validation. A between-grid minimum probe finds a small negative lobe of about 4.1e-7 near 70.54 degrees in this correlate; nonnegativity is a finite-grid constraint, not an analytic global guarantee. The previous Schiller saturation readout is retained unchanged.

No equal-lightness pair is forced to have equal native Level. Instead, the calibrated correlate shapes the own-anchor-normalized auxiliary paths. Published coefficients are frozen. Repeating SLSQP from the included subset changed coefficients by at most 3.0e-9 on the checked repeat; this optimization is not claimed to be bit-identical across platforms. A deliberate recalibration requires rebuilding the atlas and R/L fit.

### Rogers, Knoblauch and Franklin (2016): interval regularization

*Maximum likelihood conjoint measurement of lightness and chroma*, DOI **10.1364/JOSAA.33.00A184**, PDF pp3-4, especially Table 2. The four equidistant MLDS positions for red, yellow, green, blue and achromatic lightness produce 30 within-track interval comparisons. These are derived from published interpolated group scales, not thirty independent trials. Relative CIELUV XYZ reconstruction uses the documented hue angles and background chromaticity, with the standard relative-white interpretation explicitly recorded because its absolute LUV reference-white luminance was not recovered.

The fitting objective penalizes disagreement with those interval ratios, using an independent nuisance scale for each track. This retains the useful within-track nonlinear progression without treating native Reach as CIELUV chroma or Level as lightness. The subsequent conjoint-judgment results, including hue-dependent cross-influences, are conceptual support for joint R/L fitting; their unprovided raw response matrix is not invented as training input.

### Hedjar, Toscani and Gegenfurtner (2025): separate discrimination diagnostic

*Importance of hue: the effect of saturation on hue-chroma asymmetries*, DOI **10.1364/JOSAA.544641**. Released data DOI **10.5281/zenodo.14892898**, CC BY 4.0. The three downloaded CSVs contain 384 processed threshold estimates, 96 saturation PSEs and 40 detection thresholds. These are not trial-level choices. [The diagnostic](results/hedjar-diagnostic.json) retains descriptive calculations in the authors' DKL units.

In particular, average individual chroma:hue JND ratios range approximately 1.57-1.69 for Q4 and 1.04-1.19 for Q1 across the three radii. The study's principal result is that equating perceived saturation does not remove this directional difference. This supports treating small-difference fitting separately from an appearance-correlate path length. It does not establish that HRL should directly equal DKL coordinates.

The calibration is explicitly Judd-corrected, not unambiguously Judd-Vos. It has not been silently translated with the latter formula. These CSVs are therefore retained as a separate diagnostic, **not numerical HRL fitting data in 0.7**. The released rounded numbers also do not exactly reproduce every reported aggregate; the arithmetic/geometric aggregation distinction is recorded. One reversed Q1/Q4 sentence in the paper is not used to override its figures, principal conclusion or raw data.

### Other supplied papers

**Briggs (2023), The elements of colour II**, printed pp109-111, Fig10-12: useful semantic grounding for blackness/chromaticness versus lightness/chroma and the zero-blackness boundary. It is not an extra matching experiment. Its exposition reinforces preserving the user's axes rather than replacing them with familiar correlates.

**Pridmore (1999), Bezold-Brucke hue-shift**, DOI **10.1016/S0042-6989(99)00085-1**: the newly supplied full paper is preserved in the intake record as evidence for future magnitude-conditioned hue tests. Successive, simultaneous, and delayed comparison procedures must not be pooled as interchangeable. The current pass does not change the accepted OPAL hue field or claim these matches were fitted.

**Pridmore, Color Constancy III**, DOI **10.1002/col.20572**: addresses corresponding colors under illuminant changes, not merely dimming in a fixed D65 scene. Its proposed optimal-color closure at 442-613 nm is not substituted for the user's spectral-end purple closure. The benchmark's adaptation procedure remains unchanged.

**Safdar et al. (2017), Jzazbz**, DOI **10.1364/OE.25.015131**: separates color-difference fitting, hue linearity, gray-axis behavior and other tests. Its equations or scores are not substituted for HRL's bicone distance. HDR lightness work does not reopen the chosen HRL white endpoint.

**Wang, Wei and Qu (2022)**, DOI **10.1364/OE.475433**: high-chroma hue evidence uses stimuli around 3400 cd/m² against a 1000 cd/m² diffuse-white reference. It is not dark-blue SDR evidence. The article says underlying data can be obtained from the authors; a complete numerical match set has not been recovered here, so no new raw records are claimed.

Only the two first sections above add numerical fitting constraints in this revision. Other papers add interpretation, diagnostics, or clearly identified pending data, not fictional rows.

## Joint Reach/Level difference calibration

A small, explicitly invertible coordinate warp refines the normalized chart. Let `T(x,t)=x*exp(t)/(1-x+x*exp(t))`. With `U=R/L`,

```text
L1 = T(L, U*(a0(H)+a1(H)*(2*U-1)))
U1 = T(U, b0(H)+b1(H)*(2*L1-1)+b2(H)*(2*L1-1)^2)
R1 = L1*U1
```

The five coefficient functions are Fourier series through harmonic 4: 45 fitted coefficients per gamut. Inversion first recovers U using `-b(H,L1)`, then L using `-U*a(H,U)`. Each step is strictly monotone in its active coordinate, so their triangular composition has positive orientation in the open triangle. It preserves the neutral axis, both arms as sets, and all three vertices without clipping. H is unchanged. Separate sRGB/full parameter sets are fitted using each one's own anchors and empirical coordinates; transfer to other gamuts has not yet been calibrated.

The objective contains traditionally weighted pooled COMBVD squared STRESS, a coefficient-smoothing penalty, Rogers within-track interval errors, and a penalty against displacement of the preferred OPAL 0.6 layout. The latter uses 2640 neutral/arm/interior probes per gamut, with extra arm weight. Coefficient bounds are [-2,2]. There are no dataset-specific coordinate parameters, per-pair corrections or hidden XYZ-distance substitutions.

The three supplied fits use geometry-restraint weights 3, 6 and 12. Weight 6 is the default balanced candidate; weight 3 prioritizes metric fit and weight 12 preserves more of the prior layout. Selection used development scores and visual comparisons, and is not an independent statistical experiment. The actual physical hue sheets remain those of OPAL 0.6 throughout.

## Results, limitations and evidence classification

See [BENCHMARKS.md](BENCHMARKS.md) for all per-source scores and common-mask comparisons. These scores are **in-sample development results** for 0.7. The original/control transforms are unfitted COMBVD baselines; the large gain occurs after direct difference calibration. It is not a claim that the anchor normalization or new papers alone prove generalization.

The whole-family omission runs retain the fixed construction, auxiliary evidence and OPAL visual reference, omit an entire COMBVD family from its direct loss, and refit from zero. They are retrospective transfer diagnostics, not untouched final validation. They expose remaining BFD and Witt weaknesses. The Rogers red low-chroma intervals remain relatively poorly predicted, and the fitted green interval result is slightly worse than the new unfitted control. No across-the-board observer improvement is claimed.

Numerical tests cover each supplied balance/profile, integer and continuous round trips, fixed endpoints and neutral axis, unchanged hue assignment, carrier independence, and physical XYZ cross-gamut conversion. See the receipt for measured maxima and sample counts. The finite atlas is continuous but piecewise smooth, and no new grid-convergence or exhaustive RGB16 cube census is claimed. Colorimetric matching between profiles preserves XYZ, not identical gamut-relative distance.

## API

```js
import {createOPALAnchor} from './v2/lib/opal-anchor.mjs';
const srgb = await createOPALAnchor({gamut:'srgb', balance:'balanced'});
const full = await createOPALAnchor({gamut:'full', balance:'balanced'});
const q = srgb.fromRGB([0.2,0.4,0.8]); // encoded sRGB channels in [0,1]
const xyz = srgb.toXYZ(q);
const sameStimulus = full.fromXYZ(xyz);
const sameRelativeAddress = full.toXYZ(q); // intentionally different operation
const de = srgb.distance(q, {H:120,R:0.3,L:0.6});
```

Other balances: `metric`, `conservative`. Use `control:true` to omit the final empirical warp. Save gamut, version and balance with native coordinates. No new short-code format is introduced.

## Reproduction

From the repository root, Node is sufficient to reconstruct the frozen model and scores:

```sh
node v2/research/anchor-0.7/code/build-anchor.mjs
node v2/research/anchor-0.7/code/evaluate-control.mjs
node v2/research/anchor-0.7/code/prepare-fit.mjs
node v2/research/anchor-0.7/code/benchmark.mjs
node v2/research/anchor-0.7/code/verify.mjs
node v2/research/anchor-0.7/code/build-viewer.mjs
```

For a deliberate refit, Python needs NumPy, SciPy and PyTorch; Hedjar descriptive calculations also use pandas. Run `intake-rogers.py`, `intake-nayatani.py`, then rebuild the atlas and fit inputs. `fit.py srgb - 6` refits the balanced native profile and `fit.py full - 6` the full profile. Substitute 3 or 12 for the alternatives. An omitted family replaces `-`, for example `fit.py srgb WITT 6`. Refit output numbers can differ at optimizer tolerance across software/hardware; published coefficients are the reference. The default model factory reads the corresponding `fit-*-g6.json` records directly.

The `--legacy-readout` builder switch is for reproducing the isolated normalization ablation and overwrites atlas outputs; use a scratch checkout, not the publication directory. `--quick` reduces random samples in verification but does not alter the model. The old v1 and v2 source remains unchanged except additive navigation in the root/research hubs.

# Literature intake for the shared R/L dark-side refinement

The ten attached papers inform the model structure and the interpretation of diagnostics. They are not ten new training datasets. COMBVD remains the only human-observer dataset fitted in this continuation. The user's screenshots are direct visual feedback motivating a darker low-Level black-to-vivid region; they do not supply measured numeric tonal targets.

## Definitions first: Briggs, 2023

David J. C. Briggs, *The elements of colour II: the attributes of perceived colour*, Journal of the International Colour Association 33, 97-118. Attachment: `The_Elements_of_Colour_II_The_Attributes.pdf`.

Pages 109-112 (PDF pages 13-16) distinguish blackness and brilliance from lightness. Figure 10 places NCS blackness and chromaticness on triangular hue pages; Figure 12 compares contours of NCS blackness with Munsell value/chroma. Zero blackness occurs at different lightnesses depending on hue and chromatic intensity. Pages 102-107 and Figures 3-7 distinguish luminance-related brightness from chromatic brightness and from object lightness.

Consequences for HRL: retain K=1-L, W=L-R, chromaticness=R. U=R/L is only an internal saturation-like coordinate. Do not rename Y, Oklab lightness, or a brightness correlate as public Level. Normalize diagnostic tonal progress against each hue/gamut endpoint instead of imposing equal luminance across hues. HRL's geometric shares are not literal amounts of mixed RGB light. Briggs's discussion of an expected object-color maximum is not empirical proof that an arbitrary display-gamut boundary is the perceptual zero-blackness boundary.

## Nayatani and Sakai, 2011

*Predictions of Munsell Values with the Same Perceived Lightness at Any Specified Chroma Irrespective of Hues: Determination of Any Tonal Colors*, Color Research and Application 36, 140-147, DOI 10.1002/col.20596. Attachment: `nayatani2011.pdf`.

Figure 1 contrasts an NT whiteness/blackness plane with the corresponding Munsell value plane. Equations 3-5 use chromatic strength to predict Munsell value for tonal colors; Tables I and A-II and Appendix II give calculations and comparisons with observer matches. The chromatic-strength function is indexed by Munsell hue. The authors discuss a common function connecting metric and appearance attributes, while acknowledging that imperfect spaces can require different empirical functions.

Consequences: a hue-dependent, endpoint-normalized tonal adjustment is reasonable to investigate, but the paper's CS numbers cannot be pasted into HRL-degree bins. No such transfer is made. The new polynomial is not a Nayatani formula, and this fit does not claim to reproduce the NT system or the observer matches in Table A-II.

## Rogers, Knoblauch and Franklin, 2016

*Maximum likelihood conjoint measurement of lightness and chroma*, JOSA A 33, A184-A193, DOI 10.1364/JOSAA.33.00A184. Attachment: `rogers2016.pdf`.

The abstract, Sections 6-8, and Figure 3 report that additive contributions describe most tested judgments; red-chroma judgment has a small significant interaction. Lightness contributes negatively to judged chroma for red, blue, and green, but not yellow. The stimuli were prescaled and sampled in a constrained CRT range; the instructions and task matter.

Consequences: prefer controlled smooth interactions to unconstrained deformation. Do not claim arbitrary R/L coupling is physiologically established or that additivity holds everywhere in the full physical cone. The implementation retains invertible triangular couplings and adds a bounded correction, rather than treating this experiment as permission for a free-form displacement field.

## Hedjar, Toscani and Gegenfurtner, 2025

*Importance of hue: the effect of saturation on hue-chroma asymmetries*, JOSA A 42, B305-B312, DOI 10.1364/JOSAA.544641. Attachment: `Importance_of_hue_the_effect_of_saturation_on_hue-.pdf`.

The abstract, Figures 4-7, and discussion show that equating perceived saturation does not eliminate the difference in chroma-to-hue threshold ratios between orangish and purplish DKL regions. Saturation differences were modest. The result is not simply that one global saturation correction repairs a nonuniform space.

Consequences: allow smooth hue dependence and keep hue-difference behavior distinct from tonal appearance. Do not optimize hue angles in this R/L pass or assume that a prettier sheet proves threshold uniformity. Its threshold observations are not used as new numeric dark-edge targets.

## Schiller, Valsecchi and Gegenfurtner, 2018 (online 2017)

*An evaluation of different measures of color saturation*, Vision Research 151, 117-134, DOI 10.1016/j.visres.2017.04.012. Attachment: `1-s2.0-S0042698917300901-main.pdf`.

The abstract and experiments distinguish changing background luminance from raising overall luminance. The relative saturation ordering of some standards reverses with background luminance; Figures 6-7 illustrate the reversal. Section 2 documents patch/background luminances, the task, and the measures' reference assumptions. Not every contextual effect is predicted by the tested measures.

Consequences: do not equate Reach with HSV saturation or excitation purity. Do not invent a 100-versus-300-nit preference from the existing scale-invariant relative calibration. The current source readout and reference context remain fixed; a future context-sensitive fit would need the actual context data and a separately documented scope.

## Corney, Haynes, Rees and Lotto, 2009

*The Brightness of Colour*, PLoS ONE 4, e5091, DOI 10.1371/journal.pone.0005091. Attachment: `pone.0005091.pdf`.

Figure 1 separates matching brightness, luminance and reflectance in a blue/yellow example. The paper presents a Bayesian ideal-observer account of the Helmholtz-Kohlrausch effect and fMRI results. Its simulated surface-reflectance predictions and explanatory interpretation are not direct measurements of HRL Level. The results support taking hue/saturation contributions to brightness seriously.

Consequences: preserve the distinction between Y and brightness, especially for blue. However, this paper does not establish that the screenshots' bright near-black corner is an HK error. The fit tests the actual trajectories and conditions rather than declaring that causal explanation proved.

## Pridmore, 1999

*Bezold-Bruecke hue-shift as functions of luminance level, luminance ratio, interstimulus interval and adapting white for aperture and object colors*, Vision Research 39, 3873-3891, DOI 10.1016/S0042-6989(99)00085-1. Attachment: `1-s2.0-S0042698999000851-main.pdf`.

Tables 1-2 and Figures 1-5 distinguish luminance level, ratio, adaptation, and simultaneous/successive/delayed procedures. The abstract reports condition-dependent invariant wavelengths, including changed behavior with delayed presentation. The low-luminance part includes mesopic conditions; the measurements do not define one condition-free hue curve.

Consequences: preserve hue identity separately from coordinate density and record the inherited field's limits. An R/L remapping is not a fresh validation of dark-blue hue appearance. No wavelength table or rod correction is silently inserted into the frozen hue model.

## Pridmore, 2010

*Color Constancy from Invariant Wavelength Ratios. III: Chromatic Adaptation Theory, Model and Tests*, Color Research and Application, DOI 10.1002/col.20572. Attachment: `ColConstIII.pdf`.

The paper presents a theory and model involving relative wavelength, purity and radiant-power ratios, and compares corresponding colors under different illuminants. Figures 3-6 illustrate complementary-power and purity constructions. Its stated optimal-color-stimulus boundary for compound colors is not simply the entire physical spectral cone.

Consequences: distinguish theoretical interpretation from measured corresponding-color comparisons. Keep source-white adaptation explicit. This pass retains Bradford and the existing physical polygon; it does not replace them with Pridmore's theoretical wavelength construction or confuse an optimal-color boundary with physical impossibility.

## Wang, Wei and Qu, 2022

*Constant hue loci in different color spaces for stimuli in Rec. 2020 color gamut and HDR conditions*, Optics Express 30, 44896-44907, DOI 10.1364/OE.475433. Attachment: `oe-30-25-44896.pdf`.

Section 2.2 specifies 1000 cd/m2 adapting white and nominal 3400 cd/m2 stimuli. Figures 4-10 identify difficult blue/red-purple hue regions and compare nine spaces using several criteria. The data availability statement says underlying data were not publicly available at publication but could be requested.

Consequences: this is not an SDR dataset that can be made equivalent by clipping relative Y=3.4 to one. It informs the caution around wide-gamut and high-magnitude hue continuation, not the new dark-edge training. No unavailable underlying observer tuples are invented from its plots.

## Safdar, Cui, Kim and Luo, 2017

*Perceptually uniform color space for image signals including high dynamic range and wide gamut*, Optics Express 25, 15131-15151, DOI 10.1364/OE.25.015131. Attachment: `oe-25-13-15131.pdf`.

Sections 2-3 distinguish difference prediction, local/global uniformity, lightness, hue linearity, grey-scale convergence and computational cost; the paper separates training, reference and testing uses. COMBVD is training data for Jzazbz, not a universally untouched test set. The wide-range lightness experiments have their own absolute white luminances.

Consequences: retain actual bicone distance and report the visual, hue and difference results separately. A lower COMBVD loss cannot certify all of them. Absolute XYZ scaling is bookkeeping for the declared reference condition, not a substitute for an absolute-luminance appearance fit.

## Engineering choices, explicitly not paper-derived measurements

The inverse dark curve is phi(t)=t-a(H,U)t(1-t)^2, with a=0.85 sigmoid(Fourier(H)) U^2. Its derivative in t is at least 0.15. It preserves black, t=1, U=0, and the zero-whiteness edge, and has a safeguarded inverse. Its shape and the endpoint-normalized Oklab target t^p are engineering responses to Coonie's feedback; no paper is claimed to prescribe either. The same coefficients operate in every gamut. Differences in gamut-specific source maps come only from deterministic boundary intersection and own-anchor normalization, with no separately fitted head.

Positive Jacobian, small round-trip error, smooth-looking contours and good observer-data scores answer different questions. All are checked or reported separately. The mathematical singularity at black is excluded from interior conditioning estimates. Third-gamut numerical success is not evidence of perceptual calibration for every possible gamut.

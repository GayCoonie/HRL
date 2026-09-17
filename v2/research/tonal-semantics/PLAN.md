# GenSpace and tonal semantics: research scope

Recorded during the source-intake and numerical-audit pass, not retroactively presented as the pre-fit plan for HRL 0.10. No new observer fit is part of this experiment.

Coonie reports a substantial visual improvement in shared 0.10, but prefers balanced for some hues and metric for others. They request HelmLab GenSpace rather than Oklab, including for a scalar lightness ruler, and more grounded definitions of adding black and white. The newly supplied ZCAM paper is the main conceptual source. Existing HRL semantics and the single-bank, gamut-relative construction remain the starting contract.

## Sequence and deliverables

1. Read ZCAM's conceptual definitions, actual fitted equations, training/test distinctions and examples separately. Compare its attributes with the NCS and HRL shares instead of substituting identically named quantities.
2. Distinguish physical attenuation/white-light addition, appearance-attribute judgments, and geometric share-dilution operations. Derive the latter algebraically, including ratio invariants, repeated-operation composition, endpoints, and neutral exchange.
3. Implement the operators and their tests. Retain shared 0.10 coefficients exactly; do not describe them as newly GenSpace-trained.
4. Use the repository's frozen HelmLab 1.0.0 GenSpace forward port as the new diagnostic ruler. Explicitly audit its input domain and preserve the declared neutral-correction setting. No Oklab value enters this new audit.
5. Rerate both unchanged candidates in sRGB/full on black-origin and white-origin path families. Report whole-path statistics, per-hue differences and external-ruler corner-distance behavior without calling them observer preferences. Keep the absolute/relative white handling unchanged.
6. Publish the executable operations, evidence-derived definitions, raw measurements, and an actual interactive comparison. Include locally stored preference recording so future hue-specific feedback can be attributed to the user rather than guessed from metric rankings.

## Frozen design choices and interpretation limits

Amounts are replacement shares in a proposed appearance mixture, not grams of pigment, luminance fractions, or guaranteed perceptually equal intervals. The choice to preserve the ratio of the two non-added shares is an explicit operation contract. Its algebra is exact; its perceptual adequacy still needs calibration against appearance evidence.

The audit samples 72 hues at five-degree intervals, five start ratios, and 129 points per path. It does not choose or modify coefficients. No new COMBVD, hue, threshold or appearance observations are invented. The previous COMBVD scores remain historical results of the unchanged transforms, and ColorBench is not rerun merely because an external ruler changes.

The next fitted experiment should retain one coefficient bank and jointly constrain the two operation families, using GenSpace for path diagnostics and independently justified blackness/whiteness evidence for semantics. Replacing Oklab L with GenSpace L inside the same arbitrary power target would not, by itself, supply the requested definition.

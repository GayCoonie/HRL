# Black and white in HRL: attributes, operations, and calibration

## Status and provenance

This is an additive research contract and executable audit, not an approved change to the HRL 0.10 conversion. The existing balanced and metric coefficient banks are untouched. The new ruler is the repository's frozen HelmLab 1.0.0 GenSpace implementation, not Oklab or HelmLab MetricSpace. Raw source hashes and the reference repository commit are recorded in `results/genspace-audit.json`.

The primary new source is Safdar, Hardeberg and Luo, **ZCAM, a colour appearance model based on a high dynamic range uniform colour space**, Optics Express 29(4), 6036–6052 (2021), DOI https://doi.org/10.1364/OE.413659, supplied by Coonie. Relevant sections and equations were read from the PDF, including the rendered mathematical page 8. Additional primary sources are listed below. Equations explicitly introduced as HRL deductions or proposed contracts are not attributed to those authors.

## 1. The useful lesson from ZCAM

ZCAM Section 2 distinguishes brightness and lightness, colourfulness and chroma, and then introduces saturation, vividness, blackness and whiteness as two-dimensional attributes involving lightness **and chroma**. Its conceptual examples on PDF pages 3–4 make the point directly: a blacker chromatic colour has less lightness and/or chroma; a whiter one has less chroma and greater lightness in the illustrated pigment context.

This supports HRL's decision not to identify Level with an ordinary lightness correlate. It also says why changing a scalar lightness target alone cannot fully define what “more black” or “more white” means. It does not establish that HRL Level must equal any particular ZCAM output.

Briggs (2023), already in the source packet, distinguishes blackness and brilliance from lightness and describes the role of an expected maximum for a given hue and saturation. Nayatani and Sakai (2011) explicitly distinguish tonal whiteness/blackness from metric Munsell value, allowing hue-dependent chromatic-strength effects. Their concepts motivate boundary-relative normalization; neither paper supplies a universal display-gamut-specific blackness function for us to copy.

## 2. ZCAM's conceptual and fitted equations must not be conflated

Section 2 gives the conceptual relations

    V = sqrt(J² + C²)              K = 100 - V
    D = sqrt((100-J)² + C²)        W = 100 - D.

But Step 6 on PDF page 8 gives the actual model:

    Vz = sqrt((Jz-58)² + 3.4 Cz²)                    (17)
    Kz = 100 - 0.8 sqrt(Jz² + 8 Cz²)                 (18)
    Wz = 100 - sqrt((100-Jz)² + Cz²).                (19)

`operations.mjs:zcamAttributes` implements these equations exactly on **ZCAM Jz,Cz input units**. It is not a complete XYZ-to-ZCAM implementation. In particular, GenSpace L and chroma are not substituted into equations fitted in ZCAM units. ZCAM's Jz correlate should also not be confused with simply taking the J coordinate of Jzazbz.

The paper states that Kz and Vz were fitted using the CHO ratings; Wz followed the conceptual equation without such fitting. PDF page 9 explicitly discusses the vividness intercept at Jz=58 rather than black. We therefore retain that behavior rather than silently “repairing” the equation.

Direct substitution on the ideal neutral axis gives:

| Jz, Cz | Vz | Kz | Wz |
|---|---:|---:|---:|
| 0, 0 | 58 | 100 | 0 |
| 50, 0 | 8 | 60 | 50 |
| 100, 0 | 42 | 20 | 100 |

These are algebraic consequences, not measurements performed here. They show why the published correlates cannot simply be assigned as the three HRL shares. For example, `1-Kz/100-Wz/100` equals -0.2 at ideal neutral white. In the fitted model, Vz is not 100-Kz. This is not a claim that ZCAM is invalid: the authors fitted open-ended attribute-rating correlates, not nonnegative barycentric coordinates.

Neutral rescaling can remove the particular offset in Kz, but does not solve the larger problem of mapping arbitrary hue/gamut boundaries to the two prescribed HRL edges. Independent clipping would hide that mismatch and generally discard information.

## 3. A precise geometry test

Consider just the neutral-normalized conceptual distance construction, not the fitted ZCAM equations. Let `j=J/100`, `c=C/100`, and define

    dB = hypot(j,c)                 dW = hypot(1-j,c)
    K = 1-dB                      W = 1-dW
    R = dB+dW-1.

These sum to one. On the neutral segment, R=0. Triangle inequality guarantees R>=0, but does not guarantee nonnegative K and W for every chromatic point.

To give a vivid endpoint both K=0 and W=0, both distances must equal one. Subtracting their squared equations gives j=1/2, and therefore c=sqrt(3)/2. That is one particular point in this latent lightness/chroma plane. Real gamut vivid endpoints vary with hue and gamut and need not occupy it.

This calculation identifies the missing operation: **joint, boundary-aware straightening of an appearance sheet**, rather than raw attribute renaming. Gamut geometry may supply endpoints and normalization, but the same learned laws should operate across realizations. That is compatible with the existing single-bank architecture.

## 4. Three meanings of “adding” must be kept separate

**Radiometric operation.** Uniform attenuation of a light stimulus is `X'=(1-a)X`, with black at XYZ=0. A normalized blend with reference-white light is `X'=(1-a)X+aXwhite`. These are exact linear-light constructions. Adding white light without reducing the original light is a different physical operation, `X'=X+aXwhite`. These formulas do not establish perceptually uniform intervals or perfectly constant perceived hue.

**Material operation.** Mixing real white or black pigments depends on their spectra and scattering/absorption properties. A three-number colour specification alone does not identify a unique pigment mixture. HRL's API should not imply a paint-mass interpretation unless an actual material model is supplied.

**Appearance operation.** A colour can be judged more blackish, more whitish, or more chromatic under specified context and instructions. These are not automatically identical to radiometric or pigment fractions. HRL is proposing a reproducible appearance-space operation, with explicit invariants, to be calibrated and evaluated rather than presented as an already proven pigment law.

The fixed HRL hue field continues to define the hue identity. Keeping that hue fixed can entail a curved path in XYZ. We do not simultaneously promise constant physical chromaticity and constant perceived hue.

## 5. The proposed HRL share-dilution contract

The established unit triangle is

    R >= 0, W >= 0, K >= 0, R+W+K=1
    R = chromaticness, W = L-R, K = 1-L.

Level remains brilliance / inverse blackness. `U=R/L` is an internal saturation-like ratio, not the definition of Reach.

Define “add endpoint with amount a” to replace fraction a of the current appearance mixture with that endpoint, **preserving the ratio of the other two shares**. This ratio choice is the proposed operation contract; the ensuing algebra is exact.

### Add black

    R' = (1-a)R
    W' = (1-a)W
    K' = a+(1-a)K

or, in the public coordinates,

    R' = (1-a)R,       L' = (1-a)L.

It preserves R:W and therefore R/(R+W)=R/L except at black, where the ratio is undefined. These are the rays from black. The NCS official harmonies explanation identifies its constant-saturation rays in exactly the c:(c+w) form. That supports this choice of direction; it does not make the numerical parameter a an empirically validated mixing fraction.

### Add white

    R' = (1-a)R
    K' = (1-a)K
    W' = a+(1-a)W

or

    R' = (1-a)R,       L' = a+(1-a)L.

It preserves R:K. These are the rays toward white. In particular, ordinary white dilution decreases Reach too.

### Exchange neutral content

Holding R fixed and changing L instead gives

    R' = R,       W' = W+delta,       K' = K-delta.

This exchanges blackness and whiteness without diluting chromaticness. It is a valid distinct operation, not “add white” applied to the whole colour. The permissible interval is `-W <= delta <= K`.

The previous fitting and diagnostics sampled fixed-Reach Level paths and explicit black-origin rays. They included the white-vivid top edge incidentally, but not a corresponding general fan of white-origin dilution paths through the interior. The new audit adds that fan rather than claiming the white edge was never sampled at all.

## 6. Exact mathematical consequences

For two consecutive additions of the same endpoint, the combined amount is

    a combined b = 1-(1-a)(1-b).

Zero is the identity and one reaches the endpoint. All intermediate addresses stay inside the unit triangle. A fixed hue remains fixed. With amount `a=1-exp(-tau)`, repeated addition becomes an additive-time flow; the black and white vector fields in (R,L) are respectively `(-R,-L)` and `(-R,1-L)`.

Different endpoint additions need not commute. Adding black with amount a then white with amount b gives the same final R as the reverse order, but Level differs by ab. This is a consequence of replacing a fraction of the *current* mixture, not a numerical defect.

In HRL's equilateral hue triangle, the embedded coordinates are

    z = L-R/2,       c = sqrt(3)R/2.

Black addition contracts the full embedded distance to black by exactly 1-a. White addition contracts the full embedded distance to white by exactly 1-a. Neither statement says that Level itself is a Euclidean distance or that ordinary lightness changes by that fraction.

`test.mjs` verifies these contracts on 10,000 seeded random examples, with explicit endpoint and ZCAM-equation checks. It does not turn the mathematical invariants into new observer evidence.

## 7. What GenSpace replaces, and what it does not

The new audit evaluates the original XYZ outputs using `src/base/appearance-runtime.mjs` and its pinned HelmLab 1.0.0 GenSpace parameters. Neutral correction is disabled, as in the repository's existing port. The actual transformed reference white is used rather than assuming exact (1,0,0). The wrapper rejects a stimulus if the pinned forward port would require materially negative cone-response clipping; unavailable paths are not silently trimmed.

GenSpace supplies a generation-oriented ruler: full three-dimensional step lengths, scalar lightness readouts, and progress relative to the white or black endpoint. It is **not** assigned as public HRL Level, not swapped for MetricSpace, and not treated as a complete context-dependent appearance model. Its application to the full physical solid is a numerical diagnostic beyond ordinary SDR usage, not newly established wide-gamut psychophysical validity.

The old 0.10 coefficients were trained with an Oklab-based regularizer. They are preserved, not retroactively called GenSpace-trained. No Oklab value enters the new diagnostic evaluation. Existing ColorBench results are not rerun because the underlying colour transform did not change.

## 8. What the next fit can constrain more meaningfully

Use both black and white share-dilution families, plus neutral exchange as a third distinct check. Keep full GenSpace step variation and abrupt-change penalties, but do not make every tonal attribute equal a scalar lightness ratio. A path approaching white can decrease an external lightness correlate when its starting chromatic endpoint exceeds white on that correlate; this must not automatically count as “becoming blacker.” The audit therefore reports progress in full three-dimensional distance to the target separately from scalar-lightness direction.

Use appearance blackness/whiteness ratings, where available with their stimulus and viewing metadata, to constrain semantic order and contours. Model-predicted ZCAM quantities can be reference diagnostics, but labeling them as fresh human training data would be wrong. A joint boundary normalization must preserve neutral anchors, the two zero-content edges, hue identity, and invertibility, with a common learned bank across gamuts.

Coonie's preference for different candidates in different hues is first-person visual feedback. GenSpace rankings are not substituted for it. A later hue-dependent compromise should vary smoothly and be verified as an invertible shared map, not switch models abruptly at hue boundaries or blend XYZ outputs while assuming hue and inverse behavior survive.

## 9. Context is part of the definition, not an excuse to avoid one

The primary study by da Pos, Albertazzi, Villani and Dazzi, *The white and black colour attributes in the Natural Colour System*, distinguishes isolated attribute judgments from comparison in organised colour arrays. Its comparative experiments move the results closer to NCS, while noting very small observer counts in those tests. This supports specifying the judgment context; it does not establish a universal refutation or verification of NCS.

Our immediate operational context is related colours on hue sheets under a declared reference condition, with the surrounding interface and the user's display affecting visual review. The local preference recorder retains which operation and address were shown, and explicitly records that display luminance and calibration are unknown. No population-level perceptual claim is made from those informal choices.

## Primary sources and their roles

- Safdar, Hardeberg & Luo (2021). ZCAM. https://doi.org/10.1364/OE.413659. Sections 2–4: definitions, fitted formulas and data roles. Primary new attachment.
- NCS Colour, **Colour harmonies**. https://ncscolour.com/pages/colour-harmonies. Official c,w,s relations, m=c/(c+w), and the distinction between lightness and whiteness.
- da Pos et al. (2023 volume; published online 2024), **The white and black colour attributes in the Natural Colour System**, Gestalt Theory 45(3), 259–286. https://doi.org/10.2478/gth-2023-0024. Judgment procedure and context; small comparative experiments are not generalized beyond their support.
- Briggs (2023). **The elements of colour II: the attributes of perceived colour**, JAIC 33, 97–118. Supplied earlier. Blackness, brilliance, modes of appearance and hue-dependent expected maxima.
- Nayatani & Sakai (2011). **Predictions of Munsell Values with the Same Perceived Lightness at Any Specified Chroma Irrespective of Hues**. https://doi.org/10.1002/col.20596. Tonal attributes versus metric value; no transplant of Munsell-indexed coefficients into HRL degree bins.
- HelmLab official implementation: https://github.com/Grkmyldz148/helmlab/blob/a0d7389df929eb6b303673276019a7fcea58584c/src/helmlab/spaces/gen.py. Checked for the generation-space role and stages. The executed parameters are the existing HRL pin, not an unannounced upgrade to that repository's current defaults.

These sources constrain the design and identify where observations are still needed. They do not uniquely prescribe the proposed share-dilution operator or its perceptual calibration.

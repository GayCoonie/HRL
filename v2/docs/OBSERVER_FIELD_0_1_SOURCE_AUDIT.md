# Source and interpretation audit

Research date: 16 September 2026. This audit distinguishes original numerical sources, an independent repository used for discovery, transcription, normalization, source irregularities, and the present model's own assumptions.

## Project continuity

The user's `chattest.pdf` is a Critter API Lab transcript, not an original psychophysical dataset. Its pages 31–41 establish the pseudo-primary/full-visible-domain proposal and curved common hue family. Subsequent direct instructions fix black to zero light, white to common D65, both chromatic arms to the hue distortion, and the neutral axis to a straight line. They ask to initialize angular density from the actual R15-D Release 1 vivid ring, leaving later tuning open.

The previous carrier design is retained under `previous/`. Its scalar-light homogeneity for colored channels is not retained once the warp depends on magnitude. That is an explicit architectural change needed to model hue changes on darkening.

## Ebner–Fairchild

Original research: F. Ebner and M. D. Fairchild, “Finding Constant Hue Surfaces in Color Space,” SPIE 3300, 107–117 (1998), DOI 10.1117/12.298269.

Author-origin numeric ASCII mirror:
https://zenodo.org/records/3362536
https://zenodo.org/records/3362536/files/Ebner_Constant_Hue_Data.txt?download=1

The deposit credits the original RIT/Fairchild source. The ASCII contains 306 targets grouped under 15 reference hues and the white (95.01,100,108.81). All numerical reference and target triples were transcribed; the local file changes separators and the header, so it is **not claimed to have the original byte hash**. The source page publishes MD5 64b479758e8b288847f6b6ab2eb8ca5e for the original file. Our separate SHA-256 is a receipt of the local transcription.

Adaptation: normalize XYZ by 100; adapt from the supplied white to the common D65 convention. Default Bradford, independent CAT16 refit retained. The nominal reference hue labels are identifiers, not forced target angles for our field.

## Hung–Berns

Original research: P.-C. Hung and R. S. Berns, “Determination of constant hue loci for a CRT gamut and their predictions using color appearance spaces,” Color Research & Application 20(5), 285–295 (1995), DOI 10.1002/col.5080200506.

Extracted source tables:
https://zenodo.org/records/3367463
https://zenodo.org/records/3367463/files/Table%20III.csv?download=1
https://zenodo.org/records/3367463/files/Table%20IV.csv?download=1

The publication describes nine observers, three replications, and 132 matching positions. Those observer counts are **not** 132 independent studies. The present count is 36 CL targets and 96 nominal VL targets, plus reference rows.

The local source CSVs reconstruct the published CRLF files exactly. Their MD5 values equal the deposit's published hashes:

- `hung_berns_CL.csv`: f8a52142e2d0224554ce79f9bb6bdb37
- `hung_berns_VL.csv`: 054f9c9ad4b5e93fd076c7f5ecb16e9d

### White-point convention

The discovery repository's summary metadata says D65, but its raw objects use the C-white vector. The Colour Developers' own data loader also uses illuminant C for these tabulated XYZ coordinates:
https://colour-datasets.readthedocs.io/en/v0.2.5/_modules/colour_datasets/loaders/hung1995.html

There is independent numerical support in the tabulation: its red reference x=.6195, y=.3516, L*=62.4, u*=173.3, v*=55.3 implies an adopted reference chromaticity approximately x=.30994, y=.31634. This is close to C, not the D65 chromaticity. Rounding limits this inference. The fit treats the **tabulation** as C-referenced, then adapts C to D65. This does not assert that every physical viewing/adaptation condition in the original experiment was illuminant C.

### Quarantined track

Table IV's magenta-red track has inconsistent row labels/reference values. The final “Ref.” XYZ is (65.64,35.53,45.43), while its constant-lightness reference is (64.36,35.53,53.66), which appears at the variable-lightness row marked “90.0”. Earlier L* labels and Y values are also shifted. The cause is unresolved; the byte-identical local reconstruction shows this was not introduced by our copy.

All eight nonreference VL rows in that track are retained but excluded from the main fit. They are evaluated separately against the uncontested CL reference. No favorable subset of those rows was chosen after looking at errors, and the suspect numbers have not been silently “repaired”. CL magenta-red is retained. Main HB target count is 124: 36 CL + 88 VL.

## Munsell renotation subset

RIT's source explanation:
https://www.rit.edu/science/munsell-color-science-lab-educational-resources
Numeric source:
https://www.rit-mcsl.org/MunsellRenotation/1929.dat

Use the terminology carefully: these are renotations of colors represented in the 1929 book, based on later scaling/renotation work. They are not measurements of a physical copy of that book and not independent direct observations at every table location.

The declared subset comprises all ten 5-prefixed hue families (5R, 5YR, 5Y, 5GY, 5G, 5BG, 5B, 5PB, 5P, 5RP), values 3, 5, and 7, and every chroma listed for those hue/value combinations. It contains 114 points. Each family's reference is chosen nearest value 5 and chroma 6, leaving 104 nonreference same-hue relations.

Native chromaticities are illuminant C / CIE 1931 2-degree. We convert xyY to XYZ, divide Y by 100, and apply the declared C→D65 adaptation. RIT notes that its Y scale references magnesium oxide and suggests .975 conversion for a perfect diffuser convention. This prototype retains the tabulated relative scale instead of silently applying that change. A future reference-scale sensitivity test remains appropriate for the magnitude-dependent fit.

The local file is a numeric subset transcription with a different header/format, not a byte-identical copy of the complete source.

## CIE spectral domain

Official reference:
https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer

Official nominal 1 nm data URL, unavailable to this run:
https://files.cie.co.at/CIE_xyz_1931_2deg.csv

Retrieval mirror inspected through the GitHub connector:
https://github.com/sblisesivdin/spectrum-to-rgb/blob/main/CIE_xyz_1931_2deg.csv
Git blob identity: 9b4e3f73b4bb412a762a6d03cb8060bfea652a6e.

The local file explicitly selects every fifth row, 360–830 nm inclusive: 95 knots, not 471. It is an individually transcribed numeric subset; no byte-identical official-CSV claim is made. The convex hull and line-of-purples closure define the delivered numerical domain. This hull is not a replacement claim for the exact continuous spectral locus. The coarser 10 nm comparison is included only as a resolution sensitivity diagnostic.

## Reviewed but not fabricated into numeric matches

R. W. Pridmore, “Effect of purity on hue (Abney effect) in various conditions,” Color Research & Application 32, 25–39 (2007), DOI 10.1002/col.20286.
https://www.researchgate.net/publication/230067975_Effect_of_purity_on_hue_Abney_effect_in_various_conditions

The author manuscript discusses multiple purity/luminance conditions. Some stimulus coordinates are approximate, and some conditions explicitly did not record the needed desaturated coordinates. It was used for interpretation, not converted into invented exact XYZ reference-target pairs.

The literature comparison figure supplied by Coonie is reproduced/discussed in:
https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0119024

Its caption identifies illuminant C and shifted/exaggerated curves. Its Munsell, NCS, Pridmore, Ayama, MacAdam, and Robertson lines are not a common D65 numeric dataset. This fit does not claim to have fitted every named source in that illustration.

## Discovery repository

https://github.com/Grkmyldz148/color-perception-datasets
Discovery snapshot 8641f4e8ebd9d85a34dc0fedc116fa0e58493190.

Useful for routes and initial metadata, not treated as authoritative over the original numeric tables. The source-level white and magenta-red checks above are examples of why that distinction matters.

## Actual Release 1, not the earlier accepted ring

https://github.com/GayCoonie/HRL
Inspected commit 77bfa09375ba8814f5caea3c3b05b2a9c96d1081.

The public API in `src/index.mjs` declares `R15-D Release 1` and composes `CompleteModel` with the selected R15 curve/transport and `CapModel`. `picker-model.mjs` uses fitted ring density and intermediate angular maps. Therefore `src/data/srgb-hue-calibration.json`, named `coonie-accepted-hue-v1`, is not by itself proof of the final released H for each RGB edge entry.

`javascript/extract-release1-ring.mjs` recovers the angles through the complete released API, checks vivid R/L, and retains input RGB and XYZ. It can use a supplied checkout or download the pinned public files with Git-blob hash verification. `ReleaseRing` maps those actual H values to field labels and rejects reversals. The full release coefficient payload could not be loaded/executed in this sandbox; the extractor is supplied but its real-data output is **not** claimed to be present.

## Interpretation boundaries

Adaptation, source balance, smoothing, the white-completion magnitude rule, and extrapolation are explicit modeling choices. The observer sources constrain same-hue relationships, not a unique universal hue field, a unique angular spacing, or the metric on the regular bicone. Retrospective validation is reported as such. Source deletion, imaginary clipping in the fit, and an unreported substitute Release1 ring are not used to make the scores look better.

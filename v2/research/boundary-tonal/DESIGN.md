# Boundary and tonal construction: evidence and engineering choices

## Contracts carried forward

Reach R is chromaticness, K=1-L is blackness, and W=L-R is whiteness. The internal ratio U=R/L is not Reach. Level is brilliance/inverse blackness, not luminance, CIELAB lightness or GenSpace's first coordinate. Black dilution scales R and L; white dilution scales R and sends L toward one; fixed-Reach Level exchanges neutral content. The same learned R/L law is applied after each gamut's normalized source chart.

ZCAM (Safdar, Hardeberg and Luo, 2021, DOI 10.1364/OE.413659), Section 2, treats blackness and whiteness as joint lightness/chroma attributes. Its fitted Equations 17-19 are not the same as its conceptual equations and are not inserted as HRL shares. Briggs (2023), *The elements of colour II*, distinguishes brilliance and blackness from ordinary lightness. Nayatani and Sakai (2011, DOI 10.1002/col.20596) distinguish tonal coordinates from Munsell value with hue-dependent chromatic strength. These sources inform terminology and constraints; none prescribes the new coefficients or supplies fresh observer targets in this pass. Detailed original intake remains in ../tonal-semantics/DEFINITIONS.md and ../shared-rl/EVIDENCE.md.

The user's blue-sheet feedback is visual testimony motivating closer sampling, not an invented numeric preference table. GenSpace is a model-based ruler. COMBVD remains the only newly fitted human-observer dataset. Prior project development exposed the other evaluated datasets.

## Repaired physical reference domain

The physical cone is the convex hull of every row of the CIE 1931 2-degree CMF table at 1-nm intervals, 360-830 nm, intersected with 0 <= relative Y <= 1. The 471 rows yield 158 unsimplified hull vertices; the line of purples is included. The table is the exact frozen copy distributed in colour-science 0.4.7, with canonical float64 hash in boundary-1nm.json. Official CIE dataset DOI: 10.25039/CIE.DS.xvudnb9b. Direct retrieval of the official CSV failed during this run; we do not claim a new byte comparison against that CSV.

For the explicitly chosen piecewise-linear interpolation of XYZ CMFs, every between-wavelength direction and every nonnegative spectral mixture is inside this hull. This is a mathematical property of that representation, not a claim of an exact biological spectral boundary. The normalization map is defined using D65-relative radial coordinates in u-prime/v-prime and relative luminance.

For full-gamut realization, the inherited normalized source chart is transported between its old and new cones at fixed relative Y, chromaticity direction and radial fraction of the boundary. This supplies the missing physical directions without independently refitting a second gamut. It is not evidence that straight chromaticity rays are perceptually constant hue. The old hue identities are transported as labels; the new physical XYZ representing one label can change. Native sRGB's chart and boundary-only output remain unchanged.

The geometry-only control retains the exact 0.12 refined-balanced coefficients. It is intentionally different from the unchanged 0.12 parent so effects from geometry and fitting are visible separately.

## Ordinary import, not rejection or extra intensity

Source XYZ is adapted to D65 using the inherited Bradford context. Absolute XYZ is divided by target reference-white nits. Relative XYZ with an explicitly different source-white luminance is multiplied by sourceWhiteNits/targetWhiteNits. Unspecified sourceWhiteNits means the supplied relative values already use the target white scale. The ceiling is applied by scaling XYZ together, not independently clipping X or Z.

Finite imaginary chromaticity is projected radially from D65 onto the corrected cone. Native sRGB and other supported linear-RGB realizations subsequently map outside their native channel cube if needed. Mappings are recorded and many-to-one; no exact inverse to the original out-of-spec tuple is promised. No extra intensity coordinate is added. Bad types or nonfinite tuples remain errors. ColorBench uses this ordinary import and aborts unexpected conversion failures rather than omitting a NaN.

Nominal P3 and Rec.2020 input primaries are accepted via the mapped import. This does not introduce a native P3 profile or redefine the strict spectral locus to include an imaginary nominal primary. The inherited native-gamut factory still has its old descriptor restrictions.

## Shared tonal continuation

Seven invertible coupling layers use periodic Fourier functions of the shared hue angle. Each checkpoint has exactly one coefficient bank across gamuts, plus one bounded dark-curve parameter set. The source atlas, hue ring and fixed neutral shift are not optimized. Changing the boundary and normalized source changes some full-gamut data coordinates, which are regenerated before fitting. Native training keeps the original 3,331-pair mask exactly; full uses 3,813 pairs.

The new objective combines traditional weighted COMBVD squared STRESS, a smaller unweighted term, and synthetic regularizers. Generated paths cover black dilution, white dilution, neutral exchange and Reach. Per-hue mean/RMS risk and a smooth blue-region weight prevent a global average from hiding a difficult sheet. Whole-sheet vector derivatives are evaluated in the equilateral x=sqrt(3)R/2, z=L-R/2 basis, not an orthogonal R,L plane. Dark-side and already-good-hue guards refer to the prior reviewed model, not to paper-derived observer measurements.

A new analytic Jacobian propagates derivatives through the existing invertible couplings and implicit inverse dark curve. Its equilateral condition number is obtained from the trace and determinant of J-transpose-J; the determinant is propagated multiplicatively to avoid cancellation. The regularizer penalizes log-condition above a specified threshold on the same normalized points in every gamut. The stronger continuation includes exact neighboring blue hues and both mean and RMS tail risk. This derivative is not the gamut-dependent XYZ Jacobian, nor a human-perceptual metric.

The initial raw-Hessian trials added very small edge stencils, whose surrogate derivatives dominated the objective. Those runs were not selected. The successful continuation uses a bounded-influence log1p bending term and bicubic interpolation of the exact GenSpace training grid. Bicubic interpolation is only an optimizer approximation and is not trusted as proof of output smoothness. All final visual, path and sheet checks use the actual JavaScript inverse; source grid binaries are not required by the runtime.

## Separate evaluation populations

The normal development report gives weighted and unweighted COMBVD on the same 3,331 unmodified native pairs, plus the full 3,813. ColorBench separately reports all 3,813 mapped native pairs, with 482 affected pairs, and all 3,813 full pairs. The larger native population is not silently substituted for the normal score.

The original Python ColorBench judges and helper remain unchanged. Only its five scored generation and sixteen scored measurement columns run. Its finite-ellipsoid construction, upstream skips and negative-XYZ preprocessing are retained; no tensor rescaling or local-derivative replacement is included. Frozen selection precedes that scored evaluation. A mapped result is a pipeline result, not a claim every original probe was physical. No overall rank is manufactured from the heterogeneous columns.

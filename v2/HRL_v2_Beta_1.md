# HRL v2 Beta 1

## Definition, construction, evidence, and the road from r0 and Release 1

**Publication date:** 18 September 2026  
**Release identifier:** `2.0.0-beta.1`  
**Selected definition:** the **metric-leaning / `metric-b2`** checkpoint of HRL 0.13 boundary-and-tonal research  
**Default realization:** native sRGB; a full physical-reference realization is also supplied.

[Open Beta 1](beta1.html) · [Release manifest](default.json) · [Benchmarks](benchmarks.html) · [Preserved comparison](boundary-tonal.html) · [Research archive](archive.html) · [All files](../library.html)

This is the first named beta release of the current HRL v2 construction. It is a **promotion of an existing, frozen color-space definition, not another numerical refit**. Its coordinates, learned coefficients, source charts, boundary, and existing benchmark results are those of the selected metric-leaning checkpoint. The new public entry point, documentation, and navigation make that choice explicit. Release 1 remains available and is not silently redefined.

This document distinguishes the public coordinate contract, the physical realization of those coordinates, the learned transformations, input mapping, and empirical evidence. Those are related, but they are not interchangeable. In particular, a well-behaved inverse is not an observer experiment; a boundary repair is not a hue refit; and a coordinate called Level is not automatically luminance.

## 1. What HRL is trying to represent

HRL means **Hue, Reach, Level**. It describes a color using its position around a hue circle and its location in a triangle whose corners are **black, white, and the vivid endpoint of that hue**. Across hues, those triangles form a regular bicone.

The project is not trying to make every gamut look like a clipped copy of one monitor. Its geometric contract is common: zero-light black, D65 reference white, the same public coordinate ranges, and the same regular solid. Each realization supplies its own vivid boundary and its own normalized physical chart. Beta 1 then applies **one shared learned Reach/Level transformation** to those charts. Native sRGB is a genuine native construction, not the full reference solid clipped to an sRGB picture. [1, 2, 3]

The perceptual ambition is to make chromaticness and tonal progression useful together: to preserve recognizable hue families, give colors meaningful positions between black/white/vivid, and support a color-difference distance in the same solid. This ambition does not establish perfect perceptual uniformity. Beta 1 has measured strengths and remaining tradeoffs, especially in difficult blue sheets and in the tails of its coordinate conditioning.

## 2. The public coordinates and their meanings

A normalized HRL coordinate is an object `{H, R, L}` satisfying:

```text
H is finite, in degrees, interpreted cyclically modulo 360.
0 <= R <= L <= 1.
```

**Hue, H**, is the public angular label. It is not an HSV angle, a wavelength, or a raw chromaticity-plane angle. The same numerical H does not become a new color identity merely because a different display gamut is selected.

**Reach, R**, is the chromaticness coordinate: distance away from the neutral axis in the prescribed solid, scaled so the vivid endpoint has Reach one. The public term should not be replaced with the internal ratio `R/L`.

**Level, L**, is the coordinate of absence of blackness, or inverse blackness/brilliance in the project's terminology. It is **not** relative luminance Y, not CIELAB lightness for arbitrary chromatic colors, and not the first coordinate of HelmLab GenSpace. The word “Level” describes its role in HRL, not an identity with another model's scalar. [2, 4]

The associated shares are:

```text
chromaticness  R = R
whiteness      W = L - R
blackness      K = 1 - L

R + W + K = 1
```

These are barycentric shares in HRL's triangle. They are nonnegative throughout its legal domain. They are **not a recipe for mixing fixed XYZ stimuli, paint, light, or display channels**. The physical hue sheet can curve as these shares change.

The internal quantity `U = R/L`, defined as zero at black for computation, is the vivid fraction of the nonblack share. It is useful for invertible transformations; it is not what public Reach means. At fixed R, changing L changes U. At fixed U, reducing L reduces both R and L.

The corners of every hue triangle are:

| Corner | R | L | W | K |
|---|---:|---:|---:|---:|
| Black | 0 | 0 | 0 | 1 |
| White | 0 | 1 | 1 | 0 |
| Vivid | 1 | 1 | 0 | 0 |

All hue labels meet on the neutral axis, `R=0`. There H is a bookkeeping choice, not a chromatic distinction. A gray or black round trip should therefore be judged by its physical color or embedding, not by demanding recovery of an otherwise unobservable hue label.

## 3. Why the solid really is a regular bicone

For a single hue, use equilateral coordinates:

```text
x = (sqrt(3)/2) R
z = L - R/2
```

Black is `(0,0)`, white is `(0,1)`, and vivid is `(sqrt(3)/2,1/2)`. Every side has length one. Rotating the triangle about its black–white axis gives the regular bicone.

The public Cartesian embedding, in the component order used by the implementation, is:

```text
theta = H * pi/180
E(H,R,L) = [L - R/2,
            (sqrt(3)/2) R cos(theta),
            (sqrt(3)/2) R sin(theta)]
```

The HRL distance is ordinary Euclidean chord distance **after this embedding**:

```text
d(a,b) = norm(E(a) - E(b))
```

It is not Euclidean distance in the three raw numbers H, R, L. Nor is it distance in an orthogonal R–L rectangle, a shortest path around the surface, or a substituted external color-difference formula. At a fixed hue its squared distance is `dR² - dR*dL + dL²`. For arbitrary hues, direct expansion gives:

```text
d² = dR² - dR*dL + dL² + 3 R1 R2 sin²((theta1-theta2)/2)
```

This identity is a derivation from the embedding, not an extra fit. It makes the cyclic hue behavior and the disappearance of hue distance at zero Reach explicit. The black–white distance is one in normalized units. A scale factor can change displayed distance units without changing the geometry. [1, 5]

## 4. What is common across gamuts, and what is not

Beta 1's standard public factory offers `srgb` and `full`.

**Native sRGB** uses the sRGB cube and its own actual vivid edge intersections with the inherited hue family. For a legal native coordinate, its RGB output belongs to that cube up to numerical tolerance. It is not obtained by drawing the full-domain triangle and clipping the picture.

**Full** uses the declared physical chromaticity cone, bounded by a reference-relative luminance ceiling. Its hue triangle has the same abstract shape and corners in HRL coordinates, but its vivid endpoint normally differs physically from the sRGB endpoint. The “full” name refers to this explicitly bounded reference solid, not unbounded intensity or all possible visual contexts. [2, 6]

There are two different cross-gamut operations:

* To preserve a **stimulus**, convert through XYZ: `q2 = model2.fromXYZ(model1.toXYZ(q1))`. Use `importXYZ` rather than `fromXYZ` when mapping events matter. The target may be unable to represent the original stimulus exactly.
* To preserve a **relative position in the HRL solid**, reuse `{H,R,L}` in the other realization. This transports the coordinate relationship to that realization's boundary; it generally changes XYZ.

Those operations should not be conflated. Identical normalized coordinates do not promise identical physical colors across different vivid boundaries.

Black is zero light in both realizations. Relative D65 white is the same numerical XYZ:

```text
[0.9504559270516716, 1, 1.0890577507598787]
```

The one learned coefficient bank is also common. The physical source chart is not. This is how the project can retain both a common rule and real gamut-specific boundaries without hiding a learned “which gamut?” switch in the tonal fit. The underlying research code also explores additional RGB descriptors; that does not make every such descriptor a supported native Beta 1 profile.

## 5. The full physical-reference boundary

The full reference domain is the cone of nonnegative spectral mixtures under the declared CIE 1931 2-degree observer representation, intersected with:

```text
0 <= relative Y <= 1
```

X and Z are **not independently capped at one**. This is an emissive reference solid, not a spectral-reflectance or object-color solid. A chromaticity can be physically admitted while requiring unusually large X or Z at a chosen Y.

The repaired boundary is built from all **471 tabulated 1-nm rows from 360 through 830 nm**. Its unsimplified convex hull has **158 vertices** and includes the line-of-purples closure. “All 471 rows” and “158 hull vertices” describe different things: interior or collinear tabulated directions need not become separate convex-hull corners. [2, 7]

The exactness claim is limited and meaningful. With **piecewise-linear interpolation of the XYZ color-matching functions**, an interpolated wavelength lies in the cone generated by neighboring tabulated vectors, and a nonnegative spectral mixture lies in the same cone. The hull therefore covers that declared numerical representation. It is not a claim that a finite table exactly describes every observer's biological sensitivity.

The source is the frozen `colour-science 0.4.7` copy of the CIE table. The original repair record identifies official dataset DOI `10.25039/CIE.DS.xvudnb9b`, but explicitly says direct retrieval of the official CSV failed during preparation. This publication does not turn that into a fresh official-byte comparison. The source-table SHA-256 is preserved in the repair evidence. [7]

### Boundary transport is not a fresh hue experiment

The pre-repair full chart is transported to the repaired cone at fixed relative Y, fixed direction from D65 in u′v′, and fixed fraction of the radial distance to the boundary. Let:

```text
u' = 4X / (X + 15Y + 3Z)
v' = 9Y / (X + 15Y + 3Z)
```

The transport keeps the D65-relative direction and the boundary-normalized radius, while allowing the physical endpoint to move. Its geometric angle is **not public HRL Hue**. The inherited hue labels travel with the chart; the repair does not assert that straight u′v′ rays are perceptually constant hue. [2, 7]

The boundary-only control on the comparison page retains the old 0.12 coefficients. It isolates this physical change from the subsequent tonal fitting. Its native-sRGB output is unchanged. Its full-domain output can change because the cone changed.

## 6. Hue identity, angular spacing, and inherited evidence

Three layers must be distinguished: a physical color's position, its constant-hue-family label, and the angular spacing assigned to that label around HRL's circle.

The v2 lineage attached its hue labels to the **actual 1,530 released sRGB vivid-edge angles** recovered through the complete Release 1 API. The earlier accepted calibration table alone was not treated as sufficient: Release 1 has further angular transforms. `data/release1-angles.json` and `expandReleaseAngles` preserve the later, executable extraction. The older observer-source audit contains historical “not yet executed here” statements; those dated statements should not overwrite the subsequent extraction record. [8, 9]

The current source uses the OPAL-era `hue-field-0.6.json` family. Beta 1 does not refit that field or add another angular-density remap. Its checkpoint has `ring_logits: null`; the seven tonal layers preserve the source hue label. That is a claim about this continuation, **not** a claim that all v2 interior hue sheets are identical to Release 1 or r0.

The inherited source audit distinguishes direct constant-hue tables, Munsell renotation relationships, adaptation assumptions, and problematic rows. Examples include Ebner–Fairchild targets, Hung–Berns loci, and a declared Munsell subset. In the Hung–Berns material, inconsistent magenta-red variable-lightness rows were preserved but quarantined rather than silently repaired. Literature illustrations were not fabricated into exact numerical matches. [9, 10]

These datasets constrain relationships among colors; they do not uniquely determine angular density, every unsampled hue trajectory, or the metric on the bicone. Above the inherited field's fitted magnitude range, the corrected full construction holds the last fitted angular slice. That is a declared **continuation rule**, not evidence from new high-magnitude observers. Beta 1 inherits this limitation. [6]

## 7. From physical color to the normalized source chart

The delivered model is a composition, not a single three-line replacement for RGB. Its stored data are part of its definition.

Conceptually, conversion proceeds as:

```text
physical XYZ
  -> gamut-specific base hue chart
  -> inherited monotone source atlas
  -> shared invertible tonal transformation
  -> public HRL
```

For full-domain XYZ, the repaired-boundary transport is included at the physical/source interface. The opposite direction reverses the same construction. Input mapping, when necessary, happens before this reversible part.

The inherited base charts describe different physical solids. The source atlas provides normalized positions on each chart. It uses path constructions originally informed by the project's auxiliary brightness/chromatic-content readouts and the gamut's **own** vivid endpoint. The current model is therefore **not simply “GenSpace with new axes”**. GenSpace is important in the later fitting losses, but earlier OPAL-derived source structure remains in the executable chain. [3, 10]

For clarity, write the source atlas's internal nonblack ratio as `s`, and its initial tonal parameter as `l`. The base parameter is obtained using the inherited inverse-normalized-L* curve:

```text
Q(l) = 2700*l/24389                for l <= 0.08
       ((25*l + 4)/29)^3          otherwise

baseL = Q(l)
baseR = s * Q(l)
```

The monotone atlas then supplies a source Level and a source Reach ratio. In the implementation's order:

```text
L_source = A_level(H, s, l)
U_source = A_reach(H, L_source, s)
R_source = L_source * U_source
```

The inverse first inverts the Reach atlas for s, then the Level atlas for l. The selected source uses the C1 atlas implementation. These interpolation rules and frozen tables are part of the reproducible model, not decorative approximations of a different continuous definition. [3, 11]

On neutral colors, the later tonal map includes a small fixed neutral shift. Thus the complete public neutral curve must not be advertised as exactly unshifted CIE L*. If `F` is the unit warp below and `n` is the fixed shift, its inherited neutral relation is `Y = Q(F(L, -n))`. The new metric-leaning fit does not optimize this neutral progression.

## 8. The seven shared tonal coupling layers

The central learned map is easiest to understand in `(U,L)`, with `U=R/L`. This is an internal parameterization of the same triangle.

Define the endpoint-preserving unit warp:

```text
F(x,t) = x / [x + (1-x) exp(-t)]
F(0,t) = 0
F(1,t) = 1
F_inverse(x,t) = F(x,-t)
```

For interior x this is a translation of log-odds. The runtime uses algebraically equivalent branches for numerical stability. Define also:

```text
B(t) = 8 tanh(t/8)
```

Each layer has five periodic coefficient functions `c0(H)` through `c4(H)`. Each is a constant plus cosine/sine pairs through the sixth harmonic:

```text
c(H) = a0 + sum(k=1..6) [ak cos(k theta) + bk sin(k theta)]
```

Starting from source U and L, the forward map first applies the fixed neutral shift:

```text
L = F(L_source, 0.02686567756674324)
```

It then applies seven layers in stored order:

```text
L = F(L, B(U * [c0 + c1*(2U-1)]))
v = 2L - 1
U = F(U, B(c2 + c3*v + c4*v*v))
```

The second update uses the **new** L. To invert a layer, undo its U update using the current L, then undo its L update using the recovered U. Traverse layers in reverse order and undo the neutral shift last. No numerical XYZ interpolation is inserted into these coupling equations. [11, 12]

The checkpoint contains **one bank of seven layers, five functions per layer, thirteen Fourier coefficients per function**: 455 coupling coefficients. There is no separately trained native bank and full bank in this release. Historic records that say `gamut_calibration: separate` belong to earlier stages and should not be confused with this checkpoint's `shared` field.

The transformations preserve the triangle boundaries and the three corners. They can, and intentionally do, change progress along a boundary. “Preserves an arm” means the same endpoint-connected boundary remains the boundary; it does not mean every interior parameter value on that arm has the same XYZ as before fitting.

## 9. The bounded dark-side continuation

After the seven coupling layers, a further shared dark-curve transformation acts at the same U. Its amount is:

```text
a(H,U) = 0.85 * sigmoid(d(H)) * U²
```

Here `d(H)` is another periodic Fourier series, through the third harmonic, with seven stored coefficients. Define:

```text
phi(t,a) = t * [1 - a*(1-t)²]
```

The source-to-public direction solves:

```text
phi(L_public, a) = L_coupled
R_public = U * L_public
```

The public-to-source direction evaluates phi directly before reversing the coupling layers. Since `0 <= a < 0.85`, its derivative

```text
1 - a*(1-t)*(1-3t)
```

stays positive on the unit interval; in particular it is bounded below by `1-a`. The implementation uses safeguarded Newton/bisection for the inverse. This makes the dark adjustment monotone without pretending every part of the overall color conversion has a closed-form inverse. [12]

The U² factor switches this correction off on neutrals. It also prevents this learned dark adjustment from becoming an unrelated replacement gray ruler. Its direction and amount should be evaluated in the complete model, not inferred solely from the name “dark.”

## 10. Black, white, and neutral-exchange operations

The public API exports three different operations. For an amount `a` in `[0,1]`:

```text
addBlack:
  R' = (1-a) R
  L' = (1-a) L

addWhite:
  R' = (1-a) R
  L' = a + (1-a) L

exchangeNeutral by delta:
  R' = R
  L' = L + delta
  R-L <= delta <= 1-L
```

Black dilution preserves the R:W ratio. White dilution preserves the R:K ratio. Neutral exchange transfers an absolute share between K and W while keeping R fixed. These distinctions are useful both in a picker and when judging a generated tonal sequence. Increasing Level at fixed Reach is not the same operation as adding white. [4]

For example, `{R:.3,L:.6}` has shares R=.3, W=.3, K=.4. Adding half black gives `{R:.15,L:.3}`. Adding half white gives `{R:.15,L:.8}`. Exchanging .2 of black for white gives `{R:.3,L:.8}`. The latter two have the same Level but different Reach and different shares. This example follows the coordinate algebra; it does not claim an exact physical mixing correspondence.

## 11. Reference white, luminance units, and the ceiling

Public XYZ defaults to D65-relative values with reference-white Y=1. `referenceWhiteNits` defaults to **300 cd/m²**. That setting defines the connection between relative XYZ and absolute units; it does not create a fourth HRL coordinate. [1, 6]

The input context supports a declared source white, Bradford adaptation to D65, and an explicit XYZ scale. For XYZ whose white is represented near Y=100, specify `xyzScale:100`; the library does not guess the units from magnitude.

Absolute XYZ is divided by the target reference-white luminance. Relative XYZ with an explicitly different source-white luminance is additionally multiplied by `sourceWhiteNits / referenceWhiteNits`. Without that source setting, supplied relative XYZ already uses the target white scale. An absolute input together with `sourceWhiteNits` is rejected as an ambiguous double intensity specification. [1, 2]

For above-ceiling Y, the ordinary bounded import scales the entire XYZ vector to Y=1. It does not separately clamp X and Z, and it does not call an ordinary above-white stimulus an imaginary chromaticity. This is a many-to-one admission policy for the chosen bounded solid.

Equal **relative** inputs at 100 and 300 nits give the same coordinates in this construction. That is unit-scale invariance, not a new empirical claim about appearance at two adaptation luminances. Equal **absolute** inputs can yield different relative coordinates when the chosen reference white changes.

## 12. Ordinary import mapping and its audit trail

Beta 1 retains the selected checkpoint's ordinary mapped import. Finite out-of-spec tuples are converted according to explicit rules rather than silently removed from a benchmark. Nonfinite values, invalid types, invalid coordinate objects, and invalid unit declarations remain errors. [1, 2]

For imaginary input, the physical-cone preparation can map nonpositive-Y input to black, invalid chromaticity directions to the neutral at that Y, or a finite nonphysical chromaticity radially to the cone boundary at fixed Y. An above-ceiling stimulus is then scaled as described above. Native sRGB additionally clamps outside-cube **linear** sRGB channels where necessary. These are separate events, not one undifferentiated “clipping” flag.

Use `importXYZ()` when provenance matters. Its result contains the coordinates, original relative XYZ, mapped XYZ, an event list, boundary identifier, and a hue-continuation flag. Possible events include `chromaticity-clipped`, `luminance-clipped`, `imaginary-to-black`, `imaginary-to-neutral`, and `srgb-gamut-clipped`.

`fromXYZ()` is a convenience that returns just the coordinates. It cannot carry the full import audit in those three numbers. A mapped round trip recovers the **mapped stimulus**, not the original unsupported input. The release factory deliberately fixes this policy; historical factories' optional strict-import flags should not be assumed to override Beta 1's mapping.

Accepting nominal P3 or Rec.2020 **XYZ input through mapping** is not the same as supplying a native P3 or Rec.2020 Beta 1 realization. The selected release exposes native sRGB and full. This distinction is especially important when a nominal RGB primary falls just outside the declared physical cone or the inherited native-descriptor validator.

## 13. Pseudo-RGB, display previews, and integer packing

The full reference implementation has a separate three-channel carrier for its bounded physical domain. In that carrier, `max(pseudoRGB) = relative Y`; chromaticity is encoded using boundary-relative geometry and independent carrier landmarks. These channels are not ordinary display RGB. They do not define HRL hue identity. [6]

Floating conversion and 16-bit packing are distinct. `encode16` rounds into unsigned channel codes; it does not promise exact recovery of an arbitrary unquantized XYZ tuple. Exact tested integer-code round trips establish the behavior of those tested codes, not exhaustive coverage of all 2^48 possible codes or a new observer result.

A full-domain color shown in a browser still needs a display representation. The picker converts XYZ for an sRGB preview and explicitly marks clipping. Its exported relative XYZ remains the model output, not the clipped canvas pixel. The full model's ordinary `toRGB()` is intentionally not a silently clipped sRGB renderer; use XYZ and make the display conversion explicit.

## 14. What was actually fitted for this checkpoint

The immediate parent is **0.12 refined balanced after the boundary-only transport**. The record also retains older ancestry names such as A Smooth; that older `parent` field is not a complete description of the immediate optimization starting point. [7, 13]

The newly fitted human-observer objective is **COMBVD**, with traditional weighted STRESS and a smaller unweighted contribution. Native training retains its original 3,331-pair mask; full uses 3,813 pairs. The two gamut objectives have equal recorded weights. Neither the source atlas nor the hue ring nor the fixed neutral shift is newly optimized in this pass.

Synthetic regularizers use the frozen **HelmLab 1.0.0 GenSpace vector**, not just its first coordinate, for black dilution, white dilution, neutral exchange, and fixed-Level Reach paths. They also examine whole-sheet bending in equilateral coordinates, difficult blue regions, parent-relative safeguards, and a common-coordinate Jacobian-conditioning penalty. GenSpace is a model-based ruler here; it is not another set of direct observer ratings.

The successful fit uses a bicubic training surrogate and a bounded-influence `log1p` bending penalty. Final reported path and sheet diagnostics use the actual JavaScript inverse rather than claiming that the surrogate proves smooth output. The record preserves abandoned/OOM trials separately from completed trials. No Oklab target or new scalar-lightness power target was introduced. [2, 7, 13]

The metric-leaning trial is `metric-b2`. Selection was frozen before the subsequent scored ColorBench run. Earlier project work had already exposed evaluation datasets, however, so this chronology does not make the results pristine external validation.

## 15. The measurements, with populations kept separate

Lower STRESS is better. The following are the selected checkpoint's **already published** measurements; naming Beta 1 did not rerun or improve them.

| Population and realization | Weighted STRESS | Unweighted STRESS | Pairs | Mapped pairs |
|---|---:|---:|---:|---:|
| Normal development: native sRGB | 29.107048 | 30.712588 | 3,331 | 0 |
| Normal development: full | 29.948555 | 32.127880 | 3,813 | 0 |
| ColorBench all-input mapped: native sRGB | 34.489196 | 38.126339 | 3,813 | 482 |
| ColorBench all-input mapped: full | 29.948555 | 32.127880 | 3,813 | 0 |

The first native row must not be silently replaced with the larger mapped native population. Equally, the native and full retained rows are not a controlled same-stimulus comparison: full includes 482 additional pairs. COMBVD was fitted; these are development scores, not held-out success rates. [7]

Against the same-pipeline 0.12 parent, weighted retained STRESS changes from **29.281170 to 29.107048** in native sRGB, and **30.219766 to 29.948555** in full. The full boundary-only control scores **30.208686**, separating the small geometry effect from the subsequent learned change.

The original ColorBench five generation and sixteen measurement columns are retained individually in the [complete report](research/boundary-tonal/results/REPORT.md) and [raw JSON](research/boundary-tonal/results/colorbench.json). Its Python judges, finite-ellipsoid construction, scales, and upstream preprocessing remain as recorded. A dagger denotes mapped inputs, not omitted inputs. No single overall rank is invented from heterogeneous test columns.

## 16. Why “metric-leaning” does not mean “best at everything”

The selected candidate improves the reported COMBVD aggregate, but its synthetic path regularity is not uniformly better than the boundary-only control. For example, native average black-path CV is **0.222288** rather than **0.219080**, and native mean sheet bending is **0.464887** rather than **0.459986**. Full mean sheet bending is **0.718056**, compared with **0.653031** for boundary-only. These are diagnostics in a chosen model ruler, not observer preference percentages. [7]

The stronger balanced sibling substantially reduces some conditioning tails but does not win the same metric tradeoff. On the reported common-coordinate grid, the metric candidate's median condition is about **2.51635**, while its maximum remains about **113,447.9**. The balanced sibling's maximum is about **25,197.9**. A reasonable median does not erase an extreme tail, and positive sampled Jacobians do not alone establish perceptual smoothness everywhere.

The report also retains narrow-blue structure, white-corner retreat counts, and small directional reversals in the chosen ruler. These are reasons to preserve the control comparisons and call this a beta, rather than to claim a universally superior final space.

Numerical verification is nevertheless strong within its stated samples: maximum embedding round-trip errors for the selected metric model are approximately **1.67e-11 native** and **4.32e-12 full**. Such errors quantify implementation consistency, not human color-difference error. The report distinguishes random tests, integer tests, and boundary coverage instead of calling them an exhaustive proof.

## 17. Relation to r0: the original appearance reference

Here **r0** means the early accepted, appearance-oriented HRL reference used during the Release 1 tuning history. It is **not** v2's observer-field 0.1, the native 0.2 model, or merely any file with an early version number.

The recovered project discussions identify r0's smooth hue triangles and accepted vivid ring as important visual references. Coonie's later feedback explicitly distinguished the desirability of those interiors from the gains obtained by stronger metric fitting. This is first-person visual design evidence, not a synthetic observer table. The current publication does not convert that preference into invented numerical r0 targets.

There is also executable evidence in Release 1 itself. `src/model/picker-model.mjs` retains an `r0Accepted` hue lookup, while `src/model/algorithmic.mjs` explicitly implements an **R0-guided R15 warp**. The latter is a table-driven interior residual with hue interpolation and boundary/interior gates. Its existence supports a concrete statement: the road to Release 1 did not simply discard r0; it used r0-derived guidance while retaining later fitted structure. [5, 14]

That evidence has limits. An `r0Accepted` lookup is not a complete r0 forward/inverse model. A residual toward an r0-derived field is not the original field itself. No independently identified, complete r0 factory was recovered for this publication, so this document does **not** publish a made-up closed-form r0 definition or a supposedly comparable fresh r0 benchmark row. The historical archived name `smooth-r0-w0.25` is a retrieval clue, not proof that an arbitrary early prototype is the same model.

The useful comparison is therefore architectural and evidential: r0 supplied an appearance-first reference and visual continuity; Release 1 layered difference-oriented fitting and local interior repairs onto that lineage; Beta 1 reconstructs the broader physical/gamut architecture and makes the current metric-versus-regularity tradeoff explicit. This does not establish that Beta 1 visually beats r0 on every sheet. A future direct comparison needs the exact r0 runtime and matching stimulus/pipeline conditions.

## 18. Relation to R15-D Release 1

Release 1 is an actual executable reference, not merely a historical label. `src/index.mjs` declares **R15-D Release 1**, loads the selected `observer15` curve and transport, and composes them with the selected **D** cap/interior model. Native sRGB uses the complete fitted model; the Rec.2020 realization uses the existing wide-gamut appearance projector with the corresponding coordinate layers. [5]

| Aspect | Release 1 | v2 Beta 1 |
|---|---|---|
| Public solid | Regular HRL bicone | Same regular HRL bicone contract |
| Main entry point | `src/index.mjs` | `v2/index.mjs` |
| Named definition | R15-D | Frozen 0.13 metric-b2 |
| Standard realizations here | sRGB, Rec.2020 | Native sRGB, full reference cone |
| Physical construction | Native fitted and wide-gamut projector lineage | Native/full source charts with repaired full boundary |
| Interior mechanism | R15 curve/transport plus algorithmic/cap residual construction | Seven shared coupling layers plus bounded dark continuation |
| Full spectral/Y domain | Not the Beta 1 full-reference construction | Declared 1-nm cone with relative Y ceiling |
| Ordinary unsupported XYZ | Release 1 rejects outside its selected RGB gamut, apart from tolerance | Beta 1 explicitly maps and reports events |
| Role of released hue ring | Result of complete v1 angular transforms | Actual v1 vivid angles anchor the inherited v2 hue labeling |

The unchanged bicone formula does **not** imply unchanged distances between physical colors. If a physical stimulus moves to a different public R/L/H coordinate under a new definition, its distance to another stimulus can change while the abstract solid remains regular.

Nor is the Release 1 API's older Rec.2020 support evidence that Beta 1's repaired full model has independent wide-gamut observer validation. Executability, geometric admission, numerical round trips, and observer accuracy are separate properties.

All v1 source/data remain untouched by this promotion. The root picker remains the Release 1 picker. Its navigation now points clearly to the current v2 release, rather than presenting a pile of successively added experiments as competing “latest” versions.

## 19. The intervening v2 stages, without erasing them

The preserved archive includes observer-field 0.1; native 0.2; BASR 0.4; Equal-Span 0.5; OPAL 0.6 and gamut-anchor 0.7; A Smooth; C1 and relative-domain experiments; native/full refits; shared R/L; tonal-operation diagnostics; 0.11 GenSpace tonal fitting; 0.12 refinements; the mapped-input audit; and 0.13 boundary/tonal fitting. [8, 10]

These are not all consecutive replacements of one identical API. Some are diagnostic labs, some alter source geometry, some change interpolation or import policy, and some train independent or shared coefficient banks. The archive labels their roles. An old page's historical claims stay attached to its own checkpoint; they are not silently upgraded to claims about Beta 1.

The former v2 landing page and the pre-beta READMEs are preserved as historical documents. Current navigation, a chronological archive, and the searchable file catalogue give separate ways to find the models, methods, JSON evidence, and original pages.

## 20. Using the Beta 1 reference implementation

Use Node 18 or newer, or serve the repository over HTTP in a browser. The model loads its own local ES modules and frozen data. Retain the repository layout; the entry module is not a self-contained single-file bundle. No training-grid cache is required for ordinary conversion.

```js
import {
  createHRLv2, VERSION, addBlack, addWhite, exchangeNeutral
} from './v2/index.mjs';

const native = await createHRLv2(); // native sRGB, metric-b2, 300-nit reference
const q = native.fromRGB([0.2, 0.5, 0.8]); // encoded sRGB, channels 0..1
const recoveredRGB = native.toRGB(q);
const xyz = native.toXYZ(q);
const darker = addBlack(q, 0.25);
const whiter = addWhite(q, 0.25);
const lessBlack = exchangeNeutral(q, Math.min(0.05, 1 - q.L));
const difference = native.distance(q, darker);

const full = await createHRLv2({gamut:'full', referenceWhiteNits:300});
const imported = full.importXYZ(xyz);
console.log(VERSION, native.release, imported.events);
console.log(full.toXYZ(imported.coordinates));
```

A declared scale/white example:

```js
const report = full.importXYZ([20, 30, 10], {
  xyzScale: 100,
  sourceWhite: [0.96422, 1, 0.82521]
});
const absoluteXYZ = full.toAbsoluteXYZ(report.coordinates);
```

For an explicit 100-nit source-white scale entering a 300-nit target context:

```js
const report2 = full.importXYZ([0.2, 0.3, 0.1], {sourceWhiteNits:100});
```

The facade accepts `gamut` and `referenceWhiteNits`. It deliberately does not accept a different checkpoint or arbitrary coefficient record under the Beta 1 label. Use the preserved research factory for comparisons:

```js
import {createSpectralTonalHRL} from './v2/research/boundary-tonal/index.mjs';
const control = await createSpectralTonalHRL({gamut:'srgb', checkpoint:'boundary'});
const sibling = await createSpectralTonalHRL({gamut:'srgb', checkpoint:'balanced'});
```

The historical `v2/lib/index.mjs` factory remains the earlier explicit BASR/linear prototype API. It is not the new release entry point. The root package entry remains Release 1; this promotion does not misrepresent a changed npm release.

## 21. Exact identity and reproduction

The [machine-readable manifest](default.json) records the release choice. The defining metric coefficient file is:

```text
v2/research/boundary-tonal/results/metric.json
SHA-256 92aa2f9647b406239dd52cd22feed61794f3d6ed74a1c33ba9361516cff3bb72
```

The boundary record is:

```text
v2/research/boundary-tonal/boundary-1nm.json
SHA-256 20542ab516a311a68ba8ab4131542254ee899b6cccaef7c89baf9f2c4dd79e67
```

The source snapshot reviewed for promotion is commit:

```text
bd1d9039d3c4390197099dcb53967baac2896505
```

The checkpoint file alone is not sufficient to reimplement the model: source atlases, hue-field data, release-angle attachment, interpolation, boundary transport, unit conventions, and inverse algorithms must agree as well. The source hash records and numerical verification accompany those components. [7, 13]

The original scored benchmark used ColorBench commit `12b2de215cc5020682e3d245a8c78bce5f0ebbc9` and the dataset-pool commit `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`. Its report includes separate normal retained-pair scores, mapped-input scores, raw events, and actual-inverse diagnostics. Reproducing those numbers requires the same input preparation and populations, not merely the same three coordinate names.

For the release-navigation checks supplied with this publication:

```sh
python -m pip install mistune
python site/build.py
node site/test-beta1.mjs
python site/check.py
```

The GitHub publication workflow additionally runs Chromium checks, records the generated-site preservation audit, and retains deployment evidence. Those checks test the release wrapper and website; they do not claim to have rerun the psychophysical fitting or manufacture a new benchmark victory.

## 22. Primary implementation and evidence sources

The numbered references below are paths to the actual source or frozen evidence used in this write-up. Derivations and examples in the text are identified as such. Historical project recollection in the r0 section is distinguished from executable evidence and is not used as a substitute coefficient packet.

1. [Repaired-domain runtime and ordinary import](research/boundary-tonal/index.mjs).
2. [Boundary/tonal design and source-role distinctions](research/boundary-tonal/DESIGN.md).
3. [Gamut-specific deterministic source charts](research/shared-rl/source.mjs) and [shared source construction notes](research/shared-rl/README.md).
4. [Tonal operations](research/tonal-semantics/operations.mjs) and [terminology/evidence analysis](research/tonal-semantics/DEFINITIONS.md).
5. [Release 1 entry point](../src/index.mjs), [cap construction](../src/model/cap.mjs), and [pre-promotion root README](../README.pre-beta1.md).
6. [Relative-domain definition](research/relative-domain/README.md), [geometry/carrier](research/relative-domain/geometry.mjs), [units and adaptation](research/relative-domain/context.mjs), and [high-magnitude continuation](research/relative-domain/base.mjs).
7. [Full 0.13 report](research/boundary-tonal/results/REPORT.md), [boundary verification](research/boundary-tonal/results/boundary-verification.json), and [scored data](research/boundary-tonal/results/colorbench.json).
8. [Pre-beta v2 README and dated lineage](README.pre-beta1.md), [release-angle data](data/release1-angles.json), and [historical library](lib/index.mjs).
9. [Original observer-field source audit](docs/OBSERVER_FIELD_0_1_SOURCE_AUDIT.md); read its execution-status statements as dated history, alongside the subsequent extraction record in reference 8.
10. [Equal-Span/OPAL research definition](research/equal-span/README.md), [A Smooth construction](a-smooth/index.mjs), and [source readout](a-smooth/source-readout.mjs).
11. [Source PathModel and atlas composition](lib/research.mjs), [C1 atlas](research/rl-c1/atlas.mjs), and [coupling equations](a-smooth/rl-core.mjs).
12. [Shared coupling/dark-curve implementation](research/shared-rl/core.mjs).
13. [Exact metric checkpoint](research/boundary-tonal/results/metric.json), [frozen selection](research/boundary-tonal/results/SELECTION.json), [numerical verification](research/boundary-tonal/results/verification.json), and [runtime finalization record](research/boundary-tonal/results/runtime-finalization.json).
14. [Release 1's retained r0 angle reference](../src/model/picker-model.mjs) and [R0-guided algorithmic interior warp](../src/model/algorithmic.mjs). These are concrete lineage evidence, not a claim that either file alone is the complete r0 model.

---

**In one sentence:** HRL v2 Beta 1 is the frozen metric-leaning, shared-tonal realization of HRL's regular hue bicone over native sRGB and a repaired full physical-reference domain, retaining r0/Release 1 lineage while making its geometry, mappings, fitted evidence, and unresolved tradeoffs explicit.

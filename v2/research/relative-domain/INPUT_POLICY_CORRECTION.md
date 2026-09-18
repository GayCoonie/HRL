# Correction: bounded luminance import and nominal RGB primary validation

This note supersedes earlier assistant-authored descriptions of rejection or an added intensity carrier as user-approved HRL requirements. It records the user's correction. It is not a new fit, a runtime deployment, or a rerun of the existing benchmark tables.

## Actual requested behavior

Coonie/Adam requested D65, relative luminance, and a configurable absolute reference-white luminance (300 nits by default, with 100-nit use also considered). In the earlier discussion of relative Y=1.2 the user explicitly allowed clipping ('I'd just clip it and take the L tbh') or interpreting the corresponding absolute luminance, such as 120 nits at a 100-nit source reference. The latest correction rejects an additional required intensity carrier and rejection solely for above-one luminance.

Earlier assistant-created plans, test configurations, API methods, and summaries do not establish consent to those choices. Discussion of source-independent HDR rendering is not authorization to make an extra intensity coordinate part of normal HRL import.

The intended ordinary import is: interpret source units/reference, convert through absolute luminance where necessary, normalize to HRL's declared reference, and apply the relative-Y ceiling of one. Return ordinary H/R/L. Do not reject an otherwise valid physical color solely because its input luminance exceeds that ceiling, and do not require an additional intensity field to accept it.

## Explicit mathematics

Let W_s be the absolute luminance assigned to a source reference white, and W_h the absolute luminance of HRL reference white. For already D65 relative XYZ v_s:

    v_abs = W_s * v_s
    u = v_abs / W_h
    v_HRL = u / max(1, u.Y)

For absolute XYZ input, start at v_abs directly. For relative XYZ without a distinct declared source scale, use W_s=W_h. A non-D65 reference is adapted consistently to D65 before the final ceiling. A source on a 0-100 XYZ scale is converted to a 0-1 ratio before these steps. Scale all three XYZ components together when limiting luminance; do not clamp X, Y, and Z separately. X and Z are not independently bounded by one.

Examples: Y=1.2 relative to a 100-nit source becomes 120 nits, then 0.4 relative to a 300-nit HRL reference. With the same 100-nit reference on both sides, it becomes 1.2 before the ceiling and 1 after it. With 300 nits on both sides, it becomes 360 nits before normalization, then 1.2, then 1.

The two reference scales are real input/output context, not per-sample denominators chosen after inspecting the color or a benchmark answer. Applying the ceiling is a declared, generally lossy import operation; exact inverse checks apply to the represented capped color, not to discarded excess luminance. This does not require an extra color coordinate.

## Where the implementation diverged

The existing relative-domain factory already defaults to overflow='clip'. The historical benchmark adapters overrode it with policy='reject' for their headline strict cases. The pending 1-nm boundary package additionally introduced toIntensityColor/fromIntensityColor. Neither the strict headline choice nor those added methods should be described as requested or approved by the user.

A diagnostic can still record which original inputs required ceiling handling. Such a count must be labeled luminance-capped/normalized, not a rejected color. Historical unchanged-input diagnostics can be retained as historical diagnostics, but must not stand in for the requested ordinary import behavior. Genuinely invalid chromaticities and malformed data remain separate categories.

This note does not retroactively change previous scores. The corrected ordinary-import benchmark will need a separately identified rerun. The legacy ellipsoid-unit/input-generation investigation also remains separate; capping luminance does not repair oversized or nonphysical chromaticity probes.

## P3 red: numerical physicality versus nominal encoding

ICC's primary documentation, supplied by Apple, specifies Display P3 red as x=0.68, y=0.32, z=0.00:
https://registry.color.org/rgb-registry/displayp3

The nominal standard is not a coordinate invented by our test. The current strict CIE 1931 table-based cone places that exact nominal point slightly outside. Recomputing the nearest point on the unsimplified 1-nm hull in the pending boundary package gives:

    nominal xy:       (0.6800000000000000, 0.3200000000000000)
    nearest hull xy:  (0.6799185808184495, 0.3199182653888368)
    Euclidean xy gap: 0.00011536736881098912

Both coordinates of the feasible neighbor round to the published nominal values at three decimal places. This calculation is consistent with a nominal-coordinate precision mismatch at the spectral boundary. It is not proof of the standard's historical derivation, a perceptual JND estimate, or a claim that real P3 displays emit imaginary light.

The numerical hull used the pinned colour-science 0.4.7 CMF copy recorded in the boundary audit. CIE publishes its observer data at 1-nm spacing; the prior audit did not obtain and byte-verify the official CSV:
https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer

Treating failure of exact spectral feasibility as a reason to reject an entire standardized RGB profile conflates different validation tasks. Strict physical-cone tests, exact nominal RGB conversion tests, and physical-boundary-compatible import tests need distinct expectations. Supporting P3 requires a documented compatibility treatment for these tiny nominal boundary discrepancies, without claiming a silently enlarged cone is exactly the original spectral cone or silently changing a standard primary. No new P3 compatibility implementation is claimed by this note.

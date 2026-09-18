# HRL 0.12 mapped-input rerun: execution plan

User request: restore ordinary conversion of out-of-spec inputs and rerun the 0.12 benchmarks before continuing tuning. Base commit: 3aff53aaf976c41874ec68fd583084ba1f08c6f3.

## Frozen scope

Keep both 0.12 hue-fair checkpoints (balanced and gentle), the 0.11 balanced comparison control, all coefficients, source atlases, hue/neutral definitions and the existing 0.12 polygon unchanged. Do not install the pending 0.13 spectral-boundary change, retune anything, or use an extra above-white intensity coordinate.

Use ColorBench 12b2de215cc5020682e3d245a8c78bce5f0ebbc9 and dataset pool 8641f4e8ebd9d85a34dc0fedc116fa0e58493190. Run its five scored generation and sixteen scored measurement columns with the original Python judging functions and original forwarding helper. Do not rescale ellipsoid tensors or substitute the local-derivative diagnostic. Preserve upstream skips and preprocessing exactly.

## Import policy

Relative or absolute XYZ is adapted to D65, normalized to the declared HRL white luminance, and mapped into the existing domain. A luminance ceiling scales XYZ together. Imaginary chromaticities use the existing D65-radial u'v' boundary projection. Nonpositive luminance maps to black. Native sRGB additionally needs explicit linear-channel boundary mapping: the historical clip switches alone do not perform this last native-gamut step. Already supported inputs must keep the same conversion. Source-white luminance can be supplied independently; unspecified source-white luminance means the input is already relative to the target reference.

Use ordinary three-coordinate H/R/L only. Mapping is many-to-one and does not promise exact recovery of an out-of-domain input. Type errors and nonfinite data remain errors rather than fabricated colors. Any unexpected conversion failure aborts the new benchmark instead of contributing a silent NaN or dropped center.

## Evidence and publication

Retain mapping reasons, counts, masks and actual contributing records. Record per-family COMBVD mapping, not a global flag applied to every subset. Native mapped totals will cover all 3,813 pairs; retain the historical 3,331-pair native overlap separately so a changed population is not called a fitted improvement. Full COMBVD should reproduce its original fully supported values.

Verify frozen hashes, unchanged supported-input results, ceiling/source-white examples and accepted nominal-primary inputs. Preserve the historical strict results untouched and publish new mapped scores with an explicit policy label. Update the comparison's benchmark evidence without changing its rendered triangles. Check the actual served and public page separately. No additional unscored benchmark suites or new optimization in this pass.

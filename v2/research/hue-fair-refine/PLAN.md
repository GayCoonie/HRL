# Balanced-parent hue-sheet refinement: pre-fit plan

Parent: HRL 0.11 Gen tonal balanced, SHA256 109555996bc49629f35397c9bdbc1c8edac8f4ce753fb86caf8ce885e43892f8. Repository starting point ff128f3fc9766b7ba164abcd33a738d3e5b33d02. Coonie requests continued actual fitting from balanced, smoother uneven hue triangles (especially blue), and benchmark improvements. No approved checkpoint will be replaced.

## Fixed meanings and scope

R is chromaticness; K=1-L; W=L-R. Level is inverse blackness/brilliance, not scalar lightness. Black dilution, white dilution, neutral exchange and Reach paths remain distinct. Use the existing frozen HelmLab GenSpace ruler, never Oklab in the new loss. Preserve one learned bank across native/full and the untrained Adobe RGB realization, as well as hue labels, hue ring, neutral progression, vivid anchors, source geometry and white handling.

## Diagnose before fitting

Rerun the balanced parent's actual hue-sheet diagnostics and inspect rendered blue/cyan, purple and several other hues. Separate uneven spacing, vector curvature, local corner retreats, map conditioning, source-field limitations and display quantization. A visually folded contour does not establish a negative Jacobian. Source atlas and inherited hue-field defects cannot necessarily be corrected solely by a coordinate remap; report that distinction.

## Planned changes

Start every fitting lineage from 0.11 balanced. Augment the previous mean path loss with per-hue and worst-path penalties so local failures cannot be purchased by improvements elsewhere. Add whole-sheet finite-difference regularity checks on the actual triangular domain, including near-neutral/low-Level regions absent from the old sparse path fans. Candidate terms include Hessian/gradient variation and local area/stretch concentration, interpreted in the regular equilateral embedding rather than assuming orthogonal R,L axes. Avoid imposing equal luminance across hues or identifying GenSpace distance with the public shares.

Use smooth periodic hue dependence; any extra blue emphasis is a documented engineering response to the user's feedback, not a new observer measurement. Test a conservative continuation and a more flexible continuation only if the latter earns its complexity. Include explicit parent-preservation guards for already satisfactory paths and dark-edge progress. Retain all trial coefficients, recipes, objective logs and initialization lineage.

Continue joint traditional weighted COMBVD with equal per-gamut objective weights and unchanged pair masks. Other scored observer datasets remain evaluation-only during this continuation. The papers support distinctions between tonal and ordinary lightness attributes, task dependence and hue-dependent interactions; they do not prescribe new numeric targets. Prior project exposure to evaluation datasets remains disclosed.

## Selection and verification

Select from training diagnostics and direct-runtime visual review, then freeze before the scored benchmark rerun. Verify exact Python/JS math, actual inverse rather than just a fitting grid, neutral/vivid/hue preservation, same bank across gamuts, round-trips including near black and exact 16-bit samples, positive interior Jacobians and conditioning. Compare old/new on identical dense hue sheets, report per-hue and tail statistics, and make residual blue failures visible.

Run only the five scored generation and sixteen scored measurement ColorBench columns with the existing pinned revisions. Keep strict, clipped and incomplete-support outputs separate, plus common/full-only COMBVD subsets. Publish additive code, trial history, results, previews and a served comparison linked from the site; verify actual public deployment separately from local browser success. Gains and regressions must both remain visible.

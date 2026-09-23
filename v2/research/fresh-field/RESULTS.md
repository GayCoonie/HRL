# Rebuilding Reach and Level from the physical chart

**Research status, 23 September 2026.** HRL v2 Beta 1 is still the named default. The frozen joint fit and the new physical-field records are comparison models. No new Reach/Level record has met the release gate. This report separates observations, tested failures, and the next model test.

## The apparent contradiction

The frozen joint fit makes the native H120 yellow sheet visibly more luminous. At H182.5, however, its light region swings green; at H273 it has a pale blue interior and a violet corner. These differences appear side by side in the [same-grid native comparison](results/native-comparison.png). The [full-domain comparison](results/full-comparison-display-clipped.png) labels its many sRGB-clipped pixels and cannot establish full-domain sheet quality; all numeric full-domain paths use original XYZ. The older [joint-fit viewer](../../joint.html) can vary the hue, gamut, and fixed Reach or fixed Level path.

An equal-grid direct audit found that the joint fit's average native white-to-vivid step-variation coefficient is **0.598** versus Beta 1's **0.198**; its black-to-vivid counterpart is **0.510** versus **0.266**. Those are sampled GenSpace path-speed proxies, not a direct measure of beauty. They help explain why one much better yellow can coexist with weaker sheets. For H273, the joint fit reduces a sampled near-gray lightness turn but expands a weak-chroma region. Use the pictures and the path measurements together.

## What was rebuilt

The first new candidate starts at the actual native or full *physical base chart*, not at a Beta 1 or joint tonal atlas. It keeps the bicone, vivid ring, gray ruler, source-gamut mapping, and pseudo-RGB carrier. It uses one learned record in both realizations. If `G(L)` is the established gray-axis nonblack value, `f_H` and `p_H` are monotone, endpoint-anchored CDFs of positive knot densities, and `g_H` is a bounded gain, its physical nonblack amount and purity are

```text
a = G(L) + [1-G(L)] g_H p_H(R)
s = f_H(R) / f_H(L).
```

Positive densities make the public triangle invertible and preserve its anchors. They do **not** ensure perceptual lightness increases along every fixed public Reach path. The unfitted seed has a sampled worst full-domain GenSpace J retreat of **0.12655**, versus **0.04742** for Beta 1 and **0.00608** for joint on that same audit grid. This is a counterexample to using mathematical invertibility alone as visual acceptance.

The initial optimizer cache used coordinates from the inherited tonal atlas and gave scores inconsistent with the new runtime. It was rejected and regenerated from the *physical* base XYZ and original observer pair identities. Rebuilt Python seed COMBVD matches actual JavaScript within 1e-11; 3,331 native and 3,813 full pair identities and off-grid inverse paths were checked. Fitted records were closed before the separate runtime benchmark.

## First two closed fits

Weighted COMBVD STRESS, **lower is better**. Native retained, native mapped-all, and full retained use distinct populations; all entries below use actual runtime coordinates and the same pair identities.

| Model | Native retained, 3,331 | Native mapped-all, 3,813 | Full retained, 3,813 |
| --- | ---: | ---: | ---: |
| Beta 1 | 29.107048 | 34.489196 | 29.948555 |
| Frozen joint | **26.795161** | **33.358237** | **26.902322** |
| Fresh visual-neutral, **failed** | 47.162313 | 48.075028 | 48.638045 |
| Fresh joint-graded, **failed** | 36.176614 | 39.274594 | 36.677658 |

The visual-neutral record smooths several native proxies (white-edge CV **0.208**, black-edge CV **0.124**) but loses badly on observer pairs. In full, its worst sampled fixed-Reach lightness retreat is **0.10198 J** and thus remains worse than Beta 1. The joint-graded record improves its training fit over the seed but keeps a broad pale H273 interior and has a full fixed-Reach drop **0.10937 J**; it is still worse than both established models on all three COMBVD populations. The [complete direct-runtime visual protocol and 24-hue tables](VISUAL_AUDIT.md) distinguish regular, shifted and adaptive hue grids and link compressed receipts. These failures are useful evidence, not release candidates.

The pinned original ColorBench judges were also run in both gamuts, 21 columns each. Joint-graded wins 13/21 columns over Beta 1 natively and 12/21 in full, while losing the main COMBVD aggregates. The columns have different units, some reproduce unchanged generation probes, and earlier development exposed the other datasets. Counts cannot be averaged into a general quality score or called independent validation. See the [complete judge-by-judge report](results/FRESH_V1_COLORBENCH.md), [baseline JSON](results/combvd-beta1-joint.json), and the two [failed](results/combvd-fresh-visual-neutral.json) [fit receipts](results/combvd-fresh-joint-graded.json). Records, imported runtime source, and upstream datasets are identified by SHA256 in the receipts.

## Structural finding and conditional follow-up

The first architecture forces physical purity at `(R,L)` to equal the white-edge purity at `R` divided by the white-edge purity at `L`. It also forces chromatic physical nonblack to sit at or above the neutral `G(L)` and ties its increment to Reach alone. Sampled inherited maps, especially blue, violate both constraints. Turning off the frozen joint fit's interior hue adjustment at its *fixed* coefficients worsens retained COMBVD from 26.795/26.902 to 43.537/46.815 (native/full). That ablation shows the joint record uses its hue adjustment; it does not prove a refitted model must use that exact adjustment.

The separately versioned [conditional architecture](../conditional-field/README.md) tests **conditional Reach and Level** from the physical chart. For public `u=R/L`, physical purity `s=F_H(u;L)` is a positive CDF conditional on Level, and physical nonblack `a=A_H(G(L);s)` is a second positive CDF conditional on purity, with `A_H(z;0)=z`. Inverse mapping first recovers Level from `a,s`, then `u` from `s,L`, then `R=uL`. Its Jacobian stays positive where `L>0`, the gray/vivid anchors stay exact, and the same coefficient bank runs natively and in full. This lets blue's white edge and interior differ, and allows chromatic lightness to fall on either side of gray without sacrificing an inverse.

It has now produced **two closed failed fits**. The first bank scores native retained/native mapped/full retained **37.307936 / 41.179734 / 32.610459**. The second strengthens the visual guard and scores **37.868645 / 40.537667 / 34.809360**. On an independent shifted-hue direct-runtime audit, the second still drops **0.06114 GenSpace J** in one full fixed-Reach step, above the Beta 1 comparison target **0.04742** measured on the earlier grid. Its held-out WITT source family also loses badly. Those hue grids are different protocols, so the two numerical maxima are targets rather than a paired estimate of effect. [Conditional results, input identities and direct receipts](../conditional-field/RESULTS.md) explain the exact populations and source-family split.

A further [bounded hue-flow extension](../conditional-hue/README.md) changes the interior hue after the conditional transport while preserving the gray axis and the vivid ring. Its first *coupled* closed fit scores **38.477101 / 40.809677 / 35.174370** (native retained / native mapped / full retained). These numbers still lose to Beta 1 and joint. A full pinned ColorBench board also completed: v4 improves **11 of 21 native** and **15 of 21 full** columns over Beta 1, but those heterogeneous columns cannot cancel its large pooled COMBVD deficit or certify appearance. See [every v4 judge, six source families, code and data identity](results/CONDITIONAL_V4_COLORBENCH.md). The v4 source family also contains a tiny numerical inverse repair and entry metadata change relative to the v3 source used for the earlier bank; this is not an isolated hue-only ablation.

The direct-runtime fixed public Reach audit on the *same* 72 regular plus 72 shifted hues, seven Reach paths and 65 points per path shows a real but narrower change:

| Model | Full worst total J retreat, regular / shifted | Full worst single J drop, regular / shifted |
| --- | ---: | ---: |
| Beta 1 | .25115 / .25205 | .03622 / .03295 |
| Frozen joint | **.01148 / .01270** | **.00481 / .00354** |
| Conditional v3 guarded | .08924 / .08033 | .03308 / .06114 |
| Conditional plus hue v4 coupled | .03926 / .04252 | .01808 / .01705 |
| Conditional plus hue v4 contact | .03067 / .02791 | .01759 / .00919 |

Thus the v4 fits reduce that full-domain reversal relative to Beta 1 and v3, while joint remains better on the same paths. The coupled bank's native worst total retreat is .00345/.00192 on this grid (joint .00517/.00510), and the contact bank reaches .000107/.000100; this one path measure does not settle native sheet quality. Low-Reach H273 saturation in the guarded v3 bank was only **.1698** at public `R=.1,L=.5`, versus Beta 1's **.6648** on the same physical chart: a pale interior survived generic path penalties. A separately named v4 contact-point trial raises the held-out H270/275/280 mean physical saturation from .18677 to .32065 and held-out native H117.5/122.5 yellow Y from .53504 to .60242. Independent direct sheet probes find native held-out blue relative GenSpace chroma **.12906** for contact versus **.25332** for Beta 1, and native held-out yellow Y **.60242** for contact versus **.70431** for joint. It brightens and saturates its predecessor but does not reach both stronger references. Its direct observer STRESS also worsens to **38.715122 native retained / 41.339157 native mapped / 35.773916 full**. The [complete pinned contact judge board and source manifest](results/CONDITIONAL_V4_BLUE_YELLOW_CONTACT_COLORBENCH.md) scores 42 cells with no rejected point. These are local material/geometry gains with a decisive pooled benchmark failure. The [final contact record, matched audit and exact replay](../conditional-hue-fit/RESULTS.md) and [native/full panels with unclipped probes](../conditional-hue/RESULTS_VISUAL.md) document that failed tradeoff.

## Release gate and next experiments

1. Prove physical-source parity, domain anchors, seam continuity, gray axis, pseudo-RGB closure, and mapped imports for the new record; check inverse round trips near black and at the vivid boundary. Hash every code dependency and closed record used by a scored run.
2. Redesign the fit objective around the observed failures: sample low Reach at *many* Levels and adjacent hues (the previous two-u occupancy penalty missed H273 `R=.1,L=.5`), regularize white and black edge step spacing and 2D interior curvature, penalize both single-step and accumulated fixed-Reach J retreat in native/full, and inspect H120 yellow plus H182.5 hue drift. Hold out neighboring hues and Level bands from each local material target. Do not use a sparse contact point as a proxy for a whole sheet.
3. Fit a bounded set of independent starts and visual/observer weights with the same v4 invertible conditional family, recording a Pareto table instead of declaring a winner from one scalar loss. Require the visual constraints on 72 regular and 72 shifted hues at multiple resolutions, plus matched Beta 1/joint controls and the H120/H182.5/H273 native sheet review. Evaluate full-domain GenSpace before sRGB display clipping. Reject candidates that merely move a reversal to a finer or shifted grid.
4. Benchmark **after** closing each record: all three COMBVD populations, six source families, and original 21-column ColorBench board, keeping correlated or previously seen datasets labeled as such. WITT was held out here but had been exposed previously; reserve both a source-family and hue-sector split and seek new independent observer measurements before claiming generalization. Track code, runtime resources, pair identities and immutable record hashes.
5. Promote only a single shared native/full bank that improves on Beta 1's visual defects without surrendering its observer performance; the stricter target is the frozen joint's retained native and full STRESS **26.795161 / 26.902322**, while eliminating its path and sheet regressions. A visual win with a metric loss remains research. Keep Beta 1 as default until a candidate passes direct-runtime, held-out, and visual review.

Reproduce the exact v1 transport with [`index.mjs`](index.mjs), [`model.mjs`](model.mjs), [seed](records/seed.json), and the [two](results/fresh-visual-neutral.json) [closed records](results/fresh-joint-graded.json). The [fitting script](fit.py) regenerates its hashed physical appearance grid; the [audit script](audit.mjs) samples actual runtime XYZ. See [`BENCHMARK.md`](BENCHMARK.md) for pinned judge invocation and the two Python/JavaScript adapters. The conditional and hue extensions live in [v3](../conditional-field/README.md) and [v4](../conditional-hue/README.md); their measured fit outcomes belong in separately labeled results. The complete old Beta 1, joint fit and failed attempts remain available in the [archive](../../archive.html).

# Independent technical review: reconstructed physical Level contours

Read-only review under the verify-work skill. Repository: `/workspace/scratch/a7884e7b2654/hrl-recovery`. Temporary diagnostics and this report were written outside the repository. No optimization, repository edits, publishing, Sites calls, or subagent delegation were performed. This report does not declare project completion.

## Verdicts

The structural contract is confirmed for the frozen records below. Quality remains limited by reproduced GenSpace lightness reversals on increasing-public-Level paths; global perceptual behavior is not established.

| Requirement | Verdict | Evidence and scope |
| --- | --- | --- |
| One shared sRGB/full coefficient bank | **Confirmed** | `index.mjs` line 10 and lines 17/24 apply the same record without a gamut argument. Both realization factories consume the same coefficient arrays; geometry differs only after the physical map. |
| Exact inherited gray ruler | **Confirmed** | At physical purity zero, both contour terms reduce exactly to identity; the fixed inherited neutral shift remains. All 1,025 gray samples per checkpoint/profile gave exactly zero XYZ difference from Beta1. |
| Exact vivid endpoints and fixed vivid hue ring | **Confirmed** | Endpoint-preserving powers/logit warps leave R=L=1 unchanged. All 720 vivid hues per checkpoint/profile gave exactly zero XYZ change. Additional strict-record hue comparisons against Beta1 differed by at most 1.022e-8 degrees. |
| Fixed pseudoRGB carrier | **Confirmed** | Carrier construction is retained through `createSpectralTonalHRL`; 512 direct carrier comparisons per gamut gave exactly identical XYZ to Beta1. All tested 16-bit carrier roundtrips were exact. |
| Level contour determined in the physical chart before Reach redistribution | **Confirmed** | `index.mjs` line 24 computes L from physical magnitude and purity using only rows 0–3; line 25 then computes public Reach. Changing Reach power coefficients leaves assigned L exactly unchanged on 1,000 physical points. All first four contour rows and the neutral shift are byte-value-identical to each candidate's pre-Reach record; their recorded parent hashes match. |
| Finite, invertible conversions | **Confirmed within tested numerical scope** | The two positive powers and endpoint-preserving logit maps have explicit reversed inverses. 12,288 XYZ roundtrips and physical-map roundtrips passed; 3,072 16-bit triplet roundtrips were exact. Invalid/nonfinite inputs were rejected. This is not a proof of floating-point invertibility for every subnormal value. |
| Retained mapped-import policy | **Confirmed** | Prototype replacement retains the original closure's exact model object. Above-white, imaginary, absolute-XYZ, source-white-scaled, and black probes produced identical events and mapped XYZ to Beta1 in both gamuts; mapped output roundtripped. |
| Python/JS transform parity, including final Reach refinement | **Confirmed for exercised samples** | Final fitter/refinement functions were extracted with Python AST without running either optimizer. Against 150 JS samples spanning near-black and ordinary coordinates, the maximum embedding difference was 2.221e-16 after the harmless coordinate-axis permutation. |
| GenSpace turn penalty credibility | **Confirmed as a sampled scalar-J diagnostic; inconclusive globally** | Corrected spline nodes agree to 1.111e-15. Direct-runtime versus interpolated contour checks agree closely in aggregate, with finite approximation errors detailed below. The diagnostic uses J, not all three GenSpace coordinates. |
| Monotone GenSpace J as public Level increases at fixed Reach | **Rejected** | Independent runtime reproduction finds substantial negative J steps for both final full-gamut candidates. This is distinct from monotone physical magnitude at fixed physical purity. |

## Material findings

1. **Quality / regression / high severity / high confidence:** final full-gamut increasing-Level paths at fixed public Reach can move sharply backward in GenSpace J. Locations: `index.mjs` line 17 (Level-dependent Reach-to-purity map), `refine-reach.py` line 35 (Reach objective), and the inherited physical geometry used by `index.mjs` line 30. Reach refinement optimizes observer score plus frequency regularization, without the preceding fitter's sampled public-U ordering penalty. This does not break the algebraic inverse or move the physical fixed-Level contours. It does prevent a universal J-ordering or perceptual-ordering claim. The seed already has some reversals, so attributing all of them solely to Reach refinement would be unsupported.

| Full-gamut record | Negative J steps | Worst J drop | H | Fixed R | Public L interval |
| --- | ---: | ---: | ---: | ---: | --- |
| seed | 190 | 0.103232238534 | 287.5 | 0.05 | 0.05 → 0.06484375 |
| strict | 833 | 0.30493953721 | 292.5 | 0.2 | 0.2 → 0.2125 |
| metric | 1187 | 0.524346352275 | 287.5 | 0.05 | 0.05 → 0.06484375 |

These values come from 72 offset hues, seven fixed R values, and 65 Levels per path. Metric's worst J goes from 0.629440444361 to 0.105094092086. Strict's worst J goes from 0.608414169838 to 0.303474632628. Follow-up: preserve this limitation in reporting and separately examine inherited physical geometry and Reach-induced path changes before claiming perceptual ordering.

2. **Quality / coverage / medium severity / high confidence:** the regularizer's name can be overread. `fit.py` line 56 computes `(TV(J) - abs(endpoint change))/2`; it detects scalar lightness backtracking. It does not measure bends or loops in the full GenSpace vector, constrain one preferred monotone direction, or prove behavior between sampled hues/Levels/purities. Training uses 18 hues and 11 Levels. Its near-gray cutoff is physical purity s≤0.25, which differs from a public U≤0.25 cutoff after Reach redistribution. Follow-up: label the measure as sampled GenSpace J backtracking and keep direct public-path diagnostics separate.

3. **Quality / numerical conditioning / low severity / high confidence:** the final Reach refinement increases numerical sensitivity in some native roundtrips. The observed maximum XYZ embedding roundtrip error is 8.109e-8 for native strict, compared with roughly 2e-11 for the seed. The chosen 1e-7 gate passes, and all sampled 16-bit roundtrips pass. Minimum sampled physical-coordinate Jacobian determinant on strict is 2.662e-5 for native and 7.996e-8 for full. Positive determinants support local invertibility but do not establish uniformly good conditioning.

Previously discovered issues were corrected before these final checks: the original 2D-per-hue prefilter was inconsistent with a subsequent 3D cubic lookup, and the original trigonometric feature function overflowed for huge finite hue values. The final 3D prefilter and wrapped hue implementation passed independent probes. Superseded coefficient results are not evidence for final candidates.

## Final runtime evidence

Each of the six checkpoint/profile combinations used 1,025 gray samples, 720 vivid hue samples, 2,048 XYZ roundtrips (including 128 near-black samples), 2,048 analytic physical-map roundtrips, and 512 16-bit triplets.

| Model | Gray XYZ change | Vivid XYZ change | Max XYZ embedding roundtrip error | Max physical-map embedding error | 16-bit mismatches |
| --- | ---: | ---: | ---: | ---: | ---: |
| srgb-seed | 0 | 0 | 2.01272e-11 | 3.33067e-16 | 0 |
| srgb-strict | 0 | 0 | 8.10905e-08 | 1.22125e-15 | 0 |
| srgb-metric | 0 | 0 | 5.48611e-08 | 7.77156e-16 | 0 |
| full-seed | 0 | 0 | 2.35745e-12 | 2.22045e-16 | 0 |
| full-strict | 0 | 0 | 3.08059e-12 | 1.22125e-15 | 0 |
| full-metric | 0 | 0 | 1.63421e-11 | 9.99201e-16 | 0 |

Additional strict-record checks used 512 samples per gamut: direct carrier XYZ change exactly zero; 46,080-degree hue offsets exactly zero XYZ change; positive interior Jacobian determinants. Five malformed/nonfinite XYZ cases and four invalid HRL cases per gamut were rejected. H=1e308 and Number.MAX_VALUE produced finite XYZ exactly matching their wrapped hues.

The inherited cache retains the exact original 3,331 native indices, all 3,813 full indices, responses, and weights. The source input SHA256 matches. No held-out observer score or new ColorBench result was produced by this review.

## Surrogate evidence

The actual 18-hue corrected grid reproduces 20,000 randomly chosen exact grid nodes per gamut within 1.111e-15. The old inconsistent prefilter failed this identity check by up to 0.0383 on the decimated grid.

Direct physical contours were evaluated using the frozen GenSpace runtime at 36 hues × 11 Levels × 89 purity values = 35,244 points per checkpoint/profile. The 36-hue comparison includes the 18 fit hues and 18 interleaved hues. Final-candidate maximum J interpolation errors ranged from 0.000589 to 0.001702. Maximum individual scalar turn disagreement reached 0.000963; the largest near-purity turn disagreement was 0.000144. Aggregate penalties:

| Candidate/profile | Direct penalty | Interpolated penalty |
| --- | ---: | ---: |
| strict/sRGB | 1.063663011e-6 | 1.063949437e-6 |
| strict/full | 5.281681787e-7 | 5.297018971e-7 |
| metric/sRGB | 0.0003205728682 | 0.0003205883172 |
| metric/full | 0.00006144457678 | 0.00006146843757 |

These comparisons support using the corrected lookup as an approximate regularizer for the exercised physical paths. Small aggregate error does not make every local value exact, and this check does not establish subjective preference.

## Commands actually run

All listed final executions exited **0**. Paths are absolute; all diagnostic scripts are outside the repository. The ordering script intentionally reports violations and exits successfully after collecting evidence, so its exit status is not an ordering pass.

```sh
node /workspace/scratch/a7884e7b2654/contour-review/revised-review.mjs
node /workspace/scratch/a7884e7b2654/contour-review/boundaries.mjs
python /workspace/scratch/a7884e7b2654/contour-review/cache-provenance.py
python /workspace/scratch/a7884e7b2654/contour-review/final-parity.py
node /workspace/scratch/a7884e7b2654/contour-review/revised-direct-grid.mjs
python /workspace/scratch/a7884e7b2654/contour-review/revised-turn-compare.py
node /workspace/scratch/a7884e7b2654/contour-review/ordering.mjs
```

Decisive outputs: `PASS bounded conversion, anchor, mapped-policy, and Reach-independence checks`; `PASS fixed carrier, hue, Jacobian, wrapped-hue and invalid-input checks`; `PASS Python/JS transform parity and corrected 3D prefilter node reconstruction`; `PASS cache population provenance`.

During construction of the scratch diagnostics, initial runs exited 1 for an embedding-axis expectation mismatch, a stale snapshot path, a scratch-script syntax typo, and a dependent comparison started before its final generated input existed. These harness issues were corrected and the final commands above rerun. They were not silently counted as passes and required no product-source edits. An exploratory repository search also exited 1 when no matching Markdown file was present; an initial guessed refinement filename did not exist and was corrected to the observed `refine-reach.py`.

Evidence files: `/workspace/scratch/a7884e7b2654/contour-review/revised/behavior.json`, `boundaries.json`, `ordering.json`, `turn-compare.log`, plus frozen record snapshots in the same directory.

## Source and record binding

Paths below are relative to `v2/research/level-contours/`. If these sources or records change, this review's binding must be reconsidered.

| File | SHA256 |
| --- | --- |
| `index.mjs` | `5fe40306fc27f3189422b15b2b1a062c8be16877926a48179bb6d337f6a5c69a` |
| `prepare.mjs` | `4dadef0b9e08e47e1a4e95fc090e82c36086b56ae274055e1f14e25a2ea907d7` |
| `fit.py` | `091c973b1bbf13b0f467f4d74ce2ca8b2e0b38c56b1e7681bd894a49a16524e9` |
| `refine-reach.py` | `3a0dd0466d77e942fb25af22afa2a4a86c99246958135a79cbd5c85207c64731` |
| `results/seed.json` | `e37fe3712493362118bc57d5aa6b1d4e65f0a35b543ff57df8669f038d13ad39` |
| `results/strict.json` | `8bcdc399cbead8a1a2763bce50215804458141734cc487e23d63f672ec81956a` |
| `results/metric.json` | `ccd59034734e1857e636b0b35a56db06ecfaa0eae7b7b0ff0d409cd45dc37de6` |
| `results/cache.json` | `c3ddfdc1a4f1f307b126a0b44ffef43806b7bb880125f376a4c927dce996d108` |

The source files were read in full. Runtime behavior is confirmed only to the precision and sample scopes above. Browser rendering, subjective visual quality, unseen-path extrema, and generalization to held-out observer data remain untested/inconclusive. No overall completion or promotion verdict is given.


## Guarded trial addendum

This addendum reviews the final bounded `guarded` trial independently. It does not supersede the earlier measured strict/metric records or change the default checkpoint. No optimizer or repository mutation was run by this reviewer.

**Verdict:** physical-contour invariants, anchors, sampled inverses, and Python/JS parity are **confirmed**. Elimination of fixed-Reach increasing-Level GenSpace J reversals is **rejected**. Near-gray backtracking below 0.001 J is **confirmed for all 504 sampled full-gamut paths** and **rejected for all-path compliance in native sRGB**, where seven sampled paths exceed that threshold. Universal perceptual behavior remains **inconclusive**.

### Invariants and implementation

The guarded record retains strict's first four contour coefficient rows, neutral shift, harmonics, identity-ring metadata, and shared-bank metadata exactly. Its parent hash is the previously reviewed frozen strict hash. `refine-order.py` line 35 replaces only rows 4–9, leaving physical Level contours fixed. The guard's physical inverse equations agree with the runtime. The current `index.mjs` differs from the previously hashed runtime solely by adding `guarded` to the checkpoint allowlist: removing exactly that token restores SHA256 `5fe40306fc27f3189422b15b2b1a062c8be16877926a48179bb6d337f6a5c69a`. Default remains `strict`.

The ordering guard is a **soft sampled penalty**, not a hard constraint. `refine-order.py` line 37 permits per-step J drops up to 0.0005 without excess loss, then adds mean-squared and maximum-squared excess penalties. It samples 18 hues, seven fixed R values, and 57 Level positions with denser spacing near the R=L edge. The optimizer stopped at its 100-iteration bound. These facts prohibit interpreting the record name as a monotonicity guarantee.

### Independent direct-runtime results

The review uses 72 hues offset by 2.5 degrees. Ordering checks use seven fixed R values and 65 equally spaced Levels per path. Near-gray checks use seven Levels, 257 public-U samples from 0 through 0.25 per path, and a 0.001-J turn threshold. Thus the direct hue and Level grids differ from the training grid; the surrogate maximum is not a bound on these results.

| Gamut | Negative ordering steps | Worst J drop | Near-gray paths over 0.001 | Worst near-gray turn |
| --- | ---: | ---: | ---: | ---: |
| srgb | 47 | 0.00165510795147 | 7/504 | 0.00128916093692 |
| full | 582 | 0.077566318382 | 0/504 | 0.000486813862246 |

The full-gamut worst step is **H=292.5, R=0.2, L=0.2 → 0.2125**, with J **0.608414169838 → 0.530847851456**. Its 0.077566318382 drop is smaller than frozen strict's 0.304939537210 and metric's 0.524346352275 on the same direct grid. It remains a material reversal. Native's worst step is **H=287.5, R=0.2, L=0.7875 → 0.8**, with J **0.603133514556 → 0.601478406605**.

Worst near-gray native turn occurs at H=12.5, L=0.02. Worst near-gray full turn occurs at H=62.5, L=0.12. The mean near-gray turn is 0.0000400272211 native and 0.0000168619207 full. No claim about untested hues, paths, or subjective preference follows.

The prior full-gamut source-seed diagnostic had a worst drop of 0.103232238534 on this grid. Therefore the guarded maximum is lower than that seed maximum, but counts and maxima do not establish global dominance or isolate the source of every reversal.

### Conversion and parity evidence

Fresh guarded checks in both gamuts used 1,025 gray samples, 720 vivid hues, 2,048 XYZ and analytic roundtrips including near-black coordinates, 512 16-bit triplets, mapped-import probes, and 1,000 physical-point Reach-independence probes. Gray/vivid differences from Beta1 were exactly zero. All 16-bit roundtrips were exact. Mapped events and mapped XYZ matched Beta1. Changing Reach power coefficients left physical-point L unchanged exactly.

Maximum XYZ embedding roundtrip error was **7.92837930724e-12 native** and **2.84731366864e-08 full**; maximum analytic physical-map error was **2.10942374679e-15**. Both pass the previously chosen 1e-7 XYZ and 1e-12 analytic gates. Actual `refine-order.py` functions were AST-extracted without running optimization, then compared with 50 JS samples: maximum embedding difference **2.22044604925e-16**.

Recorded COMBVD training scores are weighted 34.5213583420 native and 34.7788063251 full, with unweighted 34.3366372995 and 36.2250105221. These values were read from guarded metadata; this addendum independently verifies transform parity, not a fresh full-population score recomputation. They remain training evidence.

### Commands and binding

All three final commands exited **0**; there were no failed guarded diagnostic runs. As before, successful execution of the measurement script does not mean its measured ordering property passed.

```sh
node /workspace/scratch/a7884e7b2654/contour-review/guarded-review.mjs
node /workspace/scratch/a7884e7b2654/contour-review/guarded-diagnostics.mjs
python /workspace/scratch/a7884e7b2654/contour-review/guarded-parity.py
```

Additional read-only Python assertions verified unchanged contour rows, source-only checkpoint extension, metadata identity, and the parent record hash; those commands exited 0. Evidence is in `/workspace/scratch/a7884e7b2654/contour-review/guarded/behavior.json`, `diagnostics.json`, `parity-result.json`, and the frozen `guarded.json` snapshot.

| File relative to `v2/research/level-contours/` | SHA256 |
| --- | --- |
| `index.mjs` | `b3366146556676978d67d1a1aac586b8a2a0a1c5d17b19c90a846993fa7065a4` |
| `refine-order.py` | `5e21a32d24d0a98d3dcc812ffa2365494ca068cd5ebcf6e1259b04e9d3dad725` |
| `results/guarded.json` | `d09f095a0f4c439716382b3aa1c26854e1e989d802ddc976d44ea44a109653b1` |

The structural contract continues to hold in this bounded review. Quality reporting must retain the observed residual ordering and native near-gray failures. No universal-fix, promotion, deployment, or overall-completion claim is made.

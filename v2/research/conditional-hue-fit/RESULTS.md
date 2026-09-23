# Conditional Reach/Level and bounded hue: closed research batch

**Decision (2026-09-23): reject every fitted bank as a release replacement.** The contact bank materially repairs sampled blue occupancy and yellow luminance and reduces full-domain fixed-Reach lightness retreats. Its COMBVD observer fit is worse than both HRL v2 Beta1 and the frozen joint fit. Keep Beta1 as the published default. These are specific optimization outcomes, not a proof that conditional coordinates cannot meet both goals.

## Model and source identity

The independently fitted v3 conditional coordinate map has `s=F_H(R/L;L)` and `a=E_{H,s}(G(L))`. `F` and `E` are normalized integrals of strictly positive knot densities; `G` is the existing neutral-axis function. Inversion is `L=G⁻¹(E⁻¹(a))`, then `R=L F⁻¹(s;L)`. Thus `0≤R≤L≤1` maps bijectively to the same triangle, and gray remains exactly `G(L)`. A positive Jacobian follows from `F_u A_L/L>0` in the interior. The 75 fitted v3 values comprise three 5×5 Fourier/knot banks (two harmonics, five knots). The v4 extension adds five bounded hue coefficients: with `w=4as(1−s)`, physical hue is `h=H+w·25tanh(fourier(H)/25)`. It preserves both apexes, neutral and vivid boundaries and admits a monotone scalar hue inverse. Canonical JS is in `../conditional-field/` (v3) and `../conditional-hue/` (v4); those sibling modules were developed in independent checkouts and must be integrated alongside this research package.

All training source appearances came from the **fresh physical base** (`getBoundarySource(g).base.toXYZ` and full-gamut conversion), rather than any old fitted atlas. The exact source arrays, transformed observer coordinates, metadata, and generating manifest are in [`data/base-grid/`](data/base-grid/); the manifest SHA256 is `e4b23000726fa34bdd5bf0a4a3c5e3444347cf5be689b0c38c5c02eab105e1a3`, source arrays sRGB `37490460fd0a6679b6a8ac5486d1f859959c485514692374590a2ee8c2dcb81d`, full `8168027046e4ee470543d0627fd081e39be2f412a7bbe29c0b4abc5a0d54b2af`. Existing COMBVD observer pair **identities** remain pinned (old pair cache SHA `a6379b1004fbd7b7f00894453dcf7072365d0bf6d595e9c53a08fc45d786762a`); physical endpoint coordinates were newly transformed, source endpoints and label distances unchanged. Python fitting uses a sampled 49×49 base chart with irregular hue knots; reported release gates always come from actual JS model/GenSpace, without interpolated Python appearance values.

All joint fits exclude pair multiplicity `w=7` from the loss: exactly the pinned `WITT` family (verified label match), leaving 2,915 native and 3,395 full training pairs, with 416 native and 418 full withheld for a **development** check. WITT was already known in earlier HRL research and is not a virgin observer validation sample. Direct JS totals below reinstate **all** pairs; never compare a WITT-excluded Python training score with an all-pair JS score.

## Fitted bank identity and direct JS results

The `.json` paths below are relative to `v2/research/`. All SHA256 identifiers are complete.

| Bank | Frozen record | SHA256 | sRGB retained 3331 | sRGB mapped all 3813 | Full 3813 | WITT native/full |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Beta1 baseline | `boundary-tonal/results/metric.json` | `92aa2f9647b406239dd52cd22feed61794f3d6ed74a1c33ba9361516cff3bb72` | 29.107048 | 34.489196 | 29.948555 | baseline |
| Frozen joint | `joint-contours/results/joint.json` | `4dd69df0a18cc62b3b6b1b3a2a115609059d645cb4dec498512d6779842677a5` | **26.795161** | **33.358237** | **26.902322** | baseline |
| v3 first joint | `conditional-fit/results/conditional-joint-w7holdout-v0.json` | `9a1ca2bfa81fd204993be1ea3eb7f61f31fab3e133fa02fc3ba09c79b6d7eae8` | 37.307936 | 41.179734 | 32.610459 | 43.527851/30.045170 |
| v3 guarded | `conditional-fit/results/conditional-joint-guarded-v0.json` | `e1ccedbbe177b4cc2325a701e0abada269654754effd1b0cf7cd65f2c11476ff` | 37.868645 | 40.537667 | 34.809360 | 41.011112/33.889428 |
| v4 hue-only from v3 | `conditional-hue-fit/results/hue-only-from-guarded-v0.json` | `96c6cdc21c27ebdfe65475ec6ffc9aa98f1c6f17ac259057a1c281bc3bdf213a` | 37.627342 | 40.334327 | 34.563260 | 41.052611/33.863588 |
| v4 coupled | `conditional-hue-fit/results/conditional-hue-coupled-guarded-v0.json` | `35838487659b664d363bd1e01bf154221126577889bc561828bd2b1607d3e85c` | 38.477101 | 40.809677 | 35.174370 | 41.820549/33.828082 |
| v4 contact | `conditional-hue-fit/results/conditional-hue-blue-yellow-contact-v0.json` | `7bc1152def66706089e0a07c8ea8a6957a72654b84c897327d168381cc888e51` | 38.715122 | 41.339157 | 35.773916 | 42.049381/33.638481 |

Entries are weighted STRESS100 (smaller is better) from direct JS import/distance. Reproducible receipts: [`combvd-beta1-joint.json`](results/combvd-beta1-joint.json), [`combvd-joint-w7holdout.json`](../conditional-fit/results/combvd-joint-w7holdout.json), [`combvd-joint-guarded.json`](../conditional-fit/results/combvd-joint-guarded.json), [`combvd-hue-only.json`](results/combvd-hue-only.json), [`combvd-coupled-guarded.json`](results/combvd-coupled-guarded.json), and [`combvd-blue-yellow-contact.json`](results/combvd-blue-yellow-contact.json). The candidate receipt has the exact candidate record/entry hashes and fixed pool provenance. The benchmark pipeline separately records transitive module hashes for pinned ColorBench. The independently run original contact ColorBench board completed 42/42 cells with zero rejected points and fails COMBVD; native contact improves 3/21 judges versus guarded v3, full improves 4/21, with judges in different units. Its [complete report](../fresh-field/results/CONDITIONAL_V4_BLUE_YELLOW_CONTACT_COLORBENCH.md) resides in the independently integrated benchmark package.

## Matched fixed-public-Reach audit

For **each gamut and bank**, direct JS samples 72 regular hues `H=5k`, 72 shifted `H=5k+2.5`, seven public Reaches `[.0001,.001,.01,.05,.2,.5,.8]`, 65 Levels from `R` to `1`. Values are GenSpace `J` decreases along a path (not luminance); **total** sums all negative changes on one path, **step** is the largest single downward step. The rows below report the **full** gamut; native and worst locations are preserved in the JSON receipts. These values cannot be compared to the earlier Beta1 `.04742` single-step number from a different 24-hue protocol.

| Bank | Regular worst total / step | Shifted worst total / step |
| --- | ---: | ---: |
| Beta1 | .25115 / .03622 | .25205 / .03295 |
| Frozen joint | **.01148 / .00481** | **.01270 / .00354** |
| v3 first | .19011 / .08496 | .10652 / .10152 |
| v3 guarded | .08924 / .03308 | .08033 / .06114 |
| v4 coupled | .03926 / .01808 | .04252 / .01705 |
| v4 contact | .03067 / .01759 | .02791 / .00919 |

Matched receipts: [`audit-beta1-matched.json`](../conditional-fit/results/audit-beta1-matched.json), [`audit-joint-matched.json`](../conditional-fit/results/audit-joint-matched.json), [`audit-joint-w7holdout-v0.json`](../conditional-fit/results/audit-joint-w7holdout-v0.json), [`audit-joint-guarded-v0.json`](../conditional-fit/results/audit-joint-guarded-v0.json), [`audit-coupled-guarded-v0.json`](results/audit-coupled-guarded-v0.json), and [`audit-blue-yellow-contact-v0.json`](results/audit-blue-yellow-contact-v0.json). Actual JS physical `Y` showed zero retreats on **v3 and v4** sampled full-gamut paths; Beta1 and frozen joint each have physical-Y retreats, preserved in the same receipts. The v4 contact record also passes an **exact**, zero-tolerance strict public-triangle check for all 7,626 imported COMBVD endpoints in **each gamut**, including the 898 mapped native endpoints: [`audit-contact-import-triangle.json`](results/audit-contact-import-triangle.json).

## Blue/yellow contact and held-out probes

The final trial adds explicit soft physical-saturation floors on blue H269/273/277 and native physical-Y floors on yellow H115/120/125, each at specified public `(R,L)` in [`fit-contact.py`](fit-contact.py). Adjacent blue H270/275/280 with shifted `(R,L)` and yellow H117.5/122.5 with shifted `(R,L)` are **not** contact targets. On actual JS XYZ, trained native H273 `(R,L)=(.1,.5)` physical `s` rises from coupled `.20529` to contact `.32862`, compared with Beta1 `.66478`; at the same point full Beta1 is `.40300`. Trained native H120 `(.64,.8)` relative luminance `Y` rises `.54014→.61691`, compared with joint `.71129`; full `Y` rises `.58939→.66266`, compared with joint `.77548`. These JS values differ from Python interpolated-grid fit diagnostics (which give contact native H120 `Y≈.60940`).

| Held-out group, actual JS | v4 coupled | v4 contact | reference |
| --- | ---: | ---: | ---: |
| Adjacent blue mean physical `s`, both gamuts | .18677 | .32065 | Beta1 native .50708, full .28143 |
| Adjacent yellow mean native `Y` | .53504 | .60242 | joint .70431 |
| Adjacent yellow mean full `Y` | .59154 | .66266 | joint .76869 |

Full per-point physical hue/coordinates, s, Y and J for both gamuts and five banks are in [`audit-contact-v0.json`](results/audit-contact-v0.json); replay with [`audit-contact.mjs`](audit-contact.mjs). Independently rendered five-bank [native](../conditional-hue/results/native-panels/index.html) and [full](../conditional-hue/results/full-panels/index.html) focus and shifted montages have record/PNG hash manifests; the [visual report](../conditional-hue/RESULTS_VISUAL.md) links the source generators. Full-gamut H273 is substantially out of sRGB display range (6,819/8,481 contact pixels clipped in that audit); assess its numeric full colors without interpreting an sRGB rendering as a faithful full-gamut view.

## Replay and next discriminating test

Install `numpy==2.5.3 scipy==1.17.0 autograd==1.9.1` in an isolated Python environment. Run from the indicated `v2/research/conditional-fit/` or `v2/research/conditional-hue-fit/` directory with `OPENBLAS_NUM_THREADS=1`, `PYTHONPATH` pointing to that environment, and every Python fitter supplied `--grid-root <absolute-path-to-conditional-hue-fit/data/base-grid>`. Each frozen record embeds SHA256s for the **exact historical script**, `core.py`, seed, input arrays and manifest, optimizer trace, and warm-start record. Scripts in `history/` are exact archived **bytes**: execute them from a stage copy with those bytes named `fit.py` beside the matching `core.py`, plus the directory's `records/seed.json` and sibling source folders. The first v3 visual script requires `history/core-visual.py` as its `core.py`; the remaining v3 scripts use `conditional-fit/core.py`. Current `fit.py`, `fit-contact.py` and v4 `core.py` are the exact subsequent sources. Output JSONs are frozen; do not overwrite them during a replay.

| Ordered stage | Script bytes | Recorded CLI arguments after `python3 fit.py` |
| --- | --- | --- |
| v3 zero-seed visual | `conditional-fit/history/fit-visual.py` | `--name conditional-visual-v0 --steps 12 --stage visual --hue-stride 30` |
| v3 first joint, from visual | `conditional-fit/history/fit-first-joint.py` | `--name conditional-joint-w7holdout-v0 --start-record <visual.json> --steps 80 --stage joint --hue-stride 30 --holdout-weight-seven` |
| v3 guarded, separately from visual | `conditional-fit/fit.py` | `--name conditional-joint-guarded-v0 --start-record <visual.json> --steps 150 --stage joint --visual-weight 20 --hue-stride 30 --holdout-weight-seven` |
| v4 hue only, from guarded | `conditional-hue-fit/history/fit-hue-only.py` | `--name hue-only-from-guarded-v0 --start-record <v3-guarded.json> --stage joint --mode hue-only --visual-weight 20 --hue-stride 30 --holdout-weight-seven --steps 80` (converged at iteration 22; max-iteration value is not embedded in this record) |
| v4 coupled, from hue only | `conditional-hue-fit/fit.py` | `--name conditional-hue-coupled-guarded-v0 --start-record <hue-only.json> --stage joint --visual-weight 20 --pathguard 40 --hue-stride 15 --holdout-weight-seven --steps 120` |
| v4 contact, from coupled | `conditional-hue-fit/fit-contact.py` | `--name conditional-hue-blue-yellow-contact-v0 --start-record <coupled.json> --stage joint --visual-weight 20 --pathguard 40 --blue-contact 5 --yellow-contact 30 --hue-stride 15 --holdout-weight-seven --steps 60` |

The v4 hue-only max-iteration value above is sufficient for the observed convergence, rather than a claim that its original unrecorded CLI max-iteration value was 80. The lineage is v3 zero seed → visual → first joint and separately guarded → v4 hue-only from guarded → coupled → contact; later warm starts are clearly distinguished from an inherited source atlas. The contact stage's flags were independently verified against its frozen **exact** baseline loss and diagnostic metrics using a zero-iteration replay. Run the contact stage as:

| Frozen code bytes (relative to `v2/research/`) | SHA256 |
| --- | --- |
| `conditional-fit/history/fit-visual.py` / `history/core-visual.py` | `c83b5364fc6942e6ead6661324e5c6dbc081ea8c7e39413786abb2c39fb33db1` / `360de9c3e69e9f70564a3d80c967026546259c4f39a18e5e694cedb82b66e07d` |
| `conditional-fit/history/fit-first-joint.py` / `core.py` | `d3e2e4a81bf8ac28549fdfc6b8bdb44d89931b1a0089a062c551ea38e7fba4b1` / `80c37f740c61d4e18aa643382ad0b014d53e6e37da9922fde97845dec7e2ee14` |
| `conditional-fit/fit.py` / `core.py` | `48ebc82efeebc858eae89831c61004fd14fa4c6c5ff89445b263d1b18deadee1` / `80c37f740c61d4e18aa643382ad0b014d53e6e37da9922fde97845dec7e2ee14` |
| `conditional-hue-fit/history/fit-hue-only.py` / `core.py` | `5d22e5183d5ca7bc55f9b932ddd6912686a379c6e918ce68d19449d70736bf33` / `2b0662e6fb0cc6d62cc997d5c1fa00d949ec0072dc6b6cec2c65185fe99e3efb` |
| `conditional-hue-fit/fit.py` / `core.py` | `6c7eb6055e4417d5d04391c6472d55a2c6a3e0b63ab2ff21177a56465b7a94ae` / `2b0662e6fb0cc6d62cc997d5c1fa00d949ec0072dc6b6cec2c65185fe99e3efb` |
| `conditional-hue-fit/fit-contact.py` / `core.py` | `0be3b1c10fc6454162dac55ac79a8782a94c4f6ad4e1732a8ec25ee49033ae3a` / `2b0662e6fb0cc6d62cc997d5c1fa00d949ec0072dc6b6cec2c65185fe99e3efb` |

Canonical JS candidate entry/module bytes: v3 `c6d4da23756a1a7dda132869b74750ec59ae27bf912e4b799ee51f415cfe496f` / `2e934f5b31f5f86cdb12f0f32d0987fa6fb4a593f6a4390fd3366384c73fd585`, v4 `a42dfc8ea2c0d9ebe02f386ca64a80089a58c1347a5bf3c7b7759e572214616c` / `8164861ec50eb6be55a969206a549227416697368386162a29cefdd81d9f400c`. The benchmark package's [transitive source manifest](../fresh-field/results/conditional-v4-blue-yellow-contact-source-manifest.json) records the isolated scored checkout. The Site research checkout has different `conditional-field/index.mjs` checkpoint metadata and a comment in `fresh-field/model.mjs`; its [separately hashed direct-runtime receipt](results/contact-site-runtime-combvd.json) repeats the contact score on the integrated source. The factory's `.seed` checkpoint string is prototype metadata, even when supplied a fitted record; identify banks by exact record hash.

```sh
python3 fit-contact.py --name conditional-hue-blue-yellow-contact-v0 --stage joint \
  --holdout-weight-seven --hue-stride 15 --visual-weight 20 --pathguard 40 \
  --blue-contact 5 --yellow-contact 30 --steps 60 \
  --start-record results/conditional-hue-coupled-guarded-v0.json \
  --grid-root data/base-grid
```

To replay the direct contact checks from the merged tree, run `node audit-contact.mjs <output.json>`; isolated checkouts pass the v3 JS module path, v4 JS module path, and research root as three additional arguments. For the exact 7,626-endpoint triangle gate, run `node audit-import-triangle.mjs <benchmark.mjs> <conditional-hue/index.mjs> <contact-record.json> <output.json>`. For direct COMBVD use `fresh-field/benchmark.mjs` with `--models candidate --candidate-module <conditional-hue/index.mjs> --candidate-export createConditionalHueHRL --candidate-record <record.json> --candidate-name <label>`.

The next falsifiable effort should first test **source/metric alignment** and route more of the actual JS blue/yellow occupancy and full fixed-Reach behavior into a multi-hue, multi-Level objective, then rerun both gamuts and WITT/held-out hue probes. Test a constrained increase in tonal knots/harmonics or another monotone conditional field as an explicit capacity ablation; require native retained and full COMBVD at least Beta1, mapped native without triangle errors, and full sheet/white-edge checks at fixed public Reach. Reject a model that solves named contacts while losing the broad observer fit, as this contact run does.

# V4 blue/yellow contact: direct-runtime visual check

The [native focused sheets](results/native-contact-comparison.png), [full-gamut displayed sheets](results/full-contact-display-clipped.png), and [individual native](results/native-panels/index.html) and [full](results/full-panels/index.html) panels compare Beta 1, frozen joint, v3 guarded, v4 coupled guarded, and v4 blue/yellow contact on identical public H, R, L coordinates. The panels cover H117.5/120/122.5, H182.5 (control), and H270/273/275/280. The contact bank is a **failed COMBVD experiment**.

## Reproduce in a checkout

Run from the repository root with **new** output paths; the scripts refuse to overwrite outputs:

```sh
node v2/research/conditional-hue/contact-probes.mjs --out ./contact-probes-repro.json
node v2/research/conditional-hue/contact-panels.mjs --gamut srgb --out ./contact-panels-native-repro
node v2/research/conditional-hue/contact-panels.mjs --gamut full --out ./contact-panels-full-repro
python v2/research/conditional-hue/contact-montage.py --panels ./contact-panels-native-repro --out ./contact-montages-native-repro
```

The numeric probe uses the checked-in v3 guarded record under `../conditional-field/results/` and the two v4 records under this directory's `results/`. `--v3-record`, `--coupled-record` and `--contact-record` override these inputs. `contact-panels.mjs` also accepts `--hues`, `--width` and `--height`; the default 121×141 panels reproduce the supplied rasterization. Run the Python montage on the full-panel directory for full-domain display figures. `manifest.json` records all five bank hashes, source hashes, and each PNG's SHA-256 and clipping count.

The [unclipped numeric receipt](results/visual-contact-probes.json) evaluates 31 public samples for every model and both gamuts. Physical saturation `s` is underlying physical R/L. Relative chroma is frozen GenSpace opponent-plane distance from the same-Level gray divided by the same-Level vivid-edge distance. Y is original XYZ luminance. At H120, R=.64,L=.8 native Y rises from v4 coupled **.54014** to contact **.61691**, still below frozen joint **.71129**. At H273, R=.1,L=.5 native relative chroma rises **.07760→.12896**, still below Beta 1 **.33298**. On held-out neighboring samples, native mean yellow Y rises **.53504→.60242**, while blue mean relative chroma rises **.07313→.12906**; the H182.5 control sample's chroma changes only **.08659→.08696**. The same direction holds in the full-gamut numeric samples.

The contact bank's retained weighted COMBVD development score worsens from coupled **38.47710→38.71512** native and **35.17437→35.77392** full. The full-gamut H273 contact panel has **6,819/8,481 display-clipped pixels**. Full-domain claims therefore come from original XYZ in the numeric receipt, not the clipped sRGB image. These discrete probes do not establish continuous-domain smoothness or independent observer preference.

Bank SHA-256: Beta 1 `92aa2f9647b406239dd52cd22feed61794f3d6ed74a1c33ba9361516cff3bb72`; joint `4dd69df0a18cc62b3b6b1b3a2a115609059d645cb4dec498512d6779842677a5`; v3 guarded `e1ccedbbe177b4cc2325a701e0abada269654754effd1b0cf7cd65f2c11476ff`; v4 coupled `35838487659b664d363bd1e01bf154221126577889bc561828bd2b1607d3e85c`; v4 contact `7bc1152def66706089e0a07c8ea8a6957a72654b84c897327d168381cc888e51`.

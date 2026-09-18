# Boundary/tonal comparison deployment

The repaired spectral boundary, frozen shared tonal candidates, scored results, direct-output diagnostics and served comparison were published in commit `291f76b9dea885901f0116514a257c40165f3c58` after the numerical and runner-browser gates passed in workflow run `35323474075`.

This external commit requests branch-based GitHub Pages deployment. It is not itself a public-browser success receipt. The running workflow checks exact public hashes and exercises the public page before writing `results/browser-live/verification.json`.

Live comparison: https://gaycoonie.github.io/HRL/v2/boundary-tonal.html

The first table and panel labels report normal retained-pair COMBVD: 3,331 native pairs without mapping, and 3,813 full pairs. The original scored ColorBench tables use mapped inputs and are separate, including their all-3,813-pair native aggregate. Old pages and result files remain intact.

`FINDINGS.md` records both gains and regressions. Conditioning improves strongly in its tail, while several general GenSpace ramp/bending averages worsen. `results/hue-transport.json` also records the small physical cross-gamut hue discrepancy introduced by the geometry-only full transport; retained latent labels do not prove exact physical hue equality. These are comparison candidates, not an approved new default.

All three completed local trials and three aborted attempts are recorded. The downloadable review includes all 2,390 actual objective-evaluation log rows, of which 1,767 belong to completed trials. The repository preserves the selected and intermediate arrays, trace hashes and sampled progress. No coefficient was changed after the scored evaluation.

# Results and observation provenance

The finalized source, generated report, raw GenSpace audit and navigation were published in `6253a421f0b40a969ddfe264066809f3c8f18288`, after numerical and locally served browser checks passed in publication run `35233510267`. This commit also requests the branch-based Pages deployment of those files. It is not, by itself, a claim that the public browser check has already passed; that is recorded separately in `results/browser-live/verification.json`.

`results/genspace-audit.json` contains deterministic model-derived measurements on the unchanged shared 0.10 transforms. They are not new human-observer judgments. `results/operation-tests.json` contains seeded algebraic checks. The score arrays and frozen conversion inputs were checked against the recovered manifest.

**Any preference.json under results/browser-runner/ or results/browser-live/ is an automated browser-test fixture.** The synthetic selection was made by Playwright solely to verify local saving and JSON export. It must never be attributed to Coonie or treated as a participant's visual judgment. The normal application stores actual user choices locally in their own browser and transmits none to this repository.

`VERIFY_INPUTS.json` retains the pre-interruption source hashes and aggregate expectations. Finalized source hashes are in `results/verified-source-hashes.json`. The correction from a mistaken draft author list to the primary paper's actual authors, the differential derivation and the rendered-state preference guard are recorded by `results/finalization.json`.

The audit records how often a sampled path retreats relative to its target in the GenSpace ruler. Those counts do not establish a perceptual threshold or a bound on the size of the departure. Full XYZ trajectories are not display-clipped during numerical evaluation; clipping applies only to sRGB preview pixels.

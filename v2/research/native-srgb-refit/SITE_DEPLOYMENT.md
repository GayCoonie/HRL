# Dual-gamut refit site deployment

Verified native sRGB balanced and metric-leaning models, the unchanged full-gamut counterparts, and the integrated picker were published in `5de070246b6b33caad56f74cd1d336888423db34`.

The numerical, scored ColorBench, and locally served browser checks succeeded in workflow run `35181228509`. This commit requests the branch-based GitHub Pages deployment of those exact files.

Entry point: https://gaycoonie.github.io/HRL/v2/refits.html

The root picker and v2 research hub now link to that entry point. The previous Release 1 picker and all accepted predecessor APIs remain accessible.

The running workflow checks the public checkpoint bytes and exercises the actual public page before writing `results/browser-live/verification.json`. This deployment request alone is not a claim that the public-site verification has already passed.

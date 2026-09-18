# Mapped 0.12 deployment

Commit cfb7366c488457d3d86065ee3c5c0e241ee28edb contains the completed rerun, numerical import tests, and served-browser-tested comparison. Workflow run 35315786445 passed the original scored Python judges, unchanged-model checks and local runner-browser gate before publishing those results.

This external commit triggers the branch-based Pages deployment. It does not itself claim that the public page has finished updating. The running workflow compares public content hashes and checks the actual public mapped/strict selector before writing results/browser-live/verification.json.

Live comparison: https://gaycoonie.github.io/HRL/v2/hue-fair.html
Score and policy report: https://gaycoonie.github.io/HRL/v2/research/mapped-012/

There is no retuning or 0.13 boundary update. The original strict results remain unchanged; mapped evidence becomes the default. All 126 scored cells (two 0.12 candidates plus the 0.11 control, in native/full realizations) are finite, with no HRL rejection of forwarded inputs. Native mapped COMBVD includes all 3,813 pairs, with its original supported 3,331-pair subset separately reproduced. Full COMBVD requires no mapping and reproduces the previous values.

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# See README for pinned package versions. No held-out judge runs during fitting.
node cache.mjs
node cache-fine.mjs
python fit.py --name metric3 --iterations 600 --mode metric --layers 3
python fit.py --name smooth030 --iterations 600 --mode visual --layers 3 --start results/metric3.json --strength .03
python fit.py --name smooth100 --iterations 700 --mode visual --layers 3 --start results/smooth030.json --strength .10
python fit.py --name fine100 --iterations 850 --mode visual --layers 3 --start results/smooth100.json --strength .10 --fine
python fit.py --name fine200 --iterations 850 --mode visual --layers 3 --start results/smooth100.json --strength .20 --fine
# Do not overwrite the published, frozen balanced/metric files automatically.
# Compare these regenerated candidates against the exact published checkpoints.
node test.mjs fine100 fine200
node visual.mjs fine100 fine200

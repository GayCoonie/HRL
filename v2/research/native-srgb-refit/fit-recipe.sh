#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python prepare-inputs.py
node cache.mjs
python fit.py --name native_metric --iterations 700 --mode metric --layers 3
python fit.py --name native_smooth03 --iterations 600 --mode visual --layers 3 --start results/native_metric.json --strength .03 --fine
python fit.py --name native_smooth10 --iterations 850 --mode visual --layers 3 --start results/native_smooth03.json --strength .10 --fine
python fit.py --name native_smooth20 --iterations 850 --mode visual --layers 3 --start results/native_smooth03.json --strength .20 --fine
# Published balanced/metric files remain immutable. Reproduction is a new trial.
DENSE=1 node visual.mjs baseline native_smooth10 native_smooth20

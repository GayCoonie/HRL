# Execution evidence

Repository baseline: 73b971a04c5add2ca003a4cf5dabbfab4e7bfb47. Working directory: /workspace/scratch/13a5381bdd70/hrl-global. Producer checks below are distinct from independent review.

Dependency installation, source-grid generation, four fits, five main JavaScript audits, separate near-black audit, final Python/JavaScript parity, compression, comparison generation and record verification all exited 0. The trace evaluation counts are 242, 242, 351 and 244 in candidate order. The parity maximum is 5.684341886080802e-14. Eleven compressed payloads occupy 2,455,362 bytes and decompress to 16,639,879 bytes.

Two setup failures were resolved: an invalid file URL in the first grid launch (corrected with pathToFileURL), and a first metric launch before full grid completion (FileNotFoundError before trial output). Neither modified frozen data. A report-writing command also initially used a nonexistent scratch working directory; no process launched, and it was rerun in the correct directory. Generated Python caches beside inherited modules were removed by exact filename.

## Commands

```sh
python3 -m venv --system-site-packages /workspace/scratch/13a5381bdd70/global-fit-env
/workspace/scratch/13a5381bdd70/global-fit-env/bin/python -m pip install --index-url https://download.pytorch.org/whl/cpu torch==2.10.0
HUES=48 GRID=193 GRID_ROOT=/workspace/scratch/13a5381bdd70/global-fit-cache node v2/research/global-tonal/cache-grid.mjs
/workspace/scratch/13a5381bdd70/global-fit-env/bin/python v2/research/global-tonal/fit.py --name metric-global --gridroot /workspace/scratch/13a5381bdd70/global-fit-cache --steps 240 --visual 0.075 --sheet 0.02 --corner 0.5
/workspace/scratch/13a5381bdd70/global-fit-env/bin/python v2/research/global-tonal/fit.py --name uniform-global --gridroot /workspace/scratch/13a5381bdd70/global-fit-cache --steps 240 --visual 0.55 --sheet 0.15 --corner 0.5
/workspace/scratch/13a5381bdd70/global-fit-env/bin/python v2/research/global-tonal/fit.py --name fresh-global --gridroot /workspace/scratch/13a5381bdd70/global-fit-cache --steps 320 --start fresh --visual 0.35 --sheet 0.1 --corner 0.5
PYTHONDONTWRITEBYTECODE=1 /workspace/scratch/13a5381bdd70/global-fit-env/bin/python v2/research/global-tonal/fit-tail.py --name uniform-tail-global --gridroot /workspace/scratch/13a5381bdd70/global-fit-cache --steps 240 --start uniform --visual 0.35 --sheet 0.04 --corner 0.5
node v2/research/global-tonal/audit.mjs --out /workspace/scratch/13a5381bdd70/hrl-global/v2/research/global-tonal/results/beta1-audit.json beta1=v2/research/boundary-tonal/results/metric.json
node v2/research/global-tonal/audit.mjs --out /workspace/scratch/13a5381bdd70/hrl-global/v2/research/global-tonal/results/metric-global-audit.json metric-global=v2/research/global-tonal/trials/metric-global.json
node v2/research/global-tonal/audit.mjs --out /workspace/scratch/13a5381bdd70/hrl-global/v2/research/global-tonal/results/uniform-global-audit.json uniform-global=v2/research/global-tonal/trials/uniform-global.json
node v2/research/global-tonal/audit.mjs --out /workspace/scratch/13a5381bdd70/hrl-global/v2/research/global-tonal/results/fresh-global-audit.json fresh-global=v2/research/global-tonal/trials/fresh-global.json
node v2/research/global-tonal/audit.mjs --out /workspace/scratch/13a5381bdd70/hrl-global/v2/research/global-tonal/results/uniform-tail-global-audit.json uniform-tail-global=v2/research/global-tonal/trials/uniform-tail-global.json
node v2/research/global-tonal/edge-audit.mjs
PYTHONDONTWRITEBYTECODE=1 /workspace/scratch/13a5381bdd70/global-fit-env/bin/python v2/research/global-tonal/parity.py --out v2/research/global-tonal/results/runtime-parity-final-fixture.json v2/research/global-tonal/trials/metric-global.json v2/research/global-tonal/trials/uniform-global.json v2/research/global-tonal/trials/fresh-global.json v2/research/global-tonal/trials/uniform-tail-global.json
node v2/research/global-tonal/parity.mjs v2/research/global-tonal/results/runtime-parity-final-fixture.json v2/research/global-tonal/results/runtime-parity-final-receipt.json
python3 v2/research/global-tonal/compress.py --raw-dir /workspace/scratch/13a5381bdd70/global-final-raw
node v2/research/global-tonal/compare.mjs
node v2/research/global-tonal/verify-records.mjs
```

Raw audits/traces remain in /workspace/scratch/13a5381bdd70/global-final-raw; reproducible grid binaries are in global-fit-cache. Per-process stdout logs are scratch global-*.log. Public gzip files preserve exact decompressed identities. Scripts refuse to overwrite completed trials or receipts; use a clean output area when rerunning.

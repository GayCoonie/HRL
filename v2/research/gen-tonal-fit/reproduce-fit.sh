#!/usr/bin/env bash
set -euo pipefail
P="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$P/trials" "$P/results"
python "$P/fit.py" --name g1-balanced --start old-balanced --steps 650 --stride 2 --samples 97 --visual .15 --corner .35 --guard .5 --layers 4
python "$P/fit.py" --name g1-metric --start old-metric --steps 650 --stride 2 --samples 97 --visual .05 --corner .35 --guard .5 --layers 4
python "$P/fit.py" --name g2-balanced --start g1-balanced --steps 1100 --stride 1 --samples 129 --visual .45 --corner .7 --guard .35 --layers 5
python "$P/fit.py" --name g2-metric --start g1-metric --steps 1100 --stride 1 --samples 129 --visual .15 --corner .7 --guard .35 --layers 5
python "$P/fit.py" --name g2-smooth --start old-balanced --steps 1100 --stride 1 --samples 129 --visual .9 --corner .7 --guard .35 --layers 4

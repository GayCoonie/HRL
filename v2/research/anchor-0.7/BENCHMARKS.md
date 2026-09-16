# OPAL 0.7 COMBVD and reference diagnostics

All 0.7 fitted scores are development / in-sample results. Lower STRESS is better. The shared input, exact masks, nuisance scales and rejected rows are in `results/benchmarks.json`. Quantization and channel clipping are absent. The metric is the public regular bicone.

## Native sRGB

| Subset | Pairs | OPAL 0.6 | Balanced 0.7 | Metric 0.7 | Conservative 0.7 |
|---|---:|---:|---:|---:|---:|
| BFD-P(D65) | 1828 | 44.2289 | 30.0322 | 29.4327 | 31.9463 |
| BFD-P( C ) | 139 | 52.9874 | 45.2353 | 44.9130 | 46.1929 |
| BFD-P(M) | 357 | 62.3360 | 38.9980 | 36.8227 | 42.7427 |
| LEEDS | 307 | 59.7986 | 33.1295 | 32.3708 | 35.3824 |
| RIT-DuPont | 284 | 48.3618 | 30.6792 | 30.7652 | 31.9893 |
| WITT | 416 | 54.4100 | 32.1238 | 30.1311 | 35.6698 |
| BFD-P combined | 2324 | 53.0608 | 33.3772 | 32.1116 | 36.1388 |
| **Pooled unweighted** | **3331** | **53.3601** | **33.2849** | **32.0272** | **36.0433** |
| **Pooled traditional weights** | **3331** | **54.3531** | **32.9901** | **31.8076** | **35.6838** |

## Full-domain

| Subset | Pairs | OPAL 0.6 | Balanced 0.7 | Metric 0.7 | Conservative 0.7 |
|---|---:|---:|---:|---:|---:|
| BFD-P(D65) | 2028 | 44.9577 | 35.0733 | 33.4911 | 38.2907 |
| BFD-P( C ) | 200 | 50.8538 | 46.3663 | 44.0481 | 49.9930 |
| BFD-P(M) | 548 | 46.5146 | 40.1703 | 37.8443 | 42.8221 |
| LEEDS | 307 | 41.9360 | 31.4882 | 31.1539 | 34.4689 |
| RIT-DuPont | 312 | 36.8993 | 28.6763 | 29.4183 | 29.9619 |
| WITT | 418 | 49.9627 | 37.6088 | 34.1800 | 41.9186 |
| BFD-P combined | 2776 | 45.6751 | 37.4063 | 35.4862 | 40.3672 |
| **Pooled unweighted** | **3813** | **45.8136** | **37.1608** | **35.2407** | **40.1948** |
| **Pooled traditional weights** | **3813** | **45.9790** | **36.0015** | **34.1721** | **39.2542** |

## Identical 3,331-pair mask

| Model | Native sRGB | Full-domain on the same pairs |
|---|---:|---:|
| opal0.6 | 54.3531 | 46.2421 |
| anchor-control | 52.6014 | 47.7550 |
| balanced | 32.9901 | 35.1253 |
| metric | 31.8076 | 33.3517 |
| conservative | 35.6838 | 38.6882 |

## Whole-family omission diagnostic

Each run omits the named family from the direct difference loss, refits from zero, and scores that omitted family. Appearance constraints, the fixed architecture and OPAL visual reference remain shared. These are retrospective transfer checks, not untouched independent tests.

| Family | sRGB balanced omission | Full balanced omission | sRGB metric omission | Full metric omission |
|---|---:|---:|---:|---:|
| BFD-P | 39.6554 | 42.6038 | 36.7194 | 42.1040 |
| LEEDS | 36.8959 | 33.6436 | 35.0324 | 33.0478 |
| RIT-DuPont | 31.9691 | 30.8460 | 34.4976 | 32.0478 |
| WITT | 39.1831 | 46.9350 | 37.2728 | 44.1766 |

## Attribution of the improvement

Own-anchor normalization alone, with the original readout, scored 56.3198 / 46.7465 (native/full). Own-anchor normalization with the new Nayatani/Corney readout but without the final difference fit scores 52.6014 / 48.2767. The major gain is therefore after joint native R/L difference calibration, not evidence that normalization alone fixes COMBVD.

Hue membership, angular allocation and the physical hue sheet remain unchanged from OPAL 0.6. These results do not improve its constant-hue residuals; they improve placement inside the same sheets.

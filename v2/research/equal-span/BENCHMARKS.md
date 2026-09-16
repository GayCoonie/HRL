# COMBVD baseline: unchanged BASR and new research candidates

Lower STRESS is better. These scores use the workbook's traditional multiplicities BFD-P=1, Leeds=9, RIT-DuPont=9, Witt=7. The weighted result is one pooled fit, not an average of subset STRESS. No COMBVD training was performed.

D65 target xy=(.3127,.3290), Bradford adaptation, continuous XYZ inputs, no quantization or gamut clipping. The native set contains 3,331 pairs, agreeing in count with the previously reported retained set; historical row-mask identity was not independently recovered. Full profiles retain all 3,813. The numeric retained row IDs are included.

## srgb

| Subdataset | n | BASR 0.4 | Equal-Span 0.5 | OPAL 0.6 |
|---|---:|---:|---:|---:|
|BFD-P(D65)|1828|32.94698|43.66641|44.22886|
|BFD-P( C )|139|48.10591|46.43039|52.98739|
|BFD-P(M)|357|55.11383|63.44799|62.33605|
|LEEDS|307|39.60980|52.23971|59.79858|
|RIT-DuPont|284|37.22778|44.77027|48.36183|
|WITT|416|41.59380|54.79793|54.40998|
|BFD-P combined|2324|42.78043|53.74380|53.06077|
|**unweighted**|3331|**42.57501**|**53.62088**|**53.36012**|
|**traditional_weighted**|3331|**41.80820**|**53.02117**|**54.35310**|

## full

| Subdataset | n | BASR 0.4 | Equal-Span 0.5 | OPAL 0.6 |
|---|---:|---:|---:|---:|
|BFD-P(D65)|2028|39.94529|44.43294|44.95770|
|BFD-P( C )|200|45.14221|46.41811|50.85383|
|BFD-P(M)|548|51.11129|49.00714|46.51460|
|LEEDS|307|36.69302|40.55001|41.93597|
|RIT-DuPont|312|35.11645|34.92534|36.89927|
|WITT|418|44.26693|49.68127|49.96269|
|BFD-P combined|2776|45.44635|46.88575|45.67514|
|**unweighted**|3813|**45.10736**|**46.80379**|**45.81356**|
|**traditional_weighted**|3813|**43.55541**|**46.19392**|**45.97902**|

The pure xy-arc and sparse-readout constructions are not improvements to the difference metric at this stage. This is evidence for further R/L fitting, not a result to hide. Domain changes, retained pairs, and weighting must be specified when comparing to Release 1.

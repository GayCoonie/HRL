"""Build the viewer evidence from measured results, without changing the fit."""
from pathlib import Path
import json,hashlib,sys
here=Path(__file__).resolve().parent
scores=json.loads((here/'results/colorbench.json').read_text())
paths=json.loads((here/'results/visual-dense-baseline-balanced-metric.json').read_text())
summary={'models':{},'selected_before_heldout':json.loads((here/'results/SELECTION.json').read_text()),'notes':['COMBVD is in-sample.','Visual paths use Oklab as a model-based proxy, not human ratings.','The whole full gamut cannot be faithfully displayed on sRGB.','Only the full-profile R/L calibration changes; native sRGB is unchanged.']}
for name,identifier in [('baseline','baseline-full-300-clip'),('balanced','refit-full-300-clip'),('metric','metric-full-300-clip')]:
    r=scores['models'][identifier];c=r['combvd']
    summary['models'][name]={'weighted_stress':c['traditional_weighted'],'unweighted_stress':c['unweighted'],'pairs':c['retained'],'visual':paths['models'][name]['summary'],'displayOutOfSRGB':paths['models'][name]['displayOutOfSRGB'],'osa_cv':r['generation']['osa_ucs_1974']['score'],'macadam1974_stress':r['measurement']['macadam']['score']}
(here/'results/summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary['models'],indent=2))

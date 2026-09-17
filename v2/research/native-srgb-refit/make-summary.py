"""Build the live site's compact evidence from executed native and frozen full results."""
from pathlib import Path
import json
R=Path(__file__).resolve().parent
native=json.loads((R/'results/colorbench.json').read_text())
full=json.loads((R/'../relative-refit/results/colorbench.json').read_text())
vp=R/'results/visual-dense-baseline-balanced-metric.json'
if not vp.exists():vp=R/'results/visual-dense.json'
visual=json.loads(vp.read_text())
(R/'results/visual-dense.json').write_text(json.dumps(visual,indent=2)+'\n')
full_summary=json.loads((R/'../relative-refit/results/summary.json').read_text())
def compact(v):
    a=v.get('audit',{});out={'score':v['score'],'exact':v['exact_input_support'],'mapped':a.get('mapped',0),'rejected':a.get('rejected',0)}
    if 'retained' in v:out.update(retained=v['retained'],total=v['total'])
    return out
out={'id':'HRL-native-and-full-refits','defaultGamut':'srgb','defaultCheckpoint':'balanced','profiles':{}}
for gamut,bench in [('srgb',native),('full',full)]:
    data={'models':{},'provenance':'fresh native rerun' if gamut=='srgb' else 'preserved full-domain results, unchanged model'}
    for name,key in [('baseline','baseline'),('balanced','refit'),('metric','metric')]:
        r=bench['models'][f'{key}-{gamut}-300-'+('reject' if gamut=='srgb' else 'clip')];c=r['combvd']
        data['models'][name]={'weighted':c['traditional_weighted'],'unweighted':c['unweighted'],'pairs':c['retained'],'total':c['total'],
            'visual':visual['models'][name]['summary'] if gamut=='srgb' else full_summary['models'][name]['visual'],
            'generation':{k:compact(v) for k,v in r['generation'].items()},'measurement':{k:compact(v) for k,v in r['measurement'].items()}}
    out['profiles'][gamut]=data
(R/'results/site-data.json').write_text(json.dumps(out,indent=2)+'\n')

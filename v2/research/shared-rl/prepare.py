"""Generate small adapters from preserved benchmark sources; publish generated files too."""
from pathlib import Path
import hashlib,json
HERE=Path(__file__).resolve().parent
expected={'benchmark.py':'128545ce3fa2320eaf2a4810b1548535f7f01088f9fe83e535498db7e28c0e87','bridge.mjs':'993e70f7fa86d383836ba116ae0a2cfb69e3f7aa38257c9a590fb1dae65456ca','visual.mjs':'f3d36fbfbd09c3333f3a3137eb5d3961e2c79c543309b9fe9cce388bbd371ab2'}
for name,sha in expected.items():assert hashlib.sha256((HERE/'../native-srgb-refit'/name).read_bytes()).hexdigest()==sha,name
src=(HERE/'../native-srgb-refit/benchmark.py').read_text()
a=src.index('    cases=[');b=src.index('    frozen=',a)
src=src[:a]+'''    cases=[]
    for gamut in ['srgb','full']:
        for mode in ['old-balanced','balanced','metric']:
            cases.append({'id':mode+'-'+gamut,'mode':mode,'gamut':gamut,'nits':300,'policy':'reject'})
    for mode in ['balanced','metric']:
        cases.append({'id':mode+'-full-clip','mode':mode,'gamut':'full','nits':300,'policy':'clip'})
'''+src[b:]
a=src.index('    checks={}');b=src.index("    with (HERE/'results/scores.csv')",a)
src=src[:a]+src[b:]
a=src.index('    masks=[')
src=src[:a]+'''    for gamut,n in [('srgb',3331),('full',3813)]:
        masks=[m['combvd']['retained_indices'] for m in out['models'].values() if m['config']['gamut']==gamut]
        assert all(mask==masks[0] for mask in masks) and len(masks[0])==n
    dump(out,HERE/'results/colorbench.json')
'''+'\nif __name__=="__main__":main()\n'
src=src.replace('a5afe600dc38b4d8a929d48de87973fab8408fce + additive native-sRGB refits','71c915590253a8a82b278b4c408abbf44c8db75d + resumed shared R/L')
src=src.replace("out['atlas_sha256']=","out['metric_checkpoint_sha256']=hashlib.sha256(frozen_metric).hexdigest()\n    out['selection_record']=json.loads((HERE/'results/SELECTION.json').read_text())\n    out['full_atlas_sha256']=hashlib.sha256((HERE/'../relative-domain/results/source-full.json').read_bytes()).hexdigest()\n    out['atlas_sha256']=")
(HERE/'benchmark.py').write_text(src)
s=(HERE/'../native-srgb-refit/bridge.mjs').read_text();a=s.index('import {createInterface}');b=s.index('for await',a)
s=s[:a]+'''import {createInterface} from 'node:readline';
import {createSharedHRL} from './source.mjs';
import {createHRLRefits} from '../native-srgb-refit/index.mjs';
const c=JSON.parse(process.argv[2]),opts={gamut:c.gamut,overflow:c.policy,imaginary:c.policy};
const m=c.mode==='old-balanced'?await createHRLRefits({...opts,checkpoint:'balanced'}):await createSharedHRL({...opts,checkpoint:c.mode});
'''+s[b:];(HERE/'bridge.mjs').write_text(s)
s=(HERE/'../native-srgb-refit/visual.mjs').read_text()
s=s.replace("import {createHRLRefits} from './index.mjs';","import {createSharedHRL} from './source.mjs';\nimport {createHRLRefits} from '../native-srgb-refit/index.mjs';")
s=s.replace("const args=process.argv.slice(2),names=args.length?args:['baseline','balanced','metric'];","const args=process.argv.slice(2),names=args.length?args:['old-balanced','balanced','metric'];\nconst gamut=process.env.GAMUT||'srgb';")
a=s.index(' const m=name===');b=s.index('\n const ramps=',a)
s=s[:a]+" const m=name==='old-balanced'?await createHRLRefits({gamut,checkpoint:'balanced'}):await createSharedHRL({gamut,checkpoint:name});"+s[b:]
s=s.replace("domain:'Native sRGB, own source atlas and vivid boundary; no output clipping'","domain:gamut+' own source chart; all metrics on XYZ, never display-clipped'")
s=s.replace('results/visual-${dense?', 'results/visual-${gamut}-${dense?')
(HERE/'visual.mjs').write_text(s)
print('Prepared benchmark, numeric bridge and direct visual adapter')

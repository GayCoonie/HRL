"""Freeze newly computed candidates before evaluation. Never rewrite parent models."""
from pathlib import Path
import json,hashlib,datetime
P=Path(__file__).resolve().parent
parent=P/'../gen-tonal-fit/results/balanced.json';h=lambda b:hashlib.sha256(b).hexdigest()
sel={'status':'Frozen before new scored ColorBench evaluation','timeUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parent_sha256':h(parent.read_bytes()),'basis':'Balanced-parent continuation. New runs, not recovered missing arrays. Choice uses training and native visual checks; no newly computed non-COMBVD observer score used.','candidates':{},'priorDataExposure':'All benchmark sets have project development exposure; this is not pristine external validation.'}
assert sel['parent_sha256']=='109555996bc49629f35397c9bdbc1c8edac8f4ce753fb86caf8ce885e43892f8'
for name,trial in [('balanced','resume-b'),('gentle','resume-a')]:
 r=json.loads((P/f'trials/{trial}.json').read_text());assert len(r['coefficients'])==1 and r['layers']==6 and r['ring_logits'] is None
 r['id']='HRL-0.12-hue-fair-'+name;r['variant']=name;r['research']['selected_from']=trial
 raw=(json.dumps(r,indent=2)+'\n').encode();(P/f'results/{name}.json').write_bytes(raw);sel['candidates'][name]={'trial':trial,'sha256':h(raw)}
(P/'results/SELECTION.json').write_text(json.dumps(sel,indent=2)+'\n')
rows=[]
for p in sorted((P/'trials').glob('resume-*.json')):
 if p.name.endswith('-command.json'):continue
 r=json.loads(p.read_text());t=p.with_suffix('.jsonl');rows.append({'file':p.name,'sha256':h(p.read_bytes()),'recipe':r['research']['fit'],'trace_sha256':h(t.read_bytes()),'evaluations':len(t.read_text().splitlines()),'recorded_evaluations':r['research']['evaluations']})
(P/'trials/registry.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(sel,indent=2))

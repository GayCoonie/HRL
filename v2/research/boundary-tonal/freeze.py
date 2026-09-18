"""Freeze already reviewed final trial records; no fitting occurs here."""
from pathlib import Path
import json,datetime,hashlib
P=Path(__file__).resolve().parent
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert not (P/'results/SELECTION.json').exists(),'Selection already frozen'
sel={'status':'Frozen before the new scored ColorBench run','timeUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseCommit':'16b87da59c91d9c4b30997631397bad4404c4d39','parent':'0.12 refined balanced','parent_sha256':h(P/'../hue-fair-refine/results/balanced.json'),'boundary_sha256':h(P/'boundary-1nm.json'),'runtime_sha256':h(P/'index.mjs'),'selectionBasis':'Training COMBVD, actual-inverse 24-hue/129-sample diagnostic, 14,378-point common-coordinate conditioning, native previews at 263/269/273/275/277 and magenta. No new non-COMBVD observer score used.','candidates':{},'notSelected':{'smooth-b':'Completed initializer and regularity trial. Retained, but conditioned-c gives the stronger common-coordinate tail reduction.','conditioned-a':'OOM-aborted intermediate from the raw-Hessian family.','metric-a':'OOM-aborted intermediate from the raw-Hessian family.','metric-b':'OOM during setup; no objective evaluations.'},'priorExposure':'Earlier project work used evaluation datasets. New scored results are not pristine external validation.','normalNativeMask':'3331 supported pairs, unchanged from 0.12; all-input ColorBench separately mapped.'}
for name,trial in [('balanced','conditioned-c'),('metric','metric-b2')]:
 r=json.loads((P/f'trials/{trial}.json').read_text());assert len(r['coefficients'])==1 and r['layers']==7 and r['ring_logits'] is None
 c=json.loads((P/f'results/{name}.json').read_text());assert c['coefficients']==r['coefficients'] and c['dark']==r['dark']
 sel['candidates'][name]={'trial':trial,'sha256':h(P/f'results/{name}.json'),'trial_sha256':h(P/f'trials/{trial}.json'),'layers':7}
(P/'results/SELECTION.json').write_text(json.dumps(sel,indent=2)+'\n')
statuses=json.loads((P/'trials/EXECUTION-STATUS.json').read_text())
for n in ['smooth-b','metric-b2','conditioned-c']:statuses[n]='Completed; original full trace and final array preserved'
(P/'trials/EXECUTION-STATUS.json').write_text(json.dumps(statuses,indent=2)+'\n')
reg=[]
for f in sorted((P/'trials').glob('*.jsonl')):
 lines=[json.loads(x) for x in f.read_text().splitlines() if x.strip()];record=f.with_suffix('.json');progress=lines[::50]
 if lines and (not progress or progress[-1]!=lines[-1]):progress.append(lines[-1])
 (P/'trials'/(f.stem+'-progress.json')).write_text(json.dumps({'note':'Sampled progress, not the complete original JSONL. Full trace in downloadable review ZIP.','trace_sha256':h(f),'evaluations':len(lines),'sampled_evaluations':progress},indent=2)+'\n')
 reg.append({'trial':f.stem,'status':statuses.get(f.stem),'trace_sha256':h(f),'trace_evaluations':len(lines),'trace_bytes':f.stat().st_size,'record_sha256':h(record) if record.exists() else None,'fullTraceLocation':'Review ZIP: v2/research/boundary-tonal/trials/'+f.name})
(P/'trials/registry.json').write_text(json.dumps(reg,indent=2)+'\n')
print(json.dumps(sel,indent=2));print('Completed',sum(x['trace_evaluations'] for x in reg if x['trial'] in ['smooth-b','metric-b2','conditioned-c']),'and all executed',sum(x['trace_evaluations'] for x in reg))

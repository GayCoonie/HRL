"""Recover complete source entries, then prepare an auditable fresh continuation.
No missing coefficient arrays or optimizer logs are inferred from the interrupted stream.
"""
from pathlib import Path
import base64,zlib,json,hashlib,re
P=Path(__file__).resolve().parent;G=P/'../gen-tonal-fit'
for d in ['results','trials','recovery']:(P/d).mkdir(exist_ok=True)
expected={'EVIDENCE.md':'98f83071b8608d4ae51a6fcba8f0f9c93f153dec718ff6a6bdf6083c770d7d20','build-site.py':'ea1f30915632861416e5d891e64df5c6c859bc2e17c3c081e26ea219df263b2f','fit-v1.py':'b17b7d5d17fae3ad80e22835d4343acc68f6caf57357cc38e3c5a990caaa5634','fit-v2.py':'87e49f4f3c2f1a27e64f00777f2ca701c710dbe7f4d13f6d25e212d0cb22e3c1'}
if not all((P/n).exists() for n in expected):
 chunks=sorted(P.glob('transfer-*.txt'),key=lambda p:int(p.stem.split('-')[1]));text=''.join(''.join(p.read_text().split()) for p in chunks);d=zlib.decompressobj();raw=b''
 for i in range(0,len(text)-3,4):raw+=d.decompress(base64.b64decode(text[i:i+4]))
 s=raw.decode('utf8',errors='replace');pos=1;dec=json.JSONDecoder();found=[]
 while pos<len(s):
  try:
   while s[pos].isspace() or s[pos]==',':pos+=1
   key,pos=dec.raw_decode(s,pos)
   while s[pos].isspace() or s[pos]==':':pos+=1
   value,pos=dec.raw_decode(s,pos)
   if not isinstance(value,str) or not key.startswith('v2/research/hue-fair-refine/'):continue
   name=Path(key).name
   if name in expected:
    assert hashlib.sha256(value.encode()).hexdigest()==expected[name],name
    (P/name).write_text(value);found.append(name)
   elif name in ['EXECUTION.md','README.md']:(P/'recovery'/('interrupted-'+name)).write_text(value)
  except (IndexError,json.JSONDecodeError):break
 (P/'recovery/stream-receipt.json').write_text(json.dumps({'parts':len(chunks),'streamComplete':d.eof,'recovered':found,'note':'Only complete, hash-checked executable entries are used. Incomplete stream is not a recovered trial archive.'},indent=2)+'\n')
for n,h in expected.items():assert hashlib.sha256((P/n).read_bytes()).hexdigest()==h,n
s=(P/'fit-v2.py').read_text().replace("('gridroot','../gen-tonal-fit/results',str)","('gridroot','results',str),('metricguard',300.,float),('gain',.001,float)").replace("metric_guard=F.relu(st-p['base_stress2']).square()","metric_guard=F.relu(st-p['base_stress2']+args.gain).square()").replace('10*metric_guard','args.metricguard*metric_guard').replace("'data_exposure':'Prior development", "'recovery':'New fit after partial-stream recovery. Not a reconstruction of lost trial logs.', 'code_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'data_exposure':'Prior development")
(P/'fit.py').write_text(s);(P/'cache.mjs').write_text((G/'cache.mjs').read_text())
(P/'index.mjs').write_text('''/** Balanced-parent shared-gamut refinements. Previous APIs remain untouched. */
import {createGenTonalHRL} from '../gen-tonal-fit/index.mjs';
export {coordinates,ADOBE_RGB1998,DISPLAY_P3,REC2020,addBlack,addWhite,exchangeNeutral,getSource} from '../gen-tonal-fit/index.mjs';
export async function createHueFairHRL({checkpoint='balanced',record=null,...options}={}){
 if(!record){if(!/^[a-z0-9-]+$/.test(checkpoint))throw RangeError('Invalid checkpoint');const u=new URL(`results/${checkpoint}.json`,import.meta.url);if(u.protocol==='file:'){const{readFile}=await import('node:fs/promises');record=JSON.parse(await readFile(u,'utf8'));}else{const r=await fetch(u);if(!r.ok)throw Error('Checkpoint unavailable '+r.status);record=await r.json();}}
 const m=await createGenTonalHRL({...options,record});m.version='0.12-hue-fair';m.name='HRL 0.12 '+record.variant;m.model.version=m.version;m.model.name=m.name;return m;
}
''')
s=(G/'evaluate.mjs').read_text().replace("import {createGenTonalHRL} from './index.mjs';import {createSharedHRL} from '../shared-rl/source.mjs';","import {createHueFairHRL} from './index.mjs';import {createGenTonalHRL} from '../gen-tonal-fit/index.mjs';")
s=s.replace("name.startsWith('old-')", "name==='parent'").replace('`../shared-rl/results/${name.slice(4)}.json`',"'../gen-tonal-fit/results/balanced.json'").replace("await createSharedHRL({gamut,record}):await createGenTonalHRL({gamut,record})","await createGenTonalHRL({gamut,record}):await createHueFairHRL({gamut,record})")
(P/'evaluate.mjs').write_text(s)
s=(G/'verify.mjs').read_text().replace('createGenTonalHRL','createHueFairHRL').replace("['balanced','metric']","['balanced','gentle']")
(P/'verify.mjs').write_text(s)
s=(G/'parity.py').read_text().replace("['balanced','metric']","['balanced','gentle']").replace('m.InversePhi','m.base.InversePhi');(P/'parity.py').write_text(s)
s=(G/'benchmark.py').read_text().replace("['old-balanced','old-metric','balanced','metric']","['parent','balanced','gentle']").replace("['balanced','metric']","['balanced','gentle']").replace('results/metric.json','results/gentle.json').replace(' + GenSpace tonal fit',' + balanced-parent hue refinement')
(P/'benchmark.py').write_text(s)
s=(G/'bridge.mjs').read_text();s='''/** Same scored judges, source adaptation and strict/clipped policies. */
import {createInterface} from 'node:readline';
import {createGenTonalHRL} from '../gen-tonal-fit/index.mjs';
import {createHueFairHRL} from './index.mjs';
const c=JSON.parse(process.argv[2]),opts={gamut:c.gamut,overflow:c.policy,imaginary:c.policy};
const m=c.mode==='parent'?await createGenTonalHRL({...opts,checkpoint:'balanced'}):await createHueFairHRL({...opts,checkpoint:c.mode});
'''+s[s.index('for await'):];(P/'bridge.mjs').write_text(s)
s=(G/'preview.mjs').read_text().replace("import {createGenTonalHRL} from './index.mjs';import {createSharedHRL} from '../shared-rl/source.mjs';","import {createHueFairHRL} from './index.mjs';import {createGenTonalHRL} from '../gen-tonal-fit/index.mjs';").replace("['old-balanced','old-metric','balanced','metric']","['parent','balanced','gentle']").replace("names.push('old-balanced','old-metric','balanced','metric')","names.push('parent','balanced','gentle')").replace("name.startsWith('old-')", "name==='parent'").replace("rec?await createGenTonalHRL({gamut,record:rec}):await createSharedHRL({gamut,checkpoint:name.slice(4)})","rec?await createHueFairHRL({gamut,record:rec}):await createGenTonalHRL({gamut,checkpoint:'balanced'})").replace('[30,90,150,210,240,270,300,330]','[30,90,150,210,240,255,263,269,273,275,277,281,285,293,300,330]')
(P/'preview.mjs').write_text(s)
s=(G/'build-preview.py').read_text().replace('[30,90,150,210,240,270,300,330]','[30,90,150,210,240,255,263,269,273,275,277,281,285,293,300,330]').replace('[240,270,300,330]','[255,263,269,273,275,277,281,285,293]').replace('HRL GenSpace tonal fit','HRL balanced-parent refinement')
(P/'build-preview.py').write_text(s)
s=(G/'site-check.py').read_text().replace('v2/gen-tonal.html','v2/hue-fair.html').replace('a[href="gen-tonal.html"]','a[href="hue-fair.html"]').replace("==4","==3").replace("'metric'","'gentle'").replace("'METRIC'","'GENTLE'").replace("'HRL-0.11-gen-tonal'","'HRL-0.12-hue-fair'").replace("'old-metric'","'parent'").replace("'OLD-METRIC'","'PARENT'").replace("'HRL-0.10-shared-RL'","'HRL-0.11-gen-tonal'").replace("'fourPanels':True","'threePanels':True").replace("'whiteDilutionStrips':4","'whiteDilutionStrips':3")
s=s.replace("assert page.locator('.panel').count()==3;", "assert page.locator('.panel').count()==3;page.wait_for_function(\"document.querySelectorAll('#problemHues button').length===8\",timeout=30000);")
(P/'site-check.py').write_text(s)
(P/'RECOVERY.md').write_text('''# Interrupted-turn recovery and new runs
The original PLAN.md is preserved. Fourteen of 31 source-transfer segments reached main. Complete source entries up to fit-v2.py were recovered, with their byte hashes checked. Later stream content was incomplete/corrupt. Missing trial arrays and objective logs were not reconstructed from images or prose.

The recovered EXECUTION/README drafts are retained under recovery/ only, not presented as proof of completed publication. New runs resume-a and resume-b start from the actual 0.11 Gen tonal balanced lineage; every evaluation is logged. The recovered fitter adds an explicit soft COMBVD ceiling using metricguard and gain arguments. These are new experiments, not bit-identical recovery of fair-c/fair-d. The fitting and selection records distinguish them.

The source grid is 96 hues by 193 x 193 cosine-spaced coordinates per gamut. The new map retains one bank, six invertible coupling layers, and the inherited boundaries, hue field/ring, neutral shift and dark-curve family. No new observer data, scalar lightness target or Oklab ruler is introduced. Final numerical, scored and public browser checks have separate receipts.
''')
print('Prepared recovered fitter and exact-runtime adapters')

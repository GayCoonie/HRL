from pathlib import Path
import gzip,hashlib,json,struct,subprocess
BASE=Path('/workspace/scratch/20abb8fd27ac');REPO=BASE/'hrl-v2-next';T=REPO/'v2/research/tonal-next';B=REPO/'v2/research/boundary-tonal';OUT=Path('/workspace/scratch/13a5381bdd70/review')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
i=json.loads((B/'results/training-inputs.json').read_text());cache=json.loads((B/'results/cache.json').read_text());mask=hashlib.sha256(b''.join(struct.pack('<q',v) for v in i['native_indices'])).hexdigest()
assert mask==i['provenance']['native_mask_sha256'];assert cache['profiles']['srgb']['indices']==i['native_indices'];assert cache['profiles']['full']['indices']==list(range(3813));assert len(i['native_indices'])==3331
manifest=json.loads((B/'results/colorbench.json').read_text())['frozen_source_hashes'];assert len(manifest)==148
for f,h in manifest.items():assert sha(B/f)==h,f
sources={sha(T/f):f for f in ['fit.py','fit-sheet-round.py','fit-first-round.py']};records={}
for f in sorted((T/'trials').glob('*.json')):
 d=json.loads(f.read_text());r=d['research'];trace=f.with_suffix('.jsonl');rows=[json.loads(s) for s in trace.read_text().splitlines()];assert len(rows)==r['evaluations'];assert len(d['coefficients'])==1 and len(d['coefficients'][0])==7;assert r['parent_sha256']==sha(B/'trials/metric-b2.json');assert r['fit']['steps']<=700
 records[f.stem]={'recordSHA256':sha(f),'traceRows':len(rows),'traceSHA256':sha(trace),'fitSource':sources[r['code_sha256']],'fitSourceSHA256':r['code_sha256']}
for z in (T/'trials').glob('*.jsonl.gz'):assert gzip.decompress(z.read_bytes())==z.with_suffix('').read_bytes()
archives={}
for z in (T/'results').glob('*.json.gz'):
 raw=BASE/'hrl-optimization'/z.name[:-3]
 assert raw.exists();assert gzip.decompress(z.read_bytes())==raw.read_bytes();archives[z.name]=sha(raw)
comparison=json.loads((T/'results/comparison.json').read_text());assert set(comparison['selection'])==set(records);assert len(records)==6
for n,h in comparison['receiptSHA256'].items():assert sha(BASE/'hrl-optimization'/n)==h
critical=json.loads((T/'results/grid-critical.json').read_text());gridchecks={}
for gamut,p in critical['profiles'].items():
 f=BASE/f'hrl-optimization/cache-critical/gen-grid-{gamut}.f64'; parent=BASE/f'hrl-optimization/cache/gen-grid-{gamut}.f64'; data=f.read_bytes();assert hashlib.sha256(data).hexdigest()==p['sha256'];assert len(data)==p['bytes'];assert data[:p['preservedPrefixBytes']]==parent.read_bytes();gridchecks[gamut]={'hash':p['sha256'],'prefixUnchanged':True,'bytes':len(data)}
cmd=['git','diff','--exit-code','bc70cc754e83c92790a88e0833ca8956d4d1407e','--','v2/index.mjs','v2/research/boundary-tonal','v2/research/shared-rl','v2/research/relative-domain','v2/lib','src'];proc=subprocess.run(cmd,cwd=REPO,capture_output=True,text=True);assert proc.returncode==0,proc.stdout
r={'status':'passed','currentFrozenFileHashes':148,'frozenDiffCommand':cmd,'frozenDiffExitCode':proc.returncode,'nativeMaskSHA256':mask,'nativePairs':3331,'fullPairs':3813,'cacheIndicesMatch':True,'records':records,'archives':archives,'criticalGridChecks':gridchecks,'comparisonSHA256':sha(T/'results/comparison.json')};(OUT/'integrity-fresh.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'status':'passed','frozenFileHashes':148,'records':len(records),'archiveCount':len(archives),'criticalGridPrefixChecks':gridchecks,'comparisonSHA256':r['comparisonSHA256']},indent=2))

"""Deterministically gzip completed public audit/trace payloads; keep raw receipts."""
from pathlib import Path
import argparse,gzip,hashlib,json,shutil
p=argparse.ArgumentParser();p.add_argument('--raw-dir',required=True);a=p.parse_args();root=Path(__file__).resolve().parent;rawdir=Path(a.raw_dir);rawdir.mkdir(parents=True,exist_ok=True)
paths=list((root/'results').glob('*-audit.json'))+list((root/'trials').glob('*.jsonl'))+[root/'results/runtime-parity-final-fixture.json'];rows=[]
assert len(list((root/'results').glob('*-audit.json')))==6
for f in paths:
 raw=f.read_bytes()
 if f.name.endswith('-audit.json'):assert json.loads(raw)['status']=='completed',f
 target=f.with_name(f.name+'.gz');assert not target.exists(),target
 stored=gzip.compress(raw,compresslevel=9,mtime=0);assert gzip.decompress(stored)==raw;target.write_bytes(stored)
 relative=f.relative_to(root);backup=rawdir/relative;backup.parent.mkdir(exist_ok=True,parents=True);assert not backup.exists();shutil.move(f,backup)
 rows.append({'path':str(target.relative_to(root)),'bytes':len(stored),'sha256':hashlib.sha256(stored).hexdigest(),'decompressedBytes':len(raw),'decompressedSHA256':hashlib.sha256(raw).hexdigest()})
for name in ['runtime-parity-fixture.json','runtime-parity-receipt.json']:
 f=root/'results'/name
 if f.exists():shutil.move(f,rawdir/'results'/name)
(root/'results/compressed-payloads.json').write_text(json.dumps({'schema':'hrl-global-compression-v1','gzipMtime':0,'files':rows},indent=2)+'\n')
print(json.dumps({'compressedFiles':len(rows),'storedBytes':sum(r['bytes'] for r in rows),'rawBytes':sum(r['decompressedBytes'] for r in rows)}))

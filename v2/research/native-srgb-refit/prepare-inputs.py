"""Recover the exact already-pinned ColorBench tuples; no new observation data."""
from pathlib import Path
import json,numpy as np
root=Path(__file__).resolve().parent
p=root/'../relative-domain/results/relative-candidate-srgb-300-clip-combvd.npz'
a=np.load(p)
rows=[dict(index=i,xyz1=x.tolist(),xyz2=y.tolist(),dv=float(d),weight=int(w)) for i,(x,y,d,w) in enumerate(zip(a['xyz1'],a['xyz2'],a['dv'],a['weights']))]
(root/'results').mkdir(exist_ok=True)
(root/'results/training-pairs.json').write_text(json.dumps(rows)+'\n')
print('Prepared',len(rows),'pairs; cache.mjs derives the unchanged native subset.')

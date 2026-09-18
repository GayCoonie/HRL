"""Retain exact prior COMBVD inputs and masks; no new test-method preprocessing."""
from pathlib import Path
import numpy as np,json,hashlib
P=Path(__file__).resolve().parent
old=P/'../mapped-012/results/balanced-full-combvd.npz';z=np.load(old)
h=json.loads((P/'../hue-fair-refine/results/colorbench.json').read_text())
keep=h['models']['balanced-srgb']['combvd']['retained_indices']
assert len(keep)==3331 and len(z['dv'])==3813
x={'xyz1':z['xyz1'].tolist(),'xyz2':z['xyz2'].tolist(),'dv':z['dv'].tolist(),'w':z['weights'].tolist(),'native_indices':keep,'provenance':{'preparedXYZ':'Original pinned ColorBench preprocessing, retained from mapped-012','source_file':str(old.relative_to(P)),'sha256':hashlib.sha256(old.read_bytes()).hexdigest(),'native_mask_sha256':hashlib.sha256(np.array(keep,dtype='<i8').tobytes()).hexdigest()}}
(P/'results/training-inputs.json').write_text(json.dumps(x,separators=(',',':'))+'\n')
print('3813 prepared pairs; normal native retained mask 3331',x['provenance'])

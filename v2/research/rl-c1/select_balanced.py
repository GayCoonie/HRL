from pathlib import Path
import json
import numpy as np
here=Path(__file__).resolve().parent
start=json.loads((here/'../../a-smooth/definitions.json').resolve().read_text())['models']['smooth']
record=json.loads((here/'results/fit-2p0.json').read_text())
C=np.asarray(record['coefficients']);C[0]=.5*(np.asarray(start['coefficients'])[0]+C[0])
record['coefficients']=C.tolist();record['id']='OPAL-0.8A-RL-C1-balanced';record['variant']='C1-balanced'
record['research']['native_fit_fraction']=.5;record['research']['full_fit_fraction']=1.
record['research']['selection']='Native coefficient step halved after the actual R/L output-ramp check; full fit remains the strongest regularized (2.0) candidate. Not an accepted release.'
(here/'candidate.json').write_text(json.dumps(record,indent=2)+'\n')

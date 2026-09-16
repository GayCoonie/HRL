"""Reproduce descriptive statistics in the study's own DKL threshold units.
This is NOT an HRL-coordinate fit: the Judd-corrected stimulus calibration has
not yet been converted into uncorrected 1931 XYZ. Do not silently call it Vos.
"""
from pathlib import Path
import json
import pandas as pd
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'sources/hedjar-2025'
t=pd.read_csv(p/'thresholds.csv');s=pd.read_csv(p/'PSEs.csv');d=pd.read_csv(p/'detection_thresholds.csv')
x=t.groupby(['ptID','chroma radius','quadrant','color dimension'])['JND (DT units)'].mean().unstack()
x['ratio']=x.chroma/x.hue
summary=[]
for (r,q),z in x.groupby(['chroma radius','quadrant']):
 summary.append({'radius':r,'quadrant':int(q),'observers':len(z),'mean_chroma_jnd':float(z.chroma.mean()),'mean_hue_jnd':float(z.hue.mean()),'mean_individual_chroma_to_hue_ratio':float(z.ratio.mean()),'geometric_mean_ratio':float(np.exp(np.log(z.ratio).mean()))})
# Both directions estimate the factor multiplying Q4 chroma to equate it with Q1.
f=np.where(s['quadrant of reference']==1,s['chroma of reference (DT units)']/s['chroma of test (DT units)'],s['chroma of test (DT units)']/s['chroma of reference (DT units)'])
factors=pd.DataFrame({'observer':s.ptID,'logfactor':np.log(f)}).groupby('observer').logfactor.mean().apply(np.exp)
scale=float(d[d.angle.isin([90,270])]['JND (arbitrary DKL units)'].mean()/d[d.angle.isin([0,180])]['JND (arbitrary DKL units)'].mean())
record={'source':'Hedjar, Toscani & Gegenfurtner 2025, DOI 10.1364/JOSAA.544641; data DOI 10.5281/zenodo.14892898','role':'Study-coordinate diagnostic and motivation for separate discrimination fitting, NOT numerical HRL training','rows':{'thresholds':len(t),'saturation_PSEs':len(s),'detection':len(d)},'S_axis_factor':scale,'mean_observer_Q4_scaling':float(factors.mean()),'geometric_mean_observer_Q4_scaling':float(np.exp(np.mean(np.log(factors)))), 'observer_scaling':{str(k):float(v)for k,v in factors.items()},'threshold_summary':summary,'cautions':['The published results table contains a reversed Q1/Q4 sentence on PDF p6; the raw data, figures and principal conclusion agree on larger chroma:hue ratios in Q4.','Calibrations are identified as Judd-corrected in the paper, not explicitly Judd-Vos. A stimulus-specific translation is required before direct HRL scoring.','These are processed per-observer threshold and PSE estimates, not the original trial-level choices.','The paper reports 0.91. Released CSV gives arithmetic mean of observer geometric factors 0.9251 and across-observer geometric mean about 0.917. This is not an exact replication of the authors pipeline.']}
(ROOT/'results/hedjar-diagnostic.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record,indent=2))

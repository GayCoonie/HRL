"""Nayatani & Sakai 2011: observed Table A-II only, not predicted Table I.
Renotation is a colorimetric reconstruction of the printed Munsell notations,
not recovered spectrophotometry of the study's particular JIS chips.
"""
import numpy as np,json,re,sys,hashlib,math
from pathlib import Path
from scipy.interpolate import PchipInterpolator
from scipy.optimize import minimize
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parent/'equal-span/code'))
from huefield import Cone,adapt,C_WHITE
public=Path(sys.argv[1]) if len(sys.argv)>1 else None
def load(p):
 text=p.read_text();pat=r'\(\("([^"]+)", ([0-9.]+), ([0-9.]+)\), np.array\(\[([^\]]+)\]\)\)'
 return {(h,float(v),float(c)):np.array([float(x) for x in xyz.split(',')])for h,v,c,xyz in re.findall(pat,text)}
if public is not None:
 ren=load(public/'munsell-real.py')
else:
 snapshot=json.loads((ROOT/'sources/munsell-renotation-subset.json').read_text())
 ren={(r['H'],r['V'],r['C']):np.array(r['xyY'])for r in snapshot['rows']}
def from_munsell(h,V,C):
 vs=sorted(v for (h0,v,c) in ren if h0==h and c==C)
 if not vs or V<vs[0] or V>vs[-1]:raise ValueError(f'Outside real renotation bracket {h} {V}/{C}: {vs}')
 values=np.array([ren[h,v,C] for v in vs]);v=np.array([np.interp(V,vs,values[:,i])for i in range(3)])
 # Interpolate xy in Value, use the renotation's smooth tabulated Y(Value).
 # 0.975 is the dataset's documented reflectance scaling correction.
 v[2]=float(PchipInterpolator(vs,values[:,2])(V))*.975/100
 x,y,Y=v;return adapt(np.array([x/y*Y,Y,(1-x-y)/y*Y]),C_WHITE).tolist()
hues=['5P','5PB','5B','5BG','5G','5GY','5Y','5YR','5R','5RP']
observed=[[None,5,None,None,4.85,6.77,8,6.56,5.83,5.63],[None,4,None,None,4.13,5.50,6.54,5.35,4.54,4.21],[4.85,4.53,4.61,4.58,4.93,6.16,7,5.89,5.23,5.13]]
refs=[('5Y',8,10),('5PB',4,10),('5Y',7,8)];rows=[]
for e,vals in enumerate(observed):
 ref=refs[e];x1=from_munsell(*ref)
 for h,V in zip(hues,vals):
  if V is None or (h,V,ref[2])==ref:continue
  rows.append({'experiment':e+1,'observers':24 if e<2 else 4,'reference':ref,'sample':[h,V,ref[2]],'xyz1':x1,'xyz2':from_munsell(h,V,ref[2]),'quantity':'equal perceived lightness; not equal HRL Level','study':'Nayatani2011'})
# Keep the colour-science renotation rows actually used, not copied paper text.
used_h=set(hues);sub=[{'H':h,'V':v,'C':c,'xyY':p.tolist()}for (h,v,c),p in ren.items()if h in used_h and c in (8,10)]
(ROOT/'sources/munsell-renotation-subset.json').write_text(json.dumps({'origin':'colour-science/colour v0.4.6 real.py; underlying 1943 renotation, illuminant C','Y_scaling':.975,'rows':sub},indent=2)+'\n')
if public is not None:(ROOT/'sources/colour-LICENSE').write_text((public/'colour-LICENSE').read_text())
source={'doi':'10.1002/col.20596','source':'User-supplied nayatani2011.pdf, PDF page 7, Table A-II','observed_values':dict(zip(hues,zip(*observed))),'pairs':rows,'assumptions':['Actual study chip spectra are unavailable. Printed notations reconstructed from real Munsell renotations, interpolated xy(Value) and PCHIP Y(Value), Bradford C to D65.','Experiments 1 and 2 used D65 fluorescent illumination at 1000 lux; experiment 3 used north-sky daylight at least 1800 lux and repeats earlier 1994 observations.','Predictions in Table I / CS function not counted as additional observer matches.']}
(ROOT/'sources/nayatani2011-observed.json').write_text(json.dumps(source,indent=2)+'\n')
old=json.loads((ROOT.parent/'equal-span/results/brightness-fit.json').read_text());cs=old['stimuli'];xyz=[np.array([x/y*Y,Y,(1-x-y)/y*Y])for (x,y),Y in zip(cs['xy'],cs['Y_cd_m2'])]
for i in (1,2):rows.append(dict(study='Corney2009',experiment=0,xyz1=xyz[0].tolist(),xyz2=xyz[i].tolist()))
cone=Cone();K=4
def features(xyz):
 t,r,a=cone.coordinates(np.asarray(xyz));t=np.deg2rad(t)
 return r[:,None]*np.stack([np.ones_like(t)]+[v for k in range(1,K+1)for v in (np.cos(k*t),np.sin(k*t))],1)
A=features([r['xyz1'] for r in rows])-features([r['xyz2'] for r in rows]);b=np.log([r['xyz2'][1]/r['xyz1'][1] for r in rows])/3
weights=np.array([1/2 if r['study']=='Corney2009' else (1/6 if r['experiment']<3 else .5/9)for r in rows]);weights/=weights.sum()
prior=np.zeros(1+2*K);c=old['choice']['coefficients'];prior[0]=c[0];prior[3:5]=c[1:]
t=np.arange(720)*np.pi/360;F=np.stack([np.ones_like(t)]+[v for k in range(1,K+1)for v in (np.cos(k*t),np.sin(k*t))],1);freq=np.array([1]+[k*k for k in range(1,K+1)for _ in range(2)])
fits=[]
for lam in [.001,.01,.05]:
 res=minimize(lambda c:np.sum(weights*(A@c-b)**2)+lam*np.mean(freq*(c-prior)**2),prior,method='SLSQP',constraints=[dict(type='ineq',fun=lambda c:F@c)],options={'maxiter':1000,'ftol':1e-13})
 fits.append({'ridge':lam,'coefficients':res.x.tolist(),'harmonics':K,'log_equivalent_Y_rmse':float(np.sqrt(np.mean((3*(A@res.x-b))**2))),'legacy_rmse':float(np.sqrt(np.mean((3*(A@prior-b))**2))),'success':bool(res.success)})
record={'id':'OPAL0.7-Nayatani-Corney-readout','selected':fits[1],'sensitivity':fits,'pairs':rows,'formula':'Yeq=Y*exp(3*rho*k(theta)), k Fourier series constrained nonnegative at 720 angular grid points through harmonic 4; B=Lstar(Yeq)/100. Four-study weights 1,1,1,0.5, then normalized.','note':'HK readout calibration only. Equal perceived lightness does NOT impose equal native Level.'}
(ROOT/'results/brightness-readout.json').write_text(json.dumps(record,indent=2)+'\n');print('Nayatani 21 + Corney 2 =',len(rows));print(fits)

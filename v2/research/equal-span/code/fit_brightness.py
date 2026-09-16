"""Sparse HK readout calibration from Corney et al. 2009 p.11.
Two reported brightness matches, NOT their 25,000 synthetic scenes or fMRI BOLD
values, enter this calibration. This readout does not redefine HRL Level.
"""
import sys,json,numpy as np
from pathlib import Path
from scipy.optimize import minimize
sys.path.insert(0,str(Path(__file__).resolve().parent))
from huefield import Cone
ROOT=Path(__file__).resolve().parents[1]
xyz=[]
xy=np.array([[.154,.107],[.362,.470],[.178,.150]]);Y=np.array([2.6,3.6,4.1])
xyz=np.c_[xy[:,0]/xy[:,1]*Y,Y,(1-xy.sum(1))/xy[:,1]*Y]
c=Cone();theta,rho,_=c.coordinates(xyz);th=np.deg2rad(theta)
X=np.c_[rho,rho*np.cos(2*th),rho*np.sin(2*th)];A=X[0]-X[1:];b=np.log(Y[1:]/Y[0])/3
# One regularized, nonnegative chromatic lift with just a 2nd harmonic.
# Ridge fixes the underdetermined coefficient choice; its strength is not an
# observer precision estimate. Keep the sensitivity fit, not only best residual.
fits=[]
for lam in [.0001,.001,.01]:
 r=minimize(lambda v:np.sum((A@v-b)**2)+lam*np.dot(v,v),[.5,0,0],constraints=[{'type':'ineq','fun':lambda v:v[0]-np.hypot(v[1],v[2])}],method='SLSQP',options={'ftol':1e-13,'maxiter':1000})
 fits.append({'ridge':lam,'coefficients':r.x.tolist(),'log_brightness_residuals':(A@r.x-b).tolist(),'converged':bool(r.success),'predicted_matching_Y':[float(Y[0]*np.exp(3*z)) for z in A@r.x]})
record={'id':'Corney-HK-readout-0.6','source_doi':'10.1371/journal.pone.0005091','page':11,'formula':'Y_equivalent=Y*exp(3*rho*(k0+k1*cos(2theta)+k2*sin(2theta))); brightness readout uses CIE L* of that equivalent relative Y, extended above 1 for readout only.','choice':fits[1],'sensitivity':fits,'stimuli':{'names':['blue standard','brightness-matched yellow','brightness-matched lower-purity blue'],'xy':xy.tolist(),'Y_cd_m2':Y.tolist()},'limitations':['Only two aggregate brightness matches available in paper; not dense observer calibration.','The model structure and ridge regularization are explicit priors.','No fMRI response magnitude or synthetic ideal-observer sample is treated as a measured color-distance target.','Reference D65 chromaticity used for transferred readout; original source does not supply a matching neutral-white luminance.','Equivalent readout can exceed reference white; HRL bicone remains fully bounded because every path is normalized to its own endpoints.']}
(ROOT/'results/brightness-fit.json').write_text(json.dumps(record,indent=2));print(json.dumps(record,indent=2))

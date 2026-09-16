"""Fit a context-aware saturation READOUT to Schiller et al. raw 2AFC data.
This is not the definition of HRL Reach. It informs normalized path placement.
The likelihood uses raw trials; no PSE or JND is invented from a plot.
"""
from pathlib import Path
import numpy as np,pandas as pd,json,re,sys,time
from scipy.optimize import minimize
from scipy.special import expit
ROOT=Path(__file__).resolve().parents[1]
RAW=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'sources/schiller'
W=np.array([.331,.339]); STD=np.array([[.382,.285],[.252,.369],[.362,.415]])
ENDS={1:np.array([[.252,.190],[.181,.256],[.187,.324],[.194,.394],[.212,.645],[.419,.492],[.506,.425],[.597,.355],[.483,.269],[.381,.209]]),2:np.array([[.262,.208],[.157,.242],[.162,.321],[.168,.405],[.188,.639],[.437,.523],[.536,.440],[.509,.349],[.447,.286],[.376,.221]]),3:np.array([[np.nan,np.nan],[.189,.260],[np.nan,np.nan],[np.nan,np.nan],[.212,.645],[np.nan,np.nan],[np.nan,np.nan],[.546,.352],[np.nan,np.nan],[np.nan,np.nan]])}
# Paper explicitly names the two Exp3 exclusions, but not Exp2 IDs in the text.
# The raw-trial fit keeps all supplied Exp2 observers and declares that
# population. It does not claim to reproduce the paper's exclusions. Avoid guessing which IDs were excluded.
def uv(xy):
 x,y=np.moveaxis(np.asarray(xy),-1,0);d=-2*x+12*y+3
 return np.stack([4*x/d,9*y/d],-1)
def features(xy,kappa):
 d=uv(xy)-uv(W);r=np.linalg.norm(d,axis=-1);th=np.arctan2(d[...,1],d[...,0])
 f=[np.log(np.maximum(r,1e-8))]
 for j in range(1,5):f.extend([np.cos(j*th),np.sin(j*th)])
 # Radius dependence learns progression, with no pseudo-primary landmarks.
 f.extend([r/.25,(r/.25)**2])
 for j in range(1,3): f.extend([kappa*np.cos(j*th),kappa*np.sin(j*th)])
 return np.stack(f,-1)
def main():
 allrows=[]
 for ex in [1,2,3]:
  for path in sorted((RAW/f'Exp{ex}').glob('participant*.txt')):
   df=pd.read_csv(path,sep=r'\s+');df['experiment']=ex;df['file']=path.name
   df=df[~df.Block.str.startswith('p')&~df.Group.str.startswith('p')].copy()
   if ex==3:df=df[~df.Subject.isin([2,10])]
   groups=df.Block.str.extract(r'bg(\d+)st(\d+)').astype(int);df['bg']=groups[0];df['Y']=groups[1]
   cond=df.Condition.str.extract(r'Line(\d+)T(\d+)').astype(int);df['direction']=cond[0];df['standard']=cond[1]
   df['participant']=str(ex)+':'+df.Subject.astype(str)
   allrows.append(df)
 df=pd.concat(allrows,ignore_index=True)
 endpoints=np.stack([ENDS[int(ex)][int(di)-1] for ex,di in zip(df.experiment,df.direction)])
 cmp=W+df.DistanceWhitePoint.to_numpy()[:,None]*(endpoints-W); std=STD[df.standard.to_numpy()-1]
 contrast=(df.Y.to_numpy()-df.bg.to_numpy())/(df.Y.to_numpy()+df.bg.to_numpy())
 X=features(cmp,contrast)-features(std,contrast); y=df.Response.to_numpy(float)
 assert np.all(np.isfinite(X)) and np.all((y==0)|(y==1))
 weight=np.ones(len(df))
 # Experiments equal weight, observers equal within each experiment.
 for ex in [1,2,3]:
  sub=df.experiment==ex;people=df.loc[sub,'participant'].unique()
  for p in people:
   ind=df.participant==p;weight[ind]=1/(len(people)*ind.sum())
 weight*=len(weight)/weight.sum()
 ridge=np.r_[.03,np.repeat(.7,8),4.,8.,np.repeat(1.,4)]
 def fit(mask):
  xm,ym,wm=X[mask],y[mask],weight[mask];wm=wm/wm.sum()*len(wm)
  def fun(b):
   z=xm@b;res=expit(z)-ym
   return float(np.dot(wm,np.logaddexp(0,z)-ym*z)+.5*np.dot(ridge*b,b)),xm.T@(wm*res)+ridge*b
  b0=np.zeros(15);b0[0]=5
  # Positive radial slope everywhere: keep extra terms modest vs beta0.
  # beta0>=1, radius coefficients >=0 => log-readout strictly increasing.
  bounds=[(.1,40)]+[(-20,20)]*8+[(0,0),(0,0)]+[(-20,20)]*4
  return minimize(fun,b0,jac=True,method='L-BFGS-B',bounds=bounds,options={'maxiter':500,'ftol':1e-11})
 # Retrospective observer-grouped 3-fold diagnostic, no trials split within observer.
 people=sorted(df.participant.unique());foldmap={p:i%3 for i,p in enumerate(people)};fold=df.participant.map(foldmap).to_numpy()
 cv=[]
 for k in range(3):
  m=fold!=k;r=fit(m);z=X[~m]@r.x;ym=y[~m]
  cv.append(dict(fold=k,n=int((~m).sum()),logloss=float(np.mean(np.logaddexp(0,z)-ym*z)),accuracy=float(np.mean((z>0)==ym)),converged=bool(r.success)))
 res=fit(np.ones(len(df),bool));coef=res.x/res.x[0];pred=expit(X@res.x)
 report={'id':'Schiller-saturation-readout-0.6','source_doi':'10.1016/j.visres.2017.04.012','data_doi':'10.5281/zenodo.572983','raw_n':len(df),'participants_by_experiment':{str(ex):int(df[df.experiment==ex].Subject.nunique()) for ex in [1,2,3]},'trials_by_experiment':{str(ex):int((df.experiment==ex).sum()) for ex in [1,2,3]},'white_xy_source':W.tolist(),'fit':'Raw-response logistic likelihood; source/observer-balanced; regularized Fourier angular readout and signed-contrast terms; radial log-distance baseline fixed because ordinal comparisons do not identify a cardinal saturation scale.','predictor':'log S=log(r_uv)+harmonic(theta)+b9*r/.25+b10*(r/.25)^2+contrast*harmonic12(theta)','coefficients':coef.tolist(),'logistic_slope':float(res.x[0]),'context_variable':'(Y_patch-Y_background)/(Y_patch+Y_background)','reference_context':0.,'raw_trial_logloss':float(np.mean(-y*np.log(np.maximum(pred,1e-12))-(1-y)*np.log(np.maximum(1-pred,1e-12)))),'raw_trial_accuracy':float(np.mean((pred>.5)==y)),'grouped_cv':cv,'converged':bool(res.success),'message':str(res.message),'limitations':['Readout for perceived saturation, not unnormalized HRL Reach.','Exp1 all supplied records; Exp2 all supplied records rather than guessing two excluded observer IDs; Exp3 excluded 2 and 10 as explicitly stated in paper.','Individual trial likelihood, not claimed reproduction of psignifit Bayesian PSE/JND method.','Neutral surrounding contrast kappa=0 is an explicit reference-profile choice. Background dependence is retained in readout and diagnostics, not silently treated as an intrinsic change of HRL color.','No inference about absolute Hunt-effect size across experiments from within-condition matches.','An arbitrary monotonic rescaling of saturation preserves the matching contours; the radius-linear convention fixes that otherwise unidentified gauge.']}
 (ROOT/'results/saturation-fit.json').write_text(json.dumps(report,indent=2))
 recs=[]
 for (ex,bg,stdid,line),grp in df.groupby(['experiment','bg','standard','direction']):
  en=ENDS[ex][line-1];st=STD[stdid-1];kp=(grp.Y.iloc[0]-bg)/(grp.Y.iloc[0]+bg)
  # Separate empirical logistic PSE with nonnegative slope; uncertainty is
  # diagnostic only, not called the publication's PSE estimator.
  tx=grp.DistanceWhitePoint.to_numpy();ty=grp.Response.to_numpy()
  def lf(q):
   z=q[0]*tx+q[1];pr=expit(z);return np.sum(np.logaddexp(0,z)-ty*z),np.array([np.sum((pr-ty)*tx),np.sum(pr-ty)])
  rr=minimize(lf,[15,-4],jac=True,bounds=[(.01,300),(-300,300)],method='L-BFGS-B')
  pse=-rr.x[1]/rr.x[0]
  lo,hi=1e-8,1
  for _ in range(55):
   mid=(lo+hi)/2;z=(features(W+mid*(en-W),kp)-features(st,kp))@res.x
   if z>0:hi=mid
   else:lo=mid
  recs.append(dict(experiment=int(ex),background=float(bg),standard=int(stdid),direction=int(line),n=len(grp),empirical_logistic_pse=float(pse),predicted_pse=(lo+hi)/2,logistic_scale=float(1/rr.x[0])))
 pd.DataFrame(recs).to_csv(ROOT/'results/saturation-condition-pse.csv',index=False)
 print(json.dumps(report,indent=2))
if __name__=='__main__':main()

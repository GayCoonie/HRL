from pathlib import Path
import numpy as np,pandas as pd,json,sys,time
sys.path.insert(0,str(Path(__file__).resolve().parent))
from huefield import *
from fit_huefield import read_observers,feature_pairs,reg_and_constraints,constrained_quadratic,errors,source_weights
ROOT=Path(__file__).resolve().parents[1]
# The following white is a documented table-convergence normalization assumption,
# not an asserted apparatus measurement. All Td conditions remain separate.
JV_TO_XY=np.linalg.inv(np.array([[1.0271,-.00008,-.00009],[.00376,1.0072,.00764],[.03845,.01496,1.]]))
def inverse_jv(xy):
 q=np.c_[xy,np.ones(len(xy))]@JV_TO_XY.T;return q[:,:2]/q[:,2,None]
def xyz_from_xy(xy,Y=1):
 return np.c_[xy[:,0]/xy[:,1],np.ones(len(xy)),(1-xy.sum(1))/xy[:,1]]*np.asarray(Y)[...,None]
def make_ayama(field):
 df=pd.read_csv(ROOT/'sources/ayama1987_tables23.csv')
 xy=inverse_jv(df[['x_JV','y_JV']].to_numpy());wxy=inverse_jv(np.array([[1/3,1/3]]))[0]
 w=xyz_from_xy(wxy[None,:])[0];xyz=adapt(xyz_from_xy(xy),w)
 df['X_per_Y']=xyz[:,0];df['Y_per_Y']=xyz[:,1];df['Z_per_Y']=xyz[:,2]
 df['flag']=''
 # Keep publisher anomaly untouched; not silently changed to .243.
 bad=(df.observer=='TN')&(df.retinal_illuminance_Td==10)&(df.hue=='G')&(df.Pe==.3)
 df.loc[bad,'flag']='Original x=.343 discontinuous with adjacent rows; excluded as transcription ambiguity, retained raw.'
 th,r,a=field.cone.coordinates(xyz)
 df['rho_converted']=r
 df.loc[(r>1+1e-6)|(field.cone.min_plane(xyz)<-1e-7),'flag']='Outside declared cone after approximate observer/white conversion; retained raw, not clipped.'
 A=[];b=[];meta=[];weight=[]
 for key,ids in df.groupby(['observer','retinal_illuminance_Td','hue']).groups.items():
  ids=np.asarray(list(ids));eligible=ids[(df.loc[ids,'flag'].to_numpy()=='')&(df.loc[ids,'Pe'].to_numpy()>=.2)&(df.loc[ids,'Pe'].to_numpy()<1)]
  if len(eligible)<2:continue
  ref=eligible[np.argmax(df.loc[eligible,'Pe'].to_numpy())]
  for i in eligible:
   if i==ref:continue
   # Same-luminance relations marginalized across three positive common scales.
   # They constrain relative purity trajectories, not a claimed Td->HRL conversion.
   maxg=max(a[i],a[ref]);scales=np.array([.08,.3,.9])/maxg
   f1=np.mean(field.features(np.repeat(th[i],3),np.repeat(r[i],3),a[i]*scales),axis=0)
   f0=np.mean(field.features(np.repeat(th[ref],3),np.repeat(r[ref],3),a[ref]*scales),axis=0)
   A.append(f1-f0);b.append(-float(angle_difference(th[i],th[ref])))
   meta.append(dict(observer=key[0],Td=int(key[1]),hue=key[2],row=int(i),reference_row=int(ref),Pe=float(df.Pe.iloc[i]),theta=float(th[i]),rho=float(r[i]),theta_ref=float(th[ref]),rho_ref=float(r[ref]),common_Y_scales=scales.tolist(),a_per_Y=float(a[i]),a_ref_per_Y=float(a[ref])))
   weight.append(1/(len(eligible)-1))
 df.to_csv(ROOT/'results/ayama-ingestion.csv',index=False)
 (ROOT/'results/ayama-shape-priors.json').write_text(json.dumps(meta,indent=2))
 return np.array(A),np.array(b),np.array(weight),meta

def constraints(field):
 _,D=reg_and_constraints(field.ntheta);D=D/(360/field.ntheta);low=np.full(len(D),-.6);up=np.full(len(D),2.)
 # Prevent the particular conditioning weakness seen in pure blue, on many
 # complete RGB shells, not a blue-only colour patch. Numerical shell constraints
 # supplement global field monotonicity; validation uses denser unseen shells.
 edge=vivid_rgb(24) # linear-light six-edge coordinate
 for a in [.008,.04,.15,.45,1.]:
  for u in [.12,.4,.7,1.]:
   rgb=a*((1-u)+u*edge);xyz=rgb@SRGB.T
   th,r,mag=field.cone.coordinates(xyz);F=field.features(th,r,mag);dt=angle_difference(np.roll(th,-1),th)
   d=(np.roll(F,-1,axis=0)-F)/dt[:,None]
   D=np.vstack([D,d]);low=np.r_[low,np.full(len(d),-.72)];up=np.r_[up,np.full(len(d),5.)]
 return D,low,up

def run():
 t0=time.time();records,quarantine=read_observers();field=HueField();A,b=feature_pairs(records,field)
 AA,bb,ww,meta=make_ayama(field);reg,_=reg_and_constraints(24)
 # Additional dimension-specific smoothness regularizer, uniform across hue.
 eye=np.eye(384).reshape(24,4,4,384)
 dimfirst=np.diff(eye,axis=2).reshape(-1,384)
 reg=np.vstack([reg,.3*dimfirst])
 D,lo,hi=constraints(field)
 w=source_weights(records,np.ones(len(records),bool));neww=ww/ww.sum()*w.sum()*.3
 X=np.vstack([A,AA]);y=np.r_[b,bb];w=np.r_[w,neww]
 (ROOT/'results/hue-source-inventory.json').write_text(json.dumps({'original_direct_XYZ_pairs':len(records),'ayama_marginalized_shape_priors':len(AA),'ayama_relative_total_weight':.3,'raw_ayama_points':len(pd.read_csv(ROOT/'sources/ayama1987_tables23.csv')),'legacy_exclusions_retained':len(quarantine),'scope':'Three retinal-illuminance conditions retained as separate shape-prior groups; common magnitude marginalized, not assigned to relative Level.','conversion':'Inverse Vos chromaticity formula Eq 3 in Vienot et al 1999; table-convergence white xprime=yprime=1/3 assumed, Bradford to D65; Pe=1 and out-of-cone cells excluded rather than clipped.','source_gaps':['Zhao-Luo 2020 complete match records not recovered.','Wang 2022 underlying observations explicitly not public; no synthetic substitutes admitted.','Pridmore low-luminance numerical track records not recovered.']},indent=2))
 candidates=[]
 for lam in [.2,1.]:
  f=HueField();c=np.zeros(384)
  for j in range(3):
   resid=X@c-y
   # A soft Student-like weight, capped only on strong deviations, source
   # balance retained; no hard rejection based on model residual.
   rw=1/np.sqrt(1+(resid/12.)**2)
   P=X.T@((w*rw)[:,None]*X)+lam*(reg.T@reg)+1e-7*np.eye(384);rhs=X.T@(w*rw*y)
   c,receipt=constrained_quadratic(P,rhs,D,lo,hi,c)
  f.coefficients=c.reshape(24,4,4);scores,_,_=errors(f,records)
  labels=PseudoRGB(f).ring_labels
  f.save(ROOT/f'results/hue-candidate-{lam}.json',{'carrier_ring_labels':labels.tolist(),'fit_revision':'0.6 research-conditioned shared field','regularization':lam,'assumptions_file':'hue-source-inventory.json','slope_bounds':list(f.slope_bounds())})
  er=AA@c-bb
  entry={'regularization':lam,'direct_source_scores':scores,'Ayama_marginalized_label_residual_rms':float(np.sqrt(np.mean(er**2))),'global_slope_bounds':list(f.slope_bounds()),'seconds':time.time()-t0,'solver':receipt}
  candidates.append(entry);print(json.dumps(entry),flush=True)
 # Predeclared smoother candidate for reference extrapolation, not minimal
 # training residual. Both candidates retained.
 chosen=.2;packet=json.loads((ROOT/f'results/hue-candidate-{chosen}.json').read_text())
 (ROOT.parents[1]/'data/hue-field-0.6.json').write_text(json.dumps(packet,indent=2))
 (ROOT/'results/hue-refit-report.json').write_text(json.dumps({'candidates':candidates,'selected':chosen,'selection_rule':'lambda=0.2 chosen retrospectively for lower legacy-data error under the same structural constraints; not a held-out accuracy claim.','untouched_holdout':False,'baseline_source_scores':errors(HueField.load(ROOT.parents[1]/'data/hue-field.json'),records)[0]},indent=2))
 print('DONE',time.time()-t0,flush=True)
if __name__=='__main__':run()

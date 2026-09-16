"""Reproduce an observer-relational, constrained 3-D hue fit and diagnostics.

The whole-hue-family split is retrospective model-selection evidence, not an
untouched external experiment. Source counts are not independent observer counts.
"""
from __future__ import annotations
import json,csv,time
from pathlib import Path
import numpy as np
from scipy.linalg import cho_factor,cho_solve
from huefield import *

def read_observers(method='Bradford',include_quarantine=False):
    records=[];quarantine=[]
    for line in (ROOT/'sources/ebner_fairchild_transcribed.txt').read_text().splitlines():
        if line.startswith('#') or not line.strip():continue
        hue,reference,targets=line.split(';')
        ref=adapt(np.fromstring(reference,sep=' ')/100,[.9501,1,1.0881],method)
        values=adapt(np.fromstring(targets,sep=' ').reshape(-1,3)/100,[.9501,1,1.0881],method)
        for i,xyz in enumerate(values):
            records.append(dict(source='Ebner-Fairchild',track=hue,family='EF:'+hue,index=i,xyz=xyz.tolist(),reference=ref.tolist()))
    cl=list(csv.DictReader((ROOT/'sources/hung_berns_CL.csv').open(newline='')))
    refs={r['Color name']:np.array([float(r[x]) for x in ('X','Y','Z')])/100 for r in cl if r['C*uv']=='Ref.'}
    for mode in ('CL','VL'):
        rows=list(csv.DictReader((ROOT/f'sources/hung_berns_{mode}.csv').open(newline='')))
        for i,r in enumerate(rows):
            rowlabel=r['C*uv'] if mode=='CL' else r['L*']
            if 'Ref' in rowlabel:continue
            name=r['Color name'];xyz=np.array([float(r[x]) for x in ('X','Y','Z')])/100
            item=dict(source='Hung-Berns '+mode,track=name,family='HB:'+name,index=i,
                      xyz=adapt(xyz,C_WHITE,method).tolist(),reference=adapt(refs[name],C_WHITE,method).tolist())
            if mode=='VL' and name=='Magenta-red':
                item['reason']='Published table IV magenta-red rows contain L* shifts and disagreeing reference; whole 8-target track quarantined before fitting.'
                quarantine.append(item)
                if not include_quarantine:continue
            records.append(item)
    by_hue={}
    for line in (ROOT/'sources/munsell_1929_subset.txt').read_text().splitlines():
        if line.startswith('#') or not line.strip():continue
        h,v,c,x,y,Y=line.split();v,c,x,y,Y=map(float,(v,c,x,y,Y))
        xyz=np.array([x/y*Y,Y,(1-x-y)/y*Y])/100
        by_hue.setdefault(h,[]).append((v,c,adapt(xyz,C_WHITE,method)))
    for h,rows in by_hue.items():
        ref=min(rows,key=lambda r:abs(r[0]-5)*100+abs(r[1]-6))[2]
        for i,(v,c,xyz) in enumerate(rows):
            if np.max(abs(xyz-ref))<1e-13:continue
            records.append(dict(source='Munsell subset',track=h,family='M:'+h,index=i,value=v,chroma=c,xyz=xyz.tolist(),reference=ref.tolist()))
    return records,quarantine

def data_arrays(records,field):
    xyz=np.array([r['xyz'] for r in records]);ref=np.array([r['reference'] for r in records])
    th,r,a=field.cone.coordinates(xyz);th0,r0,a0=field.cone.coordinates(ref)
    return th,r,a,th0,r0,a0

def feature_pairs(records,field):
    th,r,a,th0,r0,a0=data_arrays(records,field)
    return field.features(th,r,a)-field.features(th0,r0,a0),-angle_difference(th,th0)

def reg_and_constraints(n):
    P=n*16;eye=np.eye(P);D=eye.reshape(n,4,4,P)
    first=(np.roll(D,-1,axis=0)-D).reshape(P,P)
    angular=(np.roll(D,-1,axis=0)-2*D+np.roll(D,1,axis=0)).reshape(P,P)
    radial=np.diff(D,n=2,axis=1).reshape(-1,P)
    intensity=np.diff(D,n=2,axis=2).reshape(-1,P)
    # Small magnitude regularizer fixes arbitrary circle relabeling, not HRL density.
    reg=np.vstack([angular*2.,radial*.8,intensity*.8,eye*.03])
    return reg,first

def constrained_quadratic(P,rhs,D,lower,upper,initial=None):
    factor=cho_factor(P,check_finite=False)
    unconstrained=cho_solve(factor,rhs,check_finite=False)
    if np.all(D@unconstrained>=lower) and np.all(D@unconstrained<=upper):
        return unconstrained,dict(iterations=0,primal_residual=0,method='unconstrained optimum satisfies global derivative constraints')
    lower=np.broadcast_to(lower,(len(D),));upper=np.broadcast_to(upper,(len(D),))
    x=np.zeros(len(rhs)) if initial is None else initial.copy()*.99
    if np.any(D@x<=lower) or np.any(D@x>=upper):x[:]=0
    total=0
    for mu in [1,.2,.04,.008,.0016,.00032,.000064,.0000128,.00000256,.000000512,.0000001024,.00000002048]:
        for iteration in range(70):
            dx=D@x;sl=dx-lower;su=upper-dx
            grad=P@x-rhs+mu*(D.T@(1/su-1/sl))
            weights=mu*(1/sl**2+1/su**2)
            H=P+D.T@(weights[:,None]*D)
            step=-cho_solve(cho_factor(H,check_finite=False),grad,check_finite=False)
            descent=float(grad@step)
            if -descent/2 < max(1e-10,mu*.05):break
            dstep=D@step
            alpha=min(1.,np.min(np.divide(.995*su,dstep,out=np.full_like(su,np.inf),where=dstep>0)),np.min(np.divide(-.995*sl,dstep,out=np.full_like(sl,np.inf),where=dstep<0)))
            old=.5*x@P@x-rhs@x-mu*(np.log(sl).sum()+np.log(su).sum())
            for j in range(55):
                trial=x+alpha*step;slt=sl+alpha*dstep;sut=su-alpha*dstep
                val=.5*trial@P@trial-rhs@trial-mu*(np.log(slt).sum()+np.log(sut).sum())
                if val<=old+.01*alpha*descent+1e-10:break
                alpha*=.5
            x=trial;total+=1
    violation=max(0.,float(np.max(lower-D@x)),float(np.max(D@x-upper)))
    if violation>1e-10:raise RuntimeError('Interior-point feasibility failure')
    return x,dict(iterations=total,primal_residual=violation,barrier_duality_gap_bound=float(2*len(D)*mu),method='feasible log-barrier Newton convex quadratic solver')

def source_weights(records,mask,source_masses=None):
    if source_masses is None:source_masses={'Ebner-Fairchild':1.,'Hung-Berns CL':.5,'Hung-Berns VL':.5,'Munsell subset':.5}
    weights=np.zeros(len(records))
    for source in sorted(set(r['source'] for r in records)):
        ind=np.array([r['source']==source for r in records])&mask
        families=sorted({records[i]['family'] for i in np.flatnonzero(ind)})
        for family in families:
            ids=ind&np.array([r['family']==family for r in records]);weights[ids]=source_masses.get(source,1)/max(1,len(families))/max(1,np.sum(ids))
    weights*=np.sum(mask)/max(weights.sum(),1e-30)
    return weights

def structural_constraints(field):
    _,D=reg_and_constraints(field.ntheta);D=D/(360/field.ntheta)
    lower=np.full(len(D),-.65);upper=np.full(len(D),2.)
    edge=vivid_rgb(128);linear=np.where(edge<=.04045,edge/12.92,((edge+.055)/1.055)**2.4)
    # Extra structural constraints preserve ordered vivid-ring inheritance.
    for name,matrix in [('srgb',SRGB)]:
        theta,rho,a=field.cone.coordinates(linear@matrix.T)
        F=field.features(theta,rho,a);dt=angle_difference(np.roll(theta,-1),theta)
        assert np.all(dt>0)
        deriv=(np.roll(F,-1,axis=0)-F)/dt[:,None]
        D=np.vstack([D,deriv]);lower=np.r_[lower,np.full(len(deriv),-.975)];upper=np.r_[upper,np.full(len(deriv),10.)]
    return D,lower,upper

def fit(records,regularization=.1,mask=None,n=24,iterations=3,source_masses=None,initial=None,two_dimensional=False):
    field=HueField(ntheta=n);mask=np.ones(len(records),bool) if mask is None else mask
    A,b=feature_pairs(records,field);reg,_=reg_and_constraints(n);D,lower,upper=structural_constraints(field)
    T=np.kron(np.eye(n*4),np.ones((4,1))) if two_dimensional else np.eye(n*16)
    A=A@T;reg=reg@T;D=D@T
    base=source_weights(records,mask,source_masses);c=np.zeros(A.shape[1]) if initial is None else initial.copy()
    th,r,a,th0,r0,a0=data_arrays(records,field)
    receipts=[]
    for iteration in range(iterations):
        # Iteratively scale residuals into the fixed u'v' angular gauge.
        deriv=field.evaluate(th,r,a,True);pred=field.inverse_angle(field.evaluate(th0,r0,a0),r,a)
        errors=angle_difference(pred,th)
        robust=np.minimum(1,6./np.maximum(abs(errors),1e-12))
        w=base*robust/np.maximum(deriv,.4)**2
        P=A.T@(w[:,None]*A)+regularization*(reg.T@reg)+1e-8*np.eye(A.shape[1]);rhs=A.T@(w*b)
        c,receipt=constrained_quadratic(P,rhs,D,lower,upper,c)
        field.coefficients=(T@c).reshape(n,4,4);receipts.append(receipt)
    return field,receipts

def errors(field,records):
    th,r,a,th0,r0,a0=data_arrays(records,field)
    labels=field.evaluate(th0,r0,a0)
    predicted=field.inverse_angle(labels,r,a)
    error=angle_difference(predicted,th)
    xyz=field.cone.decode(predicted,r,a)
    uverr=np.linalg.norm(xyz_uv(xyz)-xyz_uv(np.array([x['xyz'] for x in records])),axis=1)
    result={}
    for source in sorted({r['source'] for r in records}):
        inds=np.array([q['source']==source for q in records]);e=error[inds]
        result[source]={'n':len(e),'mae_degrees':float(np.mean(abs(e))),'rms_degrees':float(np.sqrt(np.mean(e*e))),
                       'p95_degrees':float(np.quantile(abs(e),.95)),'max_degrees':float(np.max(abs(e))),
                       'mean_delta_uv':float(np.mean(uverr[inds]))}
    return result,error,uverr

def main():
    start=time.time();records,quarantine=read_observers();field=HueField()
    th,r,a,th0,r0,a0=data_arrays(records,field)
    print('Records',len(records),'quarantine',len(quarantine),'ranges rho',r.min(),r.max(),'a',a.min(),a.max(),flush=True)
    if r.max()>1+1e-7 or a.max()>1.25:raise RuntimeError('Chart range audit requires attention')
    (ROOT/'results/observer_records.json').write_text(json.dumps({'records':records,'quarantine':quarantine},indent=2))
    baseline,_,_=errors(field,records)
    print('Baseline',json.dumps(baseline),flush=True)
    families=sorted(set(r['family'] for r in records))
    # Balanced deterministic folds separately by experiment to spread the withheld hues.
    folds={}
    for prefix in ['EF:','HB:','M:']:
        fs=[f for f in families if f.startswith(prefix)]
        fs=sorted(fs,key=lambda f:float(np.mean([th[i] for i,q in enumerate(records) if q['family']==f])))
        folds.update({f:i%4 for i,f in enumerate(fs)})
    fold=np.array([folds[r['family']] for r in records])
    cvs=[]
    for lam in [.01,.05,.2,1.]:
        errs=np.zeros(len(records))
        for k in range(4):
            model,_=fit(records,lam,fold!=k,iterations=2)
            _,e,_=errors(model,records);errs[fold==k]=e[fold==k]
        masses=source_weights(records,np.ones(len(records),bool))
        score=float(np.sqrt(np.sum(masses*errs**2)/masses.sum()))
        row={'regularization':lam,'balanced_rms_degrees':score,'mae_degrees':float(np.mean(abs(errs)))};cvs.append(row)
        np.save(ROOT/f'results/cv_errors_lambda_{lam}.npy',errs)
        print('CV',row,flush=True)
    chosen=min(cvs,key=lambda d:d['balanced_rms_degrees'])['regularization']
    model,receipts=fit(records,chosen,iterations=4)
    summary,e,duv=errors(model,records)
    model.save(ROOT/'results/hue-field.json',{'chosen_regularization':chosen,'slope_bound':list(model.slope_bounds()),
      'fit_scope':'EF 306 matches; HB 124 uncontested matches; explicitly selected Munsell renotation subset; no COMBVD fitting',
      'angular_spacing':'Unassigned. Release-1 ring is a separate calibration to be imported.',
      'carrier_ring_labels':PseudoRGB(model).ring_labels.tolist(),
      'carrier_ring_convention':'1530 ordered sRGB digital-edge colors transported through the fitted hue field, linearly interpolated; NOT HRL Release 1 angular labels'})
    np.savez(ROOT/'results/training_errors.npz',errors=e,delta_uv=duv)
    sensitivity={}
    for omitted in ['Ebner-Fairchild','Hung-Berns','Munsell']:
        mask=np.array([not r['source'].startswith(omitted) for r in records])
        other,_=fit(records,chosen,mask,iterations=3)
        other.save(ROOT/f'results/leave_out_{omitted}.json')
        scores,_,_=errors(other,records);sensitivity[omitted]=scores
        print('LOSO',omitted,json.dumps(scores),flush=True)
    cat_records,_=read_observers('CAT16');cat,_=fit(cat_records,chosen,iterations=3)
    cat.save(ROOT/'results/CAT16-sensitivity.json')
    cat_summary,_,_=errors(cat,cat_records)
    report={'training_sources':summary,'straight_ray_baseline':baseline,'whole_family_cv':cvs,
      'chosen_regularization':chosen,'global_slope_bounds':list(model.slope_bounds()),'optimizer':receipts,
      'leave_experiment_out':sensitivity,'cat16_refit':cat_summary,'quarantine':errors(model,quarantine)[0],
      'seconds':time.time()-start,'fit_data_xyz_min_planes':float(field.cone.min_plane(np.array([q['xyz'] for q in records])).min())}
    (ROOT/'results/fit-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print('FINAL',json.dumps(report,indent=2),flush=True)

if __name__=='__main__':main()

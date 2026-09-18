"""Analytic derivative of the preserved shared map, in equilateral coordinates.
This is a coordinate regularity penalty, not an appearance observation.
"""
import math,torch

def log_condition(q,C,D,shift,base):
    L=q[...,2]; U=q[...,1]/L
    original_L=L
    # Gradients with respect to input (R,L).
    dL=torch.stack([torch.zeros_like(L),torch.ones_like(L)],-1)
    dU=torch.stack([1/L,-U/L],-1)
    detscale=torch.ones_like(L)
    def unit(x,t):
        y=base.warp(x,t)
        derivative=y*(1-y)/(x*(1-x)).clamp_min(1e-28)
        return y,derivative,y*(1-y)
    L,slope,_=unit(L,shift);dL=dL*slope[...,None];detscale=detscale*slope
    feat=base.features(q[...,0]);co=torch.einsum('...k,ljk->...lj',feat,C)
    for k in range(len(C)):
        c=co[...,k,:];a=U*(c[...,0]+c[...,1]*(2*U-1));tt=torch.tanh(a/8)
        Lnew,dl,dt=unit(L,8*tt)
        du=(1-tt.square())*(c[...,0]+c[...,1]*(4*U-1))
        dL=dL*dl[...,None]+dU*(dt*du)[...,None];detscale=detscale*dl;L=Lnew
        v=2*L-1;a=c[...,2]+c[...,3]*v+c[...,4]*v*v;tt=torch.tanh(a/8)
        Unew,du,dt=unit(U,8*tt);dl=(1-tt.square())*2*(c[...,3]+2*c[...,4]*v)
        dU=dU*du[...,None]+dL*(dt*dl)[...,None];detscale=detscale*du;U=Unew
    amplitude=.85*torch.sigmoid((feat[...,:7]*D).sum(-1));a=amplitude*U*U
    T=base.InversePhi.apply(L,a);den=1-a*(1-T)*(1-3*T)
    dT=(dL+dU*(T*(1-T).square()*2*amplitude*U)[...,None])/den[...,None]
    dR=dT*U[...,None]+dU*T[...,None]
    A,B=dR.unbind(-1);cc,dd=dT.unbind(-1)
    e=A+B/2;g=math.sqrt(3)*B/2;k=(2*cc+dd-A-B/2)/math.sqrt(3);l=dd-B/2
    det=(T/original_L)*detscale/den
    trace=e.square()+g.square()+k.square()+l.square()
    ratio=(trace/(2*det.clamp_min(1e-30))).clamp_min(1+1e-14)
    return torch.acosh(ratio),torch.stack([e,g,k,l],-1),det

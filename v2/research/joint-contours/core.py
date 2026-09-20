"""Shared interior normalizing flow. No realization identifier enters parameters.
Soft powers have finite endpoint slopes. Circular Möbius maps are analytic and
orientation preserving, and become identity at every vivid ring point.
"""
import math
import torch

def features(h,K):
 t=h*math.pi/180
 return torch.stack([torch.ones_like(t)]+[f(k*t) for k in range(1,K+1) for f in [torch.cos,torch.sin]],-1)
def warp(x,t):return x/(x+(1-x)*torch.exp(-t))
def softpower(x,p,inverse=False):
 e=.02;a=torch.pow(e,p);d=torch.pow(1+e,p)-a
 return torch.pow((a+x*d).clamp_min(1e-300),1/p)-e if inverse else (torch.pow((x+e).clamp_min(1e-300),p)-a)/d

def phi(t,a):return t*(1-a*(1-t).square())
class InversePhi(torch.autograd.Function):
 @staticmethod
 def forward(ctx,y,a):
  lo=torch.zeros_like(y);hi=torch.ones_like(y);t=y.clone()
  for _ in range(38):
   e=phi(t,a)-y;lo=torch.where(e<0,t,lo);hi=torch.where(e>=0,t,hi);n=t-e/(1-a*(1-t)*(1-3*t));t=torch.where((n>=lo)&(n<=hi),n,(lo+hi)/2)
  ctx.save_for_backward(t,a);return t
 @staticmethod
 def backward(ctx,g):
  t,a=ctx.saved_tensors;d=1-a*(1-t)*(1-3*t);return g/d,g*t*(1-t).square()/d

def hue(h,U,L,row,phase,inverse=False):
 u=2*U-1;l=2*L-1;t=(1-L*U)*torch.tanh(row[0]+row[1]*u+row[2]*l+row[3]*u*l)
 if inverse:t=-t
 a=torch.tanh(t/2);theta=h*math.pi/180-phase
 return h+2*torch.atan2(a*torch.sin(theta),1-a*torch.cos(theta))*180/math.pi

def coordinates(q,C,D,N,A,inverse=False,hue_enabled=True):
 H=q[...,0];L=q[...,2];U=q[...,1]/L.clamp_min(1e-30);K=(C.shape[-1]-1)//2
 def amount(h,u):return .85*torch.sigmoid((features(h,3)*D).sum(-1))*u*u
 def lc(c,u):
  v=2*u-1;return torch.exp(u*2*torch.tanh((c[...,0]+c[...,1]*v)/2)),8*torch.tanh(u*(c[...,2]+c[...,3]*v)/8)
 def rc(c,l):
  v=2*l-1;return torch.exp(2*torch.tanh((c[...,4]+c[...,5]*v+c[...,6]*v*v)/2)),8*torch.tanh((c[...,7]+c[...,8]*v+c[...,9]*v*v)/8)
 if inverse:
  L=phi(L,amount(H,U))
  for j in range(len(C)-1,-1,-1):
   if hue_enabled:H=hue(H,U,L,A[j],(j%4)*math.pi/2,True)
   c=features(H,K)@C[j].T;p,t=rc(c,L);U=softpower(warp(U,-t),p,True).clamp(0,1);p,t=lc(c,U);L=warp(softpower(L,p,True).clamp(0,1),-t)
  L=softpower(warp(L,-N[0]),torch.exp(.5*torch.tanh(N[1]/.5)),True).clamp(0,1)
 else:
  L=warp(softpower(L,torch.exp(.5*torch.tanh(N[1]/.5))),N[0])
  for j in range(len(C)):
   c=features(H,K)@C[j].T;p,t=lc(c,U);L=softpower(warp(L,t),p).clamp(0,1);p,t=rc(c,L);U=warp(softpower(U,p).clamp(0,1),t)
   if hue_enabled:H=hue(H,U,L,A[j],(j%4)*math.pi/2)
  L=InversePhi.apply(L,amount(H,U))
 return torch.stack([H,L*U,L],-1)

def embed(q):
 h=q[...,0]*math.pi/180;r=math.sqrt(3)/2*q[...,1]
 return torch.stack([q[...,2]-q[...,1]/2,r*torch.cos(h),r*torch.sin(h)],-1)

def expand_record(old):
 c=torch.tensor(old['coefficients'][0]);new=torch.zeros((len(c),10,c.shape[-1]));new[:,2:4]=c[:,:2];new[:,7:10]=c[:,2:5]
 return new,torch.tensor(old['dark']['coefficients']),torch.tensor([old['neutral_shift'],0.]),torch.zeros((len(c),4))

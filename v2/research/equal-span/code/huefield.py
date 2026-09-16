"""HRL v2 research hue foliation. Not a completed HRL color-difference model.

Hue labels are an arbitrary circle coordinate, NOT the final HRL angular scale.
A tensor-product cubic spline is fitted to same-hue relationships. The spectral
cone and white-completion domain are explicit. All conversions use relative XYZ.
"""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from scipy.spatial import ConvexHull

ROOT=Path(__file__).resolve().parents[1]
WHITE_XY=np.array([.3127,.3290])
WHITE=np.array([WHITE_XY[0]/WHITE_XY[1],1.,(1-WHITE_XY.sum())/WHITE_XY[1]])
C_XY=np.array([.31006,.31616])
C_WHITE=np.array([C_XY[0]/C_XY[1],1.,(1-C_XY.sum())/C_XY[1]])
BRADFORD=np.array([[.8951,.2664,-.1614],[-.7502,1.7135,.0367],[.0389,-.0685,1.0296]])
CAT16=np.array([[.401288,.650173,-.051461],[-.250268,1.204414,.045854],[-.002079,.048952,.953127]])
SRGB=np.array([[.4123907992659595,.357584339383878,.1804807884018343],
 [.2126390058715104,.715168678767756,.0721923153607337],
 [.0193308187155919,.119194779794626,.9505321522496607]])

def adapt(xyz, source_white, method='Bradford'):
    m=BRADFORD if method=='Bradford' else CAT16
    a=np.linalg.inv(m)@np.diag((m@WHITE)/(m@np.asarray(source_white)))@m
    return np.asarray(xyz)@a.T

def xyz_uv(xyz):
    xyz=np.asarray(xyz,dtype=float)
    den=xyz[...,0]+15*xyz[...,1]+3*xyz[...,2]
    return np.stack([4*xyz[...,0]/den,9*xyz[...,1]/den],axis=-1)

def uv_direction(uv):
    # XYZ direction scaled so X+15Y+3Z=1. Valid for the physical uv domain.
    uv=np.asarray(uv,dtype=float);u,v=uv[...,0],uv[...,1]
    return np.stack([u/4,v/9,(1-u/4-5*v/3)/3],axis=-1)

def xyz_xy(xyz):
    xyz=np.asarray(xyz);return xyz[...,:2]/xyz.sum(axis=-1,keepdims=True)

def angle_difference(a,b):return (np.asarray(a)-b+180)%360-180

def bernstein3(x):
    x=np.asarray(x,dtype=float)
    return np.stack([(1-x)**3,3*x*(1-x)**2,3*x*x*(1-x),x**3],axis=-1)

class Cone:
    def __init__(self, cmfs=None, serialized=None):
        self.white=WHITE.copy();self.white_uv=xyz_uv(WHITE)
        if serialized is not None:
            self.vertices_xy=np.asarray(serialized['vertices_xy'])
            self.normals=np.asarray(serialized['normals'])
        else:
            if cmfs is None:cmfs=np.loadtxt(ROOT/'sources/cie1931_5nm.csv',delimiter=',',skiprows=1)[:,1:]
            xy=xyz_xy(cmfs);h=ConvexHull(xy)
            self.vertices_xy=xy[h.vertices]
            directions=np.column_stack([self.vertices_xy,1-self.vertices_xy.sum(axis=1)])
            n=np.cross(directions,np.roll(directions,-1,axis=0))
            self.normals=n/(n@WHITE)[:,None]
        dirs=np.column_stack([self.vertices_xy,1-self.vertices_xy.sum(axis=1)])
        self.vertices_uv=xyz_uv(dirs)
        hull=ConvexHull(self.vertices_uv)
        self.uv_planes=hull.equations
        self.ray_rhs=-(self.uv_planes[:,:2]@self.white_uv+self.uv_planes[:,2])
    def serialize(self):
        return {'white_xyz':self.white.tolist(),'vertices_xy':self.vertices_xy.tolist(),
                'normals':self.normals.tolist(),'boundary_sampling':'CIE 1931 2-degree, 360-830 nm, 5 nm knots, convex envelope; purple closure included'}
    def gauge(self,xyz):
        xyz=np.asarray(xyz,dtype=float)
        return np.max(xyz@self.normals.T,axis=-1)
    def min_plane(self,xyz):return np.min(np.asarray(xyz)@self.normals.T,axis=-1)
    def radius(self,theta):
        t=np.deg2rad(np.asarray(theta,dtype=float));u=np.stack([np.cos(t),np.sin(t)],axis=-1)
        den=u@self.uv_planes[:,:2].T
        quot=np.divide(self.ray_rhs,den,out=np.full_like(den,np.inf),where=den>1e-14)
        return np.min(quot,axis=-1)
    def coordinates(self,xyz):
        x=np.atleast_2d(np.asarray(xyz,dtype=float));a=self.gauge(x)
        neutral=np.linalg.norm(x-x[:,1,None]*WHITE,axis=1)<1e-12
        uv=xyz_uv(np.where((a>1e-30)[:,None],x,WHITE))
        d=uv-self.white_uv;theta=np.rad2deg(np.arctan2(d[:,1],d[:,0]))%360
        rho=np.linalg.norm(d,axis=1)/self.radius(theta)
        rho[neutral]=0.;theta[neutral]=0.
        return theta,rho,a
    def decode(self,theta,rho,a):
        theta,rho,a=np.broadcast_arrays(theta,rho,a)
        rad=self.radius(theta)*rho;t=np.deg2rad(theta)
        uv=self.white_uv+np.stack([rad*np.cos(t),rad*np.sin(t)],axis=-1)
        direction=uv_direction(uv)
        result=a[...,None]*direction/self.gauge(direction)[...,None]
        return np.where((rho==0)[...,None],a[...,None]*WHITE,result)

class HueField:
    def __init__(self, coefficients=None, ntheta=24, a_max=1.25, cone=None):
        self.ntheta=int(ntheta);self.a_max=float(a_max);self.cone=cone or Cone()
        self.coefficients=np.zeros((self.ntheta,4,4)) if coefficients is None else np.asarray(coefficients).reshape(self.ntheta,4,4)
    @classmethod
    def load(cls,path):
        j=json.loads(Path(path).read_text());return cls(j['coefficients'],j['ntheta'],j['a_max'],Cone(serialized=j['cone']))
    def save(self,path,extra=None):
        out={'id':'HRL-hue-field-experimental-0.1','coordinate_gauge':'geometric CIE 1976 u-prime v-prime polar angle in degrees; NOT HRL hue angles',
             'ntheta':self.ntheta,'radial_degree':3,'magnitude_degree':3,'a_max':self.a_max,
             'magnitude_coordinate':'(white_completion_gauge/a_max)^(1/3)',
             'coefficients':self.coefficients.tolist(),'cone':self.cone.serialize()}
        if extra:out.update(extra)
        Path(path).write_text(json.dumps(out,indent=2)+'\n')
    def bases(self,theta,rho,a,derivative=False):
        theta,rho,a=np.broadcast_arrays(np.asarray(theta),np.asarray(rho),np.asarray(a))
        if np.any(rho< -1e-7) or np.any(rho>1+1e-7) or np.any(a<0) or np.any(a>self.a_max+1e-7):
            raise ValueError('Outside fitted chart: require 0<=rho<=1 and 0<=a<=a_max')
        shape=theta.shape;theta=theta.ravel();rho=rho.ravel();a=a.ravel()
        s=theta%360/(360/self.ntheta);i=np.floor(s).astype(int);v=s-i
        if derivative:
            w=np.column_stack([-.5*(1-v)**2,1.5*v*v-2*v,-1.5*v*v+v+.5,.5*v*v])/(360/self.ntheta)
        else:
            w=np.column_stack([(1-v)**3,3*v**3-6*v*v+4,-3*v**3+3*v*v+3*v+1,v**3])/6
        indices=(i[:,None]+np.array([-1,0,1,2]))%self.ntheta
        r=bernstein3(np.clip(rho,0,1));lum=bernstein3(np.cbrt(a/self.a_max))
        return indices,w,r,lum,shape
    def features(self,theta,rho,a,derivative=False):
        ind,w,r,l,shape=self.bases(theta,rho,a,derivative)
        out=np.zeros((len(ind),self.ntheta,4,4));rows=np.arange(len(ind))
        for j in range(4):out[rows,ind[:,j]]=w[:,j,None,None]*r[:,:,None]*l[:,None,:]
        return out.reshape(len(ind),-1)
    def evaluate(self,theta,rho,a,derivative=False):
        ind,w,r,l,shape=self.bases(theta,rho,a,derivative)
        coeff=self.coefficients[ind]
        corr=np.einsum('ij,ijrl,ir,il->i',w,coeff,r,l,optimize=True)
        value=(1+corr) if derivative else (np.broadcast_to(theta,shape).ravel()+corr)
        return value.reshape(shape)
    def inverse_angle(self,label,rho,a):
        label,rho,a=np.broadcast_arrays(np.asarray(label,dtype=float),np.asarray(rho,dtype=float),np.asarray(a,dtype=float))
        zero=self.evaluate(np.zeros_like(label),rho,a)
        target=zero+(label-zero)%360
        lo=np.zeros_like(target);hi=lo+360;theta=(target-zero).copy()
        for _ in range(50):
            error=self.evaluate(theta,rho,a)-target
            done=np.abs(error)<2e-12
            if np.all(done):break
            hi=np.where(error>0,theta,hi);lo=np.where(error<=0,theta,lo)
            new=theta-error/self.evaluate(theta,rho,a,True)
            theta=np.where(done,theta,np.where((new>lo)&(new<hi),new,(lo+hi)/2))
        return theta%360
    def label(self,xyz):
        theta,rho,a=self.cone.coordinates(xyz)
        value=self.evaluate(theta,rho,a)%360
        value[rho<1e-12]=np.nan # Hue undefined, not arbitrarily red, on the neutral axis.
        return value
    def sample(self,label,rho,a):
        return self.cone.decode(self.inverse_angle(label,rho,a),rho,a)
    def curve(self,label,a=1.):
        return lambda rho:self.sample(label,rho,a)
    def sheet(self,label):
        return lambda rho,a:self.sample(label,rho,a)
    def slope_bounds(self):
        differences=np.roll(self.coefficients,-1,axis=0)-self.coefficients
        return 1+differences.min()/(360/self.ntheta),1+differences.max()/(360/self.ntheta)


def rgb_matrix(primaries):
    xy=np.asarray(primaries);m=np.vstack([xy[:,0]/xy[:,1],np.ones(3),(1-xy.sum(axis=1))/xy[:,1]])
    return m@np.diag(np.linalg.solve(m,WHITE))

def vivid_rgb(samples_per_edge=255):
    u=np.arange(samples_per_edge)/samples_per_edge;z=np.zeros_like(u);o=np.ones_like(u)
    return np.concatenate([np.c_[o,u,z],np.c_[1-u,o,z],np.c_[z,o,u],np.c_[z,1-u,o],np.c_[u,z,o],np.c_[o,z,1-u]])

RGB_MATRICES={'srgb':SRGB,
 'display-p3':rgb_matrix([[.68,.32],[.265,.69],[.15,.06]]),
 'rec2020':rgb_matrix([[.708,.292],[.170,.797],[.131,.046]])}

class PseudoRGB:
    """Invertible RGB-shaped carrier; storage is uint16, evaluation is float64.

    Ring order is the numerical sRGB edge order, not the final HRL angle density.
    The edge colors calibrate labels only; full-domain realizations are wider.
    The chromaticity warp depends on magnitude so both chromatic arms can bend.
    """
    def __init__(self,field,ring_labels=None):
        self.field=field
        if ring_labels is None:
            edge=vivid_rgb(255)
            linear=np.where(edge<=.04045,edge/12.92,((edge+.055)/1.055)**2.4)
            labels=field.label(linear@SRGB.T)
            labels=np.unwrap(np.deg2rad(labels))*180/np.pi
            self.ring_labels=np.r_[labels,labels[0]+360]
        else:self.ring_labels=np.asarray(ring_labels,float)
        if np.any(np.diff(self.ring_labels)<=0):raise ValueError('Ring labels are not strictly ordered')
        self.ring_t=np.linspace(0,1,len(self.ring_labels))
    @staticmethod
    def edge(t):
        t=(np.asarray(t)%1)*6;i=np.floor(t).astype(int);u=t-i
        choices=np.stack([np.stack([np.ones_like(u),u,np.zeros_like(u)],-1),
            np.stack([1-u,np.ones_like(u),np.zeros_like(u)],-1),
            np.stack([np.zeros_like(u),np.ones_like(u),u],-1),
            np.stack([np.zeros_like(u),1-u,np.ones_like(u)],-1),
            np.stack([u,np.zeros_like(u),np.ones_like(u)],-1),
            np.stack([np.ones_like(u),np.zeros_like(u),1-u],-1)],axis=-2)
        return np.take_along_axis(choices,i[...,None,None],axis=-2)[...,0,:]
    @staticmethod
    def edge_parameter(v):
        # At a shared vertex either adjacent description gives the same value.
        r,g,b=np.moveaxis(np.asarray(v),-1,0)
        h=np.select([(r>=g)&(r>=b)&(g>=b),(g>=r)&(g>=b)&(r>=b),
                     (g>=r)&(g>=b)&(b>=r),(b>=r)&(b>=g)&(g>=r),
                     (b>=r)&(b>=g)&(r>=g)],
                    [g,2-r,2+b,4-g,4+r],default=6-b)
        return (h/6)%1
    def hue_label(self,t):return np.interp(np.asarray(t)%1,self.ring_t,self.ring_labels)%360
    def ring_position(self,label):
        h=self.ring_labels[0]+(np.asarray(label)-self.ring_labels[0])%360
        return np.interp(h,self.ring_labels,self.ring_t)%1
    def decode(self,q):
        q=np.asarray(q,dtype=float)
        if q.shape[-1]!=3 or not np.all(np.isfinite(q)) or np.any(q<0) or np.any(q>1):
            raise ValueError('Require finite normalized pseudo-RGB triplets in [0,1]')
        a=np.max(q,axis=-1);minimum=np.min(q,axis=-1);delta=a-minimum
        neutral=delta<1e-15
        v=np.divide(q-minimum[...,None],delta[...,None],out=np.zeros_like(q),where=delta[...,None]>1e-15)
        t=self.edge_parameter(v)
        total=q.sum(axis=-1)
        rho=np.divide(delta*v.sum(axis=-1),total,out=np.zeros_like(total),where=total>0)
        xyz=self.field.sample(self.hue_label(t),rho,a)
        return np.where(neutral[...,None],a[...,None]*WHITE,xyz)
    def encode(self,xyz):
        xyz=np.asarray(xyz,dtype=float)
        if xyz.shape[-1]!=3 or not np.all(np.isfinite(xyz)):raise ValueError('Require finite XYZ triplets')
        scalar=xyz.ndim==1;shape=xyz.shape;flat=xyz.reshape(-1,3)
        theta,rho,a=self.field.cone.coordinates(flat)
        if np.min(self.field.cone.min_plane(flat)) < -2e-10 or np.max(a)>1+2e-10:
            raise ValueError('XYZ outside the declared white-completion domain')
        a=np.clip(a,0,1);rho=np.clip(rho,0,1)
        label=self.field.evaluate(theta,rho,a)%360;t=self.ring_position(label)
        v=self.edge(t);e=v/v.sum(axis=-1,keepdims=True)
        p=(1-rho[:,None])/3+rho[:,None]*e
        q=a[:,None]*p/np.max(p,axis=-1,keepdims=True)
        q=np.where((rho<1e-12)[:,None],a[:,None],q)
        return q.reshape(shape)
    def decode16(self,codes):
        q=np.asarray(codes)
        if not np.issubdtype(q.dtype,np.integer) or np.any(q<0) or np.any(q>65535):
            raise ValueError('Require integer triplets in 0..65535')
        return self.decode(q.astype(float)/65535)
    def encode16(self,xyz):return np.rint(self.encode(xyz)*65535).astype(np.uint16)
    def sheet(self,label,R,L):
        """Evaluate an equilateral triangle chart at a fixed *field label*.
        Its two-dimensional distribution is a carrier convention, not fitted R/L.
        """
        R,L=np.broadcast_arrays(R,L)
        if np.any(R<0) or np.any(R>L) or np.any(L>1):raise ValueError('Require 0<=R<=L<=1')
        sigma=self.edge(self.ring_position(label)).sum(axis=-1)
        denominator=3*(L-R)+R*sigma
        rho=np.divide(R*sigma,denominator,out=np.zeros_like(denominator,dtype=float),where=denominator>0)
        return self.field.sample(label,rho,L)

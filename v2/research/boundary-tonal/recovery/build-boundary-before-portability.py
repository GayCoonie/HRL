"""Build the nonnegative-spectrum cone from the pinned 1-nm CMF table.
Linear interpolation of XYZ CMFs between wavelengths adds no new extreme rays.
No hull simplification, perceptual fitting, or benchmark-derived boundary edits.
"""
from pathlib import Path
import hashlib,json
import numpy as np
from scipy.spatial import ConvexHull
import colour
P=Path(__file__).resolve().parent
if colour.__version__ != '0.4.7':
 raise RuntimeError('Reproduction requires colour-science 0.4.7, not '+colour.__version__)
cm=colour.MSDS_CMFS['CIE 1931 2 Degree Standard Observer']; xyz=np.asarray(cm.values);xy=xyz[:,:2]/xyz.sum(1)[:,None];h=ConvexHull(xy)
assert xyz.shape == (471,3) and np.array_equal(cm.wavelengths,np.arange(360,831))
assert hashlib.sha256(xyz.astype('<f8').tobytes()).hexdigest() == 'beed7b13cda04076b84c6fc6ee5746a15f44b28916a21989cb0ac39be827e38b'
w=np.array([.9504559270516716,1,1.0890577507598787]);vertices=xy[h.vertices]
n=[]
for a,b in zip(vertices,np.roll(vertices,-1,axis=0)):
 v=np.cross([*a,1-sum(a)],[*b,1-sum(b)])
 if v@w<0:v=-v
 v=v/(v@w);n.append(v.tolist())
r={'id':'cie1931-2deg-1nm-linear-cone','observer':'CIE 1931 2 Degree Standard Observer','wavelengthRangeNm':[360,830],'stepNm':1,'interpolation':'piecewise linear in XYZ CMFs; nonnegative spectral mixtures','source':'colour-science 0.4.7 bundled table, not a newly measured observer','referenceDOI':'10.25039/CIE.DS.xvudnb9b','officialDatasetPage':'https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer','cmfFloat64LittleEndianSHA256':hashlib.sha256(xyz.astype('<f8').tobytes()).hexdigest(),'white_xyz':w.tolist(),'wavelengths_nm':cm.wavelengths.tolist(),'cmfs_xyz':xyz.tolist(),'vertices_xy':vertices.tolist(),'vertex_wavelengths_nm':cm.wavelengths[h.vertices].tolist(),'normals':n,'note':'The convex hull includes the purple closure and all tabulated spectral rays. This is exact for the declared tabulated/linear-interpolated cone, not a claim of exact continuous biological spectral sensitivity. Some tabulated spectral points are not extreme rays.'}
(P/'boundary-1nm.json').write_text(json.dumps(r,separators=(',',':'))+'\n')
print('vertices',len(vertices),'size',(P/'boundary-1nm.json').stat().st_size)

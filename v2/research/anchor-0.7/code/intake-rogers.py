"""Rogers et al. 2016 Table 2 interval constraints (aggregate MLDS estimates).
The nominal D65 chromaticity is supplied in Methods. The monitor reference-white
luminance was not provided for CIELUV; use standard relative Yw=1 and retain
this explicit reconstruction assumption. Table 2 is not raw participant data.
"""
import json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
white=[.31271,.32902]
def xyz(L,C,H):
    uw=4*white[0]/(-2*white[0]+12*white[1]+3);vw=9*white[1]/(-2*white[0]+12*white[1]+3)
    u=uw+C*math.cos(math.radians(H))/(13*L);v=vw+C*math.sin(math.radians(H))/(13*L)
    Y=((L+16)/116)**3 if L>8 else L/(24389/27)
    return [9*Y*u/(4*v),Y,Y*(12-3*u-20*v)/(4*v)]
table={'Red':(14.3,[12.96,17.19,23.66,45.79]),'Yellow':(80.2,[5,11.25,19.4,29.6]),'Green':(143.2,[11.26,22.59,35.47,47.79]),'Blue':(234.3,[7.65,15.6,26.99,38.19])}
rows=[]
for name,(H,cs) in table.items():
    for i in range(4):
        for j in range(i+1,4):rows.append(dict(track=name,i=i,j=j,xyz1=xyz(50,cs[i],H),xyz2=xyz(50,cs[j],H),difference=4*(j-i)))
ls=[42.75,49.55,58.47,67.33]
for i in range(4):
 for j in range(i+1,4):rows.append(dict(track='Neutral',i=i,j=j,xyz1=xyz(ls[i],0,0),xyz2=xyz(ls[j],0,0),difference=4*(j-i)))
out={'doi':'10.1364/JOSAA.33.00A184','source':'User supplied rogers2016.pdf, PDF page 4, Table 2; Methods PDF p3','kind':'Published aggregate/interpolated MLDS interval scales, not new independent trials','white_xy':white,'assumptions':['CIELUV relative reference-white Yn=1; white chromaticity from published background. No absolute-display luminance inferred.','Within-track intervals used as low-weight spacing constraints, not Level=lightness or Reach=chroma.','Across-track equality is not imposed; each track has its own nuisance scale.'],'table':table,'lightness':ls,'pairs':rows}
(ROOT/'sources/rogers2016-intervals.json').write_text(json.dumps(out,indent=2)+'\n')

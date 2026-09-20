"""Publication figures from exact visual.mjs values, never generated color imagery."""
from pathlib import Path
import argparse,json,base64,gzip
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=argparse.ArgumentParser();p.add_argument('name');p.add_argument('output');a=p.parse_args();P=Path(__file__).resolve().parent;vf=P/f'results/visual-{a.name}.json';d=json.loads(vf.read_text() if vf.exists() else gzip.decompress(Path(str(vf)+'.gz').read_bytes()));dest=Path(a.output);dest.mkdir(parents=True,exist_ok=True)
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'figure.facecolor':'#211a2c','axes.facecolor':'#211a2c','text.color':'#f7edf9','axes.labelcolor':'#d6c9dd','xtick.color':'#b8a9c3','ytick.color':'#b8a9c3','axes.edgecolor':'#7a6786','savefig.facecolor':'#211a2c'})
f,axes=plt.subplots(4,6,figsize=(13,10.3));f.subplots_adjust(left=.11,right=.98,top=.87,bottom=.08,wspace=.08,hspace=.22)
for row,(g,id) in enumerate([(g,id) for g in ['srgb','full'] for id in ['beta1',a.name]]):
 for col,H in enumerate(d['hues']):
  r=next(x for x in d['sheets'] if (x['gamut'],x['id'],x['H'])==(g,id,H));im=np.frombuffer(base64.b64decode(r['rgbaBase64']),dtype='uint8').reshape(d['height'],d['width'],4);ax=axes[row,col];ax.imshow(im);ax.axis('off');
  if row==0:ax.set_title(f'{H}°',pad=9)
 axes[row,0].text(-.18,.5,('Native sRGB' if g=='srgb' else 'Full, clipped')+'\n'+('Beta 1' if id=='beta1' else 'Joint fit'),transform=axes[row,0].transAxes,ha='right',va='center',fontsize=11)
f.suptitle('HRL: a wider interior model',fontsize=23,y=.965);f.text(.5,.914,'Identical vivid-ring angles and architecture · interior hue paths, tonal shape and shared gray calibration are free',ha='center',fontsize=10.5);f.text(.11,.035,'Each panel: white at top left, black at bottom left, vivid at right. Public hue is fixed across each sheet.\nFull-domain panels are clipped to sRGB; compare their physical curves separately.',fontsize=10,color='#c3b3ce');f.savefig(dest/'HRL_Joint_Sheets_2026-09-20.png',dpi=180);plt.close(f)
cases=[('srgb',300,'level'),('srgb',150,'level'),('full',288,'reach'),('full',171.25 if any(x['H']==171.25 for x in d['paths']) else 262.5,'reach')];f,axes=plt.subplots(2,4,figsize=(14,7));f.subplots_adjust(left=.065,right=.985,top=.82,bottom=.13,wspace=.31,hspace=.25)
for col,(g,H,path) in enumerate(cases):
 for id,color,label in [('beta1','#f8a4d4','Beta 1'),(a.name,'#8ce3c7','Joint fit')]:
  r=next(x for x in d['paths'] if (x['gamut'],x['id'],x['H'],x['path'])==(g,id,H,path));xx=np.linspace(0,.25,513) if path=='level' else np.linspace(r['R'],r['R']+(1-r['R'])*.25,513)
  for row,key in enumerate(['J','Y']):axes[row,col].plot(xx,r[key],color=color,lw=2,label=label);axes[row,col].grid(alpha=.15);axes[row,col].set_ylabel('GenSpace J' if key=='J' else 'Physical Y')
 axes[0,col].set_title(f'{"Native sRGB" if g=="srgb" else "Full"} · H {H:g}°\n'+(f'Fixed Level {r["L"]:g}' if path=='level' else f'Fixed Reach {r["R"]:g}'),fontsize=11)
 axes[1,col].set_xlabel('Reach / Level' if path=='level' else 'Level (normalized)')
axes[0,0].legend(frameon=False,fontsize=9);f.suptitle('Inspect the physical paths before display clipping',fontsize=21,y=.97);f.text(.5,.89,'Gray-neighborhood contours, a repaired path and a remaining full-domain reversal · exact runtime samples',ha='center');f.text(.065,.035,'Level means absence of blackness. GenSpace J and physical Y diagnose behavior; neither defines Level. These selected paths do not certify the entire solid.',fontsize=9.5,color='#c3b3ce');f.savefig(dest/'HRL_Joint_Paths_2026-09-20.png',dpi=180);plt.close(f)
print('Saved two exact-data figures to',dest)

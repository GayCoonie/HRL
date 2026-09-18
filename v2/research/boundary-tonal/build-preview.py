from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
P=Path(__file__).resolve().parent;R=P/'results';a=json.loads((R/'preview-index.json').read_text());names=a['names'];rows=a['rows']
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
for gamut in ['srgb','full']:
 for tag,hues in [('all',[30,90,150,210,240,255,263,269,273,275,277,281,285,293,300,330]),('dark',[255,263,269,273,275,277,281,285,293])]:
  im=Image.new('RGB',(215*len(names)+10,260*len(hues)+50),'#21172c');d=ImageDraw.Draw(im);d.text((12,7),f'HRL spectral boundary + tonal fit | {gamut} | same H/R/L, exact inverse; preview clipping labelled',font=font,fill='#83e8ca')
  for j,H in enumerate(hues):
   for i,name in enumerate(names):
    r=next(r for r in rows if r['gamut']==gamut and r['name']==name and r['H']==H);pic=Image.frombytes('RGBA',(r['W'],r['T']),(R/r['file']).read_bytes());x,y=12+215*i,60+260*j;im.paste(pic,(x,y),pic);d.text((x,y-22),f'{H}° | {name}',font=font,fill='#d8c4f3');d.text((x,y+224),f"{100*r['clipped']/r['inside']:.1f}% display clipped",font=font,fill='#cdbada')
  im.save(R/f'preview-{gamut}-{tag}.png')

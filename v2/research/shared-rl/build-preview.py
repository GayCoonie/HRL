from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent
rows=json.loads((HERE/'results/preview-index.json').read_text())
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
except OSError:font=ImageFont.load_default()
for gamut in ['srgb','full']:
 canvas=Image.new('RGB',(715,1712),'#21172c');d=ImageDraw.Draw(canvas)
 for j,H in enumerate([30,150,240,270,300,330]):
  for i,(name,label) in enumerate([('old-balanced','Previous separate'),('balanced','Shared balanced'),('metric','Shared metric')]):
   r=next(r for r in rows if r['gamut']==gamut and r['name']==name and r['H']==H)
   pic=Image.frombytes('RGBA',(r['W'],r['T']),(HERE/'results'/r['file']).read_bytes())
   x,y=12+i*237,30+j*280;canvas.paste(pic,(x,y),pic);d.text((x,y-23),f'{H}° | {label}',font=font,fill='#83e8ca')
   d.text((x,y+244),f"{100*r['clipped']/r['inside']:.1f}% display clipped",font=font,fill='#cdbada')
 canvas.save(HERE/f'results/preview-{gamut}.png')
print('Built exact-transform previews with explicit display clipping counts')

from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
here=Path(__file__).resolve().parent
entries=json.loads((here/'results/preview-index.json').read_text())
assert all(e['errors']==0 for e in entries)
canvas=Image.new('RGB',(550,840),'#1d1329');draw=ImageDraw.Draw(canvas)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
except OSError:font=ImageFont.load_default()
for row,H in enumerate([30,150,270,300]):
 draw.text((15,row*207+7),f'H {H}° — parent / Smooth / C1 balanced',fill='#d3bfe6',font=font)
 for col,name in enumerate(['0.8A parent','A Smooth','C1 balanced candidate']):
  e=next(x for x in entries if x['H']==H and x['model']==name)
  im=Image.frombytes('RGBA',(e['width'],e['height']),(here/'results'/e['file']).read_bytes())
  canvas.paste(im,(15+col*178,row*207+34),im)
canvas.save(here/'results/preview.png')

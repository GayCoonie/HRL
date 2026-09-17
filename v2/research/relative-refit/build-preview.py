"""Compose true-model sRGB-clipped triangle previews. Fonts are referenced, never bundled."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
here=Path(__file__).resolve().parent
entries=json.loads((here/'results/preview-index.json').read_text())
im=Image.new('RGB',(620,1115),'#1d1329');draw=ImageDraw.Draw(im)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
except OSError:font=ImageFont.load_default()
for i,title in enumerate(['Before refit','Balanced / smoother','Metric-leaning']):draw.text((15+i*205,12),title,font=font,fill='#e4d7f5')
for row,H in enumerate([30,90,150,210,270,300]):
    draw.text((8,38+row*166),f'H {H}',font=font,fill='#99e1cd')
    for col,name in enumerate(['baseline','balanced','metric']):
        e=next(x for x in entries if x['H']==H and x['name']==name)
        image=Image.frombytes('RGBA',(e['width'],e['height']),(here/'results'/e['file']).read_bytes())
        im.paste(image,(34+col*205,57+row*166),image)
draw.text((12,1060),'Full-domain XYZ previewed with explicit sRGB clipping.',font=font,fill='#c4b5d1')
draw.text((12,1080),'Out-of-display-gamut regions cannot be shown faithfully.',font=font,fill='#c4b5d1')
im.save(here/'results/preview.png')

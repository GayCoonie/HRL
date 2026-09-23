"""Accessible five-column montages. Usage: contact-montage.py --panels DIR --out NEW-DIR."""
import argparse
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--panels', required=True, type=Path, help='Directory made by contact-panels.mjs')
parser.add_argument('--out', required=True, type=Path, help='New destination directory')
args = parser.parse_args()
folder = args.panels.resolve()
out_folder = args.out.resolve()
manifest = json.loads((folder / 'manifest.json').read_text())
gamut = manifest['gamut']
if out_folder.exists():
    parser.error(f'Refusing to overwrite {out_folder}')
out_folder.mkdir(parents=True)
LABELS = ['Beta 1', 'Frozen joint', 'V3 guarded', 'V4 coupled guarded', 'V4 contact FAILED COMBVD']
HEADERS = [('Beta 1', 'frozen release'), ('Frozen joint', 'research baseline'),
           ('V3 guarded', 'research fit'), ('V4 coupled', 'research fit'),
           ('V4 contact', 'FAILED COMBVD')]
def font(size):
    try:
        return ImageFont.truetype('DejaVuSans.ttf', size)
    except OSError:
        return ImageFont.load_default(size=size)
FONTS = {size: font(size) for size in (12, 13, 16, 24)}

for name, hues in (('focus', [120, 182.5, 273]),
                   ('shifted', [117.5, 122.5, 270, 275, 280])):
        if not all(h in manifest['hues'] for h in hues):
            print('Skipping', name, 'because the panels omit at least one required hue')
            continue
        canvas = Image.new('RGB', (1400, 244 + 364*len(hues)), '#211a29')
        draw = ImageDraw.Draw(canvas)
        xs = [28 + i*271 for i in range(5)]
        draw.text((28, 18), f'HRL v4 contact · {"native sRGB" if gamut == "srgb" else "full gamut displayed in sRGB"}', font=FONTS[24], fill='#f2e9fb')
        draw.text((28, 57), 'Same public hue, Reach, Level · contact is a failed benchmark experiment', font=FONTS[13], fill='#beced2')
        for i, (heading, subheading) in enumerate(HEADERS):
            draw.text((xs[i], 102), heading, font=FONTS[16], fill='#f2e9fb')
            draw.text((xs[i], 128), subheading, font=FONTS[12], fill='#efb6b8' if 'FAILED' in subheading else '#beced2')
        counts = []
        for j, H in enumerate(hues):
            y = 195 + 364*j
            band = 'yellow' if H < 130 else 'green / cyan' if H < 200 else 'blue / violet'
            draw.text((28, y-31), f'H {H}° · {band}', font=FONTS[16], fill='#d6f6ef')
            for i, label in enumerate(LABELS):
                panel = next(p for p in manifest['panels'] if p['requestedH'] == H and p['label'] == label)
                source = Image.open(folder / panel['file']).convert('RGBA').resize((242, 282), Image.Resampling.BICUBIC)
                canvas.paste(source, (xs[i], y), source)
                clipped, valid = panel['displayClippedPixels'], panel['validPixels']
                draw.text((xs[i], y+290), f'Clipped {clipped:,} / {valid:,}', font=FONTS[12], fill='#ffadab' if clipped else '#beced2')
                counts.append(f'{label}: {clipped:,}/{valid:,} clipped')
            counts.append(f'H {H}°')
        draw.text((28, canvas.height-47), 'Actual toXYZ → display sRGB. Full-domain numerical claims use unclipped XYZ, not these clipped pixels.', font=FONTS[12], fill='#beced2')
        destination = out_folder / f'contact-{name}.png'
        canvas.save(destination, optimize=True)
        alt = [f'Alternative text for {destination.name}: {gamut} direct-runtime HRL triangle montage.',
               'Five columns: Beta 1, frozen joint, V3 guarded, V4 coupled guarded, and V4 contact (FAILED COMBVD).',
               f'{len(hues)} rows at matched public H, Reach and Level: ' + ', '.join(f'{H}°' for H in hues) + '.',
               'Each triangle has white at top left, black at bottom left, vivid hue at right. Each panel displays its clipped-pixel count.',
               'For each row, left to right:']
        for H in hues:
            row = [p for label in LABELS for p in manifest['panels'] if p['requestedH'] == H and p['label'] == label]
            alt.append(f'H {H}°: ' + '; '.join(f"{p['label']} {p['displayClippedPixels']:,}/{p['validPixels']:,}" for p in row) + ' clipped.')
        alt.append('Full-domain out-of-sRGB colors are visually clamped, so use actual XYZ numerical probes for claims about the full domain. Contact fit fails COMBVD.')
        (out_folder / f'contact-{name}.alt.txt').write_text('\n'.join(alt) + '\n')
        print(destination, canvas.size)

"""Add first-class navigation to the current research app, preserving the released picker."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
start='<!-- HRL DUAL REFITS START -->';end='<!-- HRL DUAL REFITS END -->'
def block(text,new):
    if start in text:return re.sub(re.escape(start)+'.*?'+re.escape(end),lambda _:new,text,flags=re.S)
    return None
banner=start+'''<aside class="refit-launch" style="max-width:1120px;margin:22px auto 0;padding:14px 20px;border:1px solid #81dabc;border-radius:9px;background:linear-gradient(120deg,#392647,#172b29);color:#f3e9fa;font:14px/1.65 'Trebuchet MS',sans-serif"><strong style="color:#ff91d3">New: HRL v2 native-sRGB and full-gamut refits</strong><br>Balanced and metric-leaning profiles, a real color picker, and scored comparisons. <a href="v2/refits.html" style="color:#8ff0cd;font-weight:bold">Open the two-gamut refit lab →</a><br><small style="color:#cab5db">The released R15-D picker below and all earlier prototypes remain unchanged.</small></aside>'''+end
p=root/'index.html';s=p.read_text();out=block(s,banner)
if out is None:out=re.sub(r'(<body[^>]*>)',lambda m:m.group(1)+'\n'+banner,s,count=1,flags=re.I)
assert out!=s or start in s;p.write_text(out)
card=start+'''<article class="card"><div class="label">LATEST RESEARCH · NATIVE sRGB + FULL GAMUT</div><h2>Two gamuts.<br>Two refit choices.</h2><p>Genuine native-sRGB counterparts to the corrected full-domain balanced and metric-leaning refits. Each gamut uses its own vivid boundary and independent R/L calibration.</p><a class="button" href="refits.html">Open the refit lab</a><p><a href="research/native-srgb-refit/README.md">Construction, fitting and scores</a></p></article>'''+end
p=root/'v2/index.html';s=p.read_text();out=block(s,card)
if out is None:out=s.replace('<div class="cards">','<div class="cards">'+card,1)
assert out!=s or start in s;p.write_text(out)
section=start+'''\n## Current v2 refits: native sRGB and full gamut\n\n[Open the live refit lab](https://gaycoonie.github.io/HRL/v2/refits.html) · [Native construction and fitting](v2/research/native-srgb-refit/README.md) · [Native scored report](v2/research/native-srgb-refit/results/REPORT.md) · [Full scored report](v2/research/relative-refit/results/REPORT.md).\n\nBoth balanced/smoother and metric-leaning profiles now have genuine native-sRGB calibrations. The native vivid endpoints and source maps belong to sRGB, not a clipped full solid. The full-gamut refits are unchanged. The new page defaults to native sRGB, includes a gamut switch, color selection/export, and both scored benchmark tables. These are named research checkpoints, not a replacement of Release 1 or the approved A Smooth prototype.\n\n```js\nimport {createHRLRefits} from './v2/refits.mjs';\nconst native = await createHRLRefits({gamut:'srgb', checkpoint:'balanced'});\nconst metric = await createHRLRefits({gamut:'srgb', checkpoint:'metric'});\nconst full = await createHRLRefits({gamut:'full', checkpoint:'balanced'});\n```\n\n'''+end
p=root/'README.md';s=p.read_text();out=block(s,section)
if out is None:pos=s.find('\n');out=s[:pos+1]+'\n'+section+'\n'+s[pos+1:]
p.write_text(out)
p=root/'v2/README.md';s=p.read_text();v2section=section.replace('(v2/research/','(research/').replace("'./v2/refits.mjs'","'./refits.mjs'");out=block(s,v2section)
if out is None:pos=s.find('\n');out=s[:pos+1]+'\n'+v2section+'\n'+s[pos+1:]
p.write_text(out)
print('Linked refits from root, v2 hub, and both README files; released code untouched.')

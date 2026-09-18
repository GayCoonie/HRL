"""Add navigation links without replacing older models, result tables or pickers."""
from pathlib import Path
import re
P=Path(__file__).resolve().parent;V=P.parents[1];ROOT=V.parent
for path,url in [(ROOT/'index.html','v2/boundary-tonal.html'),(V/'index.html','boundary-tonal.html'),(V/'hue-fair.html','boundary-tonal.html')]:
 s=path.read_text();marker='id="boundary-tonal-link"'
 if marker not in s:
  link=f'<a {marker} href="{url}" style="color:#83e8ca;margin:12px;display:inline-block">Repaired boundary + shared tonal fits</a>'
  s=s.replace('</nav>',link+'</nav>',1) if '</nav>' in s else re.sub(r'(<body[^>]*>)',r'\1'+link,s,count=1)
  path.write_text(s)
f=ROOT/'README.md';s=f.read_text()
if '<!-- boundary-tonal -->' not in s:
 s+='\n\n<!-- boundary-tonal -->\n## HRL 0.13 boundary and tonal research\n\n[Four-way comparison](https://gaycoonie.github.io/HRL/v2/boundary-tonal.html) preserves the 0.12 parent, isolates the 1-nm boundary-only repair, and adds two shared Reach/Level fits. [Normal retained-pair COMBVD](v2/research/boundary-tonal/results/retained-combvd.json) remains separate from mapped all-input ColorBench. [Method](v2/research/boundary-tonal/DESIGN.md), [results](v2/research/boundary-tonal/results/REPORT.md) and [execution history](v2/research/boundary-tonal/EXECUTION.md) retain the source/observer evidence distinction and numerical limits. Earlier accepted entry points are unchanged.\n'
 f.write_text(s)
print('Additive navigation integrated.')

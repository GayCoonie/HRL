"""Finish recovered research notes and integrate the verified page additively.
No model or numerical-audit changes. Preserve the original snapshot in Git.
"""
from pathlib import Path
import hashlib,json,re
P=Path(__file__).resolve().parent;V2=P.parents[1];ROOT=V2.parent
changed={}
def save(path,text,reason):
 old=path.read_bytes() if path.exists() else b''
 if old==text.encode():return
 path.write_text(text)
 changed[str(path.relative_to(ROOT))]={'before':hashlib.sha256(old).hexdigest(),'after':hashlib.sha256(path.read_bytes()).hexdigest(),'reason':reason}
p=P/'DEFINITIONS.md';text=p.read_text()
old='da Pos, Albertazzi, Villani and Dazzi'
new='da Pos, Fiorentin, Cristoforetti, Freuli, Guidolin, Nitri and Salamina'
assert old in text or new in text
text=text.replace(old,new)
if '## 10. A local differential form for the next calibration' not in text:
 text+='''

## 10. A local differential form for the next calibration

This is an HRL mathematical deduction, not a formula taken from ZCAM. Let
`X_g(H,R,L)` be the inverse HRL mapping for gamut g and let `G(X)` be the
pinned GenSpace vector. At fixed hue define the 3-by-2 derivative

    A_g = d G(X_g) / d(R,L).

The two infinitesimal appearance-operation directions are

    v_black = (-R,-L)       v_white = (-R,1-L).

Their external-ruler speeds are `||A_g v_black||` and `||A_g v_white||`.
This uses all three GenSpace coordinates and their interaction, not only
Gen lightness. The two directions have determinant -R, so together they
span the chromatic interior. Their collapse on R=0 is the expected loss
of a chromatic direction on the neutral axis, not automatically a defect.

The native equilateral-triangle metric is

    ds^2 = dR^2 - dR*dL + dL^2

at fixed hue, with an additional `(3/4) R^2 dH^2` for hue in radians.
Therefore a comparison of `A_g^T A_g` with the native metric must include
the R/L cross term. Ordinary Cartesian R/L distance would test a different
geometry. A local metric or path-speed penalty can guide smoothness, but
cannot on its own make R, W and K correct appearance ratings.

For a future fit this supplies two separately inspectable path families,
with own-gamut endpoints and the same learned law, rather than a single
power target for lightness. Appearance-data constraints determine whether
those paths really read as progressively blacker or whiter. Endpoint and
inverse constraints keep the chart coherent; GenSpace supplies the step
ruler. These roles remain analytically separate.
'''
save(p,text,'Correct author attribution from the primary paper and add explicitly derived two-direction metric constraints.')
p=P/'app.mjs';text=p.read_text()
text=text.replace('let request=0,data=null,timer;','let request=0,data=null,timer,rendered=null;')
text=text.replace("async function render(){const current=++request,s=state();","async function render(){const current=++request,s=state();rendered=null;for(const b of document.querySelectorAll('[data-prefer]'))b.disabled=true;")
text=text.replace("table(s);$('status').textContent=", "table(s);rendered={...s};for(const b of document.querySelectorAll('[data-prefer]'))b.disabled=false;$('status').textContent=")
text=text.replace('function schedule(e){let R=',"function schedule(e){rendered=null;for(const b of document.querySelectorAll('[data-prefer]'))b.disabled=true;let R=")
text=text.replace("b.onclick=()=>{try{const a=saved();a.push({...state(),preferred:","b.onclick=()=>{try{if(!rendered)return;const a=saved();a.push({...rendered,modelSourceHashes:data?.sourceHashes||null,preferred:")
assert 'a.push({...rendered,' in text
save(p,text,'Record preferences only against the completed rendered state; prevent stale-control attribution.')
for p,href in [(ROOT/'index.html','v2/research/tonal-semantics/'),(V2/'index.html','research/tonal-semantics/'),(V2/'shared.html','research/tonal-semantics/')]:
 text=p.read_text()
 if 'id="tonal-semantics-link"' not in text:
  link=f'<a id="tonal-semantics-link" href="{href}" style="color:#83e8ca;margin:12px;display:inline-block">GenSpace · black and white operations</a>'
  text=text.replace('</nav>',link+'</nav>',1) if '</nav>' in text else re.sub(r'(<body[^>]*>)',r'\1'+link,text,count=1)
  save(p,text,'Add navigation; preserve prior picker and all calibrations.')
for p,href in [(ROOT/'README.md','https://gaycoonie.github.io/HRL/v2/research/tonal-semantics/'),(V2/'README.md','research/tonal-semantics/')]:
 text=p.read_text()
 if '<!-- tonal-semantics -->' not in text:
  save(p,text+f'\n<!-- tonal-semantics -->\n## GenSpace tonal operations research\n\n[Black/white operations lab]({href}) compares unchanged shared 0.10 candidates with a GenSpace ruler. It implements distinct black dilution, white dilution and fixed-Reach neutral exchange, plus local per-hue preference export. Definitions, source roles, raw audit and algebraic tests are in `v2/research/tonal-semantics`. This is a research/diagnostic addition, not a newly fitted colour-space release.\n','Document additive research entry point.')
(P/'results').mkdir(exist_ok=True)
(P/'results/finalization.json').write_text(json.dumps({'recoveredCommit':'537e8f1351d1528f8f8112967e8768dcf2a4b24b','changes':changed,'numericalAuditChanged':False,'coefficientsChanged':False},indent=2)+'\n')
print('Completed source corrections and additive navigation',len(changed))

'''Build HRL's static navigation and reading editions without changing models.
Run from the repository root. Historical URLs and raw documents are retained.
'''
from pathlib import Path
from html.parser import HTMLParser
from html import escape, unescape
import argparse, hashlib, json, os, posixpath, re, subprocess
import mistune

ROOT=Path(__file__).resolve().parents[1]
BASE='bd1d9039d3c4390197099dcb53967baac2896505'
MARK='<!-- HRL SITE NAV BETA1 -->'
GENERATED=[]

def write(path,text):
    p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(text,encoding='utf-8');GENERATED.append(path)

def original(path):
    if has_baseline():
        return subprocess.check_output(['git','show',f'{BASE}:{path}'],cwd=ROOT).decode()
    # Release ZIPs include the preserved landing, but do not include Git history.
    p=ROOT/('v2/history.html' if path=='v2/index.html' else path)
    text=p.read_text()
    text=re.sub(re.escape(MARK)+r'<nav class="hrl-site-nav"[\s\S]*?</nav>','',text)
    text=re.sub(r'<div class="hrl-local-links">[\s\S]*?</div>','',text)
    text=re.sub(r'<details class="hrl-local-links"><summary>Page-specific links and sources</summary>(<nav[\s\S]*?</nav>)</details>',r'\1',text)
    return re.sub(r'<link rel="stylesheet" href="[^"]*site/site.css">','',text)

def has_baseline():
    return (ROOT/'.git').exists() and subprocess.run(['git','cat-file','-e',BASE+'^{commit}'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0

def rel(target,page):
    return posixpath.relpath(target,posixpath.dirname(page) or '.')

LINKS=[('v2/index.html','v2 Beta 1'),('v2/beta1.html','Picker'),
       ('v2/beta1-notes.html','Definition'),('v2/benchmarks.html','Benchmarks'),
       ('index.html','Release 1'),('v2/archive.html','Archive'),('library.html','All files')]

def nav(page):
    links=''.join(f'<a href="{rel(p,page)}"'+(' aria-current="page"' if page==p else '')+f'>{label}</a>' for p,label in LINKS)
    return MARK+f'<nav class="hrl-site-nav" aria-label="HRL site"><a class="hrl-brand" href="{rel("v2/index.html",page)}">HRL<small>Hue · Reach · Level</small></a><div class="hrl-nav-links">{links}</div></nav>'

def shell(page,title,content,extra='',document=False):
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)} · HRL</title><link rel="stylesheet" href="{rel('site/site.css',page)}"></head>
<body class="hrl-shell"><a class="hrl-skip" href="#hrl-main">Skip to content</a>{nav(page)}
<main id="hrl-main" class="hrl-page {'hrl-document' if document else ''}">{content}<footer class="hrl-footer">HRL · Coonie / Adam · Every earlier model, page, raw Markdown document, and JSON record remains available.<br><a href="{rel('library.html',page)}">Complete file catalogue</a> · <a href="https://github.com/GayCoonie/HRL">GitHub source</a> · <a href="{rel('site/preservation.json',page)}">Preservation audit</a></footer></main>{extra}</body></html>'''

class Positions(HTMLParser):
    def __init__(self,text):
        super().__init__(convert_charrefs=False);self.text=text
        self.lines=[0]
        for m in re.finditer('\n',text):self.lines.append(m.end())
        self.body=None;self.main=None;self.content=None;self.headEnd=None;self.navStart=None;self.navEnd=None;self.depth=0
        self.feed(text)
    def at(self):
        line,col=self.getpos();return self.lines[line-1]+col
    def handle_starttag(self,tag,attrs):
        p=self.at()
        if self.content is None and tag in {'header','h1','h2','section','article','div','p','nav'}:self.content=p
        if tag=='body' and self.body is None:self.body=p+len(self.get_starttag_text())
        if tag=='main' and self.main is None:self.main=p
        if tag=='nav':
            if self.navStart is None:self.navStart=p;self.depth=1
            elif self.navEnd is None:self.depth+=1
    def handle_endtag(self,tag):
        if tag=='head':self.headEnd=self.at()
        if tag=='nav' and self.navStart is not None and self.navEnd is None:
            self.depth-=1
            if self.depth==0:self.navEnd=self.text.find('>',self.at())+1

def scripts(text):
    return [hashlib.sha256(m.group().encode()).hexdigest() for m in re.finditer(r'<script\b[^>]*>[\s\S]*?</script\s*>',text,re.I)]

def attach_navigation(path):
    p=ROOT/path;text=p.read_text()
    if MARK in text:return
    before=scripts(text);pos=Positions(text);patch=[]
    insert=pos.body if pos.body is not None else pos.main if pos.main is not None else pos.content
    if insert is None:return # Raw templates with no usable document body are left intact.
    if pos.navStart is not None and pos.navEnd is not None:
        patch.extend([(pos.navEnd,'</details>'),(pos.navStart,'<details class="hrl-local-links"><summary>Page-specific links and sources</summary>')])
    banner=''
    if path=='index.html':
        banner=f'<div class="hrl-local-links">You are using <strong>R15-D Release 1</strong>. <a href="{rel("v2/beta1.html",path)}">Open the current HRL v2 Beta 1 picker</a>.</div>'
    elif path!='v2/beta1.html':
        banner=f'<div class="hrl-local-links">Preserved research page. Its original checkpoint and controls remain intact. <a href="{rel("v2/index.html",path)}">Current release: HRL v2 Beta 1</a>.</div>'
    css=f'<link rel="stylesheet" href="{rel("site/site.css",path)}">'
    if pos.headEnd is not None:patch.append((pos.headEnd,css));css=''
    patch.append((insert,css+nav(path)+banner))
    for at,addition in sorted(patch,key=lambda x:x[0],reverse=True):text=text[:at]+addition+text[at:]
    assert scripts(text)==before,path+' embedded code changed'
    write(path,text)

def headings(html):
    toc=[];used={}
    def heading(m):
        level,title=m.group(1),m.group(2)
        label=unescape(re.sub('<[^>]+>','',title))
        slug=re.sub(r'[^\w\- ]','',label.lower()).strip().replace(' ','-') or 'section'
        n=used.get(slug,0);used[slug]=n+1
        if n:slug+=f'-{n}'
        if level=='2':toc.append((slug,label))
        return f'<h{level} id="{slug}">{title}</h{level}>'
    html=re.sub(r'<h([1-6])>(.*?)</h\1>',heading,html,flags=re.S)
    return html,toc

RESEARCH=[
 ('v2/boundary-tonal.html','0.13 · Boundary and shared tonal comparison','Current release source: parent, geometry-only control, balanced, and metric-leaning.', 'v2/research/boundary-tonal/results/REPORT.md'),
 ('v2/research/mapped-012/index.html','0.12 · Mapped-input audit','Import policy and all-input benchmark evidence, distinct from retained-pair scores.','v2/research/mapped-012/README.md'),
 ('v2/hue-fair.html','0.12 · Hue-sheet refinement','Shared-bank continuations of the balanced 0.11 parent.','v2/research/hue-fair-refine/README.md'),
 ('v2/gen-tonal.html','0.11 · GenSpace tonal fitting','Fitted tonal candidates beside unchanged shared 0.10 controls.','v2/research/gen-tonal-fit/README.md'),
 ('v2/research/tonal-semantics/index.html','Tonal operations lab','Black dilution, white dilution, and fixed-Reach neutral exchange.','v2/research/tonal-semantics/README.md'),
 ('v2/shared.html','0.10 · Shared Reach/Level','One learned bank across source-gamut realizations.','v2/research/shared-rl/README.md'),
 ('v2/refits.html','Native and full refit lab','Earlier separately calibrated native/full candidates, preserved as controls.','v2/research/native-srgb-refit/README.md'),
 ('v2/research/relative-refit/viewer.html','Relative-domain refits','Full-domain interactive research viewer.','v2/research/relative-refit/README.md'),
 ('v2/research/relative-refit/standalone.html','Relative-domain standalone','Embedded-data edition of the preserved full-domain experiment.','v2/research/relative-domain/README.md'),
 ('v2/research/rl-c1/viewer.html','C1 source-atlas experiment','Interpolation and R/L continuation of A Smooth.','v2/research/rl-c1/README.md'),
 ('v2/a-smooth.html','0.8 A Smooth','Earlier approved original-ring R/L prototype.','v2/a-smooth/README.md'),
 ('v2/opal-anchor.html','0.7 · Gamut-anchor OPAL','Earlier own-gamut anchoring and metric tradeoffs.','v2/research/anchor-0.7/README.md'),
 ('v2/opal.html','0.6 · OPAL','Observer readouts and the inherited hue-family research.','v2/research/equal-span/README.md'),
 ('v2/equal-span.html','0.5 · Equal-Span','Geometric path-normalization control.','v2/research/equal-span/README.md'),
 ('v2/basr.html','0.4 · BASR','Black-Anchored Semantic Remap; earlier explicit prototype API.','v2/README.pre-beta1.md'),
 ('v2/native-0.2.html','0.2 · Native sRGB','Preserved native linear-light triangles and released angle attachment.','v2/README.pre-beta1.md'),
 ('v2/hue-field-0.1.html','0.1 · Observer-field inspector','Initial continuous constant-hue family and source audit.','v2/docs/OBSERVER_FIELD_0_1_SOURCE_AUDIT.md'),
 ('index.html','R15-D Release 1','Unchanged release library and root picker.','README.pre-beta1.md'),
]

def all_files():
    out=[]
    for base,dirs,names in os.walk(ROOT):
        dirs[:]=[d for d in dirs if d not in {'.git','node_modules','__pycache__','.venv'}]
        for name in names:
            p=Path(base)/name;path=p.relative_to(ROOT).as_posix()
            if name.endswith(('.pyc','.log')) and path.startswith('site/'):continue
            out.append(path)
    if (ROOT/'.git').exists():
        tracked=subprocess.check_output(['git','ls-tree','-r','--name-only','-z',BASE if has_baseline() else 'HEAD'],cwd=ROOT).decode().split('\0')
        out.extend(p for p in tracked if p and (ROOT/p).is_file())
    return sorted(set(out))

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--preview',action='store_true');args=ap.parse_args()
    write('.nojekyll','')
    # Preserve the old landing page at the same depth, so its relative links still resolve.
    write('v2/history.html',original('v2/index.html'))
    page='v2/index.html'
    content='''<div class="hrl-eyebrow">Current v2 release · 18 September 2026</div>
<h1>HRL v2 Beta 1</h1><p class="hrl-lede">Hue, Reach, Level. One regular bicone. Native sRGB and a repaired full physical-reference domain, with one shared learned tonal map.</p>
<div class="hrl-actions"><a class="hrl-button hrl-primary" href="beta1.html">Open the Beta 1 picker</a><a class="hrl-button" href="beta1-notes.html">Read the full definition</a></div>
<div class="hrl-note"><strong>The selected metric-leaning checkpoint.</strong> Beta 1 names the frozen 0.13 <code>metric-b2</code> model. No coefficients were refitted to give it this release name. <a href="default.json">Exact release manifest</a>.</div>
<div class="hrl-grid"><article class="hrl-card hrl-featured"><div class="hrl-eyebrow">Start here</div><h2>Pick a color</h2><p>The metric-leaning model is selected by default. Switch between native sRGB and full, import hex, export precise XYZ, or reveal all four comparison panels.</p><a href="beta1.html">Use Beta 1</a></article>
<article class="hrl-card"><div class="hrl-eyebrow">Definition</div><h2>From the ground up</h2><p>Coordinates, geometry, hue, the physical cone, source atlases, shared coupling layers, input policies, and the relationship to r0 and Release 1.</p><a href="beta1-notes.html">Read on the site</a> · <a href="HRL_v2_Beta_1.md">Raw Markdown</a></article>
<article class="hrl-card"><div class="hrl-eyebrow">Evidence</div><h2>Know what was measured</h2><p>Retained native pairs and mapped all-input ColorBench remain separate. Full reports, raw JSON, control comparisons, and limitations stay attached.</p><a href="benchmarks.html">Browse the benchmarks</a></article></div>
<h2>Same geometry. Explicit tradeoffs.</h2><div class="hrl-kpis"><div><strong>29.107048</strong><span>Native weighted STRESS · 3,331 retained pairs</span></div><div><strong>29.948555</strong><span>Full weighted STRESS · 3,813 retained pairs</span></div></div>
<p>These are fitted development scores on different retained populations, not a universal accuracy rating. The <a href="research/boundary-tonal/results/REPORT.html">original report</a> also preserves mapped-input scores, path diagnostics, and difficult conditioning tails.</p>
<h2>Use the named release</h2><pre><code>import {createHRLv2} from './v2/index.mjs';
const hrl = await createHRLv2(); // native sRGB, metric-b2
const q = hrl.fromRGB([0.2, 0.5, 0.8]);
const full = await createHRLv2({gamut:'full'});</code></pre>
<p><a href="index.mjs">Release module</a> · <a href="README.html">Library guide</a> · <a href="default.json">Machine-readable manifest</a></p>
<h2>Nothing swept under the rug</h2><p>The <a href="../index.html">Release 1 picker</a> and its <code>src/</code> library remain unchanged. Earlier research pages keep their original models and controls. Find them in the <a href="archive.html">chronological archive</a>, or search <a href="../library.html">every page, source file, Markdown document, and JSON record</a>.</p>'''
    write(page,shell(page,'HRL v2 Beta 1',content))
    # The focused release page uses the same calculation/export code as the preserved comparison.
    beta=original('v2/boundary-tonal.html')
    beta=re.sub(r'<html\b', '<html data-hrl-release="beta1"',beta,count=1,flags=re.I)
    beta=re.sub(r'<title>.*?</title>','<title>HRL v2 Beta 1 · Color picker</title>',beta,count=1,flags=re.S)
    beta=re.sub(r'<h1[^>]*>.*?</h1>','<h1>HRL v2 Beta 1</h1>',beta,count=1,flags=re.S)
    beta=beta.replace('</head>','<link rel="stylesheet" href="../site/beta1.css"></head>',1)
    if '../site/beta1.css' not in beta:beta=beta.replace('<main>','<link rel="stylesheet" href="../site/beta1.css"><main>',1)
    callout='''<p class="hrl-release-callout">Hue · Reach · Level <span>metric-b2 · frozen release</span></p><label class="hrl-compare-toggle"><input type="checkbox" id="compareProfiles"> Compare all four checkpoints</label>'''
    beta=re.sub(r'(</h1>)',r'\1'+callout,beta,count=1)
    beta=beta.replace('<option value="balanced" selected>', '<option value="balanced">').replace('<option value="metric">', '<option value="metric" selected>')
    beta=beta.replace('HRL 0.13 · spectral boundary + shared tonal fit','HRL v2 Beta 1 · metric-b2')
    beta=re.sub(r'<p class="intro">.*?</p>', '', beta, count=1, flags=re.S)
    beta=beta.replace('These are review candidates, not a changed Release 1 default.', 'Metric-leaning is HRL v2 Beta 1. Other checkpoints keep their research identities; Release 1 remains unchanged.')
    beta=beta.replace('<main>', '<main id="hrl-main">',1)
    beta=beta.replace('<div class="panels" id="panels">','<div class="hrl-workspace"><div class="panels" id="panels">',1)
    beta=beta.replace('<section class="evidence">','</div><section class="evidence">',1)
    beta=beta.replace('<section class="selection">','<section class="selection" aria-label="Selected color"><h2 class="selection-title">Selected color</h2>',1)
    beta=beta.replace('<pre id="readout"', '<pre aria-live="polite" id="readout"',1)
    beta=beta.replace('Export color JSON</button>', 'Export color JSON</button>',1)
    write('v2/beta1.html',beta)
    # Archive is curated; the complete catalogue below additionally includes every raw file.
    cards=[]
    for target,title,description,method in RESEARCH:
        if args.preview or (ROOT/target).exists():
            cards.append(f'<article class="hrl-card"><h2>{escape(title)}</h2><p>{escape(description)}</p><a href="{rel(target,"v2/archive.html")}">Open page</a> · <a href="{rel(method,"v2/archive.html")}">Source notes</a></article>')
    content='<div class="hrl-eyebrow">Preserved history · newest research first</div><h1>Research archive</h1><p class="hrl-lede">Earlier models remain earlier models. These pages retain their controls, evidence, and checkpoint identities.</p><div class="hrl-actions"><a class="hrl-button hrl-primary" href="beta1.html">Current Beta 1 picker</a><a class="hrl-button" href="../library.html">Search all files</a></div><div class="hrl-grid">'+''.join(cards)+'</div><h2>Earlier orientation documents</h2><p><a href="history.html">Former v2 landing page</a> · <a href="README.pre-beta1.md">Pre-beta v2 README</a> · <a href="../README.pre-beta1.md">Pre-beta root README</a></p><p>The r0 comparison and the limits of the recovered r0 evidence are discussed in the <a href="beta1-notes.html">Beta 1 technical write-up</a>; a residual table or an old angle lookup is not mislabeled as the complete r0 runtime.</p>'
    write('v2/archive.html',shell('v2/archive.html','Research archive',content))
    bench=json.loads((ROOT/'v2/research/boundary-tonal/results/colorbench.json').read_text())
    rows=[]
    for gamut,label in [('srgb','Native sRGB'),('full','Full reference')]:
        m=bench['models']['metric-'+gamut];r=m['retained_combvd'];a=m['combvd']
        rows.extend([[label,'Normal retained',r['weighted'],r['unweighted'],r['pairs'],0],[label,'All-input mapped',a['traditional_weighted'],a['unweighted'],a['retained'],a['mapped_pairs']]])
    table='<div class="hrl-table-wrap"><table><thead><tr>'+''.join('<th>'+s+'</th>' for s in ['Realization','Pipeline','Weighted STRESS','Unweighted STRESS','Pairs','Mapped pairs'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join(f'<td>{v:.6f}</td>' if isinstance(v,float) else f'<td>{v}</td>' for v in r)+'</tr>' for r in rows)+'</tbody></table></div>'
    content='''<div class="hrl-eyebrow">Evidence for the selected metric-b2 checkpoint</div><h1>Beta 1 benchmarks</h1><p class="hrl-lede">The score is only meaningful with its population and pipeline attached.</p><div class="hrl-note">These are the frozen 0.13 results. The Beta 1 promotion does not claim a new fit or scored benchmark run. COMBVD is fitted/in-sample; full and native retained populations differ.</div>'''+table+'''<div class="hrl-actions"><a class="hrl-button hrl-primary" href="research/boundary-tonal/results/REPORT.html">Read the complete report</a><a class="hrl-button" href="boundary-tonal.html">Compare all four controls</a></div>
<div class="hrl-grid"><article class="hrl-card"><h2>Observer tests and raw scores</h2><p>All five generation and sixteen measurement columns, mapping audit, and the original report.</p><a href="research/boundary-tonal/results/colorbench.json">ColorBench JSON</a> · <a href="research/boundary-tonal/results/scores.csv">CSV</a> · <a href="research/boundary-tonal/results/REPORT.md">Raw report</a></article>
<article class="hrl-card"><h2>Retained means retained</h2><p>The normal native score keeps 3,331 supported pairs without mapping. The all-input native pipeline includes another 482 pairs that require mapping.</p><a href="research/boundary-tonal/results/retained-combvd.json">Retained-pair JSON</a> · <a href="research/boundary-tonal/results/retained-combvd.csv">CSV</a></article>
<article class="hrl-card"><h2>Numerical and visual diagnostics</h2><p>Actual-inverse paths, whole-sheet bending, boundary coverage, and common-coordinate conditioning.</p><a href="research/boundary-tonal/results/direct-final.json">Paths</a> · <a href="research/boundary-tonal/results/sheet-final.json">Sheets</a> · <a href="research/boundary-tonal/results/conditioning-same-grid.json">Conditioning</a> · <a href="research/boundary-tonal/results/verification.json">Model verification</a></article></div>
<h2>Not an across-the-board win</h2><p>The metric candidate improves the reported COMBVD aggregate, but the balanced sibling has stronger conditioning-tail reduction and some parent paths have lower synthetic irregularity. Positive sampled Jacobians and tiny round-trip error are numerical evidence, not observer preference percentages. No overall leaderboard rank is manufactured from heterogeneous columns.</p>
<p><a href="research/boundary-tonal/results/SELECTION.json">Frozen selection</a> · <a href="research/boundary-tonal/DESIGN.html">Methods</a> · <a href="research/boundary-tonal/results/point-event-masks.jsonl.gz">Per-input event masks</a> · <a href="../library.html?q=boundary-tonal">All boundary/tonal artifacts</a></p>'''
    write('v2/benchmarks.html',shell('v2/benchmarks.html','Beta 1 benchmarks',content))
    # Every Markdown file remains raw. Add a reading edition without overwriting a real HTML page.
    render=mistune.create_markdown(escape=False,plugins=['table','strikethrough','url'])
    raw_files=all_files();previous=set()
    previous_manifest=ROOT/'site/build-manifest.json'
    if previous_manifest.exists():previous=set(json.loads(previous_manifest.read_text()).get('readingEditions',{}).values())
    editions={}
    for source in raw_files:
        if not source.endswith('.md') or source.startswith('.'):continue
        target='v2/beta1-notes.html' if source=='v2/HRL_v2_Beta_1.md' else source[:-3]+'.html'
        if (ROOT/target).exists() and target not in previous and target!='v2/beta1-notes.html':continue
        editions[source]=target
    for source,target in editions.items():
        md=(ROOT/source).read_text();body,toc=headings(render(md))
        # Resolve Markdown links to reading editions; raw downloads remain explicit in the header.
        def reading_link(m):
            href=unescape(m.group(1));path,sep,fragment=href.partition('#')
            if not path or '://' in path or path.startswith(('/', 'mailto:')):return m.group()
            source_dir=posixpath.dirname(source)
            if source=='v2/research/hue-fair-refine/recovery/interrupted-README.md':
                source_dir=posixpath.dirname(source_dir)
            absolute=posixpath.normpath(posixpath.join(source_dir,path))
            if absolute in editions:return 'href="'+escape(rel(editions[absolute],target)+(sep+fragment if sep else ''),quote=True)+'"'
            if source_dir!=posixpath.dirname(source):return 'href="'+escape(rel(absolute,target)+(sep+fragment if sep else ''),quote=True)+'"'
            return m.group()
        body=re.sub(r'href="([^"]+)"',reading_link,body)
        body=body.replace('<table>','<div class="hrl-table-wrap"><table>').replace('</table>','</table></div>')
        title=next((line.lstrip('# ').strip() for line in md.splitlines() if line.startswith('# ')),Path(source).stem)
        links=f'<div class="hrl-eyebrow">Documentation · reading edition</div><p><a href="{rel(source,target)}" download>Download original Markdown</a> · <a href="{rel("library.html",target)}">All documents and data</a></p>'
        toc_html='<details class="hrl-toc"><summary>Contents</summary><ol>'+''.join(f'<li><a href="#{anchor}">{escape(label)}</a></li>' for anchor,label in toc)+'</ol></details>' if toc else ''
        write(target,shell(target,title,links+toc_html+body,document=True))
    # Add shared navigation to actual retained viewers, not source templates whose relative depth changes on generation.
    for path in all_files():
        if path.endswith('.html') and '/source/' not in path and not path.endswith('-template.html'):
            attach_navigation(path)
    manifest={'sourceCommit':BASE,'readingEditions':editions,'curatedPages':['v2/index.html','v2/beta1.html','v2/beta1-notes.html','v2/archive.html','v2/benchmarks.html','library.html']}
    write('site/build-manifest.json',json.dumps(manifest,indent=2)+'\n')
    # Catalogue every existing file; GitHub-only hidden files get a repository link rather than a broken Pages URL.
    paths=set(all_files())|{'library.html','site/catalog.json','site/preservation.json','site/browser-checks.json','site/model-checks.json','site/publication.json'}
    catalog=[];rows=[]
    for path in sorted(paths):
        ext=Path(path).suffix.lower();kind='html' if ext=='.html' else 'markdown' if ext=='.md' else 'json' if ext in {'.json','.jsonl'} else 'source' if ext in {'.mjs','.js','.py','.css','.yml','.yaml'} else 'other'
        url='https://github.com/GayCoonie/HRL/blob/main/'+path if path.startswith('.') else path
        entry={'path':path,'kind':kind,'url':url}
        if path in editions:entry['readingEdition']=editions[path]
        catalog.append(entry)
        read=f' · <a href="{escape(editions[path],quote=True)}">Read</a>' if path in editions else ''
        rows.append(f'<tr data-hrl-file="{escape(path.lower(),quote=True)}" data-kind="{kind}"><td class="hrl-file-path"><a href="{escape(url,quote=True)}">{escape(path)}</a></td><td>{kind}{read}</td></tr>')
    write('site/catalog.json',json.dumps({'sourceCommit':BASE,'files':catalog},indent=2)+'\n')
    content='''<div class="hrl-eyebrow">The complete archive, not just the front page</div><h1>All HRL files</h1><p class="hrl-lede">Find every page, Markdown document, JSON result, model, and source file. Original paths stay intact. Markdown links retain the raw file; “Read” opens its site edition.</p><p><a href="v2/archive.html">Curated research timeline</a> · <a href="v2/index.html">Current release</a> · <a href="site/catalog.json">Machine-readable catalogue</a></p>
<div class="hrl-filter"><label>Search paths and names<input id="hrl-file-search" type="search" placeholder="Try boundary-tonal, r15, source, README…" autocomplete="off"></label><label>File type<select id="hrl-file-kind"><option value="all">All types</option><option value="html">Pages and reading editions</option><option value="markdown">Original Markdown</option><option value="json">JSON data and results</option><option value="source">Source code and workflows</option><option value="other">Other artifacts</option></select></label></div><p id="hrl-file-count" role="status">'''+str(len(rows))+''' files</p><noscript><p>All links remain usable without JavaScript. Use your browser’s Find command to search this list.</p></noscript><div class="hrl-table-wrap"><table><thead><tr><th>Original path</th><th>Type / reading edition</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table></div>'''
    write('library.html',shell('library.html','All files',content,extra='<script src="site/catalog.js" defer></script>'))
    print(json.dumps({'generated':len(GENERATED),'readingEditions':len(editions),'catalogued':len(catalog)},indent=2))

if __name__=='__main__':main()

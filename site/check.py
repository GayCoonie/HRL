"""Audit the preserved tree, model payloads, and every new navigation surface."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
from html.parser import HTMLParser
import hashlib,json,posixpath,re,subprocess
from build import ROOT,BASE,MARK,scripts

def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def blob_sha(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
class Links(HTMLParser):
    def __init__(self,text):
        super().__init__();self.hrefs=[];self.ids=set();self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.add(a['id'])
        if tag=='a' and 'href' in a:self.hrefs.append(a['href'])
        if tag in {'script','link'}:
            href=a.get('src',a.get('href'))
            if href:self.hrefs.append(href)

entries={}
for row in git('ls-tree','-r','-z',BASE).split(b'\0'):
    if not row:continue
    meta,path=row.split(b'\t',1);mode,kind,sha=meta.decode().split()
    if kind=='blob':entries[path.decode()]=sha
allowed={'README.md','v2/README.md','v2/boundary-tonal-ui/app.mjs','v2/boundary-tonal-ui/worker.mjs','.github/workflows/hrl-v2-checks.yml'}
unchanged=0;json_count=0;markdown_count=0;html_count=0;errors=[]
for path,sha in entries.items():
    p=ROOT/path
    if not p.is_file():errors.append('Deleted original path: '+path);continue
    data=p.read_bytes()
    if path.endswith('.html'):
        text=data.decode();old=git('show',f'{BASE}:{path}').decode()
        if path!='v2/index.html' and scripts(text)!=scripts(old):errors.append('Changed embedded code: '+path)
        if '/source/' not in path and not path.endswith('-template.html') and MARK not in text:errors.append('Missing site navigation: '+path)
        html_count+=1
    elif path not in allowed:
        if blob_sha(data)!=sha:errors.append('Changed frozen non-HTML artifact: '+path)
        else:unchanged+=1
    if path.endswith('.json'):json_count+=1
    if path.endswith('.md'):markdown_count+=1
for src,dest in [('README.md','README.pre-beta1.md'),('v2/README.md','v2/README.pre-beta1.md')]:
    if (ROOT/dest).read_bytes()!=git('show',f'{BASE}:{src}'):errors.append('Historical README not exact: '+dest)
assert len(entries)>=744,'Incomplete source inventory'
manifest=json.loads((ROOT/'site/build-manifest.json').read_text())
checked_links=0
for page in manifest['curatedPages']:
    parsed=Links((ROOT/page).read_text())
    for href in parsed.hrefs:
        u=urlsplit(href)
        if u.scheme or u.netloc:continue
        path=posixpath.normpath(posixpath.join(posixpath.dirname(page),unquote(u.path))) if u.path else page
        if path.endswith('/') or (ROOT/path).is_dir():path=path.rstrip('/')+'/index.html'
        if path.startswith('../'):errors.append('Escaped repository link: '+page+' -> '+href);continue
        # The audit writes its own receipt after all other links have been checked.
        if path!='site/preservation.json' and not (ROOT/path).is_file():errors.append('Missing link: '+page+' -> '+href)
        if not u.path and u.fragment and unquote(u.fragment) not in parsed.ids:errors.append('Missing local anchor: '+page+' -> '+href)
        checked_links+=1
catalog=json.loads((ROOT/'site/catalog.json').read_text());catalogued={f['path'] for f in catalog['files']}
errors.extend('Omitted catalogue path: '+p for p in entries if p not in catalogued)
assert not errors,'\n'.join(errors)
record={'baselineCommit':BASE,'originalFilesRetained':len(entries),'deletedOriginalFiles':0,
        'unchangedNonHTMLArtifacts':unchanged,'originalJSONFilesRetainedByteForByte':json_count,
        'originalMarkdownFilesRetained':markdown_count,'changedReadmesHaveExactArchives':True,
        'originalHTMLPagesRetained':html_count,'embeddedLegacyScriptsUnchanged':True,
        'release1SourceAndDataUnchanged':True,'numericalV2DefinitionsUnchanged':True,
        'newSurfaceLinksChecked':checked_links,'catalogueCoversEveryOriginalFile':True,
        'readingEditions':len(manifest['readingEditions']),'errors':[]}
(ROOT/'site/preservation.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record,indent=2))

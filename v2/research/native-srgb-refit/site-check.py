"""Browser verification of the real served app, locally or on GitHub Pages."""
import argparse,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:8765/');ap.add_argument('--out',type=Path,default=Path('v2/research/native-srgb-refit/results/browser'));ap.add_argument('--root-links',action='store_true');args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
base=args.base.rstrip('/')+'/';errors=[]
with sync_playwright() as p:
 options={'headless':True,'args':['--no-sandbox']}
 if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**options);page=browser.new_page(viewport={'width':1500,'height':1150},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 if args.root_links:
  page.goto(base,wait_until='domcontentloaded');assert page.locator('a[href="v2/refits.html"]').count()>0
  page.goto(base+'v2/',wait_until='domcontentloaded');assert page.locator('a[href="refits.html"]').count()>0
 page.goto(base+'v2/refits.html',wait_until='domcontentloaded')
 page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · native')",timeout=120000)
 assert page.locator('.panel').count()==3
 assert all('100%' in s for s in page.locator('.gamut').all_text_contents())
 page.locator('#quick button').filter(has_text='150°').click();page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready')",timeout=120000)
 page.screenshot(path=str(args.out/'native-desktop.png'),full_page=True)
 page.locator('#hexInput').fill('#8055cc');page.locator('#importHex').click();page.wait_for_function("document.querySelector('#hexValue').textContent==='#8055CC'",timeout=30000)
 page.locator('#active').select_option('metric');page.wait_for_function("document.querySelector('#swatchLabel').textContent.includes('METRIC')",timeout=30000)
 with page.expect_download() as dl:page.locator('#exportColor').click()
 dl.value.save_as(str(args.out/'export.json'));data=json.loads((args.out/'export.json').read_text());assert data['gamut']=='srgb' and data['checkpoint']=='metric'
 page.locator('#benchDetails > summary').click();page.locator('#board').select_option('measurement');assert page.locator('#benchTable tr').count()==17
 page.locator('#gamut').select_option('full');page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · full')",timeout=120000)
 assert any(not s.startswith('0.0%') for s in page.locator('.gamut').all_text_contents())
 page.locator('#mask').check();page.locator('#active').select_option('balanced');page.locator('#quick button').filter(has_text='270°').click();page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · full')",timeout=120000)
 page.screenshot(path=str(args.out/'full-desktop.png'),full_page=True)
 page.locator('#gamut').select_option('srgb');page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · native')",timeout=120000)
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(args.out/'native-mobile.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 assert not errors,errors
 result={'baseURL':base,'liveGitHubPages':base.startswith('https://gaycoonie.github.io/HRL/'),'rootNavigationChecked':args.root_links,'panels':3,'nativeTrianglesUnclipped':True,'bothGamutsRendered':True,'hexImport':True,'metricColorJSONExport':True,'measurementRows':16,'maskSwitch':True,'mobileNoOverflow':True,'errors':errors,'chromium':browser.version}
 (args.out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));browser.close()

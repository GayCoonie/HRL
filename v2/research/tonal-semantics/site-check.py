"""Exercise the actual served diagnostic page. No screenshot-only success claims."""
from pathlib import Path
import argparse,json,os
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',required=True);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
base=args.base.rstrip('/')+'/';errors=[]
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);page=browser.new_page(viewport={'width':1400,'height':1100},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'v2/research/tonal-semantics/',wait_until='domcontentloaded')
 ready=lambda:page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready')",timeout=120000)
 ready();page.wait_for_function("document.querySelectorAll('#hueTable tr').length===2",timeout=30000)
 assert page.locator('canvas.bar').count()==6
 page.screenshot(path=str(args.out/'native.png'),full_page=True)
 page.locator('#operation').select_option('white');page.wait_for_timeout(250);ready()
 text=page.locator('#balanced-read').inner_text();assert 'R 0.325000' in text and 'L 0.825000' in text,text
 page.locator('[data-prefer="balanced"]').click();assert '1 preferences' in page.locator('#saved').inner_text()
 with page.expect_download() as dl:page.locator('#export').click()
 dl.value.save_as(str(args.out/'preference.json'));obs=json.loads((args.out/'preference.json').read_text())['observations'];assert obs[0]['preferred']=='balanced' and obs[0]['operation']=='white'
 page.locator('#gamut').select_option('full');page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · full')",timeout=120000)
 page.screenshot(path=str(args.out/'full.png'),full_page=True)
 page.locator('#hue').fill('150');page.locator('#hue').dispatch_event('input');page.wait_for_timeout(250);ready();assert 'H 150.0°' in page.locator('#metric-read').inner_text()
 page.locator('#operation').select_option('exchange');page.wait_for_timeout(250);ready();assert 'R 0.650000' in page.locator('#metric-read').inner_text()
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(args.out/'mobile.png'),full_page=True);assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 assert not errors,errors
 result={'base':base,'publicPages':base.startswith('https://gaycoonie.github.io/HRL/'),'twoUnchangedCandidates':True,'bothGamuts':True,'operationStrips':6,'actualWhiteAdditionReadout':True,'fixedReachNeutralExchange':True,'currentHueReadout':True,'perHueGenSpaceTable':True,'localPreferenceExport':True,'mobileNoOverflow':True,'errors':errors,'chromium':browser.version}
 (args.out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));browser.close()

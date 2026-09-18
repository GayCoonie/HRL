"""Exercise the real served four-way fitted-checkpoint app."""
import argparse,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',required=True);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args();base=args.base.rstrip('/')+'/';args.out.mkdir(parents=True,exist_ok=True);errors=[]
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);page=b.new_page(viewport={'width':1500,'height':1100},device_scale_factor=1);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base,wait_until='domcontentloaded');assert page.locator('a[href="v2/hue-fair.html"]').count()
 page.goto(base+'v2/',wait_until='domcontentloaded');assert page.locator('a[href="hue-fair.html"]').count()
 page.goto(base+'v2/hue-fair.html',wait_until='domcontentloaded')
 ready=lambda:page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready')",timeout=120000)
 ready();assert page.locator('.panel').count()==3;page.wait_for_function("document.querySelectorAll('#problemHues button').length===8",timeout=30000);assert page.locator('canvas.white').count()==3
 page.wait_for_function("document.querySelector('#score2').textContent.includes('COMBVD')",timeout=30000)
 assert all('100%' in x for x in page.locator('.gamut').all_text_contents())
 page.locator('#surround').check();assert page.locator('body.neutral-surround').count();page.locator('#surround').uncheck()
 page.screenshot(path=str(args.out/'native.png'),full_page=True)
 page.locator('#hexInput').fill('#8055cc');page.locator('#importHex').click();page.wait_for_function("document.querySelector('#hexValue').textContent==='#8055CC'",timeout=30000)
 page.locator('#active').select_option('gentle');page.wait_for_function("document.querySelector('#swatchLabel').textContent.includes('GENTLE')",timeout=30000)
 with page.expect_download() as dl:page.locator('#exportColor').click()
 dl.value.save_as(str(args.out/'color.json'));record=json.loads((args.out/'color.json').read_text());assert record['profile']=='HRL-0.12-hue-fair' and record['checkpoint']=='gentle' and record['sharedCalibration']
 page.locator('#active').select_option('parent');page.wait_for_function("document.querySelector('#swatchLabel').textContent.includes('PARENT')",timeout=30000)
 with page.expect_download() as dl:page.locator('#exportColor').click()
 dl.value.save_as(str(args.out/'old-color.json'));old=json.loads((args.out/'old-color.json').read_text());assert old['profile']=='HRL-0.11-gen-tonal' and old['checkpoint']=='balanced' and old['viewCheckpoint']=='parent'
 page.locator('#benchDetails > summary').click();page.locator('#board').select_option('measurement');assert page.locator('#benchTable tr').count()==17
 page.locator('#gamut').select_option('full');page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · full')",timeout=120000)
 page.locator('#mask').check();page.locator('#quick button').filter(has_text='270°').click();page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready') && Array.from(document.querySelectorAll('.reading')).every(e=>e.textContent.includes('270.00'))",timeout=120000)
 page.screenshot(path=str(args.out/'full.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(args.out/'mobile.png'),full_page=True);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 r={'base':base,'publicPages':base.startswith('https://gaycoonie.github.io/HRL/'),'threePanels':True,'whiteDilutionStrips':3,'bothGamuts':True,'nativeNoDisplayClipping':True,'colorImportExport':True,'oldVersionIdentityOnExport':True,'sixteenMeasurementColumns':True,'neutralSurround':True,'mask':True,'currentHueReadouts':True,'mobileNoOverflow':True,'errors':errors,'chromium':b.version}
 (args.out/'verification.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2));b.close()

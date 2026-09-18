"""Verify actual served boundary/tonal comparison, retained scores and mapped boards."""
from pathlib import Path
import argparse,json,os
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',required=True);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args();base=args.base.rstrip('/')+'/';args.out.mkdir(parents=True,exist_ok=True);errors=[]
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);page=browser.new_page(viewport={'width':1550,'height':1100},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'v2/boundary-tonal.html',wait_until='domcontentloaded')
 ready=lambda:page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready')",timeout=120000)
 ready();page.wait_for_function("document.querySelector('#score-balanced').textContent.includes('3331 pairs')",timeout=30000)
 assert page.locator('.panel').count()==4
 assert page.locator('canvas.bar').count()==20
 assert all('100%' in s for s in page.locator('.gamut').all_text_contents())
 parent=page.locator('#tri-parent').evaluate('(c)=>c.toDataURL()');boundary=page.locator('#tri-boundary').evaluate('(c)=>c.toDataURL()');assert parent==boundary
 assert '29.2812' in page.locator('#score-parent').inner_text()
 page.locator('#neutralSurround').check();assert page.locator('body.neutral-surround').count();page.locator('#neutralSurround').uncheck()
 page.locator('#quick button').filter(has_text='273°').click();page.wait_for_timeout(300);ready()
 page.wait_for_function("Array.from(document.querySelectorAll('.reading')).every(x=>x.textContent.includes('273.00'))",timeout=30000)
 page.screenshot(path=str(args.out/'native-273.png'),full_page=True)
 page.locator('#hexInput').fill('#8055cc');page.locator('#importHex').click();page.wait_for_function("document.querySelector('#hexValue').textContent==='#8055CC'",timeout=120000);ready()
 page.locator('#active').select_option('metric');page.wait_for_function("document.querySelector('#swatchLabel').textContent.startsWith('Metric')",timeout=30000)
 with page.expect_download() as dl:page.locator('#exportColor').click()
 dl.value.save_as(str(args.out/'new-color.json'));c=json.loads((args.out/'new-color.json').read_text());assert c['profile']=='HRL-0.13-boundary-tonal' and c['checkpoint']=='metric' and c['gamut']=='srgb' and c['sharedCalibration'];assert set(c['coordinates'])=={'H','R','L'}
 page.locator('#active').select_option('parent');page.wait_for_function("document.querySelector('#swatchLabel').textContent.startsWith('0.12')",timeout=30000)
 with page.expect_download() as dl:page.locator('#exportColor').click()
 dl.value.save_as(str(args.out/'parent-color.json'));c=json.loads((args.out/'parent-color.json').read_text());assert c['profile']=='HRL-0.12-hue-fair' and c['checkpoint']=='balanced' and c['viewCheckpoint']=='parent'
 page.locator('#benchDetails > summary').click();page.locator('#board').select_option('measurement');assert page.locator('#benchTable tbody tr').count()==16;assert 'N/A' not in page.locator('#benchTable').inner_text()
 assert '3813' in page.locator('#mappedCombvd').inner_text();assert '3331' in page.locator('#retained').inner_text()
 page.locator('#board').select_option('generation');assert page.locator('#benchTable tbody tr').count()==5
 page.locator('#gamut').select_option('full');page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · full')",timeout=120000)
 assert '3813 pairs' in page.locator('#score-balanced').inner_text()
 page.locator('#showMask').check();page.wait_for_timeout(300);ready()
 page.locator('#quick button').filter(has_text='275°').click();page.wait_for_timeout(300);ready()
 page.wait_for_function("Array.from(document.querySelectorAll('.reading')).every(x=>x.textContent.includes('275.00'))",timeout=30000)
 page.screenshot(path=str(args.out/'full-275.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(args.out/'mobile.png'),full_page=True);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 result={'base':base,'publicPages':base.startswith('https://gaycoonie.github.io/HRL/'),'fourPanels':True,'bothGamuts':True,'nativeBoundaryOnlyPixelsIdentical':True,'nativeRetained3331Prominent':True,'mappedAll3813Separate':True,'fiveGenerationSixteenMeasurement':True,'finiteMappedScores':True,'tonalStrips':20,'criticalBlueNeighbors':True,'hexImport':True,'correctVersionedExports':True,'noExtraIntensityCoordinate':True,'currentHueReadouts':True,'neutralSurround':True,'mask':True,'mobileNoOverflow':True,'pageErrors':errors,'chromium':browser.version}
 (args.out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));browser.close()

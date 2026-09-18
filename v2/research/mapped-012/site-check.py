"""Check current mapped and preserved historical evidence on the actual comparison."""
import argparse,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args();a.out.mkdir(parents=True,exist_ok=True);base=a.base.rstrip('/')+'/';errors=[]
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);page=browser.new_page(viewport={'width':1500,'height':1100});page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'v2/hue-fair.html',wait_until='domcontentloaded')
 page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready') && document.querySelector('#score1').textContent.includes('3813 pairs')",timeout=120000)
 assert page.locator('#benchPolicy').input_value()=='mapped';assert '34.6310' in page.locator('#score1').inner_text()
 assert page.locator('.panel').count()==3
 snapshot=page.locator('#tri1').evaluate('(c)=>c.toDataURL()')
 page.locator('#benchDetails > summary').click();page.locator('#board').select_option('measurement');assert page.locator('#benchTable tr').count()==17
 assert 'N/A' not in page.locator('#benchTable').inner_text()
 page.locator('#benchPolicy').select_option('strict');assert '3331 pairs' in page.locator('#score1').inner_text();assert '29.2812' in page.locator('#score1').inner_text()
 assert snapshot==page.locator('#tri1').evaluate('(c)=>c.toDataURL()')
 page.locator('#benchPolicy').select_option('mapped');assert '3813 pairs' in page.locator('#score1').inner_text()
 assert snapshot==page.locator('#tri1').evaluate('(c)=>c.toDataURL()')
 page.screenshot(path=str(a.out/'native-mapped.png'),full_page=True)
 page.locator('#gamut').select_option('full');page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · full')",timeout=120000)
 assert '30.2198' in page.locator('#score1').inner_text()
 page.locator('#board').select_option('generation');assert page.locator('#benchTable tr').count()==6;assert '3.397949' in page.locator('#benchTable').inner_text()
 page.locator('#benchPolicy').select_option('strict');assert 'N/A' in page.locator('#benchTable').inner_text()
 page.locator('#benchPolicy').select_option('mapped');assert 'N/A' not in page.locator('#benchTable').inner_text()
 page.screenshot(path=str(a.out/'full-mapped.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(a.out/'mobile.png'),full_page=True)
 page.goto(base+'v2/research/mapped-012/',wait_until='domcontentloaded');assert page.locator('table').count()==4;assert '0.352832' in page.locator('main').inner_text();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 result={'base':base,'publicPages':base.startswith('https://gaycoonie.github.io/HRL/'),'defaultMapped':True,'historicalStrictSelectable':True,'native3813AndHistorical3331':True,'fullOriginalJudgeScoresVisible':True,'fiveGenerationSixteenMeasurement':True,'noMappedNA':True,'policySwitchLeavesTrianglePixelsIdentical':True,'scorePage':True,'mobileNoOverflow':True,'pageErrors':errors,'chromium':browser.version}
 (a.out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));browser.close()

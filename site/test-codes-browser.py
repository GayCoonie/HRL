"""Exercise canonical controls and short-code serialization through the picker."""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--out',required=True);a=p.parse_args()
out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':900},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(a.base.rstrip('/')+'/v2/beta1.html',wait_until='domcontentloaded')
    page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready')",timeout=180000)
    assert page.locator('#reach').get_attribute('max')=='175.75','Native canonical scale missing'
    page.wait_for_function("document.querySelector('#shortCode')?.value.length===9",timeout=30000)
    code=page.locator('#shortCode').input_value()
    page.locator('#shortCode').fill(code);page.locator('#importCode').click()
    page.wait_for_function("document.querySelector('#shortCode').value==='"+code+"' && !document.querySelector('#exportColor').disabled",timeout=60000)
    with page.expect_download() as event:page.locator('#exportColor').click()
    event.value.save_as(str(out/'native.json'));native=json.loads((out/'native.json').read_text())
    assert native['shortCode']['code']==code and native['shortCode']['context']['gamut']=='srgb'
    assert abs(native['canonicalCoordinates']['R']-native['coordinates']['R']*175.75)<1e-9
    page.locator('#gamut').select_option('full')
    page.wait_for_function("document.querySelector('#shortCode')?.value.length===12 && !document.querySelector('#exportColor').disabled",timeout=180000)
    assert page.locator('#reach').get_attribute('max')=='4569.75'
    page.locator('#reach').fill('0');page.locator('#reach').press('Tab')
    page.locator('#level').fill('4569.75');page.locator('#level').press('Tab')
    page.wait_for_function("document.querySelector('#hexValue').textContent==='#FFFFFF' && !document.querySelector('#exportColor').disabled",timeout=60000)
    with page.expect_download() as event:page.locator('#exportColor').click()
    event.value.save_as(str(out/'full-white.json'));white=json.loads((out/'full-white.json').read_text())
    assert white['coordinates']['R']==0 and white['coordinates']['L']==1
    assert white['shortCode']['code'].endswith('AAAAZZZZ')
    page.locator('#shortCode').fill('ZZZZZZZZZZZZ');page.locator('#importCode').click()
    page.wait_for_function("document.querySelector('#status').classList.contains('error')",timeout=30000)
    assert page.locator('#hexValue').inner_text()=='#FFFFFF'
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(out/'codes-mobile.png'),full_page=True)
    assert not errors,errors
    result={'canonicalScales':True,'codeImportExport':True,'fullWhiteEndpoint':True,'invalidCodeRejected':True,'mobileNoOverflow':True,'pageErrors':errors}
    (out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));browser.close()

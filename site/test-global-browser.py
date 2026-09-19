"""Global candidates, both realizations, compact codes, scales and mobile behavior."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--out',required=True);a=p.parse_args();out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1360,'height':1000},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(a.base.rstrip('/')+'/v2/global.html',wait_until='domcontentloaded')
    def ready(g,c):
        page.wait_for_function("([g,c])=>{const s=document.querySelector('.sheets');return s.dataset.ready==='true' && s.dataset.profile===g && s.dataset.candidate===c && !document.querySelector('#export-color').disabled;}",arg=[g,c],timeout=180000)
    page.wait_for_function("document.querySelector('#results-status').textContent==='Recorded measurements loaded.'",timeout=60000)
    candidates=page.locator('#candidate option').evaluate_all('(xs)=>xs.map(x=>x.value)')
    assert set(candidates)=={'metric-global','uniform-global','fresh-global','uniform-tail-global'}
    rows=[]
    for gamut in ['srgb','full']:
        page.locator('#profile').select_option(gamut)
        for candidate in candidates:
            page.locator('#candidate').select_option(candidate);ready(gamut,candidate)
            assert page.locator('#reach').get_attribute('max')==('175.75' if gamut=='srgb' else '4569.75')
            code=page.locator('#short-code').input_value();assert len(code)==(9 if gamut=='srgb' else 12)
            assert page.locator('#comparison-values tr').count()==9
            assert '—' not in page.locator('#comparison-values').inner_text()
            with page.expect_download() as event:page.locator('#export-color').click()
            path=out/f'{candidate}-{gamut}.json';event.value.save_as(str(path));data=json.loads(path.read_text())
            assert data['shortCode']['code']==code and data['gamut']==gamut and data['candidate']==candidate
            page.screenshot(path=str(out/f'{candidate}-{gamut}.png'),full_page=True)
            rows.append({'gamut':gamut,'candidate':candidate,'code':code})
        # Import the other grammar selects its own realization.
    native=next(r for r in rows if r['gamut']=='srgb' and r['candidate']==candidates[-1])
    page.locator('#short-code').fill(native['code']);page.locator('#import-code').click();ready('srgb',candidates[-1])
    assert page.locator('#short-code').input_value()==native['code']
    page.locator('#triangle-candidate').focus();old=float(page.locator('#reach').input_value());page.locator('#triangle-candidate').press('ArrowRight')
    page.wait_for_function('(old)=>Number(document.querySelector("#reach").value)>old',arg=old)
    page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(out/'global-mobile.png'),full_page=True)
    assert not errors,errors
    result={'rows':rows,'measurements':True,'canonicalScales':True,'codeImportExport':True,'keyboard':True,'mobileNoOverflow':True,'pageErrors':errors}
    (out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));browser.close()

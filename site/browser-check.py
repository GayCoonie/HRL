"""Exercise the served release, retained comparison, documentation, and catalogue."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--out',required=True);a=p.parse_args()
base=a.base.rstrip('/')+'/';out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
errors=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1450,'height':1050},accept_downloads=True,permissions=['clipboard-read','clipboard-write'])
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'v2/',wait_until='domcontentloaded')
    assert page.locator('h1').inner_text()=='HRL v2 Beta 1'
    assert page.locator('.hrl-site-nav a').count()==8
    page.screenshot(path=str(out/'release-home.png'),full_page=True)
    page.goto(base+'v2/beta1-notes.html',wait_until='domcontentloaded')
    assert page.locator('h2').count()>=22
    assert 'Relation to r0' in page.locator('main').inner_text()
    assert '92aa2f9647b406239dd52cd22feed61794f3d6ed74a1c33ba9361516cff3bb72' in page.locator('main').inner_text()
    page.screenshot(path=str(out/'definition.png'))
    page.goto(base+'library.html',wait_until='domcontentloaded')
    assert page.locator('[data-hrl-file]').count()>=744
    page.locator('#hrl-file-search').fill('boundary-tonal metric.json')
    page.wait_for_function("document.querySelector('#hrl-file-count').textContent.startsWith('1 of ')")
    assert page.locator('[data-hrl-file]:visible').count()==1
    page.locator('#hrl-file-kind').select_option('markdown')
    assert page.locator('[data-hrl-file]:visible').count()==0
    page.locator('#hrl-file-kind').select_option('json')
    assert page.locator('[data-hrl-file]:visible').count()==1
    page.goto(base+'v2/beta1.html',wait_until='domcontentloaded')
    ready=lambda:page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready')",timeout=180000)
    ready();page.wait_for_function("document.querySelector('#active').value==='metric' && document.querySelector('#swatchLabel').textContent.startsWith('Metric')",timeout=30000)
    assert page.locator('#panels > .panel:visible').count()==1
    assert page.locator('#panel-metric').is_visible()
    assert '29.1070' in page.locator('#score-metric').inner_text()
    page.screenshot(path=str(out/'beta1-native.png'),full_page=True)
    page.locator('#hexInput').fill('#8055cc');page.locator('#importHex').click()
    page.wait_for_function("document.querySelector('#hexValue').textContent==='#8055CC'",timeout=180000);ready()
    with page.expect_download() as dl:page.locator('#exportColor').click()
    dl.value.save_as(str(out/'beta1-color.json'));color=json.loads((out/'beta1-color.json').read_text())
    assert color['release']=='HRL v2 Beta 1' and color['releaseVersion']=='2.0.0-beta.1'
    assert color['checkpoint']=='metric' and color['gamut']=='srgb'
    assert color['definitionSHA256']=='92aa2f9647b406239dd52cd22feed61794f3d6ed74a1c33ba9361516cff3bb72'
    assert not color['displayClipped']
    page.locator('#share').click();page.wait_for_function("document.querySelector('#status').textContent.includes('copied')")
    shared=page.evaluate('navigator.clipboard.readText()');assert '#g=srgb' in shared and 'c=metric' in shared
    page.goto(shared,wait_until='domcontentloaded');page.reload(wait_until='domcontentloaded');ready()
    page.wait_for_function("document.querySelector('#hexValue').textContent==='#8055CC'",timeout=30000)
    page.locator('#compareProfiles').check();assert page.locator('#panels > .panel:visible').count()==4
    page.locator('#active').select_option('parent')
    page.wait_for_function("document.querySelector('#swatchLabel').textContent.startsWith('0.12')",timeout=30000)
    with page.expect_download() as dl:page.locator('#exportColor').click()
    dl.value.save_as(str(out/'parent-color.json'));parent=json.loads((out/'parent-color.json').read_text())
    assert parent['profile']=='HRL-0.12-hue-fair' and 'releaseVersion' not in parent
    page.locator('#active').select_option('metric');page.locator('#compareProfiles').uncheck()
    page.locator('#gamut').select_option('full')
    page.wait_for_function("document.querySelector('#status').textContent.startsWith('Ready · full')",timeout=180000)
    page.wait_for_function("document.querySelector('#swatchLabel').textContent.startsWith('Metric')",timeout=30000)
    assert '3813 pairs' in page.locator('#score-metric').inner_text()
    page.locator('#showMask').check();page.wait_for_timeout(300);ready()
    page.screenshot(path=str(out/'beta1-full.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Beta 1 horizontal overflow'
    page.screenshot(path=str(out/'beta1-mobile.png'),full_page=True)
    for url in ['v2/','v2/beta1-notes.html','v2/archive.html','v2/benchmarks.html','library.html?q=boundary-tonal%20metric.json']:
        page.goto(base+url,wait_until='domcontentloaded')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),url+' horizontal overflow'
    page.set_viewport_size({'width':1450,'height':1050})
    page.goto(base+'v2/boundary-tonal.html',wait_until='domcontentloaded');ready()
    assert page.locator('#active').input_value()=='balanced','Historical comparison default changed'
    assert page.locator('#panels > .panel:visible').count()==4
    page.goto(base,wait_until='domcontentloaded')
    assert 'Release 1' in page.locator('.hrl-local-links').first.inner_text()
    page.wait_for_function("!document.querySelector('#controls').disabled",timeout=180000)
    page.screenshot(path=str(out/'release1-preserved.png'))
    assert not errors,errors
    result={'base':base,'publicPages':base.startswith('https://gaycoonie.github.io/HRL/'),
            'releaseDefaultMetric':True,'focusedPickerAndFourWayComparison':True,
            'nativeAndFull':True,'correctReleaseAndParentExports':True,
            'hexImportAndShareRoundTrip':True,'longDefinitionAndR0Section':True,
            'completeCatalogueAndFilters':True,'historicalComparisonDefaultRetained':True,
            'release1PickerLoaded':True,'mobileNoHorizontalOverflow':True,
            'pageErrors':errors,'chromium':browser.version}
    (out/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2));browser.close()

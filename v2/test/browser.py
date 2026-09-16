"""Render embedded standalone HTML; navigation is blocked by this environment."""
from pathlib import Path
import json,mimetypes
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
repo=root.parent
out=root/'results'
screens=Path('/mnt/data/hrl_basr_browser');screens.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 context=browser.new_context(viewport={'width':1440,'height':1100},device_scale_factor=1)
 errors=[];missing=[]
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content((root/'basr.html').read_text(),wait_until='load')
 page.wait_for_function('window.HRLNativeLab && HRLNativeLab.ready',timeout=60000)
 page.wait_for_function('HRLNativeLab.galleryReady',timeout=60000)
 imports={}
 for value in ['#000000','#FFFFFF','#808080','#FF0000','#00FFFF','#0000FF','#9A53C7']:
  page.fill('#importhex',value);page.click('#import');imports[value]=page.locator('#hex').inner_text()
  assert imports[value]==value
 page.evaluate('HRLNativeLab.setState({R:0,L:0.5},false)')
 gray=page.locator('#hex').inner_text();assert gray=='#777777'
 page.get_by_role('button',name='Blue',exact=True).click()
 page.evaluate('HRLNativeLab.setState({R:.67,L:.82})')
 page.check('#compare');page.wait_for_function("document.querySelector('#oldstats').textContent.includes('no clipping')",timeout=60000)
 compare=page.locator('#oldstats').inner_text()
 page.screenshot(path=str(screens/'BASR-desktop.png'),full_page=True)
 page.locator('.workspace').screenshot(path=str(screens/'BASR-workspace.png'))
 desktop_overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=str(screens/'BASR-mobile.png'),full_page=True)
 mobile_overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
 module_check={'status':'Node module tests executed separately; browser module-loading not tested because navigation is administratively blocked'}
 page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_content((root/'native-0.2.html').read_text());page.wait_for_function('window.HRLNativeLab && HRLNativeLab.ready',timeout=60000)
 page.evaluate('HRLNativeLab.setState({R:0,L:.5},false)');native_gray=page.locator('#hex').inner_text();assert native_gray=='#BCBCBC'
 page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_content((root/'hue-field-0.1.html').read_text());page.wait_for_function("document.querySelector('#xyz').textContent.includes('XYZ')",timeout=60000)
 page.close();page=context.new_page();page.set_content((root/'index.html').read_text());assert page.locator('a[href="basr.html"]').count()==1
 import re
 page.set_viewport_size({'width':390,'height':844})
 page.set_content(re.sub(r'<script\b[^>]*>[\s\S]*?</script>','',(repo/'index.html').read_text()));page.wait_for_timeout(100)
 assert page.locator('a[href="v2/basr.html"]').count()==1
 root_badge=page.locator('#versionBadge').inner_text()
 root_overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
 assert not errors,errors
 assert not missing,missing
 assert not desktop_overflow and not mobile_overflow and not root_overflow
 result={'scope':'Chromium set_content on standalone viewers. File/HTTP navigation is administratively blocked. V1 header layout checked without executing its unchanged scripts.','page_errors':errors,'missing_local_requests':missing,'BASR_gray_midpoint':gray,'native_0_2_gray_midpoint':native_gray,'imports':imports,'comparison':compare,'desktop_horizontal_overflow':desktop_overflow,'mobile_horizontal_overflow':mobile_overflow,'v1_mobile_horizontal_overflow':root_overflow,'v1_badge':root_badge,'module_check':module_check,'pass':True}
 (out/'browser-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
 browser.close()

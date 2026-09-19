"""Verify a served tonal-next page with an already-installed Playwright Chromium.

Run: python ui-browser-check.py --base http://127.0.0.1:8000 --out /tmp/ui-browser
Does not install tools or start a server. Assertions prove behavior; saved screenshots
require separate visual review. Source and receipt are served from --base unchanged.
"""
from pathlib import Path
import argparse, hashlib, json, os
from playwright.sync_api import sync_playwright, expect

ap = argparse.ArgumentParser()
ap.add_argument('--base', required=True)
ap.add_argument('--out', type=Path, required=True)
args = ap.parse_args()
base = args.base.rstrip('/') + '/'
url = base + 'v2/tonal-next.html'
args.out.mkdir(parents=True, exist_ok=True)
evidence = {'url': url, 'scope': 'Chromium page behavior and viewport captures; screenshots require visual review', 'actions': [], 'screenshots': [], 'pageErrors': [], 'pass': False}

def log(action, result):
    evidence['actions'].append({'action': action, 'result': result})
    print(action + ': ' + str(result), flush=True)

def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()

with sync_playwright() as pw:
    launch = {'headless': True, 'args': ['--no-sandbox']}
    if os.environ.get('CHROMIUM_PATH'):
        launch['executable_path'] = os.environ['CHROMIUM_PATH']
    browser = pw.chromium.launch(**launch)
    context = browser.new_context(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
    page = context.new_page()
    page.on('pageerror', lambda error: evidence['pageErrors'].append(str(error)))
    receipt_pattern = '**/v2/research/tonal-next/results/comparison.json'
    page.route(receipt_pattern, lambda route: route.fulfill(status=503, content_type='application/json', body='{}'))
    page.goto(url, wait_until='domcontentloaded')
    sheets = page.locator('.sheets')

    def ready(profile=None, candidate=None, hue=None):
        expect(sheets).to_have_attribute('data-ready', 'true', timeout=120000)
        if profile is not None: expect(sheets).to_have_attribute('data-profile', profile)
        if candidate is not None: expect(sheets).to_have_attribute('data-candidate', candidate)
        if hue is not None: expect(sheets).to_have_attribute('data-hue', str(hue))
        expect(page.locator('#hex-beta1')).to_have_text(__import__('re').compile(r'^#[0-9A-F]{6}$'), timeout=30000)
        expect(page.locator('#hex-candidate')).to_have_text(__import__('re').compile(r'^#[0-9A-F]{6}$'), timeout=30000)

    def capture(name, width, height):
        page.set_viewport_size({'width': width, 'height': height})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
        for control in page.locator('input,select,button').all():
            if control.is_visible():
                box = control.bounding_box()
                assert box['x'] >= 0 and box['x'] + box['width'] <= width + 1, (width, box)
        path = args.out / name
        page.screenshot(path=str(path), full_page=True)
        evidence['screenshots'].append({'path': str(path), 'viewport': {'width': width, 'height': height}, 'profile': page.locator('#profile').input_value(), 'candidate': page.locator('#candidate').input_value(), 'hue': page.locator('#hue-number').input_value(), 'meaning': 'Real served page; bounded layout and control positions asserted, visual judgment pending'})

    ready('srgb', 'smooth-mild', 275)
    expect(page.locator('#results-status')).to_contain_text('Comparison measurements unavailable (HTTP 503)')
    expect(page.locator('#table-scroll')).to_be_hidden()
    assert page.locator('#comparison-values tr').count() == 0
    log('Receipt HTTP 503 while model records load', 'Honest error, hidden table, actual native sheets ready')
    capture('measurements-unavailable-1280.png', 1280, 800)
    page.unroute(receipt_pattern)
    response = page.request.get(base + 'v2/research/tonal-next/results/comparison.json')
    assert response.ok, f'Final comparison receipt unavailable: {response.status}'
    receipt = response.json()
    evidence['receiptSHA256'] = sha(response.text())
    page.get_by_role('button', name='Reload measurements').click()
    expect(page.locator('#results-status')).to_have_text('Recorded measurements loaded.', timeout=30000)
    ready('srgb', receipt['selectedCandidate'])
    expect(page.locator('#selection-note')).to_contain_text(receipt['selectionNote'])
    if receipt['status'] == 'no-eligible-candidate':
        expect(page.locator('#selection-note')).to_contain_text('No eligible candidate.')
    assert page.locator('#comparison-values tr').count() == 7
    candidate_ids = [key[:-5] for key in receipt['models'] if key.endswith('-srgb') and key != 'beta1-srgb']
    assert set(page.locator('#candidate option').evaluate_all('(options)=>options.map(o=>o.value)')) == set(candidate_ids)
    log('Reload measurements after real receipt becomes available', 'Seven measured rows, exact selection note, receipt-derived candidate options')
    baseline = page.locator('#triangle-beta1').evaluate('(canvas)=>canvas.toDataURL()')
    for candidate in candidate_ids:
        page.get_by_label('Research candidate', exact=True).select_option(candidate)
        ready('srgb', candidate, 275)
        expect(page.locator('#candidate-id')).to_have_text(candidate)
        assert page.locator('#candidate-source').get_attribute('href').endswith('/trials/' + candidate + '.json')
        assert page.locator('#triangle-beta1').evaluate('(canvas)=>canvas.toDataURL()') == baseline
        expect(page.locator('#comparison-values tr').nth(0).locator('td').nth(1)).to_have_text(f"{receipt['models'][candidate+'-srgb']['retained_combvd']['weighted']:.6f}")
    log('Select every actual candidate', {'candidates': candidate_ids, 'baselineRasterUnchanged': True, 'weightedStressMatchesReceipt': True})
    page.get_by_label('Research candidate', exact=True).select_option(receipt['selectedCandidate'])
    ready('srgb', receipt['selectedCandidate'], 275)

    page.get_by_role('button', name='Set hue to 273 degrees', exact=True).click()
    ready(hue=273)
    expect(page.locator('#hue-number')).to_have_value('273')
    page.get_by_label('Hue in degrees', exact=True).fill('12.1')
    page.get_by_label('Hue in degrees', exact=True).press('Tab')
    ready(hue=12)
    expect(page.locator('#hue')).to_have_value('12')
    expect(page.locator('#hue-number')).to_have_value('12')
    pending = page.locator('#hue').evaluate("input => { input.value = '280'; input.dispatchEvent(new Event('input',{bubbles:true})); return {busy:document.querySelector('.sheets').getAttribute('aria-busy'),ready:document.querySelector('.sheets').dataset.ready,sample:document.querySelector('#hex-beta1').textContent}; }")
    assert pending == {'busy': 'true', 'ready': 'false', 'sample': 'Calculating…'}, pending
    ready(hue=280)
    page.get_by_role('button', name='Set hue to 275 degrees', exact=True).click()
    ready(hue=275)
    log('Hue shortcuts, number normalization and range input', 'Synchronized controls; pending is immediate during debounce; final H275 outputs ready')

    page.locator('#triangle-beta1').focus()
    before = float(page.locator('#reach').input_value())
    page.keyboard.press('ArrowLeft')
    expect(page.locator('#reach')).to_have_value(str(before - .005))
    page.keyboard.press('Shift+ArrowUp')
    assert abs(float(page.locator('#level').input_value()) - .30) < 1e-10
    page.locator('#reach').fill('0.95')
    page.locator('#reach').press('Tab')
    assert float(page.locator('#reach').input_value()) <= float(page.locator('#level').input_value())
    page.locator('#level').fill('-1')
    page.locator('#level').press('Tab')
    expect(page.locator('#reach')).to_have_value('0')
    expect(page.locator('#level')).to_have_value('0')
    canvas = page.locator('#triangle-candidate')
    box = canvas.bounding_box()
    canvas.click(position={'x': box['width'] * .25, 'y': box['height'] * .5})
    assert abs(float(page.locator('#reach').input_value()) - .25) < .01
    assert abs(float(page.locator('#level').input_value()) - .625) < .01
    page.locator('#level').fill('.25'); page.locator('#level').press('Tab')
    page.locator('#reach').fill('.24'); page.locator('#reach').press('Tab')
    ready()
    log('Triangle keyboard/pointer and coordinate inputs', 'Same R/L in both sheets; Shift step and 0<=R<=L<=1 constraints verified')

    page.get_by_label('Realization', exact=True).select_option('full')
    ready('full', receipt['selectedCandidate'], 275)
    expect(page.locator('#display-note')).to_contain_text('cannot show the complete gamut')
    expect(page.locator('#display-note')).to_contain_text('clipped to sRGB')
    full_unmasked = page.locator('#triangle-beta1').evaluate('(canvas)=>canvas.toDataURL()')
    assert full_unmasked != baseline
    page.get_by_label('Mark display clipping', exact=True).check()
    ready('full')
    full_masked = page.locator('#triangle-beta1').evaluate('(canvas)=>canvas.toDataURL()')
    assert full_masked != full_unmasked
    expect(page.locator('#clip-beta1')).to_contain_text('pink hatching')
    page.get_by_label('Neutral surround', exact=True).check()
    expect(page.locator('body')).to_have_class('neutral-surround')
    capture('full-masked-1280.png', 1280, 800)
    log('Full profile, mask and neutral surround', {'fullDiffersFromNative': True, 'maskChangesRaster': True, 'fullClippingLabel': True})
    page.get_by_label('Neutral surround', exact=True).uncheck()
    page.get_by_label('Mark display clipping', exact=True).uncheck()
    ready('full')
    page.get_by_label('Realization', exact=True).select_option('srgb')
    ready('srgb')
    assert page.locator('#triangle-beta1').evaluate('(canvas)=>canvas.toDataURL()') == baseline
    for width, height in [(1280, 800), (768, 1024), (375, 812)]:
        capture(f'native-{width}.png', width, height)
    log('Native captures at 1280,768,375', 'No document overflow; visible controls fit; screenshots saved for visual review')
    page.get_by_role('link', name='Return to Beta 1 picker', exact=True).click()
    expect(page).to_have_url(base + 'v2/beta1.html')
    expect(page.get_by_role('heading', name='HRL v2 Beta 1', exact=True)).to_be_visible()
    log('Return to Beta 1 picker', 'Existing frozen release route opens')
    assert not evidence['pageErrors'], evidence['pageErrors']
    evidence['chromium'] = browser.version
    evidence['pass'] = True
    (args.out / 'verification.json').write_text(json.dumps(evidence, indent=2) + '\n')
    browser.close()
print(json.dumps(evidence, indent=2))

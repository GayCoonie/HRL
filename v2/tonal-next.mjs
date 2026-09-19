import { createSpectralTonalHRL } from './research/boundary-tonal/index.mjs';
import { XYZ_TO_SRGB, mul3, encodeSRGB } from './lib/srgb-triangles.mjs';

const labels = { beta1: 'HRL v2 Beta 1', 'smooth-mild': 'Smooth mild', 'smooth-conditioned': 'Smooth conditioned' };
const safeCandidate = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value !== 'beta1';
const nameOf = id => labels[id] || id.replace(/-/g, ' ').replace(/^./, letter => letter.toUpperCase());
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const recordURL = id => new URL(id === 'beta1' ? './research/boundary-tonal/results/metric.json' : `./research/tonal-next/trials/${id}.json`, import.meta.url);

export function displayXYZ(xyz) {
  const linear = mul3(XYZ_TO_SRGB, xyz);
  if (!linear.every(Number.isFinite)) throw Error('The color model returned a nonfinite display value.');
  return {
    clipped: linear.some(value => value < -2e-9 || value > 1 + 2e-9),
    rgb: linear.map(value => Math.round(255 * encodeSRGB(clamp(value, 0, 1))))
  };
}

export function renderTriangle(model, H, mask = false) {
  const width = 241, height = 279, pixels = new Uint8ClampedArray(width * height * 4);
  let total = 0, clipped = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const R = x / (width - 1), L = 1 - y / (height - 1) + R / 2;
      if (R > L || L > 1) continue;
      const color = displayXYZ(model.toXYZ({ H, R, L }));
      total++;
      if (color.clipped) clipped++;
      const rgb = mask && color.clipped && (x + y) % 14 < 3
        ? color.rgb.map((value, channel) => Math.round(.35 * value + .65 * [248, 164, 212][channel]))
        : color.rgb;
      pixels.set([...rgb, 255], 4 * (y * width + x));
    }
  }
  return { width, height, pixels, total, clipped };
}

export function renderPath(model, H, near = false) {
  const width = 257, height = 24, pixels = new Uint8ClampedArray(width * height * 4);
  for (let x = 0; x < width; x++) {
    const L = x / (width - 1), R = (near ? .96 : 1) * L;
    const { rgb } = displayXYZ(model.toXYZ({ H, R, L }));
    for (let y = 0; y < height; y++) pixels.set([...rgb, 255], 4 * (y * width + x));
  }
  return { width, height, pixels };
}

// The page and its module worker share this file; only the worker evaluates sheets.
function startWorker() {
  const records = new Map(), models = new Map();
  async function loadModel(gamut, id) {
    if (!['srgb', 'full'].includes(gamut) || (id !== 'beta1' && !safeCandidate(id))) throw Error('Unknown comparison profile.');
    if (!records.has(id)) records.set(id, (async () => {
      const response = await fetch(recordURL(id), { cache: 'no-cache' });
      if (!response.ok) throw Error(`${nameOf(id)} record unavailable (HTTP ${response.status}).`);
      return response.json();
    })().catch(error => { records.delete(id); throw error; }));
    const key = `${gamut}:${id}`;
    if (!models.has(key)) models.set(key, (async () => createSpectralTonalHRL({
      gamut,
      checkpoint: id === 'beta1' ? 'metric' : id,
      record: await records.get(id)
    }))().catch(error => { models.delete(key); throw error; }));
    return models.get(key);
  }
  let pending = null, busy = false, newestSample = 0;
  async function renderPending() {
    if (busy) return;
    busy = true;
    while (pending) {
      const job = pending;
      pending = null;
      try {
        for (const slot of ['beta1', 'candidate']) {
          const model = await loadModel(job.gamut, slot === 'beta1' ? 'beta1' : job.candidate);
          if (pending) break;
          const triangle = renderTriangle(model, job.H, job.mask);
          const edge = renderPath(model, job.H), near = renderPath(model, job.H, true);
          self.postMessage({ type: 'sheet', request: job.request, slot, H: job.H, triangle, edge, near }, [triangle.pixels.buffer, edge.pixels.buffer, near.pixels.buffer]);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (!pending) self.postMessage({ type: 'rendered', request: job.request });
      } catch (error) {
        self.postMessage({ type: 'error', operation: 'render', request: job.request, message: error.message });
      }
    }
    busy = false;
  }
  async function sample(job) {
    newestSample = job.request;
    try {
      const colors = {};
      for (const slot of ['beta1', 'candidate']) {
        const model = await loadModel(job.gamut, slot === 'beta1' ? 'beta1' : job.candidate);
        if (job.request !== newestSample) return;
        const xyz = model.toXYZ(job.q);
        colors[slot] = { xyz, ...displayXYZ(xyz) };
      }
      if (job.request === newestSample) self.postMessage({ type: 'sampled', request: job.request, colors });
    } catch (error) {
      self.postMessage({ type: 'error', operation: 'sample', request: job.request, message: error.message });
    }
  }
  self.onmessage = ({ data }) => {
    if (data.type === 'render') { pending = data; renderPending(); }
    else if (data.type === 'sample') sample(data);
  };
}

function startPage() {
  const $ = id => document.getElementById(id);
  const state = { gamut: 'srgb', candidate: 'smooth-mild', H: 275, R: .24, L: .25, mask: false };
  let worker, renderRequest = 0, sampleRequest = 0, resultsRequest = 0, receipt = null, hueTimer, candidateTouched = false, engineFailure = null;
  const sheets = document.querySelector('.sheets');

  function paint(id, image) {
    const canvas = $(id);
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').putImageData(new ImageData(image.pixels, image.width, image.height), 0, 0);
  }
  function syncControls() {
    $('hue').value = state.H;
    $('hue-number').value = state.H;
    $('reach').value = state.R;
    $('level').value = state.L;
    $('profile').value = state.gamut;
    $('candidate').value = state.candidate;
    for (const button of $('quick-hues').children) button.setAttribute('aria-pressed', String(Number(button.dataset.hue) === state.H));
    for (const slot of ['beta1', 'candidate']) {
      $('cursor-' + slot).style.left = `${100 * state.R}%`;
      $('cursor-' + slot).style.top = `${100 * (1 - state.L + state.R / 2)}%`;
    }
    $('coordinate-reading').textContent = `H ${state.H.toFixed(2)}° · R ${state.R.toFixed(3)} · L ${state.L.toFixed(3)} · K ${(1 - state.L).toFixed(3)} · W ${(state.L - state.R).toFixed(3)}`;
  }
  function clearSamples() {
    for (const slot of ['beta1', 'candidate']) {
      $('hex-' + slot).textContent = 'Calculating…';
      $('xyz-' + slot).textContent = 'Relative D65 XYZ pending.';
      $('sample-clip-' + slot).textContent = '';
      $('swatch-' + slot).style.background = '';
      $('swatch-' + slot).setAttribute('aria-label', `${slot === 'beta1' ? 'Beta 1' : nameOf(state.candidate)} sample pending`);
    }
  }
  function sample() {
    if (engineFailure) { failure(engineFailure); return; }
    clearSamples();
    worker?.postMessage({ type: 'sample', request: ++sampleRequest, gamut: state.gamut, candidate: state.candidate, q: { H: state.H, R: state.R, L: state.L } });
  }
  function markPending() {
    sheets.setAttribute('aria-busy', 'true');
    sheets.dataset.ready = 'false';
    for (const slot of ['beta1', 'candidate']) {
      $('sheet-' + slot).classList.remove('ready');
      $('cursor-' + slot).hidden = true;
      $('sheet-hue-' + slot).textContent = `H ${state.H.toFixed(2)}°`;
      $('clip-' + slot).textContent = 'Rendering this hue sheet…';
    }
    $('render-status').textContent = 'Evaluating the same hue in both models…';
    $('render-status').classList.remove('error');
    $('retry-render').hidden = true;
  }
  function render() {
    clearTimeout(hueTimer);
    const candidateName = nameOf(state.candidate);
    $('candidate-title').textContent = candidateName;
    $('candidate-id').textContent = state.candidate;
    $('sample-candidate-title').textContent = candidateName;
    $('candidate-source').href = recordURL(state.candidate).href;
    $('display-note').classList.toggle('full', state.gamut === 'full');
    $('display-note').textContent = state.gamut === 'full'
      ? 'Full physical solid · this screen cannot show the complete gamut. Out-of-display colors are clipped to sRGB; XYZ readouts retain the model output. Mark display clipping to see affected pixels.'
      : 'Native sRGB colors are shown directly. All sheets use the same Hue, Reach and Level coordinates.';
    if (engineFailure) { syncControls(); failure(engineFailure); return; }
    markPending();
    syncControls();
    worker?.postMessage({ type: 'render', request: ++renderRequest, gamut: state.gamut, candidate: state.candidate, H: state.H, mask: state.mask });
    sample();
  }
  function failure(message) {
    clearTimeout(hueTimer);
    engineFailure = message;
    renderRequest++;
    sampleRequest++;
    clearSamples();
    for (const slot of ['beta1', 'candidate']) {
      $('hex-' + slot).textContent = 'Sample unavailable';
      $('xyz-' + slot).textContent = 'Retry the color models to calculate XYZ.';
      $('swatch-' + slot).setAttribute('aria-label', `${slot === 'beta1' ? 'Beta 1' : nameOf(state.candidate)} sample unavailable`);
      if (!$('sheet-' + slot).classList.contains('ready')) $('clip-' + slot).textContent = 'Hue sheet unavailable. Retry the color models.';
    }
    sheets.setAttribute('aria-busy', 'false');
    sheets.dataset.ready = 'false';
    $('render-status').textContent = `${message} Retry the color models to load the records again.`;
    $('render-status').classList.add('error');
    $('retry-render').hidden = false;
  }
  function startEngine() {
    worker?.terminate();
    engineFailure = null;
    try {
      worker = new Worker(new URL('./tonal-next.mjs', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.type === 'sheet' && data.request === renderRequest) {
          paint('triangle-' + data.slot, data.triangle);
          paint('edge-' + data.slot, data.edge);
          paint('near-' + data.slot, data.near);
          $('sheet-' + data.slot).classList.add('ready');
          $('cursor-' + data.slot).hidden = false;
          const percent = 100 * data.triangle.clipped / data.triangle.total;
          $('clip-' + data.slot).textContent = data.triangle.clipped
            ? `${percent.toFixed(1)}% of sampled triangle pixels need sRGB display clipping.${state.mask ? ' Marked with pink hatching.' : ''}`
            : 'All sampled triangle pixels are inside sRGB.';
        } else if (data.type === 'rendered' && data.request === renderRequest) {
          sheets.setAttribute('aria-busy', 'false');
          sheets.dataset.ready = 'true';
          sheets.dataset.profile = state.gamut;
          sheets.dataset.candidate = state.candidate;
          sheets.dataset.hue = state.H;
          $('render-status').textContent = `Ready · ${state.gamut === 'srgb' ? 'native sRGB' : 'full physical solid, display clipped'} · H ${state.H.toFixed(2)}°`;
        } else if (data.type === 'sampled' && data.request === sampleRequest) {
          for (const slot of ['beta1', 'candidate']) {
            const color = data.colors[slot];
            const hex = '#' + color.rgb.map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
            $('hex-' + slot).textContent = hex;
            $('xyz-' + slot).textContent = `XYZ ${color.xyz.map(value => value.toPrecision(7)).join(', ')}`;
            $('sample-clip-' + slot).textContent = color.clipped ? 'Preview display-clipped; XYZ unchanged.' : 'No display clipping.';
            $('swatch-' + slot).style.background = hex;
            $('swatch-' + slot).setAttribute('aria-label', `${slot === 'beta1' ? 'Beta 1' : nameOf(state.candidate)} sample ${hex}${color.clipped ? ', display clipped' : ''}`);
          }
        } else if (data.type === 'error') {
          if (data.operation === 'render' && data.request === renderRequest) failure(data.message);
          if (data.operation === 'sample' && data.request === sampleRequest) {
            for (const slot of ['beta1', 'candidate']) $('hex-' + slot).textContent = 'Sample unavailable';
            failure(data.message);
          }
        }
      };
      worker.onerror = () => failure('The color engine could not load.');
      worker.onmessageerror = () => failure('The color engine returned an unreadable response.');
      render();
    } catch { failure('The color engine could not start.'); }
  }
  function setHue(value, delay = false) {
    if (!Number.isFinite(value)) { syncControls(); return; }
    state.H = (Math.round((((value % 360) + 360) % 360) * 4) / 4) % 360;
    syncControls();
    clearTimeout(hueTimer);
    if (delay && !engineFailure) {
      // A slow older reply must never relabel old pixels with the new hue.
      renderRequest++;
      sampleRequest++;
      markPending();
      clearSamples();
      hueTimer = setTimeout(render, 100);
    }
    else render();
  }
  function setCoordinates(R, L) {
    if (Number.isFinite(R) && Number.isFinite(L)) {
      state.L = clamp(L, 0, 1);
      state.R = clamp(R, 0, state.L);
    }
    syncControls();
    sample();
  }

  const metricRows = [
    ['Retained COMBVD · weighted STRESS', 'retained_combvd', 'weighted'],
    ['Retained COMBVD · unweighted STRESS', 'retained_combvd', 'unweighted'],
    ['Blue-sheet error', 'tonal', 'blueSheetMean'],
    ['Black dilution · path CV', 'tonal', 'blackCV'],
    ['White dilution · path CV', 'tonal', 'whiteCV'],
    ['Neutral exchange · path CV', 'tonal', 'exchangeCV'],
    ['Reach · path CV', 'tonal', 'reachCV']
  ];
  function format(value, signed = false) {
    if (!Number.isFinite(value)) return '—';
    if (value === 0) return '0.000000';
    const result = Math.abs(value) < .000001 ? value.toExponential(3) : value.toFixed(6);
    return signed && value > 0 ? '+' + result : result;
  }
  function fillTable() {
    if (!receipt) return;
    const baseline = receipt.models[`beta1-${state.gamut}`], candidate = receipt.models[`${state.candidate}-${state.gamut}`];
    $('candidate-column').textContent = nameOf(state.candidate);
    $('table-caption').textContent = `${state.gamut === 'srgb' ? 'Native sRGB' : 'Full physical solid'} · Beta 1 → ${nameOf(state.candidate)}`;
    $('comparison-values').replaceChildren();
    for (const [label, group, key] of metricRows) {
      const a = baseline?.[group]?.[key], b = candidate?.[group]?.[key];
      const row = document.createElement('tr');
      for (const [index, value] of [label, format(a), format(b), format(Number.isFinite(a) && Number.isFinite(b) ? b - a : null, true)].entries()) {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.scope = 'row';
        cell.textContent = value;
        row.appendChild(cell);
      }
      $('comparison-values').appendChild(row);
    }
    const pairA = baseline?.retained_combvd?.pairs, pairB = candidate?.retained_combvd?.pairs;
    const pairs = [pairA, pairB].every(Number.isInteger) ? `Retained pairs: Beta 1 ${pairA.toLocaleString('en-US')}; candidate ${pairB.toLocaleString('en-US')}.` : 'Retained-pair counts are unavailable for this selection.';
    $('measurement-context').textContent = `${state.gamut === 'srgb' ? 'Native sRGB' : 'Full physical solid'} · ${pairs}${pairA !== pairB ? ' Pair support differs; STRESS changes are not a like-for-like comparison.' : ''}`;
    $('results-status').textContent = baseline && candidate ? 'Recorded measurements loaded.' : 'This receipt does not contain both selected model rows; unavailable values are shown as —.';
    $('results-status').classList.remove('error');
    $('selection-note').textContent = `${receipt.status === 'no-eligible-candidate' ? 'No eligible candidate. ' : `Recorded eligibility for ${nameOf(receipt.selectedCandidate)}. `}${receipt.selectionNote}`;
    $('selection-note').classList.toggle('rejected', receipt.status === 'no-eligible-candidate');
    $('selection-note').hidden = false;
    $('table-scroll').hidden = false;
    $('receipt-meta').textContent = `Receipt generated: ${receipt.generatedAt || 'time not supplied'}. These measurements describe the recorded fit, not the currently selected hue.`;
  }
  async function loadResults() {
    const request = ++resultsRequest;
    $('results-status').textContent = 'Loading recorded measurements…';
    $('results-status').classList.remove('error');
    $('retry-results').disabled = true;
    $('selection-note').hidden = true;
    $('table-scroll').hidden = true;
    $('receipt-meta').textContent = '';
    receipt = null;
    try {
      const response = await fetch(new URL('./research/tonal-next/results/comparison.json', import.meta.url), { cache: 'no-cache' });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.schemaVersion !== 1 || !result.models || typeof result.models !== 'object' || !['eligible', 'no-eligible-candidate'].includes(result.status) || typeof result.selectionNote !== 'string') throw Error('unrecognized comparison record');
      if (request !== resultsRequest) return;
      const candidates = [...new Set(Object.keys(result.models).filter(key => key.endsWith('-srgb')).map(key => key.slice(0, -5)).filter(safeCandidate))];
      if (!candidates.length) throw Error('no research candidates in the comparison record');
      const keepCandidate = candidates.includes(state.candidate);
      $('candidate').replaceChildren(...candidates.map(id => {
        const option = document.createElement('option'); option.value = id; option.textContent = nameOf(id); return option;
      }));
      const next = !candidateTouched && candidates.includes(result.selectedCandidate)
        ? result.selectedCandidate : keepCandidate ? state.candidate : candidates[0];
      const changed = next !== state.candidate;
      state.candidate = next;
      $('candidate').value = next;
      receipt = result;
      fillTable();
      if (changed) render();
    } catch (error) {
      if (request !== resultsRequest) return;
      $('results-status').textContent = `Comparison measurements unavailable (${error.message}). Reload measurements to try again. The color sheets can still use their actual model records.`;
      $('results-status').classList.add('error');
    } finally {
      if (request === resultsRequest) $('retry-results').disabled = false;
    }
  }

  for (const hue of [240, 255, 263, 269, 273, 275, 277, 281, 285, 293, 300]) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.hue = hue; button.textContent = `${hue}°`;
    button.setAttribute('aria-label', `Set hue to ${hue} degrees`);
    button.onclick = () => setHue(hue);
    $('quick-hues').appendChild(button);
  }
  $('hue').oninput = event => setHue(event.target.valueAsNumber, true);
  $('hue-number').onchange = event => setHue(event.target.valueAsNumber);
  $('profile').onchange = event => { state.gamut = event.target.value; render(); fillTable(); };
  $('candidate').onchange = event => { candidateTouched = true; state.candidate = event.target.value; render(); fillTable(); };
  $('clip-mask').onchange = event => { state.mask = event.target.checked; render(); };
  $('neutral-surround').onchange = event => document.body.classList.toggle('neutral-surround', event.target.checked);
  $('reach').onchange = () => setCoordinates($('reach').valueAsNumber, state.L);
  $('level').onchange = () => setCoordinates(state.R, $('level').valueAsNumber);
  $('retry-render').onclick = startEngine;
  $('retry-results').onclick = loadResults;
  for (const slot of ['beta1', 'candidate']) {
    const canvas = $('triangle-' + slot);
    function pick(event) {
      const rect = canvas.getBoundingClientRect();
      const R = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const L = 1 - (event.clientY - rect.top) / rect.height + R / 2;
      if (event.type === 'pointerdown' && (R > L || L > 1 || L < 0)) return false;
      setCoordinates(R, clamp(L, R, 1));
      return true;
    }
    canvas.onpointerdown = event => {
      if (event.button === 0 && $('sheet-' + slot).classList.contains('ready') && pick(event)) {
        canvas.focus(); canvas.setPointerCapture(event.pointerId);
      }
    };
    canvas.onpointermove = event => { if (canvas.hasPointerCapture(event.pointerId)) pick(event); };
    canvas.onpointerup = event => { if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); };
    canvas.onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const step = event.shiftKey ? .05 : .005;
      setCoordinates(state.R + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), state.L + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0));
    };
  }
  syncControls();
  startEngine();
  loadResults();
}

if (typeof document !== 'undefined') startPage();
else if (typeof self !== 'undefined') startWorker();

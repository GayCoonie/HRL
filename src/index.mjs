import {CompleteModel, Transport} from './model/r15.mjs';
import {Curve} from './model/r14.mjs';
import {CapModel} from './model/cap.mjs';
import {makeObserverRingAppearanceProjector} from './wide/appearance-observer-ring.mjs';
import {RGB_TO_XYZ, rgbToXYZ} from './base/appearance-runtime.mjs';
import {decodeChannel, encodeChannel} from './wide/triangle-map.mjs';

export const VERSION = 'R15-D Release 1';
export const GAMUTS = Object.freeze(['srgb', 'rec2020']);

const DATA_URLS = Object.freeze({
  config: ['./data/release-config.json.part00', './data/release-config.json.part01', './data/release-config.json.part02'],
  candidate: './data/r15-candidate.json',
  table: ['./data/algorithmic-table.json.part00', './data/algorithmic-table.json.part01', './data/algorithmic-table.json.part02', './data/algorithmic-table.json.part03', './data/algorithmic-table.json.part04', './data/algorithmic-table.json.part05'],
  algorithmic: './data/algorithmic-results.json',
  cap: './data/cap-results.json',
  calibration: './data/srgb-hue-calibration.json',
  wideHue: './data/wide-native-boundary-h.json'
});

async function readText(relative) {
  const url = new URL(relative, import.meta.url);
  if (url.protocol === 'file:') {
    const {readFile} = await import('node:fs/promises');
    return readFile(url, 'utf8');
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load HRL release data: ${url}`);
  return response.text();
}

async function readJSON(relative) {
  return JSON.parse(await readText(relative));
}

async function readParts(parts) {
  return JSON.parse((await Promise.all(parts.map(readText))).join(''));
}

let sharedData;
async function loadReleaseData() {
  if (!sharedData) {
    sharedData = Promise.all([
      readParts(DATA_URLS.config), readJSON(DATA_URLS.candidate), readParts(DATA_URLS.table),
      readJSON(DATA_URLS.algorithmic), readJSON(DATA_URLS.cap), readJSON(DATA_URLS.calibration),
      readJSON(DATA_URLS.wideHue)
    ]).then(values => {
      const [config, candidate, table, algorithmic, cap, calibration, wideHue] = values;
      const selected = candidate.models.observer15;
      return {
        config,
        curve: selected.curve,
        transport: selected.transport,
        table,
        algorithmic,
        cap: cap.candidates.D,
        calibration,
        wideHue: wideHue.H
      };
    }).catch(error => {
      sharedData = null;
      throw error;
    });
  }
  return sharedData;
}

function makeWideParent(data) {
  const base = makeObserverRingAppearanceProjector({
    gamut: 'rec2020',
    cal: data.calibration,
    wideH: data.wideHue,
    cacheLimit: 512,
    projectionCacheLimit: 512
  });
  const curve = new Curve(data.curve);
  const transport = new Transport(data.transport);
  const undoCurve = (R, L) => {
    const r = curve.inverse(R);
    const l = R === 1 ? 1 : R === 0 ? L : 1 - (1 - L) * (1 - r) / (1 - R);
    return [r, Math.max(r, Math.min(1, l))];
  };
  const applyCurve = (R, L) => {
    const r = curve.forward(R);
    const l = R === 1 ? 1 : R === 0 ? L : 1 - (1 - L) * (1 - r) / (1 - R);
    return [r, Math.max(r, Math.min(1, l))];
  };
  return {
    color(H, R, L) {
      const q = transport.inverse(H, R, L);
      const [r, l] = undoCurve(q[1], q[2]);
      return {encoded: base.mapper(q[0]).inverse(26 * r, 26 * l)};
    },
    project(rgb) {
      const p = base.project(rgb, {precise: true});
      const [r, l] = applyCurve(p.R / 26, p.L / 26);
      const q = transport.forward(p.H, r, l);
      return {H: q[0], R: q[1], L: q[2]};
    }
  };
}

function makeReleaseModel(gamut, data) {
  const parent = gamut === 'srgb'
    ? new CompleteModel(data.config, 'angle-interaction-0', data.curve, data.transport)
    : makeWideParent(data);
  return new CapModel(parent, data.table, data.algorithmic, data.cap);
}

function invert3(m) {
  const [[a,b,c],[d,e,f],[g,h,i]] = m;
  const det = a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
  return [
    [e*i-f*h, c*h-b*i, b*f-c*e],
    [f*g-d*i, a*i-c*g, c*d-a*f],
    [d*h-e*g, b*g-a*h, a*e-b*d]
  ].map(row => row.map(value => value / det));
}

function multiply(m, v) {
  return m.map(row => row[0]*v[0] + row[1]*v[1] + row[2]*v[2]);
}

function coordinates(value) {
  const q = Array.isArray(value) ? {H:value[0], R:value[1], L:value[2]} : value;
  if (!q || ![q.H,q.R,q.L].every(Number.isFinite) || q.R < 0 || q.R > q.L || q.L > 1) {
    throw new Error('HRL coordinates require finite H and 0 ≤ R ≤ L ≤ 1.');
  }
  return {H: ((q.H % 360) + 360) % 360, R:q.R, L:q.L};
}

function encodedRGB(value) {
  if (!Array.isArray(value) || value.length !== 3 || value.some(x => !Number.isFinite(x) || x < 0 || x > 1)) {
    throw new Error('RGB requires three finite encoded channels in the range 0..1.');
  }
  return value;
}

export class HRL {
  constructor(gamut, model) {
    this.gamut = gamut;
    this.version = VERSION;
    this.name = `HRL ${VERSION} · ${gamut === 'srgb' ? 'sRGB' : 'Rec.2020'}`;
    this._model = model;
    this._xyzToRGB = invert3(RGB_TO_XYZ[gamut]);
  }

  fromRGB(rgb) {
    const q = this._model.project(encodedRGB(rgb));
    return {H: ((q.H % 360) + 360) % 360, R:q.R, L:q.L};
  }

  toRGB(value) {
    const q = coordinates(value);
    return this._model.color(q.H, q.R, q.L).encoded;
  }

  fromXYZ(xyz) {
    if (!Array.isArray(xyz) || xyz.length !== 3 || xyz.some(x => !Number.isFinite(x))) {
      throw new Error('XYZ requires three finite components.');
    }
    const linear = multiply(this._xyzToRGB, xyz);
    if (linear.some(x => x < -2e-8 || x > 1 + 2e-8)) {
      throw new Error(`XYZ lies outside the ${this.gamut} gamut.`);
    }
    const rgb = linear.map(x => encodeChannel(Math.max(0, Math.min(1, x)), this.gamut));
    return this.fromRGB(rgb);
  }

  toXYZ(value) {
    return rgbToXYZ(this.toRGB(value), {gamut:this.gamut});
  }

  embed(value) {
    const {H,R,L} = coordinates(value);
    const angle = H * Math.PI / 180;
    const radius = Math.sqrt(3) / 2 * R;
    return [L - R / 2, radius * Math.cos(angle), radius * Math.sin(angle)];
  }

  distance(a, b) {
    const x = this.embed(a), y = this.embed(b);
    return Math.hypot(x[0]-y[0], x[1]-y[1], x[2]-y[2]);
  }

  distanceRGB(a, b) {
    return this.distance(this.fromRGB(a), this.fromRGB(b));
  }
}

export async function createHRL({gamut='srgb'}={}) {
  gamut = gamut.toLowerCase().replace(/[.\s-]/g, '');
  if (gamut === 'rec2020' || gamut === 'bt2020') gamut = 'rec2020';
  else if (gamut === 'srgb') gamut = 'srgb';
  else throw new Error(`Unsupported HRL gamut: ${gamut}`);
  const data = await loadReleaseData();
  return new HRL(gamut, makeReleaseModel(gamut, data));
}

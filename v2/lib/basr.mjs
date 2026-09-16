/** Black-Anchored Semantic Remap (BASR), HRL v2 prototype 0.4.
 * A reversible coordinate layer, not a refit of the observer hue field.
 * Public R remains the triangular Reach coordinate. u=R/L is internal only.
 */
export const BASR_VERSION = '0.4.0';
export const BASR_NAME = 'Black-Anchored Semantic Remap';
function basrUnit(x, name) {
  if (!Number.isFinite(x) || x < 0 || x > 1) throw new RangeError(`${name} must be finite and in [0,1]`);
  return x;
}
function basrCoordinates(q) {
  if (!q || !Number.isFinite(q.H)) throw new TypeError('H must be finite');
  basrUnit(q.R, 'R'); basrUnit(q.L, 'L');
  if (q.R > q.L) throw new RangeError('Require 0 <= R <= L <= 1');
  return q;
}
/** Normalized inverse CIE L*: Q(0)=0, Q(1)=1. No gamut or hue dependence. */
export function levelToNonblack(L) {
  basrUnit(L, 'L');
  if (L === 0 || L === 1) return L;
  return L <= 0.08 ? 2700 * L / 24389 : ((25 * L + 4) / 29) ** 3;
}
/** Exact analytic inverse of levelToNonblack, with endpoint guards. */
export function nonblackToLevel(a) {
  basrUnit(a, 'nonblack amount');
  if (a === 0 || a === 1) return a;
  return a <= 216 / 24389 ? 24389 * a / 2700 : (29 * Math.cbrt(a) - 4) / 25;
}
export function toBaseCoordinates(q) {
  basrCoordinates(q);
  if (q.L === 0) return {...q, R:0, L:0};
  const a = levelToNonblack(q.L);
  return {...q, R:a * (q.R / q.L), L:a};
}
export function fromBaseCoordinates(q) {
  basrCoordinates(q);
  if (q.L === 0) return {...q, R:0, L:0};
  const L = nonblackToLevel(q.L);
  return {...q, R:L * (q.R / q.L), L};
}
/** Barycentric amounts in the base gamut chart, not fixed XYZ primaries. */
export function basrShares(q) {
  basrCoordinates(q);
  const a = levelToNonblack(q.L), u = q.L === 0 ? 0 : q.R / q.L;
  return {black:1-a, white:a*(1-u), vivid:a*u, nonblack:a, vividFraction:u};
}
/** Wrap an existing native/full triangle without changing hue or its domain. */
export class BASRModel {
  constructor(base) {
    if (!base || typeof base.toXYZ !== 'function' || typeof base.fromXYZ !== 'function') {
      throw new TypeError('BASR requires a triangle model with toXYZ/fromXYZ');
    }
    this.base = base; this.field = base.field; this.ring = base.ring;
    this.version = BASR_VERSION; this.name = BASR_NAME;
    this.gamut = base.gamut || 'srgb'; this.variant = 'basr';
  }
  labelForHue(H) { return this.base.labelForHue(H); }
  hueForLabel(label) { return this.base.hueForLabel(label); }
  toXYZ(q) { return this.base.toXYZ(toBaseCoordinates(q)); }
  fromXYZ(xyz, neutralHue=0) { return fromBaseCoordinates(this.base.fromXYZ(xyz, neutralHue)); }
  toRGB(q) {
    if (!this.base.toRGB) throw new TypeError('Full-domain colors have no implicit sRGB output; use toXYZ or toPseudoRGB');
    return this.base.toRGB(toBaseCoordinates(q));
  }
  fromRGB(rgb, neutralHue=0) {
    if (!this.base.fromRGB) throw new TypeError('Use fromXYZ or fromPseudoRGB on the full-domain model');
    return fromBaseCoordinates(this.base.fromRGB(rgb, neutralHue));
  }
  toLinear(q) {
    if (!this.base.toLinear) throw new TypeError('toLinear is available on the native-sRGB profile only');
    return this.base.toLinear(toBaseCoordinates(q));
  }
  fromLinear(rgb, neutralHue=0) {
    if (!this.base.fromLinear) throw new TypeError('fromLinear is available on the native-sRGB profile only');
    return fromBaseCoordinates(this.base.fromLinear(rgb, neutralHue));
  }
  toPseudoRGB(q) {
    if (!this.base.toPseudoRGB) throw new TypeError('toPseudoRGB is available on the full-domain profile only');
    return this.base.toPseudoRGB(toBaseCoordinates(q));
  }
  fromPseudoRGB(rgb, neutralHue=0) {
    if (!this.base.fromPseudoRGB) throw new TypeError('fromPseudoRGB is available on the full-domain profile only');
    return fromBaseCoordinates(this.base.fromPseudoRGB(rgb, neutralHue));
  }
  linearLabel(label,R,L) {
    const b=toBaseCoordinates({H:label,R,L}); return this.base.linearLabel(label,b.R,b.L);
  }
  sampleLabel(label,R,L) {
    const b=toBaseCoordinates({H:label,R,L}); return this.base.sampleLabel(label,b.R,b.L);
  }
  vivid(H) { return this.toXYZ({H,R:1,L:1}); }
  fullVivid(H) { return this.base.fullVivid(H); }
  arms(H,t) {
    basrUnit(t,'t');
    return {blackward:this.toXYZ({H,R:t,L:t}),whiteward:this.toXYZ({H,R:t,L:1}),neutral:this.toXYZ({H,R:0,L:t})};
  }
  sheet(H) { this.labelForHue(H); return (R,L)=>this.toXYZ({H,R,L}); }
  shares(q) { return basrShares(q); }
  // Metric coordinates stay in the PUBLIC, regular bicone, not its base chart.
  embed(q) { basrCoordinates(q); return this.field.embed(q.H,q.R,q.L); }
  distance(a,b) { const x=this.embed(a),y=this.embed(b);return Math.hypot(...x.map((v,i)=>v-y[i])); }
  distanceRGB(a,b) { return this.distance(this.fromRGB(a),this.fromRGB(b)); }
}

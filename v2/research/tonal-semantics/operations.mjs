/** Proposed HRL tonal-operation contract, not a pigment or radiometric mixing model.
 * The meanings R=chromaticness, K=1-L, W=L-R are unchanged.
 * An amount is a fraction of the resulting appearance mixture, not a mass of paint.
 */
export function validate(q) {
  if (!q || ![q.H,q.R,q.L].every(Number.isFinite) || q.R<0 || q.L>1 || q.R>q.L)
    throw new RangeError('Require finite H and 0 <= R <= L <= 1.');
  return q;
}
function fraction(a) {
  if (!Number.isFinite(a) || a<0 || a>1) throw new RangeError('Amount must be in [0,1].');
  return a;
}
export function shares(q) {
  validate(q);return {H:q.H,R:q.R,W:q.L-q.R,K:1-q.L};
}
/** Replace fraction a of the appearance mixture with black. R:W is preserved. */
export function addBlack(q,a) {
  validate(q);fraction(a);const s=1-a;return {H:q.H,R:s*q.R,L:s*q.L};
}
/** Replace fraction a with white. R:K is preserved. This is not fixed-Reach Level. */
export function addWhite(q,a) {
  validate(q);fraction(a);const s=1-a;return {H:q.H,R:s*q.R,L:a+s*q.L};
}
/** Transfer an absolute share from black to white, keeping chromaticness fixed. */
export function exchangeNeutral(q,delta) {
  validate(q);
  if (!Number.isFinite(delta) || delta<q.R-q.L || delta>1-q.L)
    throw new RangeError('Neutral exchange exceeds the available black or white share.');
  return {H:q.H,R:q.R,L:q.L+delta};
}
/** Consecutive additions of the same endpoint have this combined amount. */
export function composeAmounts(a,b) {fraction(a);fraction(b);return 1-(1-a)*(1-b);}
/** Distances in HRL's actual regular equilateral hue triangle, not public L itself. */
export function cornerDistances(q) {
  validate(q);const z=q.L-q.R/2,c=Math.sqrt(3)*q.R/2;
  return {black:Math.hypot(z,c),white:Math.hypot(1-z,c)};
}
/** Exact Step 6 of ZCAM 2021, equations 17-19, on ZCAM Jz,Cz units.
 * These are empirical appearance correlates, NOT HRL barycentric shares.
 */
export function zcamAttributes(Jz,Cz) {
  if (![Jz,Cz].every(Number.isFinite) || Jz<0 || Cz<0)
    throw new RangeError('Nonnegative finite ZCAM Jz and Cz required.');
  return {Vz:Math.hypot(Jz-58,Math.sqrt(3.4)*Cz),
    Kz:100-.8*Math.hypot(Jz,Math.sqrt(8)*Cz),
    Wz:100-Math.hypot(100-Jz,Cz)};
}
/** Neutral-normalized conceptual two-distance construction, for analysis only. */
export function conceptualShares(j,c) {
  if (![j,c].every(Number.isFinite)||j<0||j>1||c<0)throw new RangeError('Require 0 <= j <= 1, c >= 0.');
  const dB=Math.hypot(j,c),dW=Math.hypot(1-j,c);
  return {K:1-dB,W:1-dW,R:dB+dW-1};
}

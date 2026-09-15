// R1 observer calibration. The native bicone metric and hue labels are unchanged.
// Five fitted parameters, two triangular stages, analytic inverse. Public M=175.75;
// the existing appearance engine uses M=26. Always pass the appropriate scale.
export const PARAMETERS=Object.freeze({logs0:0.4208462720654527,a:-0.812168212977649,b:0.6862251276659913,k:-1.278355442139602,k2:-0.6027969763944833});
export const EDGE_LAMBDA=0.6487212707001282; // expm1(0.5), fixed visual edge correction.
export const FITS=Object.freeze({original:'Original appearance fit',observer1:'Observer retune · R1',observer2:'Edge-balanced retune · R2',observer3:'Joint hue & R/L retune · R3',observer4:'Appearance phenomena retune · R4',observer5:'Tonal progression retune · R5',observer6:'Native bicone retune · R6',observer7:'Hue-dependent R/L · R7',observer8:'Observer ring + appearance · R8'});
const clamp=x=>Math.max(0,Math.min(1,x));
function check(R,L,M){if(![R,L,M].every(Number.isFinite)||M<=0||R<0||R>L||L>M)throw Error('Invalid HRL triangle coordinates.');}
const odds=(t,g)=>t===0||t===1?t:t/(t+Math.exp(-g)*(1-t));
const scale=t=>{const z=2*t-1,p=PARAMETERS;return Math.exp(p.logs0+p.a*z+p.b*z*z)};
const gate=c=>PARAMETERS.k*c+PARAMETERS.k2*c*c;
export function retune(R,L,M=26){
 check(R,L,M);if(R===0||R===M)return {R,L};
 const c=R/M,t=clamp((L-R)/(M-R)),q=odds(t,gate(c)),s=scale(q),d=c+s*(1-c),v=c/d;
 const r=M*v,l=R===L?r:L===M?M:r+M*(s*(1-c)/d)*q;
 return {R:r,L:Math.max(r,Math.min(M,l))};
}
export function unretune(R,L,M=26){
 check(R,L,M);if(R===0||R===M)return {R,L};
 const v=R/M,q=clamp((L-R)/(M-R)),s=scale(q),d=1-v+s*v,c=s*v/d,t=odds(q,-gate(c));
 const r=M*c,l=R===L?r:L===M?M:r+M*((1-v)/d)*t;
 return {R:r,L:Math.max(r,Math.min(M,l))};
}
// R2 follows R1 with a common R/L shift. Whiteness is preserved; the gray and
// full-Level edges are fixed point for point. Explicit boundary returns avoid
// floating-point drift in protected colors. The rational inverse has no singularities.
export function spreadEdge(R,L,M=26){
 check(R,L,M);if(R===0||L===M)return {R,L};
 const d=EDGE_LAMBDA*R*(M-L)/(M+EDGE_LAMBDA*R),r=R+d;
 return {R:r,L:R===L?r:Math.max(r,Math.min(M,L+d))};
}
export function unspreadEdge(R,L,M=26){
 check(R,L,M);if(R===0||L===M)return {R,L};
 const r=R/(1+EDGE_LAMBDA*(1-L/M));
 return {R:r,L:R===L?r:Math.max(r,Math.min(M,(L-R)+r))};
}
export function retune2(R,L,M=26){const p=retune(R,L,M);return spreadEdge(p.R,p.L,M)}
export function unretune2(R,L,M=26){const p=unspreadEdge(R,L,M);return unretune(p.R,p.L,M)}
const calibration=fit=>{if(fit==='observer1')return [retune,unretune];if(fit==='observer2')return [retune2,unretune2];throw Error('Unknown HRL calibration.')};
export function retuneRecord(p,fit='original',M=26){
 if(fit==='original')return p;
 const {R,L}=calibration(fit)[0](p.R,p.L,M);return {...p,R,L,c:R/M,w:(L-R)/M,b:1-L/M,fit};
}
export function retuneMapper(mapper,fit='original'){
 if(fit==='original')return mapper;const inverse=calibration(fit)[1];
 return {...mapper,fit,forward:rgb=>retuneRecord(mapper.forward(rgb),fit),inverse:(R,L)=>{const p=inverse(R,L);return mapper.inverse(p.R,p.L)}};
}
export const fitCode=(text,fit)=>fit==='observer8'?'r8/'+text:fit==='observer7'?'r7/'+text:fit==='observer6'?'r6/'+text:fit==='observer5'?'r5/'+text:fit==='observer4'?'r4/'+text:fit==='observer3'?'r3/'+text:fit==='observer2'?'r2/'+text:fit==='observer1'?'r1/'+text:text;
// Explicit old profile tags retain their old meaning. Bare input follows the active fit.
export function parseFitCode(text,current='observer6'){
 if(/^r8\//i.test(text))return {text:text.slice(3),fit:'observer8'};
 if(/^r7\//i.test(text))return {text:text.slice(3),fit:'observer7'};
 if(/^r6\//i.test(text))return {text:text.slice(3),fit:'observer6'};
 if(/^r5\//i.test(text))return {text:text.slice(3),fit:'observer5'};
 if(/^r4\//i.test(text))return {text:text.slice(3),fit:'observer4'};
 if(/^r3\//i.test(text))return {text:text.slice(3),fit:'observer3'};
 if(/^r2\//i.test(text))return {text:text.slice(3),fit:'observer2'};
 if(/^r1\//i.test(text))return {text:text.slice(3),fit:'observer1'};
 if(/^(?:srgb(?:-fit|-band)?|rec2020)\/(?:@|\^|h(?:rl|cv|dl|st))|^hrl-(?:t1|s2)\(/i.test(text))return {text,fit:'original'};
 return {text,fit:current};
}

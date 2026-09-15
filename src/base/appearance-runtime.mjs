/**
 * Analytic full-colour forward coordinates for the HRL three-ruler experiment.
 * Input XYZ is D65, CIE 1931 2°, Y_white=1. Jzazbz alone converts to 300 cd/m².
 * sUCS uses the published radial compression for distance coordinates, reconstructed from intermediate colour.XYZ_to_sUCS Iab.
 * GenSpace is a forward port of helmlab 1.0.0 with neutral correction disabled.
 * This module has no fetch, DOM, Node or lookup-table dependency.
 */
import {GEN_PARAMETERS} from './gen-parameters.mjs';
export {GEN_PARAMETERS};

export const D65 = Object.freeze([.3127/.329, 1, (1-.3127-.329)/.329]);
export const PERIMETERS = Object.freeze({sucs:365.11330329256805, gen:2.925174676458035, jzazbz:1.0937252975792795});
export const METADATA = Object.freeze({
  id:'hrl-primary-9d-v1', white:'D65', observer:'CIE 1931 2°', xyzWhiteY:1,
  jzWhiteNits:300, blackNits:0, coordinates:['sUCS I','sUCS compressed a','sUCS compressed b','Gen L','Gen a','Gen b','Jz','az','bz'],
  distance:'Euclidean 9D after dividing each three-coordinate block by its fixed vivid-sRGB-boundary perimeter; equal block contributions; no square-root-of-three factor.',
  sucs:'Li & Luo sUCS distance coordinates: colour-science 0.4.7 intermediate Iab and published radial log1p(0.0447*C)/0.0252 compression',
  gen:'helmlab 1.0.0 GenSpace default parameters; neutral_correction=False',
  jzazbz:'Safdar et al. 2017 Jzazbz, absolute D65 XYZ at 300 cd/m² white',
  perimeters:PERIMETERS,
});
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const signedPow=(x,p)=>Math.sign(x)*Math.abs(x)**p;
const multiply=(m,v)=>m.map(r=>r[0]*v[0]+r[1]*v[1]+r[2]*v[2]);
function triple(v,name='XYZ') {
  if(!v || v.length!==3 || !Array.from(v).every(Number.isFinite)) throw new TypeError(name+' must contain three finite numbers.');
  return v;
}
export const RGB_TO_XYZ=Object.freeze({
  srgb:[[506752/1228815,87881/245763,12673/70218],[87098/409605,175762/245763,12673/175545],[7918/409605,87881/737289,1001167/1053270]],
  'display-p3':[[608311/1250200,189793/714400,198249/1000160],[35783/156275,247089/357200,198249/2500400],[0,32229/714400,5220557/5000800]],
  rec2020:[[63426534/99577255,20160776/139408157,47086771/278816314],[26158966/99577255,472592308/697040785,8267143/139408157],[0,19567812/697040785,295819943/278816314]],
});
export function decodeSRGB(v) {
  return Math.abs(v)<=.04045?v/12.92:Math.sign(v)*((Math.abs(v)+.055)/1.055)**2.4;
}
export function decodeRec2020(v) {
  const a=1.09929682680944,b=.018053968510807;
  return Math.abs(v)<b*4.5?v/4.5:Math.sign(v)*((Math.abs(v)+a-1)/a)**(1/.45);
}
/** RGB numbers are fractions, not 8-bit integers. No gamut clipping is applied. */
export function rgbToXYZ(rgb,{gamut='srgb',transfer=gamut==='rec2020'?'rec2020':'srgb'}={}) {
  triple(rgb,'RGB');
  const matrix=RGB_TO_XYZ[gamut];
  if(!matrix) throw new RangeError('Unknown RGB gamut: '+gamut);
  const decode=transfer==='linear'?x=>x:transfer==='srgb'?decodeSRGB:transfer==='rec2020'?decodeRec2020:null;
  if(!decode) throw new RangeError('Unknown transfer function: '+transfer);
  return multiply(matrix,Array.from(rgb,decode));
}
export const srgbToXYZ=rgb=>rgbToXYZ(rgb);
export const linearRec2020ToXYZ=rgb=>rgbToXYZ(rgb,{gamut:'rec2020',transfer:'linear'});

export function sucsFromXYZ(xyz) {
  triple(xyz);
  const lms=multiply([[.4002,.7075,-.0807],[-.228,1.15,.0612],[0,0,.9184]],xyz).map(v=>signedPow(v,.43));
  const [I,a,b]=multiply([[200/3.05,100/3.05,5/3.05],[430,-470,40],[49,49,-98]],lms);
  const c=Math.sqrt(a*a+b*b),factor=c>1e-12?Math.log1p(.0447*c)/(.0252*c):1;
  return [I,a*factor,b*factor];
}

/** General forward GenParams implementation, including the current depcubic path. */
export function createGenSpace(params=GEN_PARAMETERS) {
  const p={gamma:[1/3,1/3,1/3],transfer:'cbrt',softcbrt_eps:.001,depcubic_alpha:.020,
    L_corr_pw:[],L_corr_pw_step:.05,L_corr_p1:0,L_corr_p2:0,L_corr_p3:0,
    hue_cos1:0,hue_sin1:0,hue_cos2:0,hue_sin2:0,hue_cos3:0,hue_sin3:0,hue_cos4:0,hue_sin4:0,
    hue_L_amp:0,hue_L_center:0,hue_L_width:1,hue_L_knee:1,
    lp_dark:0,lp_dark_hcos:0,lp_dark_hsin:0,lc1:0,lc2:0,chroma_power:1,...params};
  if(params.hue_correction) [p.hue_cos1,p.hue_sin1,p.hue_cos2,p.hue_sin2]=[...params.hue_correction,0,0,0,0];
  const pwIn=Array.from({length:p.L_corr_pw.length+2},(_,i)=>i*p.L_corr_pw_step);pwIn[pwIn.length-1]=1;
  const shifts=[0,...p.L_corr_pw,0],pwOut=pwIn.map((v,i)=>v+shifts[i]);
  const hueCorrection=[1,2,3,4].some(n=>p['hue_cos'+n]||p['hue_sin'+n]);
  const enr={amp:0,center_deg:240,sigma:.7,L_lo:.37,L_hi:1,...p.enrichment};
  const epsRoot=p.softcbrt_eps**(1/3),s=Math.sqrt(p.depcubic_alpha/3);
  const transfer=(x,i)=>{
    if(p.transfer==='softcbrt') return (x+p.softcbrt_eps)**(1/3)-epsRoot;
    if(p.transfer==='depcubic') {
      let y=2*s*Math.sinh(Math.asinh(x/(2*s**3))/3);
      const f=y**3+p.depcubic_alpha*y-x,fp=3*y*y+p.depcubic_alpha,fpp=6*y,denom=2*fp*fp-f*fpp;
      if(Math.abs(denom)>1e-30)y-=2*f*fp/denom;
      return y;
    }
    return x**p.gamma[i];
  };
  return function genFromXYZ(xyz) {
    triple(xyz);
    let lms=multiply(p.M1,xyz).map((v,i)=>transfer(Math.max(v,0),i));
    if(p.transfer==='depcubic') {
      const mean=(lms[0]+lms[1]+lms[2])/3;
      const spread=(Math.max(...lms)-Math.min(...lms))/Math.max(Math.abs(mean),1e-30);
      const w=Math.exp(-((spread/1e-5)**2));
      lms=lms.map(v=>v+w*(mean-v));
    }
    let [L,a,b]=multiply(p.M2,lms);
    if(p.hue_L_amp) {
      const c=Math.sqrt(a*a+b*b),h=Math.atan2(b,a),d=Math.atan2(Math.sin(h-p.hue_L_center),Math.cos(h-p.hue_L_center));
      L-=p.hue_L_amp*Math.exp(-((d/p.hue_L_width)**2))*c/(c+.01)*Math.max(0,L-p.hue_L_knee);
    }
    if(hueCorrection) {
      let h=Math.atan2(b,a),delta=0;const c=Math.sqrt(a*a+b*b);
      for(let n=1;n<=4;n++)delta+=p['hue_cos'+n]*Math.cos(n*h)+p['hue_sin'+n]*Math.sin(n*h);
      h+=delta;a=c*Math.cos(h);b=c*Math.sin(h);
    }
    if(p.L_corr_pw.length) {
      if(L>=0&&L<=1) {
        let i=0;while(i<pwIn.length-2&&L>=pwIn[i+1])i++;
        const t=clamp((L-pwIn[i])/Math.max(pwIn[i+1]-pwIn[i],1e-30),0,1);
        L=pwOut[i]+t*(pwOut[i+1]-pwOut[i]);
      }
    } else if(p.L_corr_p1||p.L_corr_p2||p.L_corr_p3) {
      const t=L*(1-L);L+=p.L_corr_p1*t+p.L_corr_p2*t*(.5-L)+p.L_corr_p3*t*t;
    }
    if(enr.type==='L_gated_hue'&&Math.abs(enr.amp)>1e-10) {
      const c=Math.sqrt(a*a+b*b);
      if(c>=1e-12) {
        const h=Math.atan2(b,a),t=clamp((L-enr.L_lo)/(enr.L_hi-enr.L_lo),0,1);
        const d=((h-enr.center_deg*Math.PI/180+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
        const hn=h+enr.amp*Math.sin(Math.PI*t)**2*Math.exp(-.5*(d/enr.sigma)**2);
        a=c*Math.cos(hn);b=c*Math.sin(hn);
      }
    }
    if(p.lp_dark||p.lp_dark_hcos||p.lp_dark_hsin) {
      const h=Math.atan2(b,a),coeff=p.lp_dark+p.lp_dark_hcos*Math.cos(h)+p.lp_dark_hsin*Math.sin(h);
      L*=Math.exp(clamp(coeff*L*(1-L)**2,-30,30));
    }
    if(p.lc1||p.lc2) {
      const d=L-.5,t=Math.exp(clamp(p.lc1*d+p.lc2*d*d,-30,30));a*=t;b*=t;
    }
    if(p.chroma_power!==1) {
      const scale=Math.sqrt(a*a+b*b+1e-30)**(p.chroma_power-1);a*=scale;b*=scale;
    }
    return [L,a,b];
  };
}
export const genFromXYZ=createGenSpace();

/** xyz is relative D65 XYZ; fixed 300 cd/m² reference white. */
export function jzazbzFromXYZ(xyz) {
  triple(xyz);
  const [x,y,z]=Array.from(xyz,v=>300*v);
  const lms=multiply([[.41478972,.579999,.014648],[-.20151,1.120649,.0531008],[-.0166008,.2648,.6684799]],[1.15*x-.15*z,.66*y+.34*x,z]);
  const [l,m,s]=lms.map(v=>{
    if(v< -1e-12)throw new RangeError('Negative cone response outside the Jzazbz domain.');
    const p=(Math.max(0,v)/10000)**(2610/16384);
    return ((3424/4096+(2413/128)*p)/(1+(2392/128)*p))**(1.7*2523/32);
  });
  const i=(l+m)/2;
  return [.44*i/(1-.56*i)-1.6295499532821566e-11,3.524*l-4.066708*m+.542708*s,.199076*l+1.096799*m-1.295875*s];
}

export function coordinatesFromXYZ(xyz) {
  return [...sucsFromXYZ(xyz).map(x=>x/PERIMETERS.sucs),...genFromXYZ(xyz).map(x=>x/PERIMETERS.gen),...jzazbzFromXYZ(xyz).map(x=>x/PERIMETERS.jzazbz)];
}
export const coordinatesFromRGB=(rgb,options)=>coordinatesFromXYZ(rgbToXYZ(rgb,options));
export const coordinatesFromSRGB=rgb=>coordinatesFromRGB(rgb);
export function coordinateDistance(a,b) {
  if(!a||!b||a.length!==9||b.length!==9)throw new TypeError('Expected two normalized nine-coordinate vectors.');
  return Math.hypot(...Array.from(a,(v,i)=>v-b[i]));
}
export const distanceXYZ=(a,b)=>coordinateDistance(coordinatesFromXYZ(a),coordinatesFromXYZ(b));
export const distanceRGB=(a,b,options)=>coordinateDistance(coordinatesFromRGB(a,options),coordinatesFromRGB(b,options));
export const distanceSRGB=(a,b)=>distanceRGB(a,b);

/** Independent Hellwig 2022 lightness diagnostic; it is NOT a tenth primary coordinate. */
export function createHellwigLightness({adaptingLuminance=4.074366543152521,backgroundY=20,surround='average',discountIlluminant=false}={}) {
  const surrounds={average:[1,.69,1],dim:[.9,.59,.9],dark:[.8,.525,.8]};
  if(!(adaptingLuminance>0)||!(backgroundY>0)||!surrounds[surround])throw new RangeError('Invalid Hellwig viewing conditions.');
  const [F,c,Nc]=surrounds[surround],la=adaptingLuminance;
  const m16=[[.401288,.650173,-.051461],[-.250268,1.204414,.045854],[-.002079,.048952,.953127]];
  const white=multiply(m16,D65.map(v=>100*v));
  const D=discountIlluminant?1:clamp(F*(1-Math.exp((-la-42)/92)/3.6),0,1);
  const adaptation=white.map(v=>D*100/v+1-D),k=1/(5*la+1),k4=k**4;
  const FL=.2*k4*5*la+.1*(1-k4)**2*Math.cbrt(5*la),z=1.48+Math.sqrt(backgroundY/100);
  const compress=v=>{const q=(FL*Math.abs(v)/100)**.42;return 400*Math.sign(v)*q/(27.13+q)+.1;};
  const ach=v=>2*v[0]+v[1]+.05*v[2]-.305;
  const Aw=ach(white.map((v,i)=>compress(v*adaptation[i])));
  return function hellwigLightnessFromXYZ(xyz) {
    triple(xyz);
    const q=multiply(m16,Array.from(xyz,v=>100*v)).map((v,i)=>compress(v*adaptation[i]));
    const a=q[0]-12*q[1]/11+q[2]/11,b=(q[0]+q[1]-2*q[2])/9;
    const h=Math.atan2(b,a),J=100*signedPow(ach(q)/Aw,c*z);
    const et=1-.0582*Math.cos(h)-.0258*Math.cos(2*h)-.1347*Math.cos(3*h)+.0289*Math.cos(4*h)-.1475*Math.sin(h)-.0308*Math.sin(2*h)+.0385*Math.sin(3*h)+.0096*Math.sin(4*h);
    const M=43*Nc*et*Math.hypot(a,b),C=35*M/Aw;
    const f=.792-.160*Math.cos(h)+.132*Math.cos(2*h)-.405*Math.sin(h)+.080*Math.sin(2*h);
    const J_HK=J+f*signedPow(C,.587);
    return {J,J_HK,h:((h*180/Math.PI)%360+360)%360,C,M,Q:2/c*(J/100)*Aw,Q_HK:2/c*(J_HK/100)*Aw};
  };
}
export const hellwigLightnessFromXYZ=createHellwigLightness();

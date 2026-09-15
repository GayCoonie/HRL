// Research reference. Published ZCAM 2021 equations plus explicit HRL neutral-axis correction.
// Sources: https://colour.readthedocs.io/en/latest/_modules/colour/appearance/zcam.html
// https://colour.readthedocs.io/en/latest/_modules/colour/models/jzazbz.html
const N=2610/16384, P=1.7*2523/32, C1=3424/4096, C2=2413/128, C3=2392/128, D0=3.7035226210190005e-11;
const D65=[.9504559270516716,1,1.0890577507598784];
function lms([x,y,z]) {const xp=1.15*x-.15*z,yp=.66*y+.34*x;return [.41478972*xp+.579999*yp+.014648*z,-.20151*xp+1.120649*yp+.0531008*z,-.0166008*xp+.2648*yp+.6684799*z];}
function pq(x) {const u=Math.pow(Math.max(0,x)/10000,N);return Math.pow((C1+C2*u)/(1+C3*u),P);}
function pqInverse(x) {const u=Math.pow(Math.max(0,x),1/P);return 10000*Math.pow(Math.max(0,u-C1)/(C2-C3*u),1/N);}
function opponents(p) {return [3.524*p[0]-4.066708*p[1]+.542708*p[2],.199076*p[0]+1.096799*p[1]-1.295875*p[2]];}
export function makeNeutralZcam({whiteNits=300,backgroundFraction=.2,adaptingNits=60,surround=.69}={}) {
 const white=D65.map(x=>x*whiteNits),lw=lms(white),iw=pq(lw[1])-D0,fb=Math.sqrt(backgroundFraction),fl=.171*Math.pow(adaptingNits,1/3)*(1-Math.exp(-48/9*adaptingNits));
 const qp=1.6*surround/Math.pow(fb,.12),qm=Math.pow(surround,2.2)*Math.pow(fb,.5)*Math.pow(fl,.2),qw=2700*Math.pow(iw,qp)*qm;
 const cFactor=10000*Math.pow(fl,.2)/(Math.pow(fb,.1)*Math.pow(iw,.78)*qw);
 return function xyzAbsoluteToCorrelates(xyz) {
  const response=lms(xyz).map(pq),iz=Math.max(0,response[1]-D0),[a,b]=opponents(response);
  // Neutral XYZ at the same Iz, obtained analytically through the M-channel PQ inverse.
  const neutralScale=pqInverse(iz+D0)/lw[1];
  const [na,nb]=opponents(lw.map(x=>pq(x*neutralScale)));
  const aa=a-na,bb=b-nb,hh=(Math.atan2(bb,aa)*180/Math.PI+360)%360,ee=1.015+Math.cos((89.038+hh)*Math.PI/180);
  const J=100*Math.pow(iz/iw,qp);let C=cFactor*Math.pow(aa*aa+bb*bb,.37)*Math.pow(ee,.068);if(C<1e-8)C=0;
  const K=100-.8*Math.sqrt(J*J+8*C*C),W=100-Math.sqrt((100-J)**2+C*C);
  return {J,C,K,W,h:hh};
 };
}

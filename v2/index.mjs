/** HRL v2 Beta 1. Frozen 0.13 metric-b2, not a new fit.
 * Historical research entry points keep their original defaults.
 */
import {createSpectralTonalHRL} from './research/boundary-tonal/index.mjs';
export {D65,addBlack,addWhite,exchangeNeutral,sharedCoordinates} from './research/boundary-tonal/index.mjs';
export const VERSION='2.0.0-beta.1';
export const RELEASE_NAME='HRL v2 Beta 1';
export const CHECKPOINT='metric';
export const DEFINITION_SHA256='92aa2f9647b406239dd52cd22feed61794f3d6ed74a1c33ba9361516cff3bb72';
export const BOUNDARY_SHA256='20542ab516a311a68ba8ab4131542254ee899b6cccaef7c89baf9f2c4dd79e67';
/** Browser and Node factory. XYZ is D65-relative unless units are declared. */
export async function createHRLv2({gamut='srgb',referenceWhiteNits=300,...extra}={}) {
  if(Object.keys(extra).length) throw new TypeError('Beta 1 accepts gamut and referenceWhiteNits; use a research factory for other checkpoints.');
  if(!['srgb','full'].includes(gamut)) throw new RangeError('Beta 1 public realizations: srgb or full.');
  const model=await createSpectralTonalHRL({gamut,checkpoint:CHECKPOINT,referenceWhiteNits});
  model.sourceVersion=model.version;
  model.version=VERSION;
  model.name=RELEASE_NAME+' · '+gamut;
  model.release=Object.freeze({name:RELEASE_NAME,version:VERSION,checkpoint:CHECKPOINT,trial:'metric-b2',definitionSHA256:DEFINITION_SHA256,boundarySHA256:BOUNDARY_SHA256});
  return model;
}
export {createHRLv2 as createHRL};

export {createShortCodeCodec, canonicalScale, SHORT_CODE_SCALES, SHORT_CODE_VERSION} from './codes.mjs';

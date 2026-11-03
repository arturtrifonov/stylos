/** @typedef {import('../types').LCH} LCH */
/** @typedef {import('../types').XYZ} XYZ */
/** @typedef {import('.').TLchModel} TLchModel */
import {
  D65_to_D50,
  D50_to_D65,
  XYZ_to_Lab,
  Lab_to_XYZ,
  Lab_to_LCH,
  LCH_to_Lab,
  XYZ_to_OKLab,
  OKLab_to_XYZ,
  OKLab_to_OKLCH,
  OKLCH_to_OKLab,
} from './colorMath/conversions.js'

/** @type {TLchModel} */
export const cielch = {
  name: 'cielch',
  lch2xyz: (lch) => D50_to_D65(Lab_to_XYZ(LCH_to_Lab(lch))),
  xyz2lch: (xyz) => Lab_to_LCH(XYZ_to_Lab(D65_to_D50(xyz))),
  ranges: {
    l: { min: 0, max: 100, step: 0.5, precision: 2 },
    c: { min: 0, max: 134, step: 0.5, precision: 2 },
    h: { min: 0, max: 360, step: 0.5, precision: 2 },
  },
}

/** @type {TLchModel} */
export const oklch = {
  name: 'oklch',
  lch2xyz: (lch) =>
    OKLab_to_XYZ(OKLCH_to_OKLab(fromDisplayOKLCH(lch))),
  xyz2lch: (xyz) => toDisplayOKLCH(OKLab_to_OKLCH(XYZ_to_OKLab(xyz))),
  ranges: {
    l: { min: 0, max: 100, step: 0.5, precision: 2 },
    c: { min: 0, max: 0.33, step: 0.005, precision: 3 },
    h: { min: 0, max: 360, step: 0.5, precision: 2 },
  },
}

/**
 * Remaps L component to percents
 * L: [0-1] -> [0-100]
 * @param lch color
 */
/** @param {LCH} lch @returns {LCH} */
function toDisplayOKLCH([l, c, h]) {
  return [l * 100, c, h]
}

/**
 * Parses L component from percents
 * L: [0-100] -> [0-1]
 * @param lch color
 */
/** @param {LCH} lch @returns {LCH} */
function fromDisplayOKLCH([l, c, h]) {
  return [l / 100, c, h]
}

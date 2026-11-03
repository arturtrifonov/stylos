// Shared by browser graphs and repository draft validation.
/** @typedef {import('../types').LCH} LCH */
/** @typedef {import('../types').RGB} RGB */
/** @typedef {import('../types').XYZ} XYZ */
import {
  gam_2020,
  gam_P3,
  gam_sRGB,
  lin_sRGB,
  lin_sRGB_to_XYZ,
  XYZ_to_lin_2020,
  XYZ_to_lin_P3,
  XYZ_to_lin_sRGB,
} from './colorMath/conversions.js'

// XYZ conversions
/** @param {XYZ} xyz @returns {RGB} */
export const xyz2rgb = (xyz) => gam_sRGB(XYZ_to_lin_sRGB(xyz))
/** @param {RGB} rgb @returns {XYZ} */
export const rgb2xyz = (rgb) => lin_sRGB_to_XYZ(lin_sRGB(rgb))
/** @param {XYZ} xyz @returns {RGB} */
export const xyz2p3 = (xyz) => gam_P3(XYZ_to_lin_P3(xyz))
/** @param {XYZ} xyz @returns {RGB} */
export const xyz2rec2020 = (xyz) => gam_2020(XYZ_to_lin_2020(xyz))

/** @param {RGB} rgb */
export function isWithinGamut(rgb) {
  const ε = 0.000005
  return rgb.reduce((a, b) => a && b >= 0 - ε && b <= 1 + ε, true)
}

/** Moves an lch color into sRGB or other gamut
 *  by holding the l and h steady,
 *  and adjusting the c via binary-search
 *  until the color is on the gamut boundary.
 *  Logic by [Chris Lilley](https://svgees.us/)
 */
/** @param {LCH} lch @param {(lch:LCH)=>RGB} lch2rgb @returns {RGB} */
export function forceIntoGamut(lch, lch2rgb) {
  let rgb = lch2rgb(lch)
  if (isWithinGamut(rgb)) return rgb

  let [l, c, h] = lch
  let hiC = c
  let loC = 0
  const ε = 0.0001 // .0001 chosen fairly arbitrarily as "close enough"
  c /= 2

  while (hiC - loC > ε) {
    rgb = lch2rgb([l, c, h])
    if (isWithinGamut(rgb)) loC = c
    else hiC = c
    c = (hiC + loC) / 2
  }

  return rgb
}

/** @param {string} hex @returns {RGB|null} */
export function hex2rgb(hex) {
  let str = hex.toLowerCase()
  if (str.startsWith('#')) str = str.slice(1)

  if (str.match(/^([0-9a-f]{3})$/i)) {
    let r = (parseInt(str.charAt(0), 16) / 15) * 255
    let g = (parseInt(str.charAt(1), 16) / 15) * 255
    let b = (parseInt(str.charAt(2), 16) / 15) * 255
    return [r, g, b]
  }
  if (str.match(/^([0-9a-f]{6})$/i)) {
    let r = parseInt(str.slice(0, 2), 16)
    let g = parseInt(str.slice(2, 4), 16)
    let b = parseInt(str.slice(4, 6), 16)
    return [r, g, b]
  }
  if (str.match(/^([0-9a-f]{1})$/i)) {
    let a = (parseInt(str.slice(0), 16) / 15) * 255
    return [a, a, a]
  }
  if (str.match(/^([0-9a-f]{2})$/i)) {
    let a = parseInt(str.slice(0, 2), 16)
    return [a, a, a]
  }

  console.log('Failed to parse: ' + hex)

  return null
}

/** Convert sRGB to hex
 *  @param rgb — channels within [0-1]
 */
/** @param {RGB} rgb */
export function srgb2hex([r, g, b]) {
  const toHex = (x) =>
    Math.round(Math.min(255, Math.max(0, x * 255)))
      .toString(16)
      .padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

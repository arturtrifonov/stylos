// Use exactly the same gamut mapping for browser previews and file validation.
import { oklch, cielch } from './huetone/shared/colorFuncs/colorModels.mjs'
import { xyz2rgb, isWithinGamut, forceIntoGamut, srgb2hex } from './huetone/shared/colorFuncs/utils.mjs'

/** @param {import('./model.mjs').Coordinate} point */
export function projectCoordinate(point) {
  const model = { oklch, cielch }[point.space]
  const toRgb = lch => xyz2rgb(model.lch2xyz(lch))
  const rgb = toRgb(point.lch)
  const displayable = isWithinGamut(rgb)
  return { hex: srgb2hex(displayable ? rgb : forceIntoGamut(point.lch, toRgb)), displayable }
}

/** @param {import('./model.mjs').Palette} palette @param {import('./model.mjs').Coordinates} coordinates */
export function validateProjections(palette, coordinates) {
  for (const [key, point] of Object.entries(coordinates)) {
    const [mode, path] = key.split(':')
    if (projectCoordinate(point).hex !== palette[path]?.[mode]?.toLowerCase()) {
      throw new Error(`The LCH coordinates and HEX preview disagree for ${path} (${mode}).`)
    }
  }
}

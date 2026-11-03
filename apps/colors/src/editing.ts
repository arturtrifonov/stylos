import { colorSpaces } from './huetone/shared/colorFuncs'
import { oklch, cielch } from './huetone/shared/colorFuncs/colorModels'
import { sycledLerp } from './huetone/shared/interpolation'
import { spaceName } from './huetone/shared/types'
import type { LCH } from './huetone/shared/types'
import { rampPaths } from './model.mjs'
import type { Palette, Coordinates, Theme } from './model.mjs'

const models = { oklch, cielch }
export const coordinateKey = (path: string, theme: Theme) => `${theme}:${path}`

export function editorColor(palette: Palette, coordinates: Coordinates, path: string, theme: Theme, space: spaceName) {
  const point = coordinates[coordinateKey(path, theme)]
  if (!point) return colorSpaces[space].hex2color(palette[path][theme])!
  const lch = point.space === space ? point.lch : models[space].xyz2lch(models[point.space].lch2xyz(point.lch))
  const color = colorSpaces[space].lch2color(lch)
  // Changing the graph's space must not change its stored sRGB projection.
  return { ...color, hex: palette[path][theme] }
}

export function outsideSrgb(coordinates: Coordinates, path: string, theme: Theme) {
  const point = coordinates[coordinateKey(path, theme)]
  return Boolean(point && !colorSpaces[point.space].lch2color(point.lch).within_sRGB)
}

export { validateProjections } from './projection.mjs'

export function interpolatedStep(palette: Palette, coordinates: Coordinates, hue: string, step: string, theme: Theme, space: spaceName) {
  const paths = rampPaths(palette, hue)
  const value = Number(step)
  const before = [...paths].reverse().find(path => Number(path.split('/')[1]) < value) ?? paths[0]
  const after = paths.find(path => Number(path.split('/')[1]) > value) ?? paths[paths.length - 1]
  if (before === after) return palette[before][theme]
  const a = editorColor(palette, coordinates, before, theme, space)
  const b = editorColor(palette, coordinates, after, theme, space)
  const t = (value - Number(before.split('/')[1])) / (Number(after.split('/')[1]) - Number(before.split('/')[1]))
  const lch: LCH = [a.l + (b.l - a.l) * t, a.c + (b.c - a.c) * t, sycledLerp(a.h, b.h, t, 360)]
  return colorSpaces[space].lch2color(lch).hex
}

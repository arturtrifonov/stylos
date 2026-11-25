// Sample exports for the Colors import spike (PLAN.md §4.4). Each is a set of
// documents in Figma's native variable-export shape: one DTCG document per
// collection and mode, named after the mode, as Figma names them.
//
// The three generic samples are synthetic. Their layouts follow widespread
// ways of building a palette, not any one product, and every value is
// generated from OKLCH here. `stylos` is the real Stylos token set, written by
// Colors' own native export, which reproduces Figma's syntax but names modes
// after collections; a real Figma export of Stylos / Styles is still owed.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { forceIntoGamut, srgb2hex, xyz2rgb } from '../../apps/colors/src/huetone/shared/colorFuncs/utils.mjs'
import { oklch } from '../../apps/colors/src/huetone/shared/colorFuncs/colorModels.mjs'
import { createFigmaDtcgFiles } from '../../apps/colors/src/figma-dtcg.mjs'
import { buildColorsSnapshot } from '../build-colors-data.mjs'

const hexOf = (l, c, h) => srgb2hex(forceIntoGamut([l, c, h], lch => xyz2rgb(oklch.lch2xyz(lch))))
const value = (hex, alpha = 1) => ({ colorSpace: 'srgb', components: [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255), alpha, hex })

/** @param {string} mode @param {[string, object][]} entries */
function documentOf(mode, entries) {
  const document = { $extensions: { 'com.figma.modeName': mode } }
  for (const [tokenPath, token] of entries) {
    const parts = tokenPath.split('/')
    let group = document
    for (const part of parts.slice(0, -1)) group = group[part] ??= {}
    group[parts.at(-1)] = token
  }
  return { name: `${mode}.tokens.json`, document }
}

const literal = (hex, scopes = ['ALL_SCOPES'], alpha = 1) => ({ $type: 'color', $value: value(hex, alpha), $extensions: { 'com.figma.scopes': scopes } })

/** A role bound to a palette variable, as Figma writes it: the resolved value plus the binding. */
function bound(palette, collection, target, scopes, opacity = null) {
  const hex = palette[target]
  if (!hex) throw new Error(`Sample role points at a missing ${collection}:${target}.`)
  const alias = { targetVariableName: target, targetVariableSetName: collection }
  const extensions = { 'com.figma.scopes': scopes }
  if (opacity === null) extensions['com.figma.aliasData'] = alias
  else extensions['com.figma.composedColor'] = { colorArg: { type: 'alias', alias }, opacityArg: { type: 'number', value: opacity * 100 } }
  return { $type: 'color', $value: value(hex, opacity ?? 1), $extensions: extensions }
}

const FILL = ['FRAME_FILL', 'SHAPE_FILL'], TEXT = ['TEXT_FILL'], STROKE = ['STROKE_COLOR'], EFFECT = ['EFFECT_COLOR'], ALL = ['ALL_SCOPES']

/** One primitive collection with a single mode; themes exist only in the semantic layer. */
function sharedPrimitives() {
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  const hues = { slate: [255, 0.03], red: [25, 0.19], orange: [50, 0.17], amber: [80, 0.16], green: [150, 0.15], teal: [185, 0.11], blue: [255, 0.17], indigo: [275, 0.17], violet: [295, 0.19], pink: [350, 0.17] }
  const palette = { 'colors/white': '#ffffff', 'colors/black': '#000000' }
  for (const [hue, [h, c]] of Object.entries(hues)) steps.forEach((step, i) => {
    palette[`colors/${hue}/${step}`] = hexOf(97 - i * 7, c * Math.sin(Math.PI * (i + 1) / (steps.length + 1)), h)
  })
  const roles = [
    ['bg/canvas', 'white', 'slate/950', FILL], ['bg/subtle', 'slate/50', 'slate/900', FILL], ['bg/inverse', 'slate/900', 'slate/50', FILL],
    ['fg/default', 'slate/900', 'slate/50', TEXT], ['fg/muted', 'slate/600', 'slate/400', TEXT], ['fg/on-accent', 'white', 'white', TEXT],
    ['border/default', 'slate/200', 'slate/800', STROKE], ['border/strong', 'slate/400', 'slate/600', STROKE],
    ['action/primary/default', 'blue/600', 'blue/500', ALL], ['action/primary/hover', 'blue/700', 'blue/400', ALL],
    ['action/primary/pressed', 'blue/800', 'blue/300', ALL], ['action/primary/disabled', 'slate/200', 'slate/800', ALL],
    ['action/secondary/default', 'slate/100', 'slate/800', ALL], ['action/secondary/hover', 'slate/200', 'slate/700', ALL],
    ['action/secondary/pressed', 'slate/300', 'slate/600', ALL], ['action/secondary/disabled', 'slate/100', 'slate/900', ALL],
    ...Object.entries({ danger: 'red', warning: 'amber', success: 'green', info: 'blue' }).flatMap(([status, hue]) => [
      [`status/${status}/bg`, `${hue}/50`, `${hue}/950`, FILL], [`status/${status}/fg`, `${hue}/700`, `${hue}/300`, TEXT],
      [`status/${status}/border`, `${hue}/200`, `${hue}/800`, STROKE],
    ]),
  ]
  const theme = mode => documentOf(mode, roles.map(([role, light, dark, scopes]) => [role, bound(palette, 'Primitives', `colors/${mode === 'Light' ? light : dark}`, scopes)])
    .concat([['shadow/overlay', bound(palette, 'Primitives', 'colors/black', EFFECT, 0.5)]]))
  return [documentOf('Value', Object.entries(palette).map(([p, hex]) => [p, literal(hex)])), theme('Light'), theme('Dark')]
}

/** Tonal palettes 0–100 keyed by role (primary, neutral…), one extra-fine neutral, roles without scopes. */
function tonal() {
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
  const surfaceTones = [4, 6, 12, 17, 22, 24, 87, 92, 94, 96, 98]
  const keys = { primary: [280, 0.12], secondary: [280, 0.05], tertiary: [340, 0.08], error: [25, 0.15], neutral: [280, 0.01], 'neutral-variant': [280, 0.02] }
  const palette = {}
  for (const [key, [h, c]] of Object.entries(keys)) {
    const list = key === 'neutral' ? [...tones, ...surfaceTones].sort((a, b) => a - b) : tones
    for (const tone of list) palette[`ref/palette/${key}/${tone}`] = tone === 0 ? '#000000' : tone === 100 ? '#ffffff' : hexOf(tone, c, h)
  }
  const roles = []
  for (const key of ['primary', 'secondary', 'tertiary', 'error']) roles.push(
    [`sys/color/${key}`, `${key}/40`, `${key}/80`], [`sys/color/on-${key}`, `${key}/100`, `${key}/20`],
    [`sys/color/${key}-container`, `${key}/90`, `${key}/30`], [`sys/color/on-${key}-container`, `${key}/10`, `${key}/90`])
  roles.push(['sys/color/surface', 'neutral/98', 'neutral/6'], ['sys/color/on-surface', 'neutral/10', 'neutral/90'],
    ['sys/color/surface-container', 'neutral/94', 'neutral/12'], ['sys/color/surface-container-high', 'neutral/92', 'neutral/17'],
    ['sys/color/inverse-surface', 'neutral/20', 'neutral/90'], ['sys/color/inverse-on-surface', 'neutral/95', 'neutral/20'],
    ['sys/color/outline', 'neutral-variant/50', 'neutral-variant/60'], ['sys/color/outline-variant', 'neutral-variant/80', 'neutral-variant/30'],
    ['sys/color/shadow', 'neutral/0', 'neutral/0'], ['sys/color/scrim', 'neutral/0', 'neutral/0'])
  const theme = mode => documentOf(mode, roles.map(([role, light, dark]) => [role, bound(palette, 'Palette', `ref/palette/${mode === 'Light' ? light : dark}`, ALL)]))
  return [documentOf('Mode 1', Object.entries(palette).map(([p, hex]) => [p, literal(hex)])), theme('Light'), theme('Dark')]
}

/** Twelve-step scales whose light and dark values are modes of one collection, alpha variants, per-hue accents. */
function scales() {
  const light = [99, 98, 95, 92.5, 90, 87, 82, 75, 62, 58, 48, 25]
  const dark = [17, 19.5, 24, 27, 30, 34, 40, 48, 62, 66, 78, 94]
  const hues = { gray: [260, 0.008], blue: [250, 0.16], red: [25, 0.18], green: [150, 0.14], amber: [75, 0.15] }
  const palettes = { Light: {}, Dark: {} }
  const alpha = {}
  for (const [mode, levels] of [['Light', light], ['Dark', dark]]) for (const [hue, [h, c]] of Object.entries(hues)) levels.forEach((l, i) => {
    const chroma = i < 8 ? c * (0.15 + i * 0.1) : c
    palettes[mode][`${hue}/${i + 1}`] = hexOf(l, chroma, h)
  })
  for (const hue of ['gray', 'blue']) for (let i = 1; i <= 12; i++) alpha[`${hue}A/${i}`] = [hues[hue], [0.02, 0.04, 0.08, 0.12, 0.16, 0.2, 0.26, 0.36, 0.55, 0.6, 0.7, 0.9][i - 1]]
  const scalesDoc = mode => documentOf(mode, [
    ...Object.entries(palettes[mode]).map(([p, hex]) => [p, literal(hex)]),
    ...Object.entries(alpha).map(([p, [[h, c], a]]) => [p, literal(hexOf(mode === 'Light' ? 45 : 80, c, h), ALL, a)]),
  ])
  const roles = [['app/background', 'gray/1', FILL], ['app/surface', 'gray/2', FILL], ['text/high', 'gray/12', TEXT], ['text/low', 'gray/11', TEXT],
    ['border/subtle', 'gray/6', STROKE], ['border/default', 'gray/7', STROKE]]
  for (const hue of ['blue', 'red', 'green', 'amber']) roles.push([`accent/${hue}/solid`, `${hue}/9`, FILL], [`accent/${hue}/solid-hover`, `${hue}/10`, FILL],
    [`accent/${hue}/surface`, `${hue}/3`, FILL], [`accent/${hue}/border`, `${hue}/7`, STROKE], [`accent/${hue}/text`, `${hue}/11`, TEXT])
  const semantic = mode => documentOf(mode, [
    ...roles.map(([role, target, scopes]) => [role, bound(palettes[mode], 'Scales', target, scopes)]),
    ['focus/ring', bound({ 'blueA/8': hexOf(mode === 'Light' ? 45 : 80, 0.16, 250) }, 'Scales', 'blueA/8', STROKE)],
  ])
  const radius = documentOf('Value', [['radius/small', { $type: 'number', $value: 4 }], ['radius/medium', { $type: 'number', $value: 8 }]])
  return [scalesDoc('Light'), scalesDoc('Dark'), semantic('Light'), semantic('Dark'), radius]
}

function stylos() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  const snapshot = buildColorsSnapshot(root)
  return createFigmaDtcgFiles(snapshot, snapshot.palette).map(file => ({ name: file.name, document: file.document }))
}

export const SAMPLES = {
  'shared-primitives': sharedPrimitives,
  tonal,
  scales,
  stylos,
}

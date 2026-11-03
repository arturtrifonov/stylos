import { createFigmaBundle } from './figma-bundle.mjs'

function colorValue(hex, alpha = 1) {
  return { colorSpace: 'srgb', components: [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255), alpha, hex }
}

function scopes(path) {
  if (path.startsWith('text/')) return ['TEXT_FILL']
  if (path.startsWith('border/')) return ['STROKE_COLOR']
  if (path.startsWith('shadow/')) return ['EFFECT_COLOR']
  return ['FRAME_FILL', 'SHAPE_FILL']
}

/** Native Figma imports one DTCG document per collection/mode.
 * Values remain standard DTCG colors; Figma extensions retain cross-collection
 * aliases by name, without inventing IDs from another Figma file.
 * @param {import('./model.mjs').Snapshot} snapshot
 * @param {import('./model.mjs').Palette} palette
 * @param {import('./model.mjs').Coordinates} coordinates
 */
export function createFigmaDtcgFiles(snapshot, palette, coordinates = {}) {
  const bundle = createFigmaBundle(snapshot, palette, coordinates)
  const files = []
  function file(collection, mode, records) {
    const document = { $extensions: { 'com.figma.modeName': mode } }
    for (const [path, token] of records) {
      const parts = path.split('/')
      let group = document
      for (const part of parts.slice(0, -1)) group = group[part] ??= {}
      group[parts.at(-1)] = token
    }
    const name = collection.startsWith('palette.') ? `${collection}.tokens.json` : `${collection}.${mode.endsWith('light') ? 'light' : 'dark'}.tokens.json`
    files.push({ collection, mode, name, count: records.length, document })
  }
  for (const theme of ['light', 'dark']) {
    const collection = `palette.${theme}`
    file(collection, collection, Object.entries(bundle.palette).map(([path, values]) => [path, {
      $type: 'color', $value: colorValue(values[theme]),
      $extensions: { 'com.figma.scopes': ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'] },
    }]))
  }
  for (const special of [false, true]) for (const theme of ['light', 'dark']) {
    const collection = special ? 'color.special' : 'color'
    file(collection, `color.${theme}`, bundle.roles.filter(role => Boolean(role.generated) === special).map(role => {
      const path = (role.ref[theme] ?? role.ref.default).slice('palette/'.length)
      const alias = { targetVariableName: path, targetVariableSetName: `palette.${theme}` }
      const extensions = { 'com.figma.scopes': scopes(role.path) }
      if (role.alpha[theme] === 1) extensions['com.figma.aliasData'] = alias
      else extensions['com.figma.composedColor'] = {
        colorArg: { type: 'alias', alias }, opacityArg: { type: 'number', value: role.alpha[theme] * 100 },
      }
      return [role.path, { $type: 'color', $value: colorValue(bundle.palette[path][theme], role.alpha[theme]), $extensions: extensions }]
    }))
  }
  return files
}

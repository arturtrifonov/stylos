// Reads token documents into flat per-file records. Figma's native variable
// export (DTCG with `com.figma.*` extensions, one document per collection and
// mode) comes first; plain DTCG colours and `{a.b.c}` references read too.
// No filesystem or browser APIs: the caller hands in parsed documents.
//
// Deliberately not shared with tools/lib/convert.mjs: Colors leaves this
// repository after step 2 (PLAN.md §4.4), and the canonical importer's checks
// are Stylos's, not the editor's.

/** @typedef {{collection:string|null, path:string}} Alias */
/** @typedef {{type:string, hex:string|null, alpha:number, colorSpace:string|null, alias:Alias|null, opacity:number|null, scopes:string[]|null}} Token */
/** @typedef {{name:string, mode:string|null, tokens:Map<string,Token>}} TokenFile */

const HEX = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i
const REFERENCE = /^\{([^{}]+)\}$/

const toHex = components => '#' + components.slice(0, 3)
  .map(c => Math.min(255, Math.max(0, Math.round(c * 255))).toString(16).padStart(2, '0')).join('')

/** @param {Record<string, any>} extensions @returns {{alias:Alias|null, opacity:number|null}} */
function bindingOf(extensions) {
  const plain = extensions['com.figma.aliasData']
  if (plain) return { alias: { collection: plain.targetVariableSetName ?? null, path: plain.targetVariableName }, opacity: null }
  const composed = extensions['com.figma.composedColor']
  if (composed?.colorArg?.type === 'alias') {
    const target = composed.colorArg.alias
    const opacity = composed.opacityArg?.type === 'number' ? composed.opacityArg.value / 100 : null
    return { alias: { collection: target.targetVariableSetName ?? null, path: target.targetVariableName }, opacity }
  }
  return { alias: null, opacity: null }
}

/** @param {unknown} value */
function colorOf(value) {
  if (typeof value === 'string') {
    const match = HEX.exec(value)
    if (match) return { hex: '#' + match[1].toLowerCase(), alpha: match[2] ? parseInt(match[2], 16) / 255 : 1, colorSpace: 'srgb' }
    return null
  }
  if (value && typeof value === 'object' && 'components' in value) {
    const color = /** @type {{components:number[], alpha?:number, hex?:string, colorSpace?:string}} */ (value)
    const colorSpace = color.colorSpace ?? 'srgb'
    const hex = typeof color.hex === 'string' && HEX.test(color.hex) ? color.hex.slice(0, 7).toLowerCase()
      : colorSpace === 'srgb' ? toHex(color.components) : null
    return { hex, alpha: color.alpha ?? 1, colorSpace }
  }
  return null
}

/** @param {any} document @param {string} name @returns {TokenFile} */
export function readDocument(document, name = 'document') {
  /** @type {Map<string, Token>} */
  const tokens = new Map()
  const walk = (node, prefix) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$') || value === null || typeof value !== 'object') continue
      const segments = [...prefix, key]
      if (!('$value' in value)) { walk(value, segments); continue }
      const extensions = value.$extensions ?? {}
      let { alias, opacity } = bindingOf(extensions)
      const reference = typeof value.$value === 'string' ? REFERENCE.exec(value.$value) : null
      if (!alias && reference) alias = { collection: null, path: reference[1].split('.').join('/') }
      const color = colorOf(value.$value)
      tokens.set(segments.join('/'), {
        type: value.$type ?? (color ? 'color' : 'unknown'),
        hex: color?.hex ?? null,
        alpha: color?.alpha ?? 1,
        colorSpace: color?.colorSpace ?? null,
        alias,
        opacity,
        scopes: extensions['com.figma.scopes'] ?? null,
      })
    }
  }
  walk(document, [])
  return { name, mode: document?.$extensions?.['com.figma.modeName'] ?? null, tokens }
}

/** @param {{name:string, document:any}[]} inputs @returns {TokenFile[]} */
export function readDocuments(inputs) {
  return inputs.map(({ name, document }) => readDocument(document, name))
}

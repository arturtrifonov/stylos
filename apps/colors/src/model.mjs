// Shared by the browser and the review CLI. No filesystem or browser APIs.
/** @typedef {'light'|'dark'} Theme */
/** @typedef {Record<string, Record<Theme, string>>} Palette */
/** @typedef {{path:string, ref:Record<string,string>, alpha:Record<Theme,number>, generated:string|null}} Role */
/** @typedef {{schemaVersion:number, fingerprint:string, version:string, palette:Palette, roles:Role[], specialScale:object}} Snapshot */
/** @typedef {{space:'oklch'|'cielch', lch:[number,number,number]}} Coordinate */
/** @typedef {Record<string, Coordinate>} Coordinates */
/** @typedef {{path:string, mode:Theme, before:string|null, after:string}} Change */
/** @typedef {{format:string, version:number, base:string, changes:Change[], coordinates?:Coordinates}} ChangeSet */

export const MODES = /** @type {const} */ (['light', 'dark'])
const HEX = /^#[0-9a-f]{6}$/i
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

/** @param {string} path */
function validPath(path) {
  const [hue, step] = path.split('/')
  return /^[a-z][a-z0-9-]*\/(?:\d+|black|white)$/.test(path) &&
    (hue === 'mono' ? ['black', 'white'].includes(step) : /^\d+$/.test(step) && Number(step) >= 25 && Number(step) <= 975 && String(Number(step)) === step)
}

/** @param {Palette} palette @param {string} hue */
export function rampPaths(palette, hue) {
  return Object.keys(palette).filter(path => path.startsWith(`${hue}/`)).sort((a, b) => Number(a.split('/')[1]) - Number(b.split('/')[1]))
}

/** @param {Snapshot} snapshot @param {Palette} palette */
function validatePalette(snapshot, palette) {
  if (Object.keys(snapshot.palette).some(path => !own(palette, path))) throw new Error('The draft must preserve every source palette token.')
  for (const [path, values] of Object.entries(palette)) {
    if (!validPath(path) || !values || Object.keys(values).length !== 2 || MODES.some(mode => typeof values[mode] !== 'string' || !HEX.test(values[mode]))) {
      throw new Error(`Invalid palette token or modes: ${path}.`)
    }
  }
  const steps = new Set(Object.keys(palette).filter(path => !path.startsWith('mono/')).map(path => path.split('/')[1]))
  const hues = new Set(Object.keys(palette).map(path => path.split('/')[0]))
  for (const hue of hues) {
    if (hue === 'mono') continue
    if ([...steps].some(step => !own(palette, `${hue}/${step}`))) throw new Error(`Every hue needs the same steps; ${hue} is incomplete.`)
  }
}

/** @param {Coordinates} coordinates @param {Palette} palette */
function validateCoordinates(coordinates, palette) {
  if (!coordinates || typeof coordinates !== 'object' || Array.isArray(coordinates)) throw new Error('Invalid LCH coordinates.')
  for (const [key, point] of Object.entries(coordinates)) {
    const [mode, path] = key.split(':')
    if (!MODES.includes(/** @type {Theme} */ (mode)) || key !== `${mode}:${path}` || !own(palette, path) ||
        !point || !['oklch', 'cielch'].includes(point.space) || !Array.isArray(point.lch) || point.lch.length !== 3 ||
        point.lch.some(value => typeof value !== 'number' || !Number.isFinite(value))) throw new Error(`Invalid LCH coordinates: ${key}.`)
    const [l, c, h] = point.lch
    if (l < 0 || l > 100 || c < 0 || c > (point.space === 'oklch' ? 0.5 : 150) || h < 0 || h > 360) throw new Error(`LCH coordinates out of range: ${key}.`)
  }
}

/** @param {Snapshot} snapshot @returns {Palette} */
export function createDraft(snapshot) {
  return structuredClone(snapshot.palette)
}

/** @param {Snapshot} snapshot @param {Palette} draft @param {Coordinates} coordinates @returns {ChangeSet} */
export function exportChanges(snapshot, draft, coordinates = {}) {
  validatePalette(snapshot, draft)
  validateCoordinates(coordinates, draft)
  /** @type {Change[]} */
  const changes = []
  for (const path of Object.keys(draft)) {
    for (const mode of MODES) {
      const after = draft[path][mode]
      if (typeof after !== 'string' || !HEX.test(after)) throw new Error(`Invalid HEX for ${path} (${mode}).`)
      const before = snapshot.palette[path]?.[mode] ?? null
      if (before?.toLowerCase() !== after.toLowerCase()) {
        changes.push({ path: `palette/${path}`, mode, before, after: after.toLowerCase() })
      }
    }
  }
  return { format: 'stylos-color-changes', version: 2, base: snapshot.fingerprint, changes, coordinates: structuredClone(coordinates) }
}

/** Validate the entire file before returning an edited copy. @param {Snapshot} snapshot @param {unknown} input @returns {Palette} */
export function importChanges(snapshot, input) {
  const patch = /** @type {ChangeSet} */ (input)
  if (!patch || patch.format !== 'stylos-color-changes' || ![1, 2].includes(patch.version) || !Array.isArray(patch.changes)) {
    throw new Error('This is not a supported Stylos color changes file.')
  }
  if (patch.base !== snapshot.fingerprint) {
    throw new Error('The source tokens have changed. This draft needs review against the new source.')
  }
  const draft = createDraft(snapshot)
  const seen = new Set()
  for (const change of patch.changes) {
    if (!change || typeof change.path !== 'string' || !change.path.startsWith('palette/')) {
      throw new Error('A change must name a palette value.')
    }
    const path = change.path.slice('palette/'.length)
    const exists = own(snapshot.palette, path)
    if (!validPath(path) || !MODES.includes(change.mode) || (!exists && patch.version === 1)) throw new Error(`Unknown token or mode: ${change.path}.`)
    const key = `${change.path}:${change.mode}`
    if (seen.has(key)) throw new Error(`Duplicate change: ${key}.`)
    seen.add(key)
    if (change.before !== (exists ? snapshot.palette[path][change.mode] : null)) throw new Error(`The original value does not match: ${key}.`)
    if (typeof change.after !== 'string' || !HEX.test(change.after)) throw new Error(`Invalid HEX: ${key}.`)
    if (!own(draft, path)) draft[path] = /** @type {Record<Theme,string>} */ ({})
    draft[path][change.mode] = change.after.toLowerCase()
  }
  validatePalette(snapshot, draft)
  validateCoordinates(patch.coordinates ?? {}, draft)
  return draft
}

/** New hue families follow the same authored special scale. @param {Snapshot} snapshot @param {Palette} palette @returns {Snapshot} */
export function withDraftRoles(snapshot, palette) {
  const sourceHues = new Set(Object.keys(snapshot.palette).map(path => path.split('/')[0]))
  const hues = [...new Set(Object.keys(palette).map(path => path.split('/')[0]))].filter(hue => !sourceHues.has(hue))
  const roles = [...snapshot.roles]
  const scale = /** @type {{exclude:string[],roles:Record<string,Record<string,string>>}} */ (snapshot.specialScale)
  for (const hue of hues) {
    if (scale.exclude.includes(hue)) continue
    for (const [template, bindings] of Object.entries(scale.roles)) {
      roles.push({ path: template.replaceAll('{hue}', hue), ref: Object.fromEntries(Object.entries(bindings).map(([mode, ref]) => [mode, ref.replaceAll('{hue}', hue)])), alpha: { light: 1, dark: 1 }, generated: 'tokens/_special.yaml' })
    }
  }
  return { ...snapshot, roles }
}

/** @param {Palette} palette @param {string} name @param {string} fromHue @returns {Palette} */
export function addHue(palette, name, fromHue) {
  if (!/^[a-z][a-z0-9-]*$/.test(name) || name === 'mono') throw new Error('Use a hue name with lowercase letters, numbers and hyphens.')
  if (Object.keys(palette).some(path => path.startsWith(`${name}/`))) throw new Error('That hue already exists.')
  const paths = rampPaths(palette, fromHue)
  if (!paths.length || fromHue === 'mono') throw new Error('Select a numbered ramp to duplicate.')
  const result = structuredClone(palette)
  for (const path of paths) result[`${name}/${path.split('/')[1]}`] = { ...palette[path] }
  return result
}

/** @param {Palette} palette @param {string} step @param {(hue:string,mode:Theme)=>string} valueFor @returns {Palette} */
export function addStep(palette, step, valueFor) {
  if (!validPath(`custom/${step}`)) throw new Error('Use a numbered step from 25 to 975.')
  if (Object.keys(palette).some(path => path.split('/')[1] === step)) throw new Error('That step already exists.')
  const result = structuredClone(palette)
  for (const hue of new Set(Object.keys(palette).map(path => path.split('/')[0]))) {
    if (hue !== 'mono') result[`${hue}/${step}`] = { light: valueFor(hue, 'light'), dark: valueFor(hue, 'dark') }
  }
  return result
}

/** @param {Snapshot} snapshot @param {Palette} draft @param {string} path @param {Theme} mode */
export function resolveRole(snapshot, draft, path, mode) {
  const role = snapshot.roles.find(role => role.path === path)
  if (!role) throw new Error(`Unknown color role: ${path}.`)
  const target = role.ref[mode] ?? role.ref.default
  if (!target?.startsWith('palette/')) throw new Error(`Invalid palette reference for ${path}.`)
  const value = draft[target.slice('palette/'.length)]?.[mode]
  if (!value) throw new Error(`Missing palette value: ${target} (${mode}).`)
  return { value, alpha: role.alpha[mode], ref: target }
}

/** @param {{value:string,alpha:number}} color */
export function colorCss({ value, alpha }) {
  if (alpha === 1) return value
  const [r, g, b] = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16))
  return `rgb(${r} ${g} ${b} / ${alpha})`
}

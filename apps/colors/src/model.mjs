// Shared by the browser and the review CLI. No filesystem or browser APIs.
/** @typedef {'light'|'dark'} Theme */
/** @typedef {Record<string, Record<Theme, string>>} Palette */
/** @typedef {{path:string, ref:Record<string,string>, alpha:Record<Theme,number>, generated:string|null}} Role */
/** @typedef {{schemaVersion:number, fingerprint:string, version:string, palette:Palette, roles:Role[], specialScale:object}} Snapshot */
/** @typedef {{space:'oklch'|'cielch', lch:[number,number,number]}} Coordinate */
/** @typedef {Record<string, Coordinate>} Coordinates */
/** @typedef {{path:string, mode:Theme, before:string|null, after:string}} Change */
/** @typedef {Record<string, Partial<Record<Theme,string>>>} Bindings */
/** @typedef {{roles:Bindings, scale:Bindings}} Assignments */
/** @typedef {{path:string, mode:Theme, before:string, after:string}} RoleChange */
/** @typedef {{template:string, mode:Theme, before:string, after:string}} ScaleChange */
/** @typedef {{format:string, version:number, base:string, changes:Change[], coordinates?:Coordinates, roles?:RoleChange[], scale?:ScaleChange[]}} ChangeSet */

export const MODES = /** @type {const} */ (['light', 'dark'])
const HEX = /^#[0-9a-f]{6}$/i
const HUE = '{hue}'
const PALETTE = 'palette/'
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
const refFor = (ref, mode) => ref[mode] ?? ref.default
const paletteHues = palette => [...new Set(Object.keys(palette).map(path => path.split('/')[0]))]

/** @returns {Assignments} */
export const noAssignments = () => ({ roles: {}, scale: {} })

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

/** Only a disabled role drops its hue (FND-COLOR-08). @param {string} template */
export const scaleKeepsHue = template => template.split('/').at(-1) !== 'disabled'

/** @param {Snapshot} snapshot @param {Palette} palette @param {string} path @param {Theme} mode @param {string} ref */
function validateRoleBinding(snapshot, palette, path, mode, ref) {
  const role = snapshot.roles.find(item => item.path === path)
  if (!role || role.generated) throw new Error(`Unknown semantic role: ${path}.`)
  if (!MODES.includes(mode)) throw new Error(`Unknown mode for ${path}: ${mode}.`)
  if (typeof ref !== 'string' || !ref.startsWith(PALETTE) || !own(palette, ref.slice(PALETTE.length))) throw new Error(`${path} (${mode}) needs a palette step: ${ref}.`)
}

/** Every generated hue must have the step, so the family stays complete.
 * @param {Snapshot} snapshot @param {Palette} palette @param {string} template @param {Theme} mode @param {string} ref */
function validateScaleBinding(snapshot, palette, template, mode, ref) {
  const scale = /** @type {{exclude:string[],roles:Record<string,Record<string,string>>}} */ (snapshot.specialScale)
  if (!own(scale.roles, template)) throw new Error(`Unknown special scale role: ${template}.`)
  if (!MODES.includes(mode)) throw new Error(`Unknown mode for ${template}: ${mode}.`)
  if (typeof ref !== 'string' || !ref.startsWith(PALETTE)) throw new Error(`${template} (${mode}) needs a palette step: ${ref}.`)
  const target = ref.slice(PALETTE.length)
  if (scaleKeepsHue(template) && !target.startsWith(`${HUE}/`)) throw new Error(`${template} (${mode}) must keep its own hue.`)
  const hues = target.includes(HUE) ? paletteHues(palette).filter(hue => !scale.exclude.includes(hue)) : ['']
  for (const hue of hues) if (!own(palette, target.replaceAll(HUE, hue))) throw new Error(`${template} (${mode}) needs ${target.replaceAll(HUE, hue)}, which the palette does not have.`)
}

/** @param {Snapshot} snapshot @param {Palette} palette @param {Assignments} assignments */
function validateAssignments(snapshot, palette, { roles, scale }) {
  for (const [path, modes] of Object.entries(roles)) for (const [mode, ref] of Object.entries(modes)) validateRoleBinding(snapshot, palette, path, /** @type {Theme} */ (mode), ref)
  for (const [template, modes] of Object.entries(scale)) for (const [mode, ref] of Object.entries(modes)) validateScaleBinding(snapshot, palette, template, /** @type {Theme} */ (mode), ref)
}

/** An override equal to the source is no override, so a draft never carries noise.
 * @param {Bindings} bindings @param {string} key @param {Theme} mode @param {string} ref @param {string} source @returns {Bindings} */
function bind(bindings, key, mode, ref, source) {
  const next = { ...bindings, [key]: { ...bindings[key], [mode]: ref } }
  if (ref === source) delete next[key][mode]
  if (!Object.keys(next[key]).length) delete next[key]
  return next
}

/** @param {Snapshot} snapshot @param {Assignments} assignments @param {string} path @param {Theme} mode @param {string} ref @returns {Assignments} */
export function assignRole(snapshot, assignments, path, mode, ref) {
  const role = snapshot.roles.find(item => item.path === path)
  if (!role || role.generated) throw new Error(`Unknown semantic role: ${path}.`)
  return { ...assignments, roles: bind(assignments.roles, path, mode, ref, refFor(role.ref, mode)) }
}

/** @param {Snapshot} snapshot @param {Assignments} assignments @param {string} template @param {Theme} mode @param {string} ref @returns {Assignments} */
export function assignScale(snapshot, assignments, template, mode, ref) {
  const source = /** @type {{roles:Record<string,Record<string,string>>}} */ (snapshot.specialScale).roles[template]
  if (!source) throw new Error(`Unknown special scale role: ${template}.`)
  return { ...assignments, scale: bind(assignments.scale, template, mode, ref, refFor(source, mode)) }
}

/** The palette step a scale role takes in a mode, with the draft applied.
 * @param {Snapshot} snapshot @param {Assignments} assignments @param {string} template @param {Theme} mode */
export function scaleRef(snapshot, assignments, template, mode) {
  return assignments.scale[template]?.[mode] ?? refFor(/** @type {{roles:Record<string,Record<string,string>>}} */ (snapshot.specialScale).roles[template], mode)
}

/** @param {Snapshot} snapshot @returns {Palette} */
export function createDraft(snapshot) {
  return structuredClone(snapshot.palette)
}

/** @param {Snapshot} snapshot @param {Palette} draft @param {Coordinates} coordinates @param {Assignments} assignments @returns {ChangeSet} */
export function exportChanges(snapshot, draft, coordinates = {}, assignments = noAssignments()) {
  validatePalette(snapshot, draft)
  validateCoordinates(coordinates, draft)
  validateAssignments(snapshot, draft, assignments)
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
  const roles = Object.entries(assignments.roles).flatMap(([path, modes]) => MODES.filter(mode => modes[mode]).map(mode => ({
    path, mode, before: refFor(snapshot.roles.find(role => role.path === path).ref, mode), after: modes[mode],
  })))
  const scale = Object.entries(assignments.scale).flatMap(([template, modes]) => MODES.filter(mode => modes[mode]).map(mode => ({
    template, mode, before: refFor(/** @type {{roles:Record<string,Record<string,string>>}} */ (snapshot.specialScale).roles[template], mode), after: modes[mode],
  })))
  return { format: 'stylos-color-changes', version: 3, base: snapshot.fingerprint, changes, coordinates: structuredClone(coordinates), roles, scale }
}

/** Validate the entire file before returning an edited copy. @param {Snapshot} snapshot @param {unknown} input @returns {Palette} */
export function importChanges(snapshot, input) {
  const patch = /** @type {ChangeSet} */ (input)
  if (!patch || patch.format !== 'stylos-color-changes' || ![1, 2, 3].includes(patch.version) || !Array.isArray(patch.changes)) {
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

/** Read the role and scale edits of a validated palette. Older files have none.
 * @param {Snapshot} snapshot @param {ChangeSet} input @param {Palette} palette @returns {Assignments} */
export function importAssignments(snapshot, input, palette) {
  let assignments = noAssignments()
  const seen = new Set()
  const once = (key) => {
    if (seen.has(key)) throw new Error(`Duplicate change: ${key}.`)
    seen.add(key)
  }
  for (const change of input.roles ?? []) {
    validateRoleBinding(snapshot, palette, change?.path, change?.mode, change?.after)
    once(`${change.path}:${change.mode}`)
    if (change.before !== refFor(snapshot.roles.find(role => role.path === change.path).ref, change.mode)) throw new Error(`The original binding does not match: ${change.path} (${change.mode}).`)
    assignments = assignRole(snapshot, assignments, change.path, change.mode, change.after)
  }
  for (const change of input.scale ?? []) {
    validateScaleBinding(snapshot, palette, change?.template, change?.mode, change?.after)
    once(`${change.template}:${change.mode}`)
    if (change.before !== scaleRef(snapshot, noAssignments(), change.template, change.mode)) throw new Error(`The original binding does not match: ${change.template} (${change.mode}).`)
    assignments = assignScale(snapshot, assignments, change.template, change.mode, change.after)
  }
  return assignments
}

/** The scale's roles for one hue, with the draft applied.
 * @param {Snapshot} snapshot @param {Assignments} assignments @param {string} hue */
function generatedRoles(snapshot, assignments, hue) {
  const scale = /** @type {{roles:Record<string,Record<string,string>>}} */ (snapshot.specialScale)
  return Object.entries(scale.roles).map(([template, bindings]) => {
    const edited = assignments.scale[template]
    const ref = edited ? Object.fromEntries(MODES.map(mode => [mode, scaleRef(snapshot, assignments, template, mode)])) : bindings
    return { path: template.replaceAll(HUE, hue), ref: Object.fromEntries(Object.entries(ref).map(([mode, target]) => [mode, target.replaceAll(HUE, hue)])) }
  })
}

/** Apply role and scale edits; new hue families follow the same authored scale.
 * @param {Snapshot} snapshot @param {Palette} palette @param {Assignments} assignments @returns {Snapshot} */
export function withDraftRoles(snapshot, palette, assignments = noAssignments()) {
  const scale = /** @type {{exclude:string[]}} */ (snapshot.specialScale)
  const generated = new Map(paletteHues(palette).filter(hue => !scale.exclude.includes(hue))
    .flatMap(hue => generatedRoles(snapshot, assignments, hue)).map(role => [role.path, role.ref]))
  const roles = snapshot.roles.map(role => {
    if (role.generated) return { ...role, ref: generated.get(role.path) ?? role.ref }
    const edited = assignments.roles[role.path]
    return edited ? { ...role, ref: Object.fromEntries(MODES.map(mode => [mode, edited[mode] ?? refFor(role.ref, mode)])) } : role
  })
  const known = new Set(roles.map(role => role.path))
  for (const [path, ref] of generated) {
    if (!known.has(path)) roles.push({ path, ref, alpha: { light: 1, dark: 1 }, generated: 'tokens/_special.yaml' })
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

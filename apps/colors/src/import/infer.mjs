// Recognises a colour system's structure from read token files, so that a
// project is created by confirming what was found rather than configuring it.
// Spike for the standalone Colors work order (PLAN.md §4.4): every guess says
// what it rests on, and nothing here is written anywhere.

import { rgb2xyz } from '../huetone/shared/colorFuncs/utils.mjs'
import { oklch } from '../huetone/shared/colorFuncs/colorModels.mjs'

/** @typedef {import('./read.mjs').TokenFile} TokenFile */
/** @typedef {import('./read.mjs').Token} Token */

const NUMBER = /^\d+(?:\.\d+)?$/
const STATES = ['default', 'rest', 'hover', 'hovered', 'active', 'pressed', 'focus', 'focused', 'selected', 'checked', 'visited', 'disabled']
const SCOPE_KINDS = { TEXT_FILL: 'text', STROKE_COLOR: 'border', EFFECT_COLOR: 'shadow', FRAME_FILL: 'surface', SHAPE_FILL: 'surface', ALL_FILLS: 'surface' }
const NAME_KINDS = [
  ['shadow', /^(shadow|elevation|scrim)$/],
  ['border', /^(border|stroke|outline|divider|separator)(-.*)?$/],
  ['text', /^(text|fg|foreground|icon|on-.+|ink|label)$/],
  ['surface', /^(bg|background|surface|fill|container|canvas|backdrop|layer)(-.*)?$/],
]

/** OKLCH lightness 0–100 of an sRGB hex. @param {string} hex */
export function lightness(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  return oklch.xyz2lch(rgb2xyz(rgb))[0]
}

const colorTokens = (/** @type {TokenFile} */ file) => [...file.tokens].filter(([, token]) => token.type === 'color')
const last = (/** @type {string} */ path) => path.split('/').at(-1)
const parent = (/** @type {string} */ path) => path.split('/').slice(0, -1).join('/')
const count = (/** @type {Map<any, number>} */ map, key) => map.set(key, (map.get(key) ?? 0) + 1)
const majority = (/** @type {Map<any, number>} */ map) => [...map].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

/** A name hint from file names: Figma names a file after its mode, so only a
 * prefix shared by every file of a collection, and unlike its modes, counts.
 * @param {TokenFile[]} files */
function fileHint(files) {
  const stems = files.map(file => file.name.replace(/^.*[\\/]/, '').replace(/\.tokens\.json$|\.json$/, '').split('.'))
  let prefix = stems[0]
  if (files.length > 1) {
    prefix = []
    for (let i = 0; stems.every(stem => i < stem.length - 1 && stem[i] === stems[0][i]); i++) prefix.push(stems[0][i])
  }
  const hint = prefix.join('.')
  return hint && !files.some(file => file.mode === hint) ? hint : null
}

/** Group files into collections. One collection's modes share a path set; two
 * collections may share one too (Stylos keeps `palette.light` and
 * `palette.dark`), and then the aliases that name them, matched by value,
 * decide which file is which.
 * @param {TokenFile[]} files */
function groupCollections(files) {
  /** @type {Map<string, {paths:Set<string>, refs:{path:string, hex:string|null}[]}>} */
  const targets = new Map()
  for (const file of files) for (const [, token] of file.tokens) {
    if (!token.alias?.collection) continue
    if (!targets.has(token.alias.collection)) targets.set(token.alias.collection, { paths: new Set(), refs: [] })
    const target = targets.get(token.alias.collection)
    target.paths.add(token.alias.path)
    target.refs.push({ path: token.alias.path, hex: token.hex })
  }
  /** @type {Map<string, TokenFile[]>} */
  const bySignature = new Map()
  for (const file of files) {
    const signature = [...file.tokens.keys()].sort().join('\n')
    bySignature.set(signature, [...(bySignature.get(signature) ?? []), file])
  }
  /** @type {{name:string|null, nameSource:'alias'|'file'|null, files:TokenFile[]}[]} */
  const collections = []
  for (const group of bySignature.values()) {
    const keys = group[0].tokens
    const names = [...targets].filter(([, target]) => [...target.paths].every(path => keys.has(path))).map(([name]) => name)
    if (names.length > 1) {
      /** @type {Map<string, TokenFile[]>} */
      const assigned = new Map(names.map(name => [name, []]))
      const rest = []
      for (const file of group) {
        const scores = names.map(name => [name, targets.get(name).refs.filter(ref => ref.hex && file.tokens.get(ref.path)?.hex === ref.hex).length])
        scores.sort((a, b) => b[1] - a[1])
        if (scores[0][1] > 0 && scores[0][1] !== scores[1]?.[1]) assigned.get(scores[0][0]).push(file)
        else rest.push(file)
      }
      for (const [name, matched] of assigned) if (matched.length) collections.push({ name, nameSource: 'alias', files: matched })
      for (const file of rest) collections.push({ name: fileHint([file]), nameSource: fileHint([file]) ? 'file' : null, files: [file] })
      continue
    }
    const modes = group.map(file => file.mode)
    const split = new Set(modes).size !== modes.length
    for (const files of split ? group.map(file => [file]) : [group]) {
      const hint = fileHint(files)
      collections.push(names.length === 1 && !split ? { name: names[0], nameSource: 'alias', files }
        : { name: hint, nameSource: hint ? 'file' : null, files })
    }
  }
  return collections.map((collection, index) => ({ id: collection.name ?? `collection-${index + 1}`, ...collection }))
}

/** @param {{files:TokenFile[]}} collection */
function classify(collection) {
  let literal = 0, alias = 0, other = 0
  for (const [, token] of collection.files[0].tokens) {
    if (token.type !== 'color') other++
    else if (token.alias) alias++
    else literal++
  }
  const kind = literal + alias === 0 ? 'other' : literal >= 0.8 * (literal + alias) ? 'palette' : alias >= 0.8 * (literal + alias) ? 'roles' : 'mixed'
  return { kind, literal, alias, other }
}

/** @param {TokenFile} file */
function analysePalette(file) {
  /** @type {Map<string, {step:string, path:string, hex:string|null, alpha:number}[]>} */
  const groups = new Map()
  for (const [path, token] of colorTokens(file)) {
    if (token.alias) continue
    const group = parent(path)
    groups.set(group, [...(groups.get(group) ?? []), { step: last(path), path, hex: token.hex, alpha: token.alpha }])
  }
  const ramps = []
  const loose = []
  for (const [group, entries] of groups) {
    if (!group || entries.length < 3 || !entries.every(entry => NUMBER.test(entry.step))) { loose.push(...entries.map(entry => entry.path)); continue }
    entries.sort((a, b) => Number(a.step) - Number(b.step))
    const levels = entries.map(entry => entry.hex ? lightness(entry.hex) : NaN)
    const direction = levels[0] >= levels.at(-1) ? 'light-to-dark' : 'dark-to-light'
    const sign = direction === 'light-to-dark' ? -1 : 1
    const inversions = levels.slice(1).filter((level, i) => Math.sign(level - levels[i]) === -sign && Math.abs(level - levels[i]) > 0.5).length
    ramps.push({ group, name: last(group), steps: entries.map(entry => entry.step), direction, inversions,
      alpha: entries.every(entry => entry.alpha < 1) })
  }
  for (const ramp of ramps) {
    const base = ramps.filter(other => other !== ramp && ramp.name.startsWith(other.name) && ramp.name.length > other.name.length)
      .sort((a, b) => b.name.length - a.name.length)[0]
    ramp.variantOf = base ? { name: base.name, suffix: ramp.name.slice(base.name.length).replace(/^[-_]/, '') } : null
  }
  const opaque = ramps.filter(ramp => !ramp.alpha)
  /** @type {Map<string, number>} */
  const stepSets = new Map()
  for (const ramp of opaque) count(stepSets, ramp.steps.join(','))
  const scale = majority(stepSets)?.split(',') ?? []
  const deviations = opaque.filter(ramp => ramp.steps.join(',') !== scale.join(',')).map(ramp => ({
    group: ramp.group, missing: scale.filter(step => !ramp.steps.includes(step)), extra: ramp.steps.filter(step => !scale.includes(step)),
  }))
  const prefixes = new Set(ramps.map(ramp => parent(ramp.group)))
  /** @type {Map<string, number>} */
  const directions = new Map()
  for (const ramp of opaque) count(directions, ramp.direction)
  return { ramps, scale, deviations, loose, namespace: prefixes.size === 1 ? [...prefixes][0] : null, direction: majority(directions) }
}

/** @param {string} path @param {string[]|null} scopes */
function kindOf(path, scopes) {
  const fromScopes = new Set((scopes ?? []).map(scope => SCOPE_KINDS[scope]).filter(Boolean))
  if (fromScopes.size === 1) return { kind: [...fromScopes][0], source: 'scope' }
  const segments = path.toLowerCase().split('/').reverse()
  for (const segment of segments) for (const [kind, pattern] of NAME_KINDS) if (pattern.test(segment)) return { kind, source: 'name' }
  return { kind: null, source: null }
}

export function recognise(/** @type {TokenFile[]} */ files) {
  const issues = []
  const collections = groupCollections(files).map(collection => ({ ...collection, ...classify(collection), modes: collection.files.map(file => file.mode) }))
  const byName = new Map(collections.filter(c => c.name).map(c => [c.name, c]))
  const fileOwner = new Map(collections.flatMap(c => c.files.map(file => [file, c])))

  for (const file of files) for (const [path, token] of file.tokens) {
    if (token.type === 'color' && token.colorSpace && token.colorSpace !== 'srgb') issues.push({ level: 'error', message: `${path} (${file.mode}) is in ${token.colorSpace}; only sRGB reads as HEX.` })
  }
  for (const collection of collections.filter(c => c.kind === 'mixed')) {
    issues.push({ level: 'warning', message: `Collection ${collection.id} mixes ${collection.literal} literal colours with ${collection.alias} aliases.` })
  }

  /** Which collection and mode a reference lands in, matched by value when the target has modes.
   * @param {import('./read.mjs').Token} token */
  function target(token) {
    const alias = token.alias
    const collection = alias.collection ? byName.get(alias.collection)
      : collections.find(c => c.files[0].tokens.has(alias.path))
    if (!collection) return null
    const file = collection.files.length === 1 ? collection.files[0]
      : collection.files.find(candidate => token.hex && candidate.tokens.get(alias.path)?.hex === token.hex) ?? null
    return { collection, file, path: alias.path, token: collection.files[0].tokens.get(alias.path) ?? null }
  }

  const palettes = collections.filter(c => c.kind === 'palette').map(collection => ({ id: collection.id, modes: collection.modes, ...analysePalette(collection.files[0]) }))
  for (const palette of palettes) {
    for (const ramp of palette.ramps.filter(ramp => ramp.inversions)) issues.push({ level: 'warning', message: `${palette.id}: ${ramp.group} is not monotonic in lightness (${ramp.inversions} inversion(s)).` })
    for (const deviation of palette.deviations) issues.push({ level: 'info', message: `${palette.id}: ${deviation.group} differs from the common steps (missing ${deviation.missing.join(', ') || 'none'}; extra ${deviation.extra.join(', ') || 'none'}).` })
  }
  const hues = new Set(palettes.flatMap(palette => palette.ramps.filter(ramp => !ramp.alpha).map(ramp => ramp.name)))

  const roleSets = collections.filter(c => c.kind === 'roles' || c.kind === 'mixed').map(collection => {
    const tokens = colorTokens(collection.files[0]).map(([path]) => path)
    /** @type {Map<string, Map<string, number>>} */
    const themeTargets = new Map()
    let unresolved = 0, literal = 0, chained = 0
    /** @type {Map<string, Record<string, {collection:string, path:string, file:TokenFile|null}>>} */
    const bindings = new Map()
    for (const file of collection.files) {
      const counts = new Map()
      for (const path of tokens) {
        const token = file.tokens.get(path)
        if (!token?.alias) { literal++; continue }
        let found = target(token)
        for (let hops = 0; found?.token?.alias && hops < 5; hops++) {
          chained++
          const next = target({ ...found.token, hex: token.hex })
          if (!next) break
          found = next
        }
        if (!found) { unresolved++; issues.push({ level: 'error', message: `${path} (${file.mode}) refers to ${token.alias.collection ? token.alias.collection + ':' : ''}${token.alias.path}, which the import does not contain.` }); continue }
        if (!bindings.has(path)) bindings.set(path, {})
        bindings.get(path)[file.mode ?? file.name] = { collection: found.collection.id, path: found.path, file: found.file }
        if (found.file) count(counts, found.file)
      }
      themeTargets.set(file.mode ?? file.name, counts)
    }
    const themes = [...themeTargets].map(([mode, counts]) => {
      const file = majority(counts)
      const owner = file ? fileOwner.get(file) : null
      return { mode, palette: owner ? owner.id : null, paletteMode: file?.mode ?? null }
    })
    const sources = new Set(themes.map(theme => `${theme.palette}\u0000${theme.paletteMode}`))
    const owners = new Set(themes.map(theme => theme.palette))
    const arrangement = themes.length < 2 ? 'single' : sources.size === 1 ? 'shared' : owners.size === 1 ? 'modes' : 'parallel'

    /** @type {Map<string, number>} */
    const areas = new Map()
    /** @type {Map<string, Set<string>>} */
    const families = new Map()
    /** @type {Map<string, number>} */
    const kinds = new Map()
    const stateWords = new Set()
    for (const path of tokens) {
      count(areas, path.split('/')[0])
      const state = last(path)
      if (STATES.includes(state)) {
        stateWords.add(state)
        const family = parent(path)
        families.set(family, new Set([...(families.get(family) ?? []), state]))
      }
      const { kind, source } = kindOf(path, collection.files[0].tokens.get(path).scopes)
      count(kinds, kind ? `${kind} (${source})` : 'unknown')
    }
    const stateFamilies = [...families].filter(([, states]) => states.size >= 2)

    /** @type {Map<string, Map<string, string>>} */
    const templates = new Map()
    for (const path of tokens) {
      const segments = path.split('/')
      const index = segments.findIndex(segment => hues.has(segment))
      if (index < 0) continue
      const template = segments.map((segment, i) => i === index ? '{hue}' : segment).join('/')
      if (!templates.has(template)) templates.set(template, new Map())
      templates.get(template).set(segments[index], path)
    }
    const perHue = []
    for (const [template, members] of templates) {
      if (members.size < 3) continue
      const modes = {}
      let consistent = true
      for (const theme of themes) {
        const targets = [...members].map(([hue, path]) => ({ hue, target: bindings.get(path)?.[theme.mode] }))
        const steps = new Set(targets.map(({ hue, target }) => target && last(parent(target.path)) === hue ? last(target.path) : null))
        const fixed = new Set(targets.map(({ target }) => target?.path))
        if (steps.size === 1 && !steps.has(null)) modes[theme.mode] = `{hue}/${[...steps][0]}`
        else if (fixed.size === 1 && !fixed.has(undefined)) modes[theme.mode] = [...fixed][0]
        else { modes[theme.mode] = 'irregular'; consistent = false }
      }
      perHue.push({ template, hues: [...members.keys()], modes, consistent })
    }
    const coveredHues = new Set(perHue.filter(t => t.consistent).flatMap(t => t.hues))
    if (unresolved) issues.push({ level: 'error', message: `${collection.id}: ${unresolved} binding(s) do not resolve.` })
    return {
      id: collection.id, modes: collection.modes, count: tokens.length, literal, chained, themes, arrangement,
      areas: Object.fromEntries(areas), stateWords: [...stateWords], stateFamilies: stateFamilies.length,
      kinds: Object.fromEntries(kinds), perHue: perHue.sort((a, b) => a.template.localeCompare(b.template)),
      excludedHues: perHue.some(t => t.consistent) ? [...hues].filter(hue => !coveredHues.has(hue)) : [],
    }
  })

  return {
    files: files.length,
    collections: collections.map(({ id, name, nameSource, kind, literal, alias, other, modes }) => ({ id, name, nameSource, kind, literal, alias, other, modes })),
    palettes, roles: roleSets, issues,
  }
}

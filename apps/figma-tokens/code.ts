// Stylos Tokens: self-contained entrypoint for the account-library plugin.
// Keep this file dependency-free: Figma deploys code.ts and ui.html together.
type Theme = 'light' | 'dark'
type Palette = Record<string, Record<Theme, string>>
type RoleRecord = { path: string; ref: Record<string, string>; alpha: Record<Theme, number>; generated: string | null }
type Bundle = { format: string; version: number; source: { fingerprint: string; version: string }; basePalette: Palette; palette: Palette; roles: RoleRecord[]; coordinates?: Record<string, { space: string; lch: number[] }> }
type Target = { collection: string; mode: string }
type Mapping = { light: Target; dark: Target; roles: { collection: string; light: string; dark: string }; includeRoles: boolean; allowRebind: boolean; allowOverwrite: boolean }
type State = { collections: VariableCollection[]; variables: Variable[] }
type CollectionPlan = { key: string; name: string; existing?: VariableCollection; modes: Map<string, string> }
type Operation = { key: string; path: string; theme: Theme; collection: string; mode: string; variable?: Variable; value?: RGBA; binding?: string; alpha?: number; before: VariableValue | undefined; action: 'create' | 'update' | 'unchanged' }
type Plan = { bundle: Bundle; mapping: Mapping; state: string; collections: CollectionPlan[]; operations: Operation[]; errors: string[]; variableNames: Map<string, string> }
const THEMES: Theme[] = ['light', 'dark']
const NEW = 'new:'
const HEX = /^#[0-9a-f]{6}$/i
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
function fail(message: string): never { throw new Error(message) }
function pathValid(name: string) { return /^[a-z][a-z0-9-]*\/(?:\d+|black|white)$/.test(name) && (name.startsWith('mono/') ? /^mono\/(black|white)$/.test(name) : Number(name.split('/')[1]) >= 25 && Number(name.split('/')[1]) <= 975 && String(Number(name.split('/')[1])) === name.split('/')[1]) }
function validatePalette(palette: Palette, label: string) {
  if (!palette || typeof palette !== 'object' || Array.isArray(palette) || !Object.keys(palette).length || Object.keys(palette).length > 5000) fail(`${label}: expected 1–5000 palette tokens.`)
  for (const [path, values] of Object.entries(palette)) if (!pathValid(path) || !values || Object.keys(values).length !== 2 || THEMES.some(mode => typeof values[mode] !== 'string' || !HEX.test(values[mode]))) fail(`${label}: invalid token or themes at ${path}.`)
  const numbered = Object.keys(palette).filter(path => !path.startsWith('mono/'))
  const steps = new Set(numbered.map(path => path.split('/')[1]))
  for (const hue of new Set(numbered.map(path => path.split('/')[0]))) for (const step of steps) if (!palette[`${hue}/${step}`]) fail(`${label}: ${hue} is missing step ${step}.`)
}
function validateBundle(input: unknown): Bundle {
  const bundle = input as Bundle
  if (!bundle || bundle.format !== 'stylos-figma-colors' || bundle.version !== 1 || !/^[0-9a-f]{64}$/.test(bundle.source?.fingerprint) || !Array.isArray(bundle.roles) || bundle.roles.length > 20000) fail('Use Export for Figma → Advanced → Download plugin transfer in Colors. Native DTCG files go to Figma Variables → Import mode.')
  validatePalette(bundle.palette, 'Palette')
  validatePalette(bundle.basePalette, 'Source palette')
  for (const path of Object.keys(bundle.basePalette)) if (!bundle.palette[path]) fail(`The bundle removes source token ${path}.`)
  const names = new Set<string>()
  for (const role of bundle.roles) {
    if (!role || !/^(surface|text|background|border|shadow)\/[a-z0-9/-]+$/.test(role.path) || role.path.includes('//') || role.path.endsWith('/') || names.has(role.path)) fail('Invalid or duplicate role path.')
    names.add(role.path)
    for (const theme of THEMES) {
      const ref = role.ref?.[theme] ?? role.ref?.default
      if (typeof ref !== 'string' || !ref.startsWith('palette/') || !bundle.palette[ref.slice(8)] || typeof role.alpha?.[theme] !== 'number' || !Number.isFinite(role.alpha[theme]) || role.alpha[theme] < 0 || role.alpha[theme] > 1) fail(`Invalid reference or opacity: ${role.path} (${theme}).`)
    }
  }
  // Coordinates are editor metadata, never a value written into Figma. Validate
  // their shape before preserving them in a return draft.
  if (bundle.coordinates) for (const [key, point] of Object.entries(bundle.coordinates)) {
    const [theme, path] = key.split(':')
    if (!THEMES.includes(theme as Theme) || !bundle.palette[path] || !['oklch', 'cielch'].includes(point?.space) || !Array.isArray(point.lch) || point.lch.length !== 3 || point.lch.some(value => !Number.isFinite(value)) || point.lch[0] < 0 || point.lch[0] > 100 || point.lch[1] < 0 || point.lch[1] > (point.space === 'oklch' ? 0.5 : 150) || point.lch[2] < 0 || point.lch[2] > 360) fail(`Invalid graph coordinates: ${key}.`)
  }
  return bundle
}
function rgba(hex: string): RGBA { return { r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255, a: 1 } }
function literalHex(value: VariableValue | undefined): string | null {
  if (!value || typeof value !== 'object' || !('r' in value) || !('g' in value) || !('b' in value) || ('a' in value && value.a !== 1)) return null
  const channels = [value.r, value.g, value.b]
  if (channels.some(channel => !Number.isFinite(channel) || channel < 0 || channel > 1)) return null
  return '#' + channels.map(channel => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')
}
function aliasValue(value: VariableValue | undefined): { id: string; alpha: number } | null {
  if (!value || typeof value !== 'object') return null
  if ('type' in value && value.type === 'VARIABLE_ALIAS') return { id: value.id, alpha: 1 }
  const composed = value as { color?: VariableAlias | null; opacity?: unknown }
  if (composed.color?.type === 'VARIABLE_ALIAS' && typeof composed.opacity === 'number') return { id: composed.color.id, alpha: composed.opacity / 100 }
  return null
}
async function readState(): Promise<State> {
  const [collections, variables] = await Promise.all([figma.variables.getLocalVariableCollectionsAsync(), figma.variables.getLocalVariablesAsync()])
  if (variables.length > 50000) fail('This file has more than 50,000 variables. Use a smaller foundations file.')
  return { collections, variables }
}
function fingerprint(state: State) {
  return JSON.stringify({ collections: state.collections.map(c => [c.id, c.name, c.remote, c.isExtension, c.modes]), variables: state.variables.map(v => [v.id, v.variableCollectionId, v.name, v.resolvedType, v.remote, v.valuesByMode]) })
}
function buildPlan(bundle: Bundle, mapping: Mapping, state: State): Plan {
  validateBundle(bundle)
  const plan: Plan = { bundle, mapping: copy(mapping), state: fingerprint(state), collections: [], operations: [], errors: [], variableNames: new Map(state.variables.map(v => [v.id, `${state.collections.find(c => c.id === v.variableCollectionId)?.name ?? 'collection'}/${v.name}`])) }
  if (!mapping?.light || !mapping?.dark || !mapping?.roles) fail('Choose target collections and modes first.')
  if (mapping.light.collection === mapping.dark.collection) fail('Stylos uses separate light and dark palette collections. Choose two different collections.')
  if (mapping.includeRoles && [mapping.light.collection, mapping.dark.collection].includes(mapping.roles.collection)) fail('The color role collection must be separate from both palette collections.')
  if (mapping.includeRoles && mapping.roles.light === mapping.roles.dark) fail('Choose different light and dark modes for the color roles.')
  const byCollection = new Map<string, Map<string, Variable[]>>()
  for (const variable of state.variables) {
    if (!byCollection.has(variable.variableCollectionId)) byCollection.set(variable.variableCollectionId, new Map())
    const group = byCollection.get(variable.variableCollectionId)!
    if (!group.has(variable.name)) group.set(variable.name, [])
    group.get(variable.name)!.push(variable)
  }
  function target(selection: Target): CollectionPlan {
    if (typeof selection.collection !== 'string' || typeof selection.mode !== 'string' || !selection.collection || !selection.mode) fail('Choose every target collection and mode.')
    let c = plan.collections.find(item => item.key === selection.collection)
    if (!c) {
      const existing = state.collections.find(item => item.id === selection.collection)
      const name = selection.collection.startsWith(NEW) ? selection.collection.slice(NEW.length).trim() : existing?.name
      if (!name || name.length > 120 || existing?.remote || existing?.isExtension) fail('Choose a local, editable variable collection.')
      if (!existing && state.collections.some(item => item.name === name)) fail(`A collection named ${name} already exists. Select it explicitly or refresh the list.`)
      c = { key: selection.collection, name, existing, modes: new Map() }
      plan.collections.push(c)
    }
    const mode = c.existing?.modes.find(item => item.modeId === selection.mode)
    const name = selection.mode.startsWith(NEW) ? selection.mode.slice(NEW.length).trim() : mode?.name
    if (!name || name.length > 120 || (!mode && !selection.mode.startsWith(NEW))) fail(`Choose a valid mode for ${c.name}.`)
    if (!mode && c.existing?.modes.some(item => item.name === name)) fail(`${c.name} already has mode ${name}. Refresh and select that mode.`)
    c.modes.set(selection.mode, name)
    return c
  }
  function variableFor(c: CollectionPlan, name: string) {
    const matches = c.existing ? byCollection.get(c.existing.id)?.get(name) ?? [] : []
    if (matches.length > 1) plan.errors.push(`${c.name}/${name}: duplicate names; choose a collection with unique variable names.`)
    const variable = matches[0]
    if (variable && (variable.remote || variable.resolvedType !== 'COLOR')) plan.errors.push(`${c.name}/${name}: expected an editable COLOR variable.`)
    return variable
  }
  const paletteOps = new Map<string, Operation>()
  for (const theme of THEMES) {
    const selected = mapping[theme]
    const collection = target(selected)
    for (const [path, values] of Object.entries(bundle.palette)) {
      const variable = variableFor(collection, path)
      const before = variable?.valuesByMode[selected.mode]
      if (variable && before === undefined && !selected.mode.startsWith(NEW)) plan.errors.push(`${collection.name}/${variable.name}: existing mode has no explicit value; repair it before importing.`)
      const value = rgba(values[theme])
      const currentHex = literalHex(before)
      const same = currentHex === values[theme].toLowerCase()
      if (variable && before !== undefined && !same && !mapping.allowOverwrite && currentHex !== bundle.basePalette[path]?.[theme]?.toLowerCase()) plan.errors.push(`${collection.name}/${path}: changed in Figma since the source snapshot. Review it or enable overwrite.`)
      const operation: Operation = { key: `${selected.collection}:${path}`, path, theme, collection: selected.collection, mode: selected.mode, variable, before, value, action: variable ? same ? 'unchanged' : 'update' : 'create' }
      paletteOps.set(`${theme}:${path}`, operation)
      plan.operations.push(operation)
    }
  }
  if (mapping.includeRoles) for (const theme of THEMES) {
    const selected = { collection: mapping.roles.collection, mode: mapping.roles[theme] }
    const collection = target(selected)
    for (const role of bundle.roles) {
      const path = (role.ref[theme] ?? role.ref.default).slice(8)
      const binding = paletteOps.get(`${theme}:${path}`)!
      const variable = variableFor(collection, role.path)
      const before = variable?.valuesByMode[selected.mode]
      if (variable && before === undefined && !selected.mode.startsWith(NEW)) plan.errors.push(`${collection.name}/${variable.name}: existing mode has no explicit value; repair it before importing.`)
      const alias = aliasValue(before)
      const sameBinding = Boolean(alias && binding.variable && alias.id === binding.variable.id)
      const same = sameBinding && alias!.alpha === role.alpha[theme]
      if (variable && before !== undefined && !sameBinding && !mapping.allowRebind) plan.errors.push(`${collection.name}/${role.path} (${theme}): its existing binding would change. Enable role rebinding only after reviewing this target.`)
      plan.operations.push({ key: `${selected.collection}:${role.path}`, path: role.path, theme, collection: selected.collection, mode: selected.mode, variable, before, binding: binding.key, alpha: role.alpha[theme], action: variable ? same ? 'unchanged' : 'update' : 'create' })
    }
  }
  return plan
}
function describeValue(value: VariableValue | undefined, names: Map<string, string>) {
  if (value === undefined) return 'Not set'
  const alias = aliasValue(value)
  return literalHex(value) ?? (alias ? `Alias ${names.get(alias.id) ?? alias.id}${alias.alpha === 1 ? '' : ` · ${Math.round(alias.alpha * 100)}%`}` : JSON.stringify(value))
}
function preview(plan: Plan) {
  const added = new Set(plan.operations.filter(op => !op.variable).map(op => op.key)).size
  const byRole = new Map(plan.bundle.roles.map(role => [role.path, role]))
  const byKey = new Map(plan.operations.map(op => [op.key, op]))
  const followsPalette = (op: Operation) => op.action === 'unchanged' && Boolean(op.binding && byKey.get(op.binding)?.action === 'update')
  return {
    createVariables: added, updateValues: plan.operations.filter(op => op.action === 'update').length,
    unchanged: plan.operations.filter(op => op.action === 'unchanged').length,
    affectedRoles: plan.operations.filter(followsPalette).length,
    createCollections: plan.collections.filter(c => !c.existing).map(c => c.name),
    targets: plan.collections.map(c => ({ name: c.name, modes: [...c.modes].map(([key, name]) => ({ name, create: key.startsWith(NEW) })) })),
    errors: plan.errors,
    rows: plan.operations.map(op => {
      const role = byRole.get(op.path)
      return ({
      path: op.path, theme: op.theme, collection: plan.collections.find(c => c.key === op.collection)!.name,
      before: describeValue(op.before, plan.variableNames), after: op.value ? plan.bundle.palette[op.path][op.theme] : `${role!.ref[op.theme] ?? role!.ref.default}${op.alpha === 1 ? '' : ` · ${Math.round(op.alpha! * 100)}%`}`, action: op.action,
      followsPalette: followsPalette(op), beforeColor: literalHex(op.before),
      afterColor: op.value ? plan.bundle.palette[op.path][op.theme] : plan.bundle.palette[(role!.ref[op.theme] ?? role!.ref.default).slice(8)][op.theme],
    })}),
  }
}
async function applyPlan(plan: Plan) {
  const current = await readState()
  if (fingerprint(current) !== plan.state) fail('Variables or modes changed after preview. Review changes again before applying.')
  if (plan.errors.length) fail('Resolve the preview conflicts before applying.')
  const createdCollections: VariableCollection[] = []
  const createdModes: { collection: VariableCollection; id: string }[] = []
  const createdVariables: Variable[] = []
  const restored: { variable: Variable; mode: string; value: VariableValue | undefined }[] = []
  const collections = new Map<string, VariableCollection>()
  const modes = new Map<string, string>()
  const variables = new Map<string, Variable>()
  figma.commitUndo()
  try {
    for (const c of plan.collections) {
      const collection = c.existing ?? figma.variables.createVariableCollection(c.name)
      collections.set(c.key, collection)
      if (!c.existing) createdCollections.push(collection)
      let first = true
      for (const [key, name] of c.modes) {
        let id = key
        if (key.startsWith(NEW)) {
          if (!c.existing && first) { id = collection.defaultModeId; collection.renameMode(id, name) }
          else { id = collection.addMode(name); createdModes.push({ collection, id }) }
        }
        modes.set(`${c.key}:${key}`, id)
        first = false
      }
    }
    // Create every variable before writing aliases, so forward references work.
    for (const op of plan.operations) {
      if (variables.has(op.key)) continue
      const variable = op.variable ?? figma.variables.createVariable(op.path, collections.get(op.collection)!, 'COLOR')
      if (!op.variable) {
        createdVariables.push(variable)
        const area = op.path.split('/')[0]
        variable.scopes = op.value ? ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'] : area === 'text' ? ['TEXT_FILL'] : area === 'border' ? ['STROKE_COLOR'] : area === 'shadow' ? ['EFFECT_COLOR'] : ['FRAME_FILL', 'SHAPE_FILL']
      }
      variables.set(op.key, variable)
    }
    for (const op of plan.operations) {
      if (op.action === 'unchanged') continue
      const variable = variables.get(op.key)!
      const mode = modes.get(`${op.collection}:${op.mode}`)!
      if (op.variable) restored.push({ variable, mode, value: op.before === undefined ? undefined : copy(op.before) })
      let value: VariableValue
      if (op.value) value = op.value
      else {
        const alias = figma.variables.createVariableAlias(variables.get(op.binding!)!)
        // The account-library compiler can lag the September 2026 Plugin API.
        // Keep its legacy typings compatible with documented composed colors.
        value = op.alpha === 1 ? alias : { color: alias, opacity: op.alpha! * 100 } as unknown as VariableValue
      }
      variable.setValueForMode(mode, value)
    }
    figma.commitUndo()
  } catch (error) {
    const recovery: string[] = []
    for (const item of restored.reverse()) try {
      // Unset values only occur in newly created modes, which are removed below.
      if (item.value !== undefined && !equal(item.variable.valuesByMode[item.mode], item.value)) item.variable.setValueForMode(item.mode, item.value)
    } catch (rollback) { recovery.push(String(rollback)) }
    for (const variable of createdVariables.reverse()) try { variable.remove() } catch (rollback) { recovery.push(String(rollback)) }
    for (const item of createdModes.reverse()) try { item.collection.removeMode(item.id) } catch (rollback) { recovery.push(String(rollback)) }
    for (const collection of createdCollections.reverse()) try { collection.remove() } catch (rollback) { recovery.push(String(rollback)) }
    if (recovery.length) fail(`Import failed and rollback was incomplete. Use Figma Undo and inspect the file. ${String(error)}; ${recovery.join('; ')}`)
    fail(`Import cancelled; changes rolled back. ${String(error)}. If a mode limit or composed color is unsupported, check the file plan or update Figma.`)
  }
}
async function exportDraft(bundle: Bundle, mapping: Mapping) {
  const state = await readState()
  const palette: Palette = {}
  for (const theme of THEMES) {
    const target = mapping[theme]
    const collection = state.collections.find(c => c.id === target.collection)
    if (!collection || !collection.modes.some(mode => mode.modeId === target.mode)) fail('Select existing palette collections and modes before exporting from Figma.')
    for (const variable of state.variables.filter(v => v.variableCollectionId === collection.id && v.resolvedType === 'COLOR' && pathValid(v.name))) {
      const hex = literalHex(variable.valuesByMode[target.mode])
      if (!hex) fail(`${collection.name}/${variable.name} is an alias, translucent or unset. Palette export requires opaque literal colors.`)
      if (!palette[variable.name]) palette[variable.name] = {} as Record<Theme, string>
      if (palette[variable.name][theme]) fail(`Duplicate palette name ${variable.name}.`)
      palette[variable.name][theme] = hex
    }
  }
  validatePalette(palette, 'Figma palette')
  for (const path of Object.keys(bundle.basePalette)) if (!palette[path]) fail(`Figma is missing source token ${path}. Choose the correct collections.`)
  const changes: { path: string; mode: Theme; before: string | null; after: string }[] = []
  for (const [path, values] of Object.entries(palette)) for (const mode of THEMES) {
    const before = bundle.basePalette[path]?.[mode] ?? null
    if (before?.toLowerCase() !== values[mode]) changes.push({ path: `palette/${path}`, mode, before, after: values[mode] })
  }
  // Figma exports HEX only: graph coordinates must be recomputed in the editor.
  // Returning old LCH after an independent Figma edit would resurrect stale data.
  return { format: 'stylos-color-changes', version: 2, base: bundle.source.fingerprint, changes, coordinates: {} }
}

// PLUGIN BOOTSTRAP — install the message handler before opening the iframe.
let bundle: Bundle | null = null
let pending: Plan | null = null
let reviewId = 0
let busy = false
const emit = (message: object) => figma.ui.postMessage(message)
async function sendCollections(send: (message: object) => void) {
  const state = await readState()
  send({ type: 'collections', collections: state.collections.filter(c => !c.remote && !c.isExtension).map(c => ({ id: c.id, name: c.name, modes: c.modes })) })
}
figma.ui.onmessage = async (message) => {
  if (!message || typeof message.type !== 'string') return
  if (message.type === 'invalidate') { pending = null; return }
  if (message.type === 'resize') {
    try { if (Number.isFinite(message.height)) figma.ui.resize(560, Math.max(360, Math.min(720, Math.round(message.height)))) } catch { /* Some embedded hosts keep their own panel size. */ }
    return
  }
  const requestId = Number.isSafeInteger(message.requestId) ? message.requestId : null
  const send = (response: object) => emit({ ...response, requestId })
  // Retried startup messages can arrive while the first async read is pending.
  // A readiness reply is sufficient; do not interrupt that read with an error.
  if (busy) {
    if (message.type === 'init') return
    send({ type: 'error', message: 'Wait for the current operation to finish.' })
    return
  }
  busy = true
  try {
    if (message.type === 'init') { await sendCollections(send); send({ type: 'ready' }) }
    else if (message.type === 'load') {
      if (typeof message.text !== 'string' || message.text.length > 2_000_000) fail('Choose a JSON file smaller than 2 MB.')
      pending = null; bundle = null
      bundle = copy(validateBundle(JSON.parse(message.text)))
      await sendCollections(send)
      send({ type: 'loaded', palette: Object.keys(bundle.palette).length, roles: bundle.roles.length, version: bundle.source.version, fingerprint: bundle.source.fingerprint })
    } else if (message.type === 'preview') {
      pending = null
      if (!bundle) fail('Open a Stylos Figma transfer file first.')
      pending = buildPlan(bundle, message.mapping, await readState())
      reviewId++
      send({ type: 'preview', reviewId, ...preview(pending) })
    } else if (message.type === 'apply') {
      if (!pending || message.reviewId !== reviewId) fail('Review changes before applying.')
      const plan = pending; pending = null
      const result = preview(plan)
      await applyPlan(plan)
      await sendCollections(send)
      send({ type: 'applied', ...result, message: 'Tokens applied. Use Figma Undo to revert this import.' })
    } else if (message.type === 'export') {
      if (!bundle) fail('Open the Stylos transfer file to establish the source for the return draft.')
      send({ type: 'download', name: 'stylos-colors.from-figma.draft.json', text: JSON.stringify(await exportDraft(bundle, message.mapping), null, 2) + '\n' })
    } else fail('Unknown plugin command. Reopen Stylos Tokens and try again.')
  } catch (error) { pending = null; send({ type: 'error', message: error instanceof Error ? error.message : String(error) }) }
  finally { busy = false; send({ type: 'idle' }) }
}
figma.showUI(__html__, { width: 560, height: 600, themeColors: true })
try {
  // Relaunch metadata is optional in embedded hosts. It must not prevent the
  // import UI and its message handler from starting when the host lacks it.
  figma.root.setRelaunchData({ '314b1bc6-3c77-43ae-adee-0fa63868958a': 'Import and export Stylos color tokens' })
} catch { /* The standalone plugin still uses the manifest relaunch command. */ }

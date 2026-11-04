import { MODES, assignRole, assignScale, exportChanges, noAssignments, scaleRef, withDraftRoles } from './model.mjs'
import { validateProjections } from './projection.mjs'

/** A self-contained transfer, rather than a patch that needs a repository at runtime.
 * @param {import('./model.mjs').Snapshot} snapshot
 * @param {import('./model.mjs').Palette} palette
 * @param {import('./model.mjs').Coordinates} coordinates
 * @param {import('./model.mjs').Assignments} assignments
 */
export function createFigmaBundle(snapshot, palette, coordinates = {}, assignments = noAssignments()) {
  exportChanges(snapshot, palette, coordinates, assignments)
  validateProjections(palette, coordinates)
  return {
    format: 'stylos-figma-colors', version: 1,
    source: { fingerprint: snapshot.fingerprint, version: snapshot.version },
    basePalette: structuredClone(snapshot.palette),
    palette: structuredClone(palette),
    roles: structuredClone(withDraftRoles(snapshot, palette, assignments).roles),
    specialScale: Object.fromEntries(Object.keys(snapshot.specialScale.roles).map(template => [template,
      Object.fromEntries(MODES.map(mode => [mode, scaleRef(snapshot, assignments, template, mode)]))])),
    coordinates: structuredClone(coordinates),
  }
}

/** Open a complete transfer as a source-checked editor draft. Generated roles
 * follow the scale, so only recorded roles and the scale itself are read back.
 * @param {import('./model.mjs').Snapshot} snapshot @param {unknown} input
 */
export function draftFromFigmaBundle(snapshot, input) {
  const bundle = /** @type {ReturnType<typeof createFigmaBundle>} */ (input)
  if (!bundle || bundle.format !== 'stylos-figma-colors' || bundle.version !== 1 || bundle.source?.fingerprint !== snapshot.fingerprint) {
    throw new Error('This color transfer does not match the current Stylos source.')
  }
  let assignments = noAssignments()
  const source = new Map(snapshot.roles.filter(role => !role.generated).map(role => [role.path, role]))
  for (const role of bundle.roles ?? []) {
    if (source.has(role.path)) for (const mode of MODES) assignments = assignRole(snapshot, assignments, role.path, mode, role.ref[mode] ?? role.ref.default)
  }
  for (const [template, modes] of Object.entries(bundle.specialScale ?? {})) {
    for (const mode of MODES) assignments = assignScale(snapshot, assignments, template, mode, modes[mode])
  }
  const result = exportChanges(snapshot, bundle.palette, bundle.coordinates ?? {}, assignments)
  validateProjections(bundle.palette, result.coordinates ?? {})
  return result
}

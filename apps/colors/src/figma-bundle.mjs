import { exportChanges, withDraftRoles } from './model.mjs'
import { validateProjections } from './projection.mjs'

/** A self-contained transfer, rather than a patch that needs a repository at runtime.
 * @param {import('./model.mjs').Snapshot} snapshot
 * @param {import('./model.mjs').Palette} palette
 * @param {import('./model.mjs').Coordinates} coordinates
 */
export function createFigmaBundle(snapshot, palette, coordinates = {}) {
  exportChanges(snapshot, palette, coordinates)
  validateProjections(palette, coordinates)
  return {
    format: 'stylos-figma-colors', version: 1,
    source: { fingerprint: snapshot.fingerprint, version: snapshot.version },
    basePalette: structuredClone(snapshot.palette),
    palette: structuredClone(palette),
    roles: structuredClone(withDraftRoles(snapshot, palette).roles),
    coordinates: structuredClone(coordinates),
  }
}

/** Open the palette of a complete transfer as a source-checked editor draft.
 * Role bindings remain derived from the current canonical source.
 * @param {import('./model.mjs').Snapshot} snapshot @param {unknown} input
 */
export function draftFromFigmaBundle(snapshot, input) {
  const bundle = /** @type {ReturnType<typeof createFigmaBundle>} */ (input)
  if (!bundle || bundle.format !== 'stylos-figma-colors' || bundle.version !== 1 || bundle.source?.fingerprint !== snapshot.fingerprint) {
    throw new Error('This color transfer does not match the current Stylos source.')
  }
  const result = exportChanges(snapshot, bundle.palette, bundle.coordinates ?? {})
  validateProjections(bundle.palette, result.coordinates ?? {})
  return result
}

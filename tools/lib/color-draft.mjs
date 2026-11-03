// Validate a complete editor draft through the same pipeline as a system build.
// No writes: the result can be reviewed or passed to a separate authoring step.
import { buildColorsSnapshot } from '../build-colors-data.mjs';
import { importChanges, exportChanges, withDraftRoles, resolveRole } from '../../apps/colors/src/model.mjs';
import { validateProjections, projectCoordinate } from '../../apps/colors/src/projection.mjs';
import { loadCanonical } from './tokens.mjs';
import { loadSpecialScale, withSpecialRoles } from './special-colors.mjs';
import { verifyCanonical } from './verify.mjs';
import { buildCss } from '../build-css.mjs';
import { readNaming, runCheck } from '../check-tokens.mjs';
import { loadEffectStyles } from './effect-styles.mjs';
import { loadSurfaceMotionProfile } from './surface-motion-profiles.mjs';

export function prepareColorDraft(root, input) {
  const check = runCheck({ root });
  if (!check.ok) throw new Error(check.errors.join('\n'));
  const snapshot = buildColorsSnapshot(root);
  const draft = importChanges(snapshot, input);
  const patch = exportChanges(snapshot, draft, input.coordinates ?? {});
  validateProjections(draft, patch.coordinates);
  const outside = Object.entries(patch.coordinates).filter(([, point]) => !projectCoordinate(point).displayable).map(([key]) => key);

  const collections = loadCanonical(root, [], { derived: false });
  const palette = collections.find(collection => collection.name === 'palette');
  palette.tokens = new Map(Object.entries(draft).map(([name, values]) => [name, {
    ...(palette.tokens.get(name) ?? { type: 'color', id: null, scopes: [], alpha: new Map(), ref: null }),
    values: new Map(Object.entries(values)),
  }]));
  const proposed = collections.map(collection => collection.name === 'color'
    ? withSpecialRoles(collection, palette, loadSpecialScale(root)) : collection);
  const problems = { errors: [], warnings: [] };
  verifyCanonical({ collections: proposed }, problems);
  if (problems.errors.length) throw new Error(problems.errors.join('\n'));
  const output = buildCss({ collections: proposed, naming: readNaming(root), effectStyles: loadEffectStyles(root), surfaceMotion: loadSurfaceMotionProfile(root) });
  if (output.errors.length) throw new Error(output.errors.join('\n'));

  const project = withDraftRoles(snapshot, draft);
  const affected = [];
  for (const role of project.roles) for (const mode of ['light', 'dark']) {
    const after = resolveRole(project, draft, role.path, mode);
    const before = snapshot.roles.some(item => item.path === role.path) ? resolveRole(snapshot, snapshot.palette, role.path, mode) : null;
    if (!before || before.value !== after.value || before.alpha !== after.alpha) affected.push({
      path: `color/${role.path}`, mode, ref: after.ref, before: before?.value ?? null,
      after: after.value, alpha: after.alpha, generated: Boolean(role.generated),
    });
  }
  return { snapshot, draft, patch, outside, affected, css: output.css, manifest: output.manifest };
}

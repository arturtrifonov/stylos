import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildColorsSnapshot } from './build-colors-data.mjs';
import { loadCanonical, resolve } from './lib/tokens.mjs';
import { prepareColorDraft } from './lib/color-draft.mjs';
import { projectCoordinate, validateProjections } from '../apps/colors/src/projection.mjs';
import { oklch, cielch } from '../apps/colors/src/huetone/shared/colorFuncs/colorModels.mjs';
import { rgb2xyz } from '../apps/colors/src/huetone/shared/colorFuncs/utils.mjs';
import { reviewColorChanges, writeColorPreview } from './review-color-changes.mjs';
import { createDraft, exportChanges, importChanges, importAssignments, resolveRole, colorCss, addHue, addStep, withDraftRoles, assignRole, assignScale, scaleRef, noAssignments } from '../apps/colors/src/model.mjs';
import { createFigmaBundle, draftFromFigmaBundle } from '../apps/colors/src/figma-bundle.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const snapshot = buildColorsSnapshot(root);

test('opening, exporting and restoring a project preserves every original HEX in both themes', () => {
  const draft = createDraft(snapshot);
  const patch = exportChanges(snapshot, draft);
  assert.deepEqual(patch.changes, []);
  assert.deepEqual(importChanges(snapshot, JSON.parse(JSON.stringify(patch))), snapshot.palette);
  assert.notEqual(draft['slate/25'], snapshot.palette['slate/25']);
  const [palette] = loadCanonical(root, ['palette']);
  for (const [name, token] of palette.tokens) {
    for (const mode of palette.modes) assert.equal(draft[name][mode], token.values.get(mode));
  }
});

test('every semantic and generated special preview agrees with the canonical resolver, including alpha', () => {
  const collections = loadCanonical(root, ['palette', 'color']);
  for (const role of snapshot.roles) {
    for (const mode of ['light', 'dark']) {
      const expected = resolve(collections, 'color', role.path, mode);
      const actual = resolveRole(snapshot, snapshot.palette, role.path, mode);
      assert.equal(actual.value, expected.value, `${role.path} (${mode})`);
      assert.equal(actual.alpha, expected.alpha, `${role.path} alpha (${mode})`);
    }
  }
  assert.equal(snapshot.roles.filter(role => role.generated).length, 242);
  assert.equal(colorCss(resolveRole(snapshot, snapshot.palette, 'shadow/base', 'dark')), 'rgb(0 0 0 / 0.83)');
});

test('a palette edit propagates to dependent semantics and special roles in its own theme', () => {
  const draft = createDraft(snapshot);
  draft['indigo/700'].light = '#123456';
  assert.equal(resolveRole(snapshot, draft, 'surface/bold/primary/default', 'light').value, '#123456');
  assert.equal(resolveRole(snapshot, draft, 'surface/bold/special/indigo/hover', 'light').value, '#123456');
  assert.equal(resolveRole(snapshot, draft, 'surface/bold/primary/default', 'dark').value, snapshot.palette['indigo/700'].dark);
  const patch = JSON.parse(JSON.stringify(exportChanges(snapshot, draft)));
  assert.equal(patch.changes.length, 1);
  assert.deepEqual(importChanges(snapshot, patch), draft);
  assert.match(reviewColorChanges(root, patch), /palette\/indigo\/700 \(light\): .* → #123456/);
});

test('stale or malformed changes cannot partially apply or remove tokens', () => {
  const draft = createDraft(snapshot);
  draft['slate/25'].dark = '#123456';
  const patch = exportChanges(snapshot, draft);
  assert.throws(() => importChanges(snapshot, { ...patch, base: 'old' }), /source tokens have changed/);
  for (const change of [
    { ...patch.changes[0], path: 'palette/new/25' },
    { ...patch.changes[0], path: 'palette/__proto__' },
    { ...patch.changes[0], mode: 'default' },
    { ...patch.changes[0], before: '#ffffff' },
    { ...patch.changes[0], after: 'red' },
  ]) assert.throws(() => importChanges(snapshot, { ...patch, changes: [...patch.changes, change] }));
  assert.throws(() => importChanges(snapshot, { ...patch, changes: [...patch.changes, ...patch.changes] }), /Duplicate/);
  delete draft['slate/25'];
  assert.throws(() => exportChanges(snapshot, draft), /preserve every/);
  assert.notEqual(snapshot.palette['slate/25'].dark, '#123456');
});

test('a new canonical import invalidates old browser drafts even when values are the same', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'stylos-colors-'));
  try {
    cpSync(path.join(root, 'tokens'), path.join(fixture, 'tokens'), { recursive: true });
    cpSync(path.join(root, 'package.json'), path.join(fixture, 'package.json'));
    const before = buildColorsSnapshot(fixture);
    appendFileSync(path.join(fixture, 'tokens/palette.yaml'), '\n# New source import\n');
    const after = buildColorsSnapshot(fixture);
    assert.notEqual(before.fingerprint, after.fingerprint);
    assert.deepEqual(before.palette, after.palette);
    assert.throws(() => importChanges(after, exportChanges(before, createDraft(before))), /source tokens have changed/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('new rows and columns round-trip with both themes and generated special families', () => {
  let draft = addHue(createDraft(snapshot), 'brand', 'indigo');
  draft = addStep(draft, '750', (hue, mode) => draft[`${hue}/700`][mode]);
  const patch = exportChanges(snapshot, draft);
  assert.equal(patch.version, 3);
  assert.deepEqual(importChanges(snapshot, JSON.parse(JSON.stringify(patch))), draft);
  assert.equal(patch.changes.filter(change => change.before === null).length, (13 + 23) * 2);
  const project = withDraftRoles(snapshot, draft);
  assert.equal(project.roles.length, snapshot.roles.length + 11);
  assert.equal(resolveRole(project, draft, 'text/special/brand', 'dark').value, draft['brand/800'].dark);
  assert.match(reviewColorChanges(root, patch), /palette\/brand\/700 \(light\): \(new\).*dependent roles/);
  assert.throws(() => addHue(draft, 'brand', 'indigo'), /already exists/);
  assert.throws(() => addStep(draft, '750', () => '#123456'), /already exists/);
  assert.throws(() => addStep(draft, '1000', () => '#123456'), /25 to 975/);
  const incomplete = structuredClone(patch);
  incomplete.changes = incomplete.changes.filter(change => !(change.path === 'palette/brand/25' && change.mode === 'dark'));
  assert.throws(() => importChanges(snapshot, incomplete), /Invalid palette token or modes/);
  const missingStep = structuredClone(patch);
  missingStep.changes = missingStep.changes.filter(change => change.path !== 'palette/brand/25');
  assert.throws(() => importChanges(snapshot, missingStep), /incomplete/);
});

test('raw graph points survive export alongside their HEX previews', () => {
  const draft = createDraft(snapshot);
  draft['indigo/700'].light = '#554eff';
  const coordinates = { 'light:indigo/700': { space: 'oklch', lch: [55, 0.33, 276.1] } };
  const patch = exportChanges(snapshot, draft, coordinates);
  assert.equal(patch.changes.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(patch)).coordinates, coordinates);
  assert.deepEqual(importChanges(snapshot, patch), draft);
  assert.match(reviewColorChanges(root, patch), /1 LCH point\(s\) retained/);
  for (const point of [
    { space: 'oklch', lch: [55, NaN, 277] },
    { space: 'oklch', lch: [55, 1, 277] },
    { space: 'unknown', lch: [55, 0.3, 277] },
  ]) assert.throws(() => importChanges(snapshot, { ...patch, coordinates: { 'light:indigo/700': point } }), /LCH coordinates/);
  assert.throws(() => importChanges(snapshot, { ...patch, coordinates: { 'light:missing/700': coordinates['light:indigo/700'] } }), /Invalid LCH/);
});

test('version-one browser drafts remain readable after the editing format is extended', () => {
  const input = { format: 'stylos-color-changes', version: 1, base: snapshot.fingerprint, changes: [
    { path: 'palette/indigo/700', mode: 'dark', before: snapshot.palette['indigo/700'].dark, after: '#123456' },
  ] };
  assert.equal(importChanges(snapshot, input)['indigo/700'].dark, '#123456');
});

test('undo restores structure and original coordinates across gamut correction and reset', async () => {
  const { createHistory, recordHistory, undoHistory, redoHistory } = await import('../apps/colors/src/history.mjs');
  const source = { palette: createDraft(snapshot), coordinates: {} };
  const added = { palette: addHue(source.palette, 'brand', 'indigo'), coordinates: {} };
  const point = { palette: { ...added.palette, 'brand/700': { ...added.palette['brand/700'], light: '#123456' } }, coordinates: { 'light:brand/700': { space: 'oklch', lch: [0.5, 0.4, 300] } } };
  const displayable = { palette: point.palette, coordinates: {} };
  let history = createHistory(source);
  for (const state of [added, point, displayable, source]) history = recordHistory(history, state);
  assert.deepEqual(history.present, source);
  history = undoHistory(history);
  assert.deepEqual(history.present, displayable);
  history = undoHistory(history);
  assert.deepEqual(history.present, point);
  assert.deepEqual(redoHistory(history).present, displayable);
  history = undoHistory(undoHistory(history));
  assert.deepEqual(history.present, source);
  assert.equal('brand/700' in history.present.palette, false);
  assert.deepEqual(redoHistory(history).present, added);
});

test('one continuous input edit has one undo, later actions branch and restored drafts retain a source undo', async () => {
  const { createHistory, recordHistory, undoHistory, redoHistory } = await import('../apps/colors/src/history.mjs');
  const source = { palette: createDraft(snapshot), coordinates: {} };
  const changed = value => ({ palette: { ...source.palette, 'indigo/700': { ...source.palette['indigo/700'], light: value } }, coordinates: {} });
  let history = createHistory(source);
  for (const value of ['#123456', '#234567', '#345678']) history = recordHistory(history, changed(value), 'gesture-1');
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoHistory(history).present, source);
  assert.deepEqual(redoHistory(undoHistory(history)).present, changed('#345678'));
  history = recordHistory(undoHistory(history), changed('#abcdef'), 'gesture-2');
  assert.equal(history.future.length, 0);
  assert.equal(recordHistory(history, history.present), history);
  assert.deepEqual(undoHistory(createHistory(changed('#123456'), source)).present, source);
  for (let index = 1; index < 80; index++) history = recordHistory(history, changed(`#${index.toString(16).padStart(6, '0')}`));
  assert.equal(history.past.length, 60);
});

test('semantic and special roles retain the full hierarchy with aligned state order and filtering', async () => {
  const { groupRoles, ROLE_STATES } = await import('../apps/colors/src/role-groups.mjs');
  const flatten = groups => groups.flatMap(area => area.sections.flatMap(section => section.families.flatMap(family => family.roles)));
  for (const special of [false, true]) {
    const grouped = groupRoles(snapshot.roles, special);
    assert.deepEqual(flatten(grouped).map(role => role.path).sort(), snapshot.roles.filter(role => Boolean(role.generated) === special).map(role => role.path).sort());
    const bold = grouped.find(area => area.area === 'surface').sections.find(section => section.name === 'bold');
    const family = bold.families.find(family => family.name === (special ? 'indigo' : 'base'));
    assert.deepEqual(family.roles.map(role => role.path.split('/').at(-1)), ROLE_STATES);
  }
  const hover = groupRoles(snapshot.roles, false, 'surface/bold/base/hover');
  assert.equal(hover[0].sections[0].families[0].name, 'base');
  assert.deepEqual(flatten(hover).map(role => role.path), ['surface/bold/base/hover']);
  const project = withDraftRoles(snapshot, addHue(createDraft(snapshot), 'brand', 'indigo'));
  assert.equal(flatten(groupRoles(project.roles, true, 'special/brand')).length, 11);
  assert.deepEqual(groupRoles(snapshot.roles, false, 'absent'), []);
});


test('shared gamut projection round-trips every source colour in OKLCH and CIELCH', () => {
  for (const values of Object.values(snapshot.palette)) for (const hex of Object.values(values)) {
    const rgb = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
    for (const model of [oklch, cielch]) {
      const point = { space: model.name, lch: model.xyz2lch(rgb2xyz(rgb)) };
      assert.equal(projectCoordinate(point).hex, hex, `${model.name}: ${hex}`);
    }
  }
  assert.deepEqual(projectCoordinate({ space: 'oklch', lch: [55, 0.33, 276.1] }), { hex: '#554eff', displayable: false });
  assert.throws(() => validateProjections(snapshot.palette, { 'light:indigo/700': { space: 'oklch', lch: [55, 0.33, 276.1] } }), /coordinates and HEX preview disagree/);
});

test('preparing a draft validates downstream CSS, new special families, both modes and opacity without writing source', () => {
  const draft = addHue(createDraft(snapshot), 'brand', 'indigo');
  draft['indigo/700'].light = '#123456';
  draft['mono/black'].dark = '#010203';
  const before = readFileSync(path.join(root, 'tokens/palette.yaml'), 'utf8');
  const plan = prepareColorDraft(root, exportChanges(snapshot, draft));
  assert.match(plan.css, /--stylos-palette-light-indigo-700: #123456;/);
  assert.match(plan.css, /--stylos-palette-dark-brand-700:/);
  assert.match(plan.css, /--stylos-color-text-special-brand:/);
  assert(plan.affected.some(role => role.path === 'color/surface/bold/primary/default' && role.mode === 'light' && role.after === '#123456'));
  assert.equal(plan.affected.filter(role => role.path.includes('special/brand')).length, 22);
  assert(plan.affected.some(role => role.path === 'color/shadow/base' && role.mode === 'dark' && role.alpha === 0.83));
  assert.equal(readFileSync(path.join(root, 'tokens/palette.yaml'), 'utf8'), before);
  assert.equal(buildColorsSnapshot(root).fingerprint, snapshot.fingerprint);
});

test('preview files carry a reviewable impact report and reject mismatched coordinates before writing', () => {
  const out = mkdtempSync(path.join(tmpdir(), 'stylos-preview-'));
  try {
    const draft = createDraft(snapshot);
    draft['indigo/700'].light = '#554eff';
    const coordinates = { 'light:indigo/700': { space: 'oklch', lch: [55, 0.33, 276.1] } };
    const patch = exportChanges(snapshot, draft, coordinates);
    assert.match(writeColorPreview(root, patch, out), /1 point\(s\) outside sRGB/);
    assert.match(readFileSync(path.join(out, 'tokens.css'), 'utf8'), /DRAFT PREVIEW/);
    assert.equal(JSON.parse(readFileSync(path.join(out, 'tokens.json'), 'utf8')).preview, true);
    assert(JSON.parse(readFileSync(path.join(out, 'impact.json'), 'utf8')).some(role => role.path === 'color/shadow/primary' && role.alpha === 0.04));
    assert.deepEqual(JSON.parse(readFileSync(path.join(out, 'draft.json'), 'utf8')), patch);
    const bad = structuredClone(patch);
    bad.changes[0].after = '#123456';
    const failed = path.join(out, 'failed');
    assert.throws(() => writeColorPreview(root, bad, failed), /coordinates and HEX preview disagree/);
    assert.equal(existsSync(failed), false);
    assert.throws(() => writeColorPreview(root, patch, path.join(root, 'tokens')), /Choose a preview directory/);
    assert.throws(() => prepareColorDraft(root, { ...patch, base: 'stale' }), /source tokens have changed/);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('a semantic role is reassigned per theme, survives a round trip and returns to source', () => {
  const draft = createDraft(snapshot);
  const source = snapshot.roles.find(role => role.path === 'text/base');
  const sourceDark = source.ref.dark ?? source.ref.default;
  const assignments = assignRole(snapshot, noAssignments(), 'text/base', 'light', 'palette/indigo/700');
  const project = withDraftRoles(snapshot, draft, assignments);
  assert.equal(resolveRole(project, draft, 'text/base', 'light').value, draft['indigo/700'].light);
  assert.equal(resolveRole(project, draft, 'text/base', 'dark').ref, sourceDark);
  const patch = JSON.parse(JSON.stringify(exportChanges(snapshot, draft, {}, assignments)));
  assert.equal(patch.version, 3);
  assert.deepEqual(patch.roles.map(change => [change.path, change.mode, change.after]), [['text/base', 'light', 'palette/indigo/700']]);
  assert.deepEqual(importAssignments(snapshot, patch, importChanges(snapshot, patch)), assignments);
  const back = assignRole(snapshot, assignments, 'text/base', 'light', source.ref.light ?? source.ref.default);
  assert.deepEqual(back, noAssignments());
});

test('a role binding that does not hold is refused as a whole', () => {
  const draft = createDraft(snapshot);
  const patch = exportChanges(snapshot, draft, {}, assignRole(snapshot, noAssignments(), 'text/base', 'light', 'palette/indigo/700'));
  const [change] = patch.roles;
  for (const roles of [
    [{ ...change, path: 'text/absent' }],
    [{ ...change, path: 'text/special/indigo' }],
    [{ ...change, mode: 'default' }],
    [{ ...change, before: 'palette/slate/25' }],
    [{ ...change, after: 'palette/indigo/1' }],
    [{ ...change, after: '#123456' }],
    [change, change],
  ]) assert.throws(() => importAssignments(snapshot, { ...patch, roles }, draft));
  assert.throws(() => exportChanges(snapshot, draft, {}, assignRole(snapshot, noAssignments(), 'text/base', 'light', 'palette/brand/700')), /needs a palette step/);
});

test('one scale edit moves its role in every hue, new hues included', () => {
  const template = 'text/special/{hue}';
  const draft = addHue(createDraft(snapshot), 'brand', 'indigo');
  const assignments = assignScale(snapshot, noAssignments(), template, 'light', 'palette/{hue}/800');
  assert.equal(scaleRef(snapshot, assignments, template, 'light'), 'palette/{hue}/800');
  const project = withDraftRoles(snapshot, draft, assignments);
  for (const hue of ['indigo', 'slate', 'brand']) {
    assert.equal(resolveRole(project, draft, `text/special/${hue}`, 'light').ref, `palette/${hue}/800`);
    assert.equal(resolveRole(project, draft, `text/special/${hue}`, 'dark').ref, `palette/${hue}/800`);
  }
  assert.equal(resolveRole(project, draft, 'border/special/indigo', 'light').ref, 'palette/indigo/700');
  const patch = JSON.parse(JSON.stringify(exportChanges(snapshot, draft, {}, assignments)));
  assert.deepEqual(importAssignments(snapshot, patch, importChanges(snapshot, patch)), assignments);
});

test('a scale step keeps its hue and exists in every hue; only disabled drops the hue', () => {
  const draft = createDraft(snapshot);
  const scale = (template, ref) => assignScale(snapshot, noAssignments(), template, 'light', ref);
  assert.throws(() => exportChanges(snapshot, draft, {}, scale('text/special/{hue}', 'palette/slate/700')), /own hue/);
  assert.throws(() => exportChanges(snapshot, draft, {}, scale('text/special/{hue}', 'palette/{hue}/750')), /does not have/);
  assert.throws(() => assignScale(snapshot, noAssignments(), 'text/absent/{hue}', 'light', 'palette/{hue}/700'), /Unknown special scale/);
  const disabled = scale('surface/bold/special/{hue}/disabled', 'palette/indigo/100');
  assert.equal(exportChanges(snapshot, draft, {}, disabled).scale.length, 1);
});

test('role and scale edits go through the real build, and the review proposes the authored scale', () => {
  let assignments = assignRole(snapshot, noAssignments(), 'text/base', 'dark', 'palette/indigo/700');
  assignments = assignScale(snapshot, assignments, 'text/special/{hue}', 'light', 'palette/{hue}/800');
  const patch = exportChanges(snapshot, createDraft(snapshot), {}, assignments);
  const plan = prepareColorDraft(root, patch);
  const affected = plan.affected.map(role => `${role.path}:${role.mode}`);
  assert.ok(affected.includes('color/text/base:dark'));
  assert.ok(affected.includes('color/text/special/violet:light'));
  assert.ok(!affected.includes('color/text/special/violet:dark'));
  const css = plan.css.slice(plan.css.indexOf('[data-theme="dark"]'));
  assert.match(css, /--stylos-color-text-base: var\(--stylos-palette-dark-indigo-700\)/);
  const review = reviewColorChanges(root, patch);
  assert.match(review, /1 role binding\(s\) and 1 special scale step\(s\) changed/);
  assert.match(review, /color\/text\/base \(dark\): .* → indigo\/700/);
  const out = mkdtempSync(path.join(tmpdir(), 'stylos-scale-'));
  try {
    writeColorPreview(root, patch, out);
    const proposal = readFileSync(path.join(out, '_special.yaml'), 'utf8');
    assert.match(proposal, /AUTHORED SYSTEM SCALE/);
    assert.match(proposal, /"text\/special\/\{hue\}":\n    default: "palette\/\{hue\}\/800"/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('a transfer carries role and scale edits and opens as the same draft', () => {
  const draft = createDraft(snapshot);
  let assignments = assignRole(snapshot, noAssignments(), 'text/base', 'light', 'palette/indigo/700');
  assignments = assignScale(snapshot, assignments, 'border/special/{hue}', 'dark', 'palette/{hue}/900');
  const bundle = JSON.parse(JSON.stringify(createFigmaBundle(snapshot, draft, {}, assignments)));
  assert.equal(bundle.roles.find(role => role.path === 'text/base').ref.light, 'palette/indigo/700');
  assert.equal(bundle.roles.find(role => role.path === 'border/special/indigo').ref.dark, 'palette/indigo/900');
  const patch = draftFromFigmaBundle(snapshot, bundle);
  assert.deepEqual(importAssignments(snapshot, patch, importChanges(snapshot, patch)), assignments);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createFigmaTestApi } from './tests/figma-tokens-api.mjs';
import ts from 'typescript';
import { buildColorsSnapshot } from './build-colors-data.mjs';
import { createDraft, importChanges, addHue } from '../apps/colors/src/model.mjs';
import { createFigmaBundle, draftFromFigmaBundle } from '../apps/colors/src/figma-bundle.mjs';

const source = readFileSync(new URL('../apps/figma-tokens/code.ts', import.meta.url), 'utf8').split('// PLUGIN BOOTSTRAP')[0];
const compiled = ts.transpileModule(source + '\nglobalThis.testing = { validateBundle, buildPlan, preview, applyPlan, exportDraft, fingerprint, rgba };', { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
const root = new URL('../', import.meta.url).pathname;
const snapshot = buildColorsSnapshot(root);
const clone = value => JSON.parse(JSON.stringify(value));
function harness(options) {
  const host = createFigmaTestApi(options);
  const context = vm.createContext({ figma: host.figma }); vm.runInContext(compiled, context);
  return { ...host, api: context.testing };
}
const newMapping = () => ({
  light: { collection: 'new:palette.light', mode: 'new:palette.light' },
  dark: { collection: 'new:palette.dark', mode: 'new:palette.dark' },
  roles: { collection: 'new:color', light: 'new:color.light', dark: 'new:color.dark' },
  includeRoles: true, allowRebind: false, allowOverwrite: false,
});
function existingMapping(state) {
  const target = name => { const c = state.collections.find(c => c.name === name); return { collection: c.id, mode: c.modes[0].modeId }; };
  const roles = state.collections.find(c => c.name === 'color');
  return { light: target('palette.light'), dark: target('palette.dark'), roles: { collection: roles.id, light: roles.modes[0].modeId, dark: roles.modes[1].modeId }, includeRoles: true, allowRebind: false, allowOverwrite: false };
}
const bundle = createFigmaBundle(snapshot, createDraft(snapshot));

test('Figma transfer includes the whole draft and new generated roles, without changing its source', () => {
  const draft = addHue(createDraft(snapshot), 'brand', 'indigo');
  draft['indigo/700'].light = '#554eff';
  const transfer = createFigmaBundle(snapshot, draft, { 'light:indigo/700': { space: 'oklch', lch: [55, 0.33, 276.1] } });
  const h = harness(); assert.doesNotThrow(() => h.api.validateBundle(transfer));
  assert.equal(transfer.roles.length, snapshot.roles.length + 11);
  assert.equal(transfer.basePalette['indigo/700'].light, snapshot.palette['indigo/700'].light);
  assert.deepEqual(importChanges(snapshot, draftFromFigmaBundle(snapshot, transfer)), draft);
  assert.throws(() => draftFromFigmaBundle(snapshot, { ...transfer, source: { ...transfer.source, fingerprint: 'stale' } }), /current Stylos source/);
  assert.throws(() => createFigmaBundle(snapshot, draft, { 'light:indigo/700': { space: 'oklch', lch: [50, 0.1, 180] } }), /coordinates and HEX preview disagree/);
  const invalid = clone(transfer); invalid.roles[0].ref.light = 'palette/missing/700';
  assert.throws(() => h.api.validateBundle(invalid), /Invalid reference/);
});

test('first import creates explicit collections, both modes and real aliases with opacity; a repeat creates nothing', async () => {
  const h = harness(); const p = h.api.buildPlan(bundle, newMapping(), h.state());
  assert.deepEqual(clone(p.errors), []); assert.equal(h.state().variables.length, 0);
  assert.equal(h.api.preview(p).createVariables, 288 * 2 + 319);
  assert.equal(h.api.preview(p).rows.length, 288 * 2 + 319 * 2, 'the review includes both modes, not just distinct variables');
  await h.api.applyPlan(p);
  assert.deepEqual(h.state().collections.map(c => c.name), ['palette.light', 'palette.dark', 'color']);
  const mapping = existingMapping(h.state());
  const primary = h.state().variables.find(v => v.name === 'surface/bold/primary/default');
  const lightTarget = h.state().variables.find(v => v.name === 'indigo/700' && v.variableCollectionId === mapping.light.collection);
  assert.equal(primary.valuesByMode[mapping.roles.light].id, lightTarget.id);
  const shadow = h.state().variables.find(v => v.name === 'shadow/primary');
  assert.equal(shadow.valuesByMode[mapping.roles.light].color.id, lightTarget.id);
  assert.equal(shadow.valuesByMode[mapping.roles.light].opacity, 4);
  const repeat = h.api.preview(h.api.buildPlan(bundle, mapping, h.state()));
  assert.equal(repeat.createVariables, 0); assert.equal(repeat.updateValues, 0); assert.equal(repeat.unchanged, 288 * 2 + 319 * 2);
});

test('updates preserve variable identities, unrelated variables and existing component references', async () => {
  const h = harness(); await h.api.applyPlan(h.api.buildPlan(bundle, newMapping(), h.state()));
  const mapping = existingMapping(h.state()); const palette = h.state().variables.find(v => v.name === 'indigo/700' && v.variableCollectionId === mapping.light.collection);
  const id = palette.id; const role = h.state().variables.find(v => v.name === 'surface/bold/primary/default'); const alias = clone(role.valuesByMode[mapping.roles.light]);
  const extra = h.figma.variables.createVariable('unrelated', h.state().collections[0], 'STRING'); extra.setValueForMode(mapping.light.mode, 'Keep me');
  const draft = createDraft(snapshot); draft['indigo/700'].light = '#123456';
  const plan = h.api.buildPlan(createFigmaBundle(snapshot, draft), mapping, h.state());
  const review = h.api.preview(plan);
  const affected = snapshot.roles.filter(role => (role.ref.light ?? role.ref.default) === 'palette/indigo/700').length;
  assert.equal(review.updateValues, 1);
  assert.equal(review.affectedRoles, affected);
  assert.equal(review.rows.filter(row => row.followsPalette).length, affected);
  assert(review.rows.filter(row => row.followsPalette).every(row => row.action === 'unchanged' && row.afterColor === '#123456'));
  assert.equal(review.rows.find(row => row.path === 'indigo/700' && row.theme === 'light').beforeColor, snapshot.palette['indigo/700'].light);
  assert.equal(plan.errors.length, 0); await h.api.applyPlan(plan);
  assert.equal(palette.id, id); assert.equal(palette.valuesByMode[mapping.light.mode].r, 0x12 / 255);
  assert.deepEqual(role.valuesByMode[mapping.roles.light], alias);
  assert.equal(extra.valuesByMode[mapping.light.mode], 'Keep me');
});

test('ambiguous names, wrong types, stale palette values and rebinding are visible conflicts; stale preview cannot write', async () => {
  const h = harness(); await h.api.applyPlan(h.api.buildPlan(bundle, newMapping(), h.state()));
  const mapping = existingMapping(h.state());
  const changed = h.state().variables.find(v => v.name === 'indigo/700' && v.variableCollectionId === mapping.light.collection);
  changed.valuesByMode[mapping.light.mode] = h.api.rgba('#123456');
  const conflict = h.api.buildPlan(bundle, mapping, h.state()); assert(conflict.errors.some(e => /changed in Figma/.test(e)));
  assert.equal(h.api.buildPlan(bundle, { ...mapping, allowOverwrite: true }, h.state()).errors.length, 0);
  const role = h.state().variables.find(v => v.name === 'text/base'); role.valuesByMode[mapping.roles.light] = h.api.rgba('#ffffff');
  assert(h.api.buildPlan(bundle, mapping, h.state()).errors.some(e => /existing binding would change/.test(e)));
  const ready = h.api.buildPlan(bundle, { ...mapping, allowOverwrite: true, allowRebind: true }, h.state());
  const writes = h.getWrites(); changed.valuesByMode[mapping.light.mode] = h.api.rgba('#abcdef');
  await assert.rejects(h.api.applyPlan(ready), /changed after preview/); assert.equal(h.getWrites(), writes);
  const duplicate = h.figma.variables.createVariable('indigo/700', h.state().collections[0], 'FLOAT');
  assert(h.api.buildPlan(bundle, mapping, h.state()).errors.some(e => /duplicate names/.test(e)));
  duplicate.remove(); changed.resolvedType = 'FLOAT';
  assert(h.api.buildPlan(bundle, mapping, h.state()).errors.some(e => /expected an editable COLOR/.test(e)));
});

test('unsupported modes and failed writes roll back created data; existing values are restored', async () => {
  for (const options of [{ maxModes: 1 }, { failWriteAt: 600 }]) {
    const h = harness(options); const before = h.api.fingerprint(h.state());
    await assert.rejects(h.api.applyPlan(h.api.buildPlan(bundle, newMapping(), h.state())), /rolled back/);
    assert.equal(h.api.fingerprint(h.state()), before);
  }
  const h = harness({ failWriteAt: 3 });
  const c = h.figma.variables.createVariableCollection('Existing'); c.renameMode(c.defaultModeId, 'palette.light');
  const v = h.figma.variables.createVariable('slate/25', c, 'COLOR'); v.setValueForMode(c.defaultModeId, h.api.rgba(snapshot.palette['slate/25'].light));
  const mapping = newMapping(); mapping.light = { collection: c.id, mode: c.defaultModeId }; mapping.includeRoles = false;
  const draft = createDraft(snapshot); draft['slate/25'].light = '#123456';
  const before = h.api.fingerprint(h.state());
  await assert.rejects(h.api.applyPlan(h.api.buildPlan(createFigmaBundle(snapshot, draft), mapping, h.state())), /rolled back/);
  assert.equal(h.api.fingerprint(h.state()), before);
});

test('a palette edited in Figma returns to the editor as a source-checked draft in both themes', async () => {
  const h = harness(); await h.api.applyPlan(h.api.buildPlan(bundle, newMapping(), h.state()));
  const mapping = existingMapping(h.state());
  for (const [theme, value] of [['light','#123456'],['dark','#abcdef']]) {
    const v = h.state().variables.find(v => v.name === 'indigo/700' && v.variableCollectionId === mapping[theme].collection);
    v.setValueForMode(mapping[theme].mode, h.api.rgba(value));
  }
  const patch = clone(await h.api.exportDraft(bundle, mapping));
  const restored = importChanges(snapshot, patch);
  assert.equal(restored['indigo/700'].light, '#123456'); assert.equal(restored['indigo/700'].dark, '#abcdef');
  assert.equal(patch.changes.length, 2); assert.deepEqual(patch.coordinates, {});
  const v = h.state().variables.find(v => v.name === 'indigo/700'); v.valuesByMode[mapping.light.mode].a = 0.5;
  await assert.rejects(h.api.exportDraft(bundle, mapping), /opaque literal colors/);
});


function boot({ relaunchUnavailable = false, onShow } = {}) {
  const host = createFigmaTestApi(); const messages = [], sizes = [];
  host.figma.ui = { postMessage(message) { messages.push(clone(message)); }, resize(width, height) { sizes.push({ width, height }); } };
  host.figma.root = { setRelaunchData() { if (relaunchUnavailable) throw new Error('not implemented'); } };
  host.figma.showUI = () => onShow?.(host.figma);
  const fullSource = readFileSync(new URL('../apps/figma-tokens/code.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(fullSource, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
  vm.runInNewContext(code, { figma: host.figma, __html__: '<html></html>' });
  return { ...host, messages, sizes };
}

test('the real entrypoint registers messages before opening UI and survives missing relaunch support', async () => {
  let initialized;
  const host = boot({ relaunchUnavailable: true, onShow(figma) {
    assert.equal(typeof figma.ui.onmessage, 'function');
    initialized = figma.ui.onmessage({ type: 'init', requestId: 0 });
  } });
  await initialized;
  assert.deepEqual(host.messages.map(message => message.type), ['collections', 'ready', 'idle']);
  assert(host.messages.every(message => message.requestId === 0));
  assert.equal(host.getWrites(), 0);
});

test('load, preview, apply and export complete through the real correlated UI message handler', async () => {
  const host = boot(); const handle = host.figma.ui.onmessage;
  await handle({ type: 'load', requestId: 1, text: JSON.stringify(bundle) });
  assert(host.messages.some(message => message.type === 'loaded' && message.requestId === 1));
  await handle({ type: 'preview', requestId: 2, mapping: newMapping() });
  const preview = host.messages.find(message => message.type === 'preview');
  assert.equal(preview.createVariables, 895); assert.equal(preview.requestId, 2);
  await handle({ type: 'apply', requestId: 3, reviewId: preview.reviewId });
  assert(host.messages.some(message => message.type === 'applied' && message.requestId === 3));
  const applied = host.messages.find(message => message.type === 'applied');
  assert.equal(applied.createVariables, preview.createVariables);
  assert.equal(applied.updateValues, preview.updateValues);
  assert.deepEqual(applied.rows, preview.rows, 'the success view retains the exact applied before/after report');
  await handle({ type: 'export', requestId: 4, mapping: existingMapping(host.state()) });
  const download = host.messages.find(message => message.type === 'download');
  assert.equal(download.requestId, 4); assert.deepEqual(importChanges(snapshot, JSON.parse(download.text)), snapshot.palette);
  await handle({ type: 'resize', height: 99999 }); assert.deepEqual(host.sizes.at(-1), { width: 560, height: 720 });
});

test('failed loads release the busy state and cannot reuse a previous import plan', async () => {
  const host = boot(); const handle = host.figma.ui.onmessage;
  await handle({ type: 'load', requestId: 1, text: JSON.stringify(bundle) });
  await handle({ type: 'preview', requestId: 2, mapping: newMapping() });
  await handle({ type: 'load', requestId: 3, text: '{broken JSON' });
  assert(host.messages.some(message => message.type === 'error' && message.requestId === 3));
  assert.equal(host.messages.at(-1).type, 'idle');
  await handle({ type: 'apply', requestId: 4, reviewId: 1 });
  assert(host.messages.some(message => message.type === 'error' && message.requestId === 4));
  assert.equal(host.getWrites(), 0);
  await handle({ type: 'load', requestId: 5, text: JSON.stringify(bundle) });
  assert(host.messages.some(message => message.type === 'loaded' && message.requestId === 5));
});

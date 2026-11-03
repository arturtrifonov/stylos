import test from 'node:test';
import assert from 'node:assert/strict';
import { buildColorsSnapshot } from './build-colors-data.mjs';
import { createFigmaDtcgFiles } from '../apps/colors/src/figma-dtcg.mjs';
import { createFigmaBundle } from '../apps/colors/src/figma-bundle.mjs';
import { createDraft, addHue, withDraftRoles } from '../apps/colors/src/model.mjs';
import { flattenDocument, documentMode, toHex } from './lib/convert.mjs';

const snapshot = buildColorsSnapshot(new URL('../', import.meta.url).pathname);
test('native export has six independent DTCG mode documents; Special and semantic roles never mix', () => {
  const files = createFigmaDtcgFiles(snapshot, snapshot.palette);
  assert.equal(files.length, 6); assert.equal(new Set(files.map(file => file.name)).size, 6);
  const semantic = snapshot.roles.filter(role => !role.generated).map(role => role.path).sort();
  const special = snapshot.roles.filter(role => role.generated).map(role => role.path).sort();
  for (const file of files) {
    assert.equal(documentMode(file.document), file.mode);
    assert(!('format' in file.document)); assert(!('palette' in file.document)); assert(!('coordinates' in file.document));
    const tokens = flattenDocument(JSON.parse(JSON.stringify(file.document)));
    assert.equal(tokens.size, file.count);
    if (file.collection === 'color') assert.deepEqual([...tokens.keys()].sort(), semantic);
    if (file.collection === 'color.special') assert.deepEqual([...tokens.keys()].sort(), special);
    for (const token of tokens.values()) {
      assert.equal(token.type, 'color'); assert.equal(token.value.colorSpace, 'srgb');
      assert.equal(toHex(token.value.components), token.value.hex);
      assert(token.value.components.every(value => value >= 0 && value <= 1));
    }
  }
});

test('DTCG export preserves edits, both themes, new hues, role aliases and opacity in Figma export syntax', () => {
  const draft = addHue(createDraft(snapshot), 'brand', 'indigo'); draft['indigo/700'].light = '#123456';
  const files = createFigmaDtcgFiles(snapshot, draft);
  for (const theme of ['light', 'dark']) {
    const palette = flattenDocument(files.find(file => file.collection === `palette.${theme}`).document);
    for (const [path, token] of palette) assert.equal(token.value.hex, draft[path][theme]);
    const roles = new Map(files.filter(file => file.mode === `color.${theme}`).flatMap(file => [...flattenDocument(file.document)]));
    for (const role of withDraftRoles(snapshot, draft).roles) {
      const ref = (role.ref[theme] ?? role.ref.default).slice(8), token = roles.get(role.path);
      assert.deepEqual(token.alias, { collection: `palette.${theme}`, name: ref });
      assert.equal(token.value.hex, draft[ref][theme]); assert.equal(token.value.alpha, role.alpha[theme]);
      assert.equal(token.opacity?.value ?? 100, role.alpha[theme] * 100);
    }
  }
  // The server/plugin transfer remains a separate, compatible protocol.
  const transfer = createFigmaBundle(snapshot, draft);
  assert.equal(transfer.format, 'stylos-figma-colors'); assert.equal(transfer.palette['indigo/700'].light, '#123456');
  assert.equal(transfer.roles.length, snapshot.roles.length + 11);
});

test('native export rejects inconsistent graph metadata instead of silently exporting another color', () => {
  assert.throws(() => createFigmaDtcgFiles(snapshot, snapshot.palette, { 'light:indigo/700': { space: 'oklch', lch: [50, 0.1, 180] } }), /coordinates and HEX preview disagree/);
});

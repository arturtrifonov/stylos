#!/usr/bin/env node
// Project canonical tokens to an editor snapshot; never read Figma exports.
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCanonical, resolve } from './lib/tokens.mjs';
import { loadSpecialScale } from './lib/special-colors.mjs';
import { runCheck } from './check-tokens.mjs';
import { createFigmaBundle } from '../apps/colors/src/figma-bundle.mjs';

export function buildColorsSnapshot(root) {
  const [palette, color] = loadCanonical(root, ['palette', 'color']);
  const paletteValues = Object.fromEntries([...palette.tokens].map(([name, token]) => [
    name, Object.fromEntries(palette.modes.map(mode => [mode, token.values.get(mode)])),
  ]));
  const roles = [...color.tokens].map(([name, token]) => {
    if (!token.ref || [...token.ref.values()].some(ref => !ref.startsWith('palette/'))) {
      throw new Error(`The color editor needs a palette binding for color/${name}.`);
    }
    return {
      path: name,
      ref: Object.fromEntries(token.ref),
      alpha: Object.fromEntries(color.modes.map(mode => [mode, resolve([palette, color], 'color', name, mode).alpha])),
      generated: token.generated ?? null,
    };
  });
  const scale = loadSpecialScale(root);
  const specialScale = {
    exclude: scale.exclude,
    roles: Object.fromEntries(scale.roles.map(role => [role.template, Object.fromEntries(role.ref)])),
  };
  const content = { schemaVersion: 1, palette: paletteValues, roles, specialScale };
  // Include provenance as well as values: a new canonical source invalidates old drafts.
  const hash = createHash('sha256').update(JSON.stringify(content));
  for (const file of ['palette.yaml', 'color.yaml', '_special.yaml']) hash.update(readFileSync(path.join(root, 'tokens', file)));
  const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  return { ...content, fingerprint: hash.digest('hex'), version };
}

export function buildColorsData(root, out = path.join(root, 'apps/colors/public')) {
  const check = runCheck({ root });
  if (!check.ok) throw new Error(check.errors.join('\n'));
  const snapshot = buildColorsSnapshot(root);
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, 'stylos.json'), JSON.stringify(snapshot, null, 2) + '\n');
  writeFileSync(path.join(out, 'stylos-colors.figma.json'), JSON.stringify(createFigmaBundle(snapshot, snapshot.palette), null, 2) + '\n');
  cpSync(path.join(root, 'apps/colors/LICENSE.huetone'), path.join(out, 'LICENSE.huetone.txt'));
  return snapshot;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const snapshot = buildColorsData(root);
  console.log(`Colors: ${Object.keys(snapshot.palette).length} palette tokens × 2 modes, ${snapshot.roles.length} roles.`);
}

#!/usr/bin/env node
// Inspect a downloaded draft against the current canonical source. Read-only.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareColorDraft } from './lib/color-draft.mjs';
import { SCALE_FILE } from './lib/special-colors.mjs';

export function reviewColorChanges(root, input) {
  return formatReview(prepareColorDraft(root, input));
}

function formatReview({ patch, affected, outside }) {
  const lines = patch.changes.map(change => {
    const key = change.path.slice('palette/'.length);
    const dependents = affected.filter(role => role.mode === change.mode && role.ref === `palette/${key}`);
    return `${change.path} (${change.mode}): ${change.before ?? '(new)'} → ${change.after} · ${dependents.length} dependent roles`;
  });
  const short = ref => ref.slice('palette/'.length);
  return [`${patch.changes.length} palette value(s), ${patch.roles.length} role binding(s) and ${patch.scale.length} special scale step(s) changed; ${Object.keys(patch.coordinates).length} LCH point(s) retained. Canonical files are unchanged.`,
    `Validated the complete proposed token set and CSS build. ${affected.length} role value(s) affected.`,
    ...(outside.length ? [`${outside.length} point(s) outside sRGB: the exported CSS uses their mapped HEX previews.`, ...outside.map(key => `  ${key}`)] : []),
    ...lines,
    ...patch.roles.map(change => `color/${change.path} (${change.mode}): ${short(change.before)} → ${short(change.after)}`),
    ...patch.scale.map(change => `${SCALE_FILE} ${change.template} (${change.mode}): ${short(change.before)} → ${short(change.after)}`)].join('\n');
}

// The scale is authored, so a proposal keeps the file's own header and history.
function specialScaleYaml(root, scale) {
  const source = readFileSync(path.join(root, SCALE_FILE), 'utf8');
  const lines = scale.roles.flatMap(({ template, ref }) => {
    const values = [...ref.values()];
    const modes = ref.has('default') || values.every(value => value === values[0]) ? [['default', values[0]]] : [...ref];
    return [`  "${template}":`, ...modes.map(([mode, target]) => `    ${mode}: "${target}"`)];
  });
  return source.slice(0, source.indexOf('\nroles:') + '\nroles:\n'.length) + lines.join('\n') + '\n';
}

export function writeColorPreview(root, input, out) {
  if (path.resolve(out) === path.resolve(root) || path.resolve(out).startsWith(path.resolve(root, 'tokens') + path.sep) || path.resolve(out) === path.resolve(root, 'tokens')) {
    throw new Error('Choose a preview directory outside tokens/ and the repository root.');
  }
  const plan = prepareColorDraft(root, input);
  mkdirSync(out, { recursive: true });
  for (const [name, content] of Object.entries({
    'review.txt': formatReview(plan) + '\n',
    'tokens.css': '/* DRAFT PREVIEW — not applied to Stylos. */\n' + plan.css,
    'tokens.json': JSON.stringify({ ...plan.manifest, preview: true, base: plan.snapshot.fingerprint }, null, 2) + '\n',
    'impact.json': JSON.stringify(plan.affected, null, 2) + '\n',
    'draft.json': JSON.stringify(plan.patch, null, 2) + '\n',
    ...(plan.patch.scale.length ? { '_special.yaml': specialScaleYaml(root, plan.scale) } : {}),
  })) writeFileSync(path.join(out, name), content);
  return formatReview(plan);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (!(args.length === 1 || args.length === 3 && args[1] === '--out' && args[2])) throw new Error('Usage: npm run colors:review -- <stylos-colors.draft.json> [--out <preview-directory>]');
    const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    const input = JSON.parse(readFileSync(args[0], 'utf8'));
    console.log(args.length === 3 ? writeColorPreview(root, input, path.resolve(args[2])) : reviewColorChanges(root, input));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

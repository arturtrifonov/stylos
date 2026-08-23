#!/usr/bin/env node
// Validates docs/components/registry/**/*.yaml.
//
//   npm run validate:registry
//
// Two kinds of finding, and the difference is the point:
//
//   FAIL   the registry contradicts itself — a dangling reference, a duplicate
//          id, a file in the wrong place, a Figma link that cannot resolve.
//          Exit 1.
//   REPORT something a human has to judge — a relation recorded on one side
//          only, a child at or above its parent's level, an entry with no
//          relations at all. Exit 0.
//
// The reports are expected to be noisy on the current data. It came from a CSV
// export of Airtable's relational fields, which the registry README already
// records as lossy; the mismatches are what that cost looks like. Which side of
// a non-reciprocal relation is wrong is a judgement, so nothing here repairs
// anything — see docs/specs/0002-registry-viewer.md §5.
//
// Reading is delegated to lib/registry.mjs, which parses the files with the
// real reader in lib/yaml.mjs rather than the regexes this script used to
// carry. The regexes could not have seen inside a `figma:` block.

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadRegistry,
  registryPathFor,
  levelRank,
  LEVELS,
  COMPONENT_FILE_KEYS,
  FIGMA_TYPES,
} from "./lib/registry.mjs";

export function checkRegistry(entries) {
  const errors = [];
  const reports = [];

  const byId = new Map();
  for (const entry of entries) {
    if (!entry.id) {
      errors.push(`${entry.file}: missing "id"`);
      continue;
    }
    // Two files claiming one id: every reference to it resolves to whichever
    // was read last, and the loser is unreachable without being missing.
    if (byId.has(entry.id)) {
      errors.push(
        `${entry.file}: duplicate id "${entry.id}", already declared by ${byId.get(entry.id).file}`
      );
      continue;
    }
    byId.set(entry.id, entry);
  }

  for (const entry of entries) {
    if (!entry.id) continue;

    if (!LEVELS.includes(entry.level)) {
      errors.push(`${entry.file}: level "${entry.level}" is not one of ${LEVELS.join(", ")}`);
    }

    // The path is derived from the id, so a file in the wrong place means one
    // of the two was edited without the other.
    const expected = registryPathFor(entry.id);
    if (entry.file !== expected) {
      errors.push(`${entry.file}: id "${entry.id}" belongs at ${expected}`);
    }

    for (const ref of [...entry.children, ...entry.parents]) {
      if (!byId.has(ref)) {
        errors.push(`${entry.file}: references "${ref}", which has no matching component id`);
      }
    }

    const figma = entry.figma;
    if (figma) {
      if (figma.type !== undefined && !FIGMA_TYPES.includes(figma.type)) {
        errors.push(
          `${entry.file}: figma.type "${figma.type}" is not one of ${FIGMA_TYPES.join(", ")}`
        );
      }
      if (figma.node_id && !figma.file_key) {
        errors.push(
          `${entry.file}: figma.node_id without figma.file_key — a node id is only addressable ` +
            `inside a file, and components live in two of them`
        );
      }
      if (figma.file_key && !COMPONENT_FILE_KEYS.has(figma.file_key)) {
        errors.push(
          `${entry.file}: figma.file_key "${figma.file_key}" is not a component file. ` +
            `Expected one of ${[...COMPONENT_FILE_KEYS]
              .map(([key, name]) => `${key} (${name})`)
              .join(", ")} — see figma/README.md`
        );
      }
    }
  }

  // Non-reciprocal relations, both directions. A lists B as a child while B
  // does not list A as a parent, and the reverse.
  for (const entry of entries) {
    if (!entry.id) continue;
    for (const child of entry.children) {
      const other = byId.get(child);
      if (other && !other.parents.includes(entry.id)) {
        reports.push(
          `"${entry.id}" lists "${child}" as a child, but "${child}" does not list it as a parent`
        );
      }
    }
    for (const parent of entry.parents) {
      const other = byId.get(parent);
      if (other && !other.children.includes(entry.id)) {
        reports.push(
          `"${entry.id}" lists "${parent}" as a parent, but "${parent}" does not list it as a child`
        );
      }
    }
  }

  // A child at or above its parent's level. Information, not a fault: this
  // repository names exceptions rather than forbidding them (docs/charter.md).
  for (const entry of entries) {
    if (!entry.id) continue;
    const rank = levelRank(entry.level);
    if (rank === -1) continue;
    for (const child of entry.children) {
      const other = byId.get(child);
      if (!other) continue;
      const childRank = levelRank(other.level);
      if (childRank === -1) continue;
      if (childRank >= rank) {
        reports.push(
          `"${entry.id}" (${entry.level}) is composed from "${child}" (${other.level}), ` +
            `which is at or above its own level`
        );
      }
    }
  }

  // Neither composed from anything nor used inside anything. Usually a gap in
  // the import rather than a real island.
  for (const entry of entries) {
    if (!entry.id) continue;
    if (entry.children.length === 0 && entry.parents.length === 0) {
      reports.push(`"${entry.id}" has no parents and no children`);
    }
  }

  return { ok: errors.length === 0, errors, reports };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const entries = loadRegistry(root);
  const { ok, errors, reports } = checkRegistry(entries);

  for (const report of reports) console.error(`REPORT  ${report}`);
  for (const error of errors) console.error(`FAIL    ${error}`);

  if (reports.length > 0) {
    console.error(
      `\n${reports.length} report(s) — judgement, not failure. Nothing is repaired automatically.`
    );
  }
  if (!ok) {
    console.error(`\nFAIL: ${errors.length} registry issue(s).`);
    process.exit(1);
  }

  console.log(
    `OK: ${entries.length} registry entries, all references resolve` +
      (reports.length > 0 ? `, ${reports.length} report(s) outstanding.` : ".")
  );
}

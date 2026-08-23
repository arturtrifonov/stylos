#!/usr/bin/env node
// Verifies the canonical token set.
//
//   npm run tokens:check              verify tokens/*.yaml
//   npm run tokens:check -- --strict  warnings fail too
//
// Reads tokens/*.yaml and tokens/_naming.yaml, and needs no Figma export.
// A token bound to another stores its reference and no value, so there is no
// stored copy to disagree with anything; what is checked is that every
// reference resolves, that none loop, and that mode dependence is declared.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { stringify, parse, deepEqualOrdered } from "./lib/yaml.mjs";
import { loadCanonical, listCanonical } from "./lib/tokens.mjs";
import { verifyCanonical } from "./lib/verify.mjs";

export function readNaming(root) {
  const file = path.join(root, "tokens/_naming.yaml");
  if (!existsSync(file)) {
    throw new Error(
      `tokens/_naming.yaml is missing. It declares which Figma collection and mode each ` +
        `canonical collection comes from, and nothing works without it. ` +
        `See docs/specs/0001-token-pipeline.md §5.1.`
    );
  }
  return parse(readFileSync(file, "utf8"), { filename: "tokens/_naming.yaml" });
}

export function runCheck({ root, strict = false }) {
  const problems = { errors: [], warnings: [] };

  let naming;
  try {
    naming = readNaming(root);
  } catch (error) {
    return { ok: false, errors: [error.message], warnings: [] };
  }

  if (listCanonical(root).length === 0) {
    return {
      ok: false,
      errors: [
        `No canonical tokens under tokens/. Import an export first: ` +
          `npm run tokens:import -- --collection <name> <file>`,
      ],
      warnings: [],
    };
  }

  const collections = loadCanonical(root);

  // A canonical file nothing declares. This is what a rename leaves behind:
  // `_naming.yaml` starts saying `dimension`, the importer writes
  // `dimension.yaml`, and `space.yaml` sits there for ever looking current.
  const declared = new Set((naming.get("collections") ?? new Map()).keys());
  for (const name of listCanonical(root)) {
    if (!declared.has(name)) {
      problems.errors.push(
        `tokens/${name}.yaml: no collection "${name}" in tokens/_naming.yaml. ` +
          `If it was renamed, delete this file — the new one is written on import. ` +
          `If it should still exist, declare it.`
      );
    }
  }

  // The converse: declared but never imported.
  for (const name of declared) {
    if (!listCanonical(root).includes(name)) {
      problems.warnings.push(
        `tokens/_naming.yaml declares "${name}", which has not been imported yet: ` +
          `npm run tokens:import -- --collection <figma name> <file>`
      );
    }
  }

  verifyCanonical(
    { collections, modeDependent: naming.get("mode_dependent") ?? [] },
    problems
  );

  // Every canonical file must survive a YAML round-trip. This is what keeps
  // the writer and reader in tools/lib/yaml.mjs a matched pair.
  for (const name of listCanonical(root)) {
    const file = path.join(root, "tokens", `${name}.yaml`);
    const text = readFileSync(file, "utf8");
    try {
      const reparsed = stringify(parse(text, { filename: `tokens/${name}.yaml` }), {
        comments: text
          .split("\n")
          .filter((l) => l.startsWith("# "))
          .map((l) => l.slice(2)),
      });
      if (!deepEqualOrdered(parse(reparsed), parse(text))) {
        problems.errors.push(`tokens/${name}.yaml does not survive a YAML round-trip.`);
      }
    } catch (error) {
      problems.errors.push(error.message);
    }
  }

  const ok = problems.errors.length === 0 && !(strict && problems.warnings.length > 0);
  return { ok, ...problems };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");

  const result = runCheck({ root, strict });
  for (const w of result.warnings) console.error(`WARN  ${w}`);
  for (const e of result.errors) console.error(`FAIL  ${e}`);
  if (result.ok && !result.errors.length && !result.warnings.length) {
    console.error(`OK: ${listCanonical(root).length} collections, alias contract holds.`);
  }
  process.exit(result.ok ? 0 : 1);
}

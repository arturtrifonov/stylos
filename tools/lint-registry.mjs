#!/usr/bin/env node
// Validates docs/components/registry/*.yaml for internal consistency:
// every parent/child reference must resolve to another component's `id`,
// and every file's `level` must be one of the five confirmed levels.
//
// This is a structural check, not a YAML schema validator — it's a small
// regex-based reader deliberately kept dependency-free, matching the
// project's "keep tools/ small" rule (master doc §20.5). If the registry
// schema grows meaningfully more complex, replace this with a real YAML
// parser rather than extending the regexes.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const registryDir = path.join(root, "docs/components/registry");
const validLevels = new Set(["primitive", "element", "object", "widget", "layout"]);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "import-source") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".yaml")) files.push(full);
  }
  return files;
}

function parseListField(source, key) {
  const re = new RegExp(`^${key}: (\\[\\]|)\\n((?:  - .*\\n?)*)`, "m");
  const match = source.match(re);
  if (!match) return [];
  if (match[1] === "[]") return [];
  return [...match[2].matchAll(/  - "((?:[^"\\]|\\.)*)"/g)].map((m) =>
    m[1].replace(/\\"/g, '"')
  );
}

function parseScalarField(source, key) {
  const match = source.match(new RegExp(`^${key}: "((?:[^"\\\\]|\\\\.)*)"`, "m"));
  return match ? match[1] : null;
}

const files = walk(registryDir);
const entries = files.map((file) => {
  const source = readFileSync(file, "utf8");
  return {
    file: path.relative(root, file),
    id: parseScalarField(source, "id"),
    level: parseScalarField(source, "level"),
    children: parseListField(source, "children"),
    parents: parseListField(source, "parents"),
  };
});

const ids = new Set(entries.map((e) => e.id));
const errors = [];

for (const e of entries) {
  if (!e.id) errors.push(`${e.file}: missing "id"`);
  if (!validLevels.has(e.level)) {
    errors.push(`${e.file}: level "${e.level}" is not one of ${[...validLevels].join(", ")}`);
  }
  for (const ref of [...e.children, ...e.parents]) {
    if (!ids.has(ref)) {
      errors.push(`${e.file}: references "${ref}", which has no matching component id`);
    }
  }
}

if (errors.length > 0) {
  console.error(`FAIL: ${errors.length} registry issue(s):\n`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log(`OK: ${entries.length} registry entries, all references resolve.`);

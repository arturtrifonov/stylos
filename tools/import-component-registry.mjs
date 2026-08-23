#!/usr/bin/env node
// RETIRED. The bootstrap import that created docs/components/registry/ from
// the Airtable CSV. It ran once, on 2026-08-20, and is kept as the record of
// how those files came to exist — not as a step in any workflow.
//
// Hand-editing the YAML is the workflow now (docs/components/registry/
// README.md), and this script does not merge: it deletes every registry file
// and writes them again from the CSV. Running it against the current registry
// would destroy every hand edit, every `figma:` block, and every field the
// schema has gained since. There is deliberately no npm script for it, and it
// refuses to run without --overwrite-hand-edits saying so out loud.
//
// Usage (do not):
//   node tools/import-component-registry.mjs <path-to-csv> --overwrite-hand-edits

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "docs/components/registry");

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node tools/import-component-registry.mjs <path-to-csv> --overwrite-hand-edits");
  process.exit(1);
}

if (!process.argv.includes("--overwrite-hand-edits")) {
  console.error(
    "This import is retired. It ran once, on 2026-08-20, and the registry has been\n" +
      "hand-edited since — this script deletes every file under docs/components/registry/\n" +
      "and writes them again from the CSV, merging nothing.\n\n" +
      "If that is genuinely what you want, pass --overwrite-hand-edits."
  );
  process.exit(1);
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (inQuotes) {
      if (c === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function splitList(value) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugPath(name) {
  return name.split(" / ").map(slug).join("/");
}

function yamlString(value) {
  if (value === "") return '""';
  return JSON.stringify(value);
}

// An empty list omits its key rather than writing `[]`: the restricted YAML
// subset in tools/lib/yaml.mjs has no flow-collection syntax, and every reader
// of the registry goes through it.
function yamlField(key, items) {
  if (items.length === 0) return "";
  return `${key}:\n` + items.map((i) => `  - ${yamlString(i)}`).join("\n") + "\n";
}

const source = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const rows = parseCsv(source);
const header = rows[0];
const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== ""));

const expectedHeader = [
  "Name",
  "Children",
  "Parents",
  "Role",
  "Flow Behavior",
  "Content Category",
  "Notes",
  "Batch",
  "Ready",
];
if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
  console.error("Unexpected CSV header. Expected:", expectedHeader, "Got:", header);
  process.exit(1);
}

// Clean previously generated files (everything except import-source/ and README.md)
for (const entry of readdirSync(outDir, { withFileTypes: true })) {
  if (entry.name === "import-source" || entry.name === "README.md") continue;
  rmSync(path.join(outDir, entry.name), { recursive: true, force: true });
}

const names = new Set(dataRows.map((r) => r[0].trim()));
const missingRefs = new Set();

for (const r of dataRows) {
  const [name, childrenRaw, parentsRaw, role, flowRaw, level, notes, batch, ready] = r.map(
    (v) => v.trim()
  );

  const children = splitList(childrenRaw);
  const parents = splitList(parentsRaw);
  const flowBehavior = splitList(flowRaw);

  for (const ref of [...children, ...parents]) {
    if (!names.has(ref)) missingRefs.add(ref);
  }

  const filePath = path.join(outDir, `${slugPath(name)}.yaml`);
  mkdirSync(path.dirname(filePath), { recursive: true });

  const yaml = `# Hand-edited. This file is the source for its component's structural data.
# The CSV import that created it ran once, on 2026-08-20, and will not run
# again — see docs/components/registry/README.md for the schema and workflow.

id: ${yamlString(name)}
name: ${yamlString(name)}
level: ${yamlString(level.toLowerCase())}
role: ${role ? yamlString(role.toLowerCase()) : "null"}
${yamlField("flow_behavior", flowBehavior.map((f) => f.toLowerCase()))}${yamlField("children", children)}${yamlField("parents", parents)}notes: ${yamlString(notes)}
import:
  batch: ${batch || "null"}
  ready: ${ready === "checked"}
`;

  const cleaned = yaml
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n");
  writeFileSync(filePath, cleaned, "utf8");
}

console.log(`Imported ${dataRows.length} components into ${path.relative(root, outDir)}/`);
if (missingRefs.size > 0) {
  console.warn(
    `\nWarning: ${missingRefs.size} parent/child reference(s) do not match any component Name in the CSV:`
  );
  for (const ref of [...missingRefs].sort()) console.warn(`  - ${ref}`);
  console.warn(
    "\nThese are likely components missing from the registry (not yet added in Airtable) rather than typos, but worth checking."
  );
}

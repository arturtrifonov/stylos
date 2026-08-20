#!/usr/bin/env node
// One-time-per-refresh import: converts the Airtable component registry CSV
// into one YAML file per component under docs/components/registry/.
//
// The CSV is not the source of truth going forward — the generated YAML
// files are. Re-running this script overwrites generated files from a fresh
// CSV export; it never merges, so hand edits to generated YAML will be lost
// on re-import. See docs/components/registry/README.md.
//
// Usage:
//   node tools/import-component-registry.mjs <path-to-csv>

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "docs/components/registry");

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node tools/import-component-registry.mjs <path-to-csv>");
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

function yamlList(items) {
  if (items.length === 0) return "[]";
  return "\n" + items.map((i) => `  - ${yamlString(i)}`).join("\n");
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

  const yaml = `# GENERATED FILE. Do not hand-edit structural fields — re-running
# tools/import-component-registry.mjs overwrites this file from the source
# CSV. The "notes" field is preserved verbatim from the source and is safe
# to extend, but will be replaced wholesale on next import, not merged.
#
# See docs/components/registry/README.md for schema and workflow.

id: ${yamlString(name)}
name: ${yamlString(name)}
level: ${yamlString(level.toLowerCase())}
role: ${role ? yamlString(role.toLowerCase()) : "null"}
flow_behavior: ${yamlList(flowBehavior.map((f) => f.toLowerCase()))}
children: ${yamlList(children)}
parents: ${yamlList(parents)}
notes: ${yamlString(notes)}
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

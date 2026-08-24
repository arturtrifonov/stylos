import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  loadRegistry,
  derive,
  slugPath,
  registryPathFor,
  documentPathFor,
  figmaUrl,
  levelRank,
} from "./registry.mjs";

function fixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), "stylos-registry-"));
  for (const [relative, contents] of Object.entries(files)) {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, contents);
  }
  return root;
}

const badge = `id: "Badge"
name: "Badge"
level: "primitive"
role: "content"
flow_behavior:
  - "hug"
parents:
  - "Table / TD Text"
notes: ""
import:
  batch: 1
  ready: false
`;

const tdText = `id: "Table / TD Text"
name: "Table / TD Text"
level: "object"
role: "output"
flow_behavior:
  - "fill"
children:
  - "Badge"
notes: ""
`;

test("slugs a nested name into the path both directories mirror", () => {
  assert.equal(slugPath("Table / TD Text"), "table/td-text");
  assert.equal(slugPath("Button Basic"), "button-basic");
  assert.equal(registryPathFor("Table / TD Text"), "docs/components/registry/table/td-text.yaml");
  assert.equal(documentPathFor("Table / TD Text"), "docs/components/table/td-text.md");
});

test("builds a Figma URL out of the two parts, unchanged", () => {
  assert.equal(
    figmaUrl({ file_key: "WUc07ZBtjRvypXtsOlbVut", node_id: "4479-13507" }),
    "https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/?node-id=4479-13507"
  );
});

test("builds no URL from half a record", () => {
  assert.equal(figmaUrl({ file_key: "WUc07ZBtjRvypXtsOlbVut" }), null);
  assert.equal(figmaUrl({ node_id: "4479-13507" }), null);
  assert.equal(figmaUrl(null), null);
});

test("ranks levels in composition order", () => {
  assert.ok(levelRank("primitive") < levelRank("element"));
  assert.ok(levelRank("widget") < levelRank("layout"));
  assert.equal(levelRank("atom"), -1);
});

test("loads entries sorted by id, with absent lists read as empty", () => {
  const root = fixture({
    "docs/components/registry/badge.yaml": badge,
    "docs/components/registry/table/td-text.yaml": tdText,
  });
  try {
    const entries = loadRegistry(root);
    assert.deepEqual(
      entries.map((e) => e.id),
      ["Badge", "Table / TD Text"]
    );
    assert.deepEqual(entries[0].children, []);
    assert.deepEqual(entries[0].parents, ["Table / TD Text"]);
    assert.equal(entries[0].file, "docs/components/registry/badge.yaml");
    assert.deepEqual(entries[1].import, null);
    assert.deepEqual(entries[0].import, { batch: 1, ready: false });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ignores the import-source CSV kept as history", () => {
  const root = fixture({
    "docs/components/registry/badge.yaml": badge,
    "docs/components/registry/import-source/export.yaml": 'id: "Ghost"\n',
  });
  try {
    assert.deepEqual(
      loadRegistry(root).map((e) => e.id),
      ["Badge"]
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("keeps a field the schema has not been taught yet", () => {
  const root = fixture({
    "docs/components/registry/badge.yaml": `${badge}properties:\n  tone:\n    - "neutral"\n`,
  });
  try {
    const [entry] = loadRegistry(root);
    assert.deepEqual(entry.extra, { properties: { tone: ["neutral"] } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("derives documented from the document existing, and linked from a node id", () => {
  const root = fixture({
    "docs/components/registry/badge.yaml": badge,
    "docs/components/registry/table/td-text.yaml": tdText,
    "docs/components/table/td-text.md": "# Table / TD Text\n",
  });
  try {
    const entries = loadRegistry(root);
    assert.deepEqual(derive(root, entries[0]), { documented: false, linked: false });
    assert.deepEqual(derive(root, entries[1]), { documented: true, linked: false });

    entries[0].figma = { file_key: "WUc07ZBtjRvypXtsOlbVut", node_id: "4479-13507" };
    assert.equal(derive(root, entries[0]).linked, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a figma block with no node id is not a link", () => {
  const root = fixture({
    "docs/components/registry/badge.yaml": `${badge}figma:\n  file_key: "WUc07ZBtjRvypXtsOlbVut"\n`,
  });
  try {
    const [entry] = loadRegistry(root);
    assert.equal(derive(root, entry).linked, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

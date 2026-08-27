import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  loadRegistry,
  derive,
  readiness,
  slugPath,
  registryPathFor,
  pagePathFor,
  figmaUrl,
  levelRank,
  composeFigmaDescription,
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

// The narrative half of a contract, appended to an inventory entry.
const contract = `summary: "One cell of text."
purpose: "Tables need a cell that is only text."
use_when:
  - "A table cell holds a string."
do_not_use_when:
  -
    text: "The cell holds a number."
    instead: "Badge"
api:
  -
    name: "width"
    kind: "variant"
    description: "How wide."
`;

test("slugs a nested name into the path both directories mirror", () => {
  assert.equal(slugPath("Table / TD Text"), "table/td-text");
  assert.equal(slugPath("Button Basic"), "button-basic");
  assert.equal(registryPathFor("Table / TD Text"), "docs/components/registry/table/td-text.yaml");
  assert.equal(pagePathFor("Table / TD Text"), "table/td-text.html");
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

test("derives documented from the contract's own fields, and linked from a node id", () => {
  const root = fixture({
    "docs/components/registry/badge.yaml": badge,
    "docs/components/registry/table/td-text.yaml": `${tdText}${contract}`,
  });
  try {
    const entries = loadRegistry(root);
    assert.deepEqual(derive(entries[0]), { documented: false, linked: false });
    assert.deepEqual(derive(entries[1]), { documented: true, linked: false });

    entries[0].figma = { file_key: "WUc07ZBtjRvypXtsOlbVut", node_id: "4479-13507" };
    assert.equal(derive(entries[0]).linked, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("reads the two flags as one word — ready needs both", () => {
  const root = fixture({
    "docs/components/registry/badge.yaml": badge,
    "docs/components/registry/table/td-text.yaml": `${tdText}${contract}`,
  });
  try {
    const entries = loadRegistry(root);
    assert.equal(readiness(entries[0]), "not started");
    assert.equal(readiness(entries[1]), "in progress");

    entries[1].figma = { file_key: "WUc07ZBtjRvypXtsOlbVut", node_id: "4479-13507" };
    assert.equal(readiness(entries[1]), "ready");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a property with no description leaves the contract undocumented", () => {
  const root = fixture({
    "docs/components/registry/table/td-text.yaml": `${tdText}${contract.replace(
      '    description: "How wide."\n',
      ""
    )}`,
  });
  try {
    assert.equal(derive(loadRegistry(root)[0]).documented, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("composes the Figma description from three fields, never from one of its own", () => {
  const root = fixture({
    "docs/components/registry/table/td-text.yaml": `${tdText}${contract}`,
  });
  try {
    const [entry] = loadRegistry(root);
    assert.deepEqual(composeFigmaDescription(entry).split("\n"), [
      "One cell of text.",
      "Use when: A table cell holds a string.",
      "Do not use when: The cell holds a number. Use Badge instead.",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("composes nothing where one of the three lines is missing", () => {
  const root = fixture({ "docs/components/registry/badge.yaml": badge });
  try {
    assert.equal(composeFigmaDescription(loadRegistry(root)[0]), null);
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
    assert.equal(derive(entry).linked, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

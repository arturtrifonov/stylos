import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildViewData, renderView } from "./build-registry-view.mjs";
import { loadRegistry } from "./lib/registry.mjs";

function fixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), "stylos-view-"));
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
figma:
  file_key: "WUc07ZBtjRvypXtsOlbVut"
  node_id: "4479-13507"
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

function build(extra = {}) {
  const root = fixture({
    "docs/components/registry/badge.yaml": badge,
    "docs/components/registry/table/td-text.yaml": tdText,
    ...extra,
  });
  try {
    const data = buildViewData(root, loadRegistry(root));
    return { data, html: renderView(data) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("carries every entry into the payload, once", () => {
  const { data } = build();
  assert.deepEqual(
    data.entries.map((e) => e.id),
    ["Badge", "Table / TD Text"]
  );
});

test("resolves the Figma link at build time, so no stored URL can rot", () => {
  const { data } = build();
  const badgeEntry = data.entries.find((e) => e.id === "Badge");
  assert.equal(
    badgeEntry.figma_url,
    "https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/?node-id=4479-13507"
  );
  assert.equal(badgeEntry.linked, true);
  assert.equal(data.entries.find((e) => e.id === "Table / TD Text").figma_url, null);
});

test("derives documented from a document on disk, with no source change", () => {
  const before = build();
  assert.equal(before.data.entries.find((e) => e.id === "Table / TD Text").documented, false);

  const after = build({ "docs/components/table/td-text.md": "# Table / TD Text\n" });
  assert.equal(after.data.entries.find((e) => e.id === "Table / TD Text").documented, true);
});

test("names the document path whether or not it exists yet", () => {
  const { data } = build();
  assert.equal(
    data.entries.find((e) => e.id === "Table / TD Text").document_path,
    "docs/components/table/td-text.md"
  );
});

test("reaches nothing over the network — no CDN, no font, no fetch", () => {
  const { html } = build();
  const remote = [...html.matchAll(/(https?:)?\/\/[^"'\s)]+/g)].map((m) => m[0]);
  // The only absolute URLs allowed in the output are the Figma links built
  // from the entries themselves.
  assert.ok(
    remote.every((url) => url.startsWith("https://www.figma.com/design/")),
    `unexpected remote reference: ${remote.filter((u) => !u.startsWith("https://www.figma.com/design/"))}`
  );
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /<link[^>]+stylesheet/);
  assert.doesNotMatch(html, /\bfetch\s*\(/);
});

test("inlines the data as one payload the page already has", () => {
  const { html, data } = build();
  const payload = html.match(/window\.__REGISTRY__ = (.*);<\/script>/);
  assert.ok(payload, "the data is not inlined");
  assert.equal(JSON.parse(payload[1]).entries.length, data.entries.length);
});

test("escapes a value that would otherwise close the script tag", () => {
  const { html } = build({
    "docs/components/registry/badge.yaml": badge.replace(
      'notes: ""',
      'notes: "closes the tag: </script><script>alert(1)</script>"'
    ),
  });
  const scripts = html.match(/<\/script>/g) ?? [];
  assert.equal(scripts.length, 2, "a note broke out of the data payload");
  assert.match(html, /\\u003c\/script>/);
});

test("adapts to the reader's theme rather than picking one", () => {
  const { html } = build();
  assert.match(html, /prefers-color-scheme: dark/);
});

test("lifts the Airtable batch onto the row, so it can be filtered and sorted", () => {
  const { data } = build();
  assert.equal(data.entries.find((e) => e.id === "Badge").batch, 1);
  assert.equal(data.entries.find((e) => e.id === "Table / TD Text").batch, null);
});

test("offers only the batch values that occur, in order", () => {
  const { data } = build({
    "docs/components/registry/badge.yaml": badge.replace("batch: 1", "batch: 3"),
    "docs/components/registry/table/td-text.yaml": `${tdText}import:\n  batch: 1\n  ready: false\n`,
  });
  assert.deepEqual(data.batches, [1, 3]);
});

test("says nothing about batches when nothing carries one", () => {
  const { data } = build({
    "docs/components/registry/badge.yaml": badge.replace("import:\n  batch: 1\n  ready: false\n", ""),
    "docs/components/registry/table/td-text.yaml": tdText,
  });
  assert.deepEqual(data.batches, []);
  assert.equal(data.entries.every((e) => e.batch === null), true);
});

test("groups by level, on by default, and by nothing else", () => {
  const { html } = build();
  assert.match(html, /group: true,/);
  assert.match(html, /text: "Group by level"/);
  // Grouping is a display mode, so clearing the filters must not switch it off.
  assert.doesNotMatch(html, /state\.group = false;/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildViewData, renderView, loadChrome } from "./build-registry-view.mjs";
import { loadRegistry } from "./lib/registry.mjs";

// The registry is a fixture; the theme is the repository's own, because it is
// resolved from tokens/ and a fixture has none. This is also what the real
// build does — one theme over whatever entries it is handed.
const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const chrome = loadChrome(repoRoot);

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
    return { data, html: renderView(data, chrome) };
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

test("derives documented from the contract in the entry, with no source change", () => {
  const before = build();
  assert.equal(before.data.entries.find((e) => e.id === "Table / TD Text").documented, false);

  const after = build({
    "docs/components/registry/table/td-text.yaml": `${tdText}summary: "One cell of text."
purpose: "Tables need a cell that is only text."
use_when:
  - "A table cell holds a string."
api:
  -
    name: "width"
    kind: "variant"
    description: "How wide."
`,
  });
  assert.equal(after.data.entries.find((e) => e.id === "Table / TD Text").documented, true);
});

test("links every row to its page, legacy entries included", () => {
  const { data } = build();
  assert.equal(
    data.entries.find((e) => e.id === "Table / TD Text").page_path,
    "components/table/td-text.html"
  );
  assert.equal(data.entries.find((e) => e.id === "Badge").page_path, "components/badge.html");
});

const ALLOWED_REMOTE = (url) =>
  // The Figma links, built from the entries themselves...
  url.startsWith("https://www.figma.com/design/") ||
  // ...and the SVG namespace on the inlined wordmark, which is an identifier
  // a parser compares against, not an address anything resolves.
  url === "http://www.w3.org/2000/svg";

test("reaches nothing over the network — no CDN, no remote font, no fetch", () => {
  const { html } = build();
  const remote = [...html.matchAll(/(https?:)?\/\/[^"'\s)]+/g)].map((m) => m[0]);
  assert.ok(
    remote.every(ALLOWED_REMOTE),
    `unexpected remote reference: ${remote.filter((u) => !ALLOWED_REMOTE(u))}`
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

test("reads the two derived flags as one word, so ready rows can be spotted", () => {
  const { data } = build();
  // Badge is linked to Figma but has no contract; TD Text has neither.
  assert.equal(data.entries.find((e) => e.id === "Badge").readiness, "in progress");
  assert.equal(data.entries.find((e) => e.id === "Table / TD Text").readiness, "not started");

  const after = build({
    "docs/components/registry/badge.yaml": `${badge}summary: "A small label."
purpose: "Short states need a label that is not a sentence."
use_when:
  - "A row carries a short state."
`,
  });
  assert.equal(after.data.entries.find((e) => e.id === "Badge").readiness, "ready");
});

test("offers readiness as its own vocabulary, most complete first", () => {
  const { data, html } = build();
  assert.deepEqual(data.readiness, ["ready", "in progress", "not started"]);
  assert.match(html, /text: "Readiness"/);
});

test("colours readiness in both themes, and never by colour alone", () => {
  const { html } = build();
  // The word is in the cell; the colour and the dot only make it scannable.
  // Both tones come from tokens/ — text/success in each mode — so the pair
  // asserted here is the pair the token set currently resolves to.
  assert.match(html, /--ok: #166534;/);
  assert.match(html, /--ok: #8aeeae;/);
  assert.match(html, /\.status\[data-status="ready"\] \{ color: var\(--ok\); \}/);
  assert.match(html, /el\("span", \{ text: entry\.readiness \}\)/);
});

test("dresses the page from tokens/ rather than from a hex written here", () => {
  const { html } = build();
  // SPEC 0002 §4.3: no hand-coded Stylos colour. The wordmark takes the theme
  // through currentColor, and the fonts are the two families font.yaml names.
  assert.match(html, /--brand: #5752f1;/);
  assert.match(html, /--font-sans: Georama,/);
  assert.match(html, /assets\/fonts\/georama-latin\.woff2/);
  assert.match(html, /<svg class="logo"/);
});

test("keeps the authored lifecycle apart from the derived readiness", () => {
  const { data } = build({
    "docs/components/registry/badge.yaml": badge.replace('name: "Badge"', 'name: "Badge"\nstatus: "draft"'),
  });
  const badgeEntry = data.entries.find((e) => e.id === "Badge");
  assert.equal(badgeEntry.status, "draft");
  assert.equal(badgeEntry.readiness, "in progress");
  assert.equal(data.entries.find((e) => e.id === "Table / TD Text").status, null);
});

test("groups by level, on by default, and by nothing else", () => {
  const { html } = build();
  assert.match(html, /group: true,/);
  assert.match(html, /text: "Group by level"/);
  // Grouping is a display mode, so clearing the filters must not switch it off.
  assert.doesNotMatch(html, /state\.group = false;/);
});

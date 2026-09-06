import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sampleHtml, buildShowcase } from "./showcase.mjs";
import { loadRegistry } from "./registry.mjs";

const entry = {
  id: "Badge",
  api: [
    { name: "number text", kind: "text", default: "1" },
    { name: "tone", kind: "variant", default: "base", values: [{ value: "base" }, { value: "danger" }] },
    { name: "size", kind: "variant", default: "medium", values: [{ value: "medium" }, { value: "extra small" }] },
  ],
};

test("writes the DOM contract — class, data attributes verbatim, text as content", () => {
  assert.equal(
    sampleHtml(entry, { "number text": "99+", tone: "danger", size: "extra small" }),
    '<span class="stylos-badge" data-tone="danger" data-size="extra small">99+</span>'
  );
});

// The honesty guard: the sample cannot claim what the contract does not say.
test("refuses a property the contract does not carry", () => {
  assert.throws(() => sampleHtml(entry, { state: "hover" }), /no api property "state"/);
});

test("refuses a value outside the variant's list, naming the list", () => {
  assert.throws(() => sampleHtml(entry, { tone: "success" }), /no value "success".*base, danger/);
});

test("refuses a non-boolean where the contract says boolean", () => {
  const withBool = { id: "X", api: [{ name: "is required", kind: "boolean", default: false }] };
  assert.throws(() => sampleHtml(withBool, { "is required": "yes" }), /is a boolean/);
  assert.equal(sampleHtml(withBool, { "is required": true }), '<span class="stylos-x" data-is-required="true"></span>');
});

// The one structural case, pinned to the entry's html field: the marker span
// is aria-hidden, the supporting span rides validation or the boolean.
test("writes Label's marker and supporting spans per its html field", () => {
  const label = {
    id: "Label",
    api: [
      { name: "label text", kind: "text", default: "Label" },
      { name: "is required", kind: "boolean", default: false },
      { name: "has additional text", kind: "boolean", default: false },
      { name: "additional text", kind: "text", default: "Additional text" },
      { name: "validation", kind: "variant", default: "off", values: [{ value: "off" }, { value: "error" }] },
    ],
  };
  const html = sampleHtml(label, { "label text": "Email", "is required": true, validation: "error", "additional text": "Wrong" });
  assert.match(html, /^<label class="stylos-label"/);
  assert.match(html, /Email<span aria-hidden="true"> \*<\/span><span>Wrong<\/span><\/label>$/);
  assert.doesNotMatch(sampleHtml(label, { "label text": "Email" }), /<span/);
});

// End to end against the real repository: whatever the curated composition
// names must build, and build only from what the registry and the package
// actually hold. Drift in either fails here rather than shipping.
test("the real composition builds from the real contracts and the shipped CSS", () => {
  const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
  const showcase = buildShowcase(root, loadRegistry(root));
  if (showcase === null) return; // a checkout with no components built — the section is absent, and rightly

  assert.ok(showcase.css.includes("--stylos-"), "the token sheet is in the payload");
  assert.ok(showcase.groups.length > 0);
  for (const group of showcase.groups) {
    for (const sample of group.samples) {
      assert.match(sample.html, /class="stylos-/);
    }
  }
  assert.ok(
    showcase.groups.every((group) => showcase.css.includes(`.stylos-${group.id.toLowerCase().replace(/ /g, "-")}`)),
    "every shown component's CSS is inlined"
  );
});

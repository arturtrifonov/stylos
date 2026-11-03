import test from "node:test";
import assert from "node:assert/strict";
import { loadRegistry } from "./registry.mjs";
import { defaultAssignment, sampleHtml } from "./preview.mjs";
import { fileURLToPath } from "node:url";

const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));

test("Toggle static previews preserve selection and escape label content without interactive controls", () => {
  for (const id of ["Toggle Input", "Toggle Label", "Toggle Text"]) {
    const entry = entries.find(entry => entry.id === id);
    const props = { ...defaultAssignment(entry), "is checked": "true", name: "delivery", value: "weekly", form: "settings" };
    if (id !== "Toggle Input") props["label text"] = "<Weekly> & daily";
    const html = sampleHtml(entry, props);
    // The Input root span is the surface; Label sets its text directly, Text keeps a copy box.
    assert.match(html, /<span class="stylos-toggle-input"[^>]*aria-hidden="true"><\/span>/);
    assert.doesNotMatch(html, /input-surface/);
    if (id.endsWith("Label")) assert.doesNotMatch(html, /stylos-toggle-copy/);
    if (id.endsWith("Text")) assert.match(html, /stylos-toggle-copy/);
    assert.match(html, /data-is-checked="true"/);
    assert.doesNotMatch(html, /<input|<label|<Weekly>/);
    if (id !== "Toggle Input") assert.match(html, /&lt;Weekly&gt; &amp; daily/);
    assert.throws(() => sampleHtml(entry, { "is checked": "mixed" }), /no value "mixed"/);
  }
});

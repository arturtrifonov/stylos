import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { defaultAssignment, sampleHtml } from "./preview.mjs";

const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));

for (const id of ["Tag Fill", "Tag Outline"]) {
  test(`${id} preserves label case and renders only configured decorative icons`, () => {
    const entry = entries.find(entry => entry.id === id);
    const props = defaultAssignment(entry);
    assert.equal(props.size, "medium");
    assert.equal(props["text case"], "uppercase");
    const html = sampleHtml(entry, {
      ...props, "label text": 'Category <one> & "two"',
      "has leading icon": true, "leading icon": "check",
      "has trailing icon": true, "trailing icon": "arrow_forward",
    });
    assert.match(html, /^<span class="stylos-tag-/);
    assert.match(html, /stylos-tag-label">Category &lt;one&gt; &amp; &quot;two&quot;</);
    assert.match(html, /data-position="leading" aria-hidden="true"><svg[^>]*data-name="check"/);
    assert.match(html, /data-position="trailing" aria-hidden="true"><svg[^>]*data-name="arrow_forward"/);
    assert.doesNotMatch(html, /<button|<a |tabindex|onclick/);
    assert.doesNotMatch(sampleHtml(entry, { ...props, "leading icon": "check" }), /<svg/);
    assert.doesNotMatch(sampleHtml(entry, { ...props, "has leading icon": true }), /<svg|stylos-tag-icon/);
    assert.doesNotMatch(sampleHtml(entry, { ...props, "has leading icon": true, "leading icon": "unknown" }), /<svg/);
    assert.throws(() => sampleHtml(entry, { ...props, state: "hover" }), /no api property/);
  });
}

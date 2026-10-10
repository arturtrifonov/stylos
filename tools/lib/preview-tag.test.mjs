import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { defaultAssignment, sampleHtml } from "./preview.mjs";

const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));

for (const variant of ["fill", "outline"]) {
  const id = "Tag";
  test(`${id} ${variant} preserves label case and renders only configured decorative icons`, () => {
    const entry = entries.find(entry => entry.id === id);
    const props = { ...defaultAssignment(entry), variant };
    assert.equal(props.size, "medium");
    assert.equal(props["text case"], "uppercase");
    const html = sampleHtml(entry, {
      ...props, "label text": 'Category <one> & "two"',
      "has leading icon": true, "leading icon": "check",
      "has trailing icon": true, "trailing icon": "arrow_forward",
    });
    assert.match(html, /^<span class="stylos-tag stylos-tag-/);
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

for (const variant of ["fill", "outline"]) {
  const id = "Tag Interactive";
  test(`${id} ${variant} previews a native action without introducing selection or icon controls`, () => {
    const entry = entries.find(entry => entry.id === id);
    const props = { ...defaultAssignment(entry), variant };
    const html = sampleHtml(entry, {
      ...props, "label text": 'Apply <one> & "two"', type: "submit",
      state: "disabled", id: 'apply"', name: "action", value: 'apply&', form: 'filters"',
      "description ids": 'hint"',
      "has leading icon": true, "leading icon": "check",
      "has trailing icon": true, "trailing icon": "arrow_forward",
    });
    assert.match(html, /^<button type="submit" class="stylos-tag-interactive stylos-tag-interactive-/);
    assert.match(html, /id="apply&quot;"/);
    assert.match(html, /name="action" value="apply&amp;" form="filters&quot;"/);
    assert.match(html, /aria-describedby="hint&quot;" disabled>/);
    assert.match(html, /stylos-tag-label">Apply &lt;one&gt; &amp; &quot;two&quot;</);
    assert.match(html, /data-position="leading" aria-hidden="true"><svg[^>]*data-name="check"/);
    assert.match(html, /data-position="trailing" aria-hidden="true"><svg[^>]*data-name="arrow_forward"/);
    assert.equal((html.match(/<button/g) ?? []).length, 1);
    assert.doesNotMatch(html, /aria-pressed|href=|tabindex|onclick/);
    assert.match(sampleHtml(entry, props), /^<button type="button"/);
    assert.doesNotMatch(sampleHtml(entry, props), / disabled|<svg/);
    assert.doesNotMatch(sampleHtml(entry, { ...props, "has leading icon": true }), /stylos-tag-icon/);
    assert.doesNotMatch(sampleHtml(entry, { ...props, "has leading icon": true, "leading icon": "unknown" }), /<svg/);
    assert.throws(() => sampleHtml(entry, { state: "hover" }), /no value "hover"/);
    assert.throws(() => sampleHtml(entry, { "is focused": true }), /no api property/);
    assert.throws(() => sampleHtml(entry, { onclick: () => {} }), /event callback/);
  });
}

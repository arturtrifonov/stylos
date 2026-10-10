import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { defaultAssignment, sampleHtml } from "./preview.mjs";

const entry = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)))
  .find(entry => entry.id === "Button Icon");

for (const variant of ["base", "outline", "ghost"]) {
  test(`Button Icon ${variant} previews a named native button with decorative icon and form attributes`, () => {
    const html = sampleHtml(entry, {
      ...defaultAssignment(entry), variant, icon: "search", "accessible name": 'Find "items" <now>',
      type: "submit", state: "disabled", id: 'find"', name: "action", value: 'find&',
      form: 'filters"', "description ids": 'hint"',
    });
    assert.ok(html.startsWith(`<button type="submit" class="stylos-button-icon stylos-button-${variant}"`));
    assert.match(html, /aria-label="Find &quot;items&quot; &lt;now&gt;"/);
    assert.match(html, /id="find&quot;" name="action" value="find&amp;" form="filters&quot;"/);
    assert.match(html, /aria-describedby="hint&quot;" disabled>/);
    assert.match(html, /stylos-button-icon-mark" aria-hidden="true"><svg[^>]*data-name="search"/);
    assert.equal((html.match(/<button/g) ?? []).length, 1);
    assert.doesNotMatch(html, /aria-pressed|href=|tabindex|onclick/);
  });
}

test("Button Icon samples configure an icon and name without introducing runtime defaults or drawing controls", () => {
  const defaults = sampleHtml(entry, defaultAssignment(entry));
  assert.match(defaults, /^<button type="button"/);
  assert.match(defaults, /aria-label="Add item"/);
  assert.match(defaults, /data-name="add"/);
  assert.doesNotMatch(sampleHtml(entry), /<svg|aria-label/);
  assert.doesNotMatch(sampleHtml(entry, { icon: "unknown" }), /stylos-button-icon-mark|<svg/);
  assert.throws(() => sampleHtml(entry, { state: "hover" }), /no value "hover"/);
  assert.throws(() => sampleHtml(entry, { "is focused": true }), /no api property/);
  assert.throws(() => sampleHtml(entry, { onclick: () => {} }), /event callback/);
});

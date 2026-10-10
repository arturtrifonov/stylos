import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { defaultAssignment, sampleHtml } from "./preview.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const entry = loadRegistry(root).find(entry => entry.id === "Button Inner");

test("Button Inner previews a named local-action button with a decorative active-set icon", () => {
  const html = sampleHtml(entry, {
    ...defaultAssignment(entry), icon: "close", "accessible name": 'Clear "field" <now>',
    id: 'clear"', "description ids": 'help"', state: "disabled",
  });
  assert.match(html, /^<button type="button" class="stylos-button-inner"/);
  assert.match(html, /aria-label="Clear &quot;field&quot; &lt;now&gt;"/);
  assert.match(html, /id="clear&quot;"/);
  assert.match(html, /aria-describedby="help&quot;"/);
  assert.match(html, / disabled>/);
  assert.match(html, /stylos-button-inner-icon" aria-hidden="true"><svg/);
  assert.match(html, /data-name="close"[^>]*><path /);
  assert.doesNotMatch(sampleHtml(entry, { icon: "missing_mark" }), /<svg|<path/);
  assert.doesNotMatch(sampleHtml(entry, defaultAssignment(entry)), /<svg|<path/);
  assert.throws(() => sampleHtml(entry, { onclick: () => {} }), /event callback/);
  assert.throws(() => sampleHtml(entry, { state: "hover" }), /no value "hover"/);
});

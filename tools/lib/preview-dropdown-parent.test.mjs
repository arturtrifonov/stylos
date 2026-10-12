import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { defaultAssignment, sampleHtml } from "./preview.mjs";

const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));
const parent = entries.find(entry => entry.id === "Dropdown Item Parent");
const leaf = entries.find(entry => entry.id === "Dropdown Item Default");

test("Parent is a disabled-aware native button with fixed arrow, escaped target and associated qualifier", () => {
  const html = sampleHtml(parent, { ...defaultAssignment(parent), id: 'parent"', controls: 'level"&',
    "label text": '<Design>', state: "disabled", "has icon": true, icon: "home",
    "has additional text": true, "additional text": '<Private>' });
  assert.match(html, /^<li role="presentation"><button type="button"/);
  assert.match(html, /id="parent&quot;" aria-label="&lt;Design&gt;" aria-controls="level&quot;&amp;" disabled/);
  assert.match(html, /aria-describedby="parent&quot;-description"/);
  assert.match(html, /id="parent&quot;-description">&lt;Private&gt;/);
  assert.match(html, /data-name="home"/);
  assert.match(html, /data-name="arrow_right"/);
  assert.doesNotMatch(html, /role="option"|aria-selected|aria-pressed|data-name="check"|<Design>/);
});

test("action leaves and Back have native activation semantics while default leaves remain listbox options", () => {
  const props = { ...defaultAssignment(leaf), interaction: "action", value: 'team"&',
    "is selected": "true", "label text": '<Team>', state: "disabled" };
  const action = sampleHtml(leaf, props);
  assert.match(action, /^<li role="presentation"><button type="button"/);
  assert.match(action, /data-value="team&quot;&amp;"/);
  assert.match(action, /aria-label="&lt;Team&gt;" aria-pressed="true" disabled/);
  assert.doesNotMatch(action, /aria-selected|role="option"/);
  const back = sampleHtml(leaf, { ...props, value: "", state: "default", "is selected": "false", "has icon": true, icon: "arrow_back" });
  assert.doesNotMatch(back, /aria-pressed| disabled/);
  assert.match(back, /data-name="arrow_back"/);
  const option = sampleHtml(leaf, { ...props, interaction: "option" });
  assert.match(option, /^<li[^>]*role="option"/);
  assert.match(option, /aria-selected="true" aria-disabled="true"/);
  assert.doesNotMatch(option, /<button|aria-pressed/);
});

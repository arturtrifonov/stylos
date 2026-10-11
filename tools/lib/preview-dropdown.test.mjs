import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { defaultAssignment, sampleHtml } from "./preview.mjs";

const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));
const item = entries.find(entry => entry.id === "Dropdown Item Default");
const panel = entries.find(entry => entry.id === "Dropdown");

test("Dropdown preserves option semantics and escapes labels, values and names", () => {
  const row = sampleHtml(item, { ...defaultAssignment(item), value: 'team"&',
    "label text": "<Team> & design", "has additional text": true, "additional text": '<Private>',
    state: "disabled", "is selected": "true", "has icon": true, icon: "home" });
  assert.match(row, /^<li[^>]*role="option"/);
  assert.match(row, /data-value="team&quot;&amp;"/);
  assert.match(row, /aria-selected="true" aria-disabled="true"/);
  assert.match(row, /&lt;Team&gt; &amp; design/);
  assert.match(row, /&lt;Private&gt;/);
  assert.match(row, /data-name="home"/);
  assert.match(row, /data-name="check"/);
  assert.doesNotMatch(row, /<button|<input|<Team>|tabindex/);
  const html = sampleHtml(panel, { size: "medium", "content slot": row, "accessible name": 'Team "choice"', id: 'teams"' });
  assert.match(html, /<ul[^>]*role="listbox" id="teams&quot;" aria-label="Team &quot;choice&quot;"/);
  assert.ok(html.includes(row));
  assert.equal((html.match(/role="option"/g) ?? []).length, 1);
});

test("Dropdown previews keep optional bands outside the option list", () => {
  const html = sampleHtml(panel, { "back slot": '<button>Back</button>', "search slot": '<input aria-label="Search">',
    "content slot": '<li role="option">One</li>', "actions slot": '<button>Apply</button>', "max height": '20rem' });
  assert.match(html, /stylos-dropdown-back.*stylos-dropdown-search.*<ul.*<\/ul>.*stylos-dropdown-actions/);
  assert.match(html, /--_stylos-dropdown-height-limit:20rem/);
  assert.throws(() => sampleHtml(item, { state: "hover" }), /no value/);
  assert.throws(() => sampleHtml(item, { "is focused": true }), /no api property/);
});

for (const kind of ["Checkbox", "Toggle"]) {
  test(`Dropdown Item ${kind} uses one labelled native control with a description and form association`, () => {
    const controlRow = entries.find(entry => entry.id === `Dropdown Item ${kind}`);
    const html = sampleHtml(controlRow, { ...defaultAssignment(controlRow), id: 'control"',
      name: "workspace", value: 'team"&', form: "preferences", "is selected": "true", state: "disabled",
      "label text": "<Design>", "has additional text": true, "additional text": "<Private>" });
    assert.equal((html.match(/<input /g) ?? []).length, 1);
    assert.match(html, /<li role="presentation"><label class="stylos-dropdown-item /);
    assert.match(html, /for="control&quot;"/);
    assert.match(html, /type="checkbox"/);
    assert.match(html, /id="control&quot;" name="workspace" value="team&quot;&amp;" form="preferences" checked disabled/);
    assert.match(html, /aria-describedby="control&quot;-description"/);
    assert.match(html, /id="control&quot;-description">&lt;Private&gt;/);
    assert.match(html, /&lt;Design&gt;/);
    assert.doesNotMatch(html, /role="option"|aria-selected|<Design>/);
    if (kind === "Toggle") assert.match(html, /role="switch"/);
    else assert.doesNotMatch(html, /role="switch"/);
    const group = sampleHtml(panel, { "content role": "group", "content slot": html, "accessible name": "Preferences" });
    assert.match(group, /<ul[^>]*role="group"[^>]*aria-label="Preferences"/);
    assert.doesNotMatch(group, /role="listbox"/);
    assert.throws(() => sampleHtml(controlRow, { state: "hover" }), /no value/);
    assert.throws(() => sampleHtml(controlRow, { "is focused": true }), /no api property/);
  });
}

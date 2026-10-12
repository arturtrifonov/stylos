import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { sampleHtml, defaultAssignment, wrapTablePreview } from "./preview.mjs";

const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));
const entry = id => entries.find(item => item.id === id);

test("table cells preserve native associations, full escaped strings and action names", () => {
  const heading = entry("Table Cell Heading"), text = entry("Table Cell Text");
  const html = sampleHtml(heading, { ...defaultAssignment(heading), id: 'amount"', "cell text": '<Amount>',
    "is sorted": true, "is filtered": true, "sort direction": "descending", "sort accessible name": 'Sort "amount"' });
  assert.match(html, /^<th /);
  assert.match(html, /id="amount&quot;" scope="col" data-constrained="true" aria-sort="descending"/);
  assert.match(html, /title="&lt;Amount&gt;">&lt;Amount&gt;/);
  assert.match(html, /data-table-action="sort"/);
  assert.match(html, /aria-label="Sort &quot;amount&quot;"/);
  assert.match(html, /data-name="arrow_upward"/);
  assert.match(html, /data-name="filter_list"/);
  const value = sampleHtml(text, { ...defaultAssignment(text), headers: 'amount"', "cell text": '€24 < tax' });
  assert.match(value, /^<td /);
  assert.match(value, /headers="amount&quot;"/);
  assert.match(value, /title="€24 &lt; tax">€24 &lt; tax/);
  assert.doesNotMatch(value, /aria-sort|<button/);
  assert.doesNotMatch(sampleHtml(heading, defaultAssignment(heading)), /aria-sort|<button/);
});

test("standalone native previews get valid table scaffolding without spacer cells or flex markup", () => {
  for (const id of ["Table Cell Heading", "Table Cell Text", "Table Row Head", "Table Row Body"]) {
    const component = entry(id);
    const html = wrapTablePreview(component, sampleHtml(component, defaultAssignment(component)));
    const head = ["Table Cell Heading", "Table Row Head"].includes(id);
    assert.match(html, head ? /<thead><tr/ : /<tbody><tr/);
    assert.equal((html.match(/<(?:th|td) /g) ?? []).length, id.startsWith("Table Row") ? 4 : 1);
    assert.doesNotMatch(html, /role="(?:grid|row|cell)"|spacer/);
  }
  assert.throws(() => sampleHtml(entry("Table Row Body"), { state: "hover" }), /no api property/);
});

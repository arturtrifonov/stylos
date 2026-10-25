import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { buildPreviewAssets, defaultAssignment, sampleHtml } from "./preview.mjs";
import { markupReader } from "./ui-release.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const entries = loadRegistry(root);
const entry = entries.find(entry => entry.id === "Input Text");
const defaults = defaultAssignment(entry);
const render = props => sampleHtml(entry, { ...defaults, ...props });

test("static Input Text previews ship the composed focus token their CSS uses", () => {
  const assets = buildPreviewAssets(root, entries);
  assert.match(assets.byId.get("Input Text"), /box-shadow: var\(--stylos-focus-base\)/);
  assert.match(assets.tokensCss, /--stylos-focus-base:\s+0px 0px 0px 4px rgb\(55 48 163 \/ 0.16\)/);
});

test("the text field has an associated native label and escaped form attributes", () => {
  assert.equal(defaults.size, "medium");
  assert.equal(defaults.value, "");
  const html = render({ id: "reference", name: "reference", form: "invoice", autocomplete: "off",
    value: 'A < B & "C"', "label text": "Reference", "is required": true });
  assert.match(html, /<label[^>]*for="reference">Reference/);
  assert.match(html, /<input type="text" id="reference" value="A &lt; B &amp; &quot;C&quot;" name="reference" form="invoice" autocomplete="off" aria-label="Reference" required/);
  assert.match(html, /data-is-filled="true"/);
  assert.doesNotMatch(html, / placeholder=|aria-invalid/);
  assert.throws(() => render({ "is filled": "true" }), /no api property/);
  assert.throws(() => render({ state: "hover" }), /no value/);
});

test("editable validation associates messages and marks only errors invalid", () => {
  for (const outcome of ["off", "error", "warning", "success"]) {
    const html = render({ id: "field", validation: outcome, "additional text": "Check this value" });
    assert.equal(html.includes('aria-invalid="true"'), outcome === "error");
    assert.equal(html.includes('aria-describedby="field-message"'), ["error", "warning"].includes(outcome));
    assert.equal(html.includes('id="field-message"'), ["error", "warning"].includes(outcome));
    assert.equal(html.includes('class="stylos-input-text-validation"'), outcome !== "off");
    if (outcome === "success") assert.match(html, /data-name="check_circle"/);
  }
});

test("read-only and disabled retain their native distinction and suppress outcomes", () => {
  for (const state of ["read only", "disabled"]) {
    const html = render({ state, validation: "error", value: "Settled", "is required": true });
    assert.match(html, /data-validation="off"/);
    assert.match(html, state === "disabled" ? /<input[^>]* disabled/ : /<input[^>]* readonly/);
    assert.doesNotMatch(html, /aria-invalid|stylos-input-text-validation|field-message/);
    assert.equal(html.includes('data-state="disabled"'), state === "disabled");
  }
});

test("hidden labels, suffixes and hints keep explicit accessible associations", () => {
  const html = render({ id: "amount", "has label": false, "accessible name": "Amount",
    "label ids": "amount-label", "description ids": "external-help", "has suffix text": true,
    "suffix text": "USD", validation: "warning", "additional text": "Double-check the amount" });
  assert.match(html, /<span id="amount-message" hidden>Double-check the amount<\/span>/);
  assert.match(html, /aria-label="Amount" aria-labelledby="amount-label" aria-describedby="external-help amount-message amount-suffix"/);
  assert.match(html, /<span class="stylos-input-text-suffix" id="amount-suffix">USD<\/span>/);
  assert.doesNotMatch(html, /class="stylos-label"/);
});

test("static examples get unique IDs and only configured decorative icons", () => {
  const first = render({}), second = render({});
  assert.notEqual(first.match(/<input[^>]*id="([^"]+)"/)[1], second.match(/<input[^>]*id="([^"]+)"/)[1]);
  const html = render({ "has leading icon": true, "leading icon": "person",
    "has trailing icon": true, "trailing icon": "search" });
  assert.match(html, /data-position="leading" aria-hidden="true"><svg[^>]*data-name="person"/);
  assert.match(html, /data-position="trailing" aria-hidden="true"><svg[^>]*data-name="search"/);
  assert.doesNotMatch(render({ "has leading icon": true }), /<svg/);
});

test("plain fields have no empty side slots and optional parts retain their own groups", () => {
  const read = markupReader(render({}));
  const elements = node => node.childNodes?.filter(child => child.tagName) ?? [];
  const count = node => 1 + elements(node).reduce((sum, child) => sum + count(child), 0);
  assert.equal(count(read("stylos-input-text")), 4);
  assert.equal(read("stylos-input-text-field").childNodes.filter(child => child.tagName).length, 1);
  const decorated = markupReader(render({ "has leading icon": true, "leading icon": "person",
    "has trailing icon": true, "trailing icon": "search", "has suffix text": true, "suffix text": "USD" }));
  assert.equal(decorated("stylos-input-text-leading").parentNode, decorated("stylos-input-text-field"));
  assert.equal(decorated("stylos-input-text-suffix").parentNode, decorated("stylos-input-text-trailing"));
  assert.equal(decorated("stylos-input-text-adornments"), undefined);
});

const searchEntry = entries.find(entry => entry.id === "Input Search");
const searchDefaults = defaultAssignment(searchEntry);
const search = props => sampleHtml(searchEntry, { ...searchDefaults, ...props });

test("Search shares Text defaults and always shows its fixed decorative search mark", () => {
  assert.equal(searchDefaults.size, defaults.size);
  assert.equal(searchDefaults["has placeholder"], defaults["has placeholder"]);
  const html = search({});
  const read = markupReader(html);
  const count = node => 1 + (node.childNodes?.filter(child => child.tagName) ?? []).reduce((sum, child) => sum + count(child), 0);
  assert.equal(count(read("stylos-input-search")), 7);
  assert.match(html, /<input type="search"/);
  assert.match(html, /data-name="search"/);
  assert.doesNotMatch(html, / placeholder=|<button|adornments|search-icon/);
  assert.throws(() => search({ "has trailing icon": false }), /no api property/);
  assert.throws(() => search({ "trailing icon": "close" }), /no api property/);
});

test("only filled editable Search fields have a named non-submit clear action", () => {
  const filled = search({ value: "query", "label text": "Products", validation: "error", "has suffix text": true, "suffix text": "items" });
  assert.match(filled, /type="button" aria-label="Clear Products"/);
  assert.match(filled, /search-suffix[\s\S]*stylos-button-inner[\s\S]*search-validation[\s\S]*data-name="search"/);
  assert.match(search({ value: "query", "clear accessible name": 'Очистить "поиск"' }), /aria-label="Очистить &quot;поиск&quot;"/);
  assert.match(search({ value: "query", "has label": false, "accessible name": "Catalog" }), /aria-label="Clear Catalog"/);
  for (const state of ["read only", "disabled"]) {
    const html = search({ state, value: "query", validation: "error" });
    assert.doesNotMatch(html, /<button|aria-invalid|search-validation/);
    assert.match(html, /data-name="search"/);
    assert.match(html, state === "disabled" ? /<input[^>]* disabled/ : /<input[^>]* readonly/);
  }
});

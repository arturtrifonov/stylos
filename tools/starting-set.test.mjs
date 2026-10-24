import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry, contractGaps } from "./lib/registry.mjs";
import { readPlan, waveMembers, milestoneMembers } from "./lib/plan.mjs";
import { builtComponents } from "./build-ui-types.mjs";
import { defaultAssignment, sampleHtml } from "./lib/preview.mjs";
import { markupReader } from "./lib/ui-release.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const entries = loadRegistry(root);
const additions = ["Accordion", "Accordion Header", "Alert Inline", "Alert Popup", "Alert Popup Timer", "Input Search", "Progress Bar", "Switcher", "Switcher Item", "Tabs Horizontal", "Tab Item", "Text Area"];

const reviewedReady = new Set(["Accordion", "Accordion Header"]);

test("urgent product components keep their reviewed status, complete contracts and one core wave", () => {
  const plan = readPlan(root);
  const waves = waveMembers(plan, entries);
  const later = milestoneMembers(plan, entries).flatMap(row => row.ids);
  const built = new Set(builtComponents(root, entries).map(entry => entry.id));
  for (const id of additions) {
    const entry = entries.find(entry => entry.id === id);
    assert.equal(entry.status, reviewedReady.has(id) ? "ready" : "draft", `${id}: readiness follows explicit component review`);
    assert.deepEqual(contractGaps(entry), [], id);
    assert.equal(waves.filter(wave => wave.ids.includes(id)).length, 1, id);
    assert.ok(!later.includes(id), `${id} still waits on a later milestone`);
    assert.ok(built.has(id), id);
  }
  assert.ok(!entries.some(entry => ["Alert", "Progress"].includes(entry.id)));
});

test("draft native-field previews preserve multiline values, escaping and disabled validation suppression", () => {
  const entry = entries.find(entry => entry.id === "Text Area");
  const html = sampleHtml(entry, { ...defaultAssignment(entry), state: "disabled", validation: "error", value: "A\n</textarea><script>bad</script>" });
  assert.match(html, /<textarea[^>]* disabled/);
  assert.match(html, /data-validation="off"/);
  assert.ok(!html.includes("<script>"));
  assert.match(html, /A\n&lt;\/textarea&gt;/);
});

test("progress preview clamps real values and removes a numerical claim in skeleton mode", () => {
  const entry = entries.find(entry => entry.id === "Progress Bar");
  const html = sampleHtml(entry, { ...defaultAssignment(entry), value: "140" });
  assert.match(html, /<progress[^>]* value="100"/);
  const skeleton = sampleHtml(entry, { ...defaultAssignment(entry), state: "skeleton", value: "40" });
  assert.doesNotMatch(skeleton, /<progress[^>]* value=/);
});

test("every starting-set independent preview exposes its component root", () => {
  for (const id of additions) {
    const entry = entries.find(entry => entry.id === id);
    assert.ok(markupReader(sampleHtml(entry, defaultAssignment(entry)))(`stylos-${id.toLowerCase().replaceAll(" ", "-")}`), id);
  }
});

test("Accordion preview keeps the same heading and panel associations in both disclosure states", () => {
  const entry = entries.find(entry => entry.id === "Accordion");
  assert.match(sampleHtml(entry, {}), /data-expand-icon-position="trailing"/);
  for (const expanded of [false, true]) {
    const html = sampleHtml(entry, { ...defaultAssignment(entry), id: "review", "heading level": "2", "is expanded": expanded, "label text": "Read <more>" });
    assert.match(html, /aria-labelledby="review-heading"/);
    assert.match(html, /<h2 class="stylos-accordion-heading"><button/);
    assert.match(html, /id="review-heading" aria-controls="review-body"/);
    assert.match(html, /Read &lt;more&gt;/);
    assert.ok(html.includes(`aria-expanded="${expanded}"`));
    assert.ok(html.includes(`id="review-body"${expanded ? "" : " hidden"}`));
  }
});

test("standalone Accordion Header preview only references a supplied controlled panel", () => {
  const entry = entries.find(entry => entry.id === "Accordion Header");
  assert.doesNotMatch(sampleHtml(entry, defaultAssignment(entry)), /aria-controls=/);
  assert.match(sampleHtml(entry, {}), /data-expand-icon-position="leading"/);
  const html = sampleHtml(entry, { ...defaultAssignment(entry), id: "heading", controls: "panel" });
  assert.match(html, /id="heading" aria-controls="panel"/);
});

test("Accordion and Header previews render all three paired expand icons in both states", () => {
  const iconEntry = entries.find(entry => entry.id === "Icon");
  const pairs = { chevron: ["expand_more", "expand_less"], plus: ["add", "remove"], dropdown: ["arrow_drop_down", "arrow_drop_up"] };
  for (const id of ["Accordion", "Accordion Header"]) {
    const entry = entries.find(entry => entry.id === id);
    for (const [choice, pair] of Object.entries(pairs)) {
      for (const expanded of [false, true]) {
        const html = sampleHtml(entry, { ...defaultAssignment(entry), "expand icon": choice, "is expanded": expanded });
        assert.ok(html.includes(sampleHtml(iconEntry, { name: pair[Number(expanded)] })), `${id}: ${choice}, expanded=${expanded}`);
      }
    }
  }
});

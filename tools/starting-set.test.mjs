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

test("progress preview accepts percentages, clamps values and leaves unknown indeterminate", () => {
  const entry = entries.find(entry => entry.id === "Progress Bar");
  const html = sampleHtml(entry, { ...defaultAssignment(entry), value: "140" });
  assert.match(html, /<progress[^>]* value="100"/);
  assert.match(sampleHtml(entry, { ...defaultAssignment(entry), value: "37.5%" }), /<progress[^>]* value="37.5"/);
  for (const value of ["-10", "invalid", "Infinity"]) {
    assert.match(sampleHtml(entry, { ...defaultAssignment(entry), value }), /<progress[^>]* value="0"/);
  }
  const unknown = sampleHtml(entry, { ...defaultAssignment(entry), value: "unknown" });
  assert.doesNotMatch(unknown, /<progress[^>]* value=/);
  assert.doesNotMatch(unknown, /stylos-progress-label/);
  const labelled = sampleHtml(entry, { ...defaultAssignment(entry), value: "unknown", "label text": "Preparing" });
  assert.match(labelled, /aria-valuetext="Preparing"/);
  assert.match(labelled, /class="stylos-progress-label"[^>]*>Preparing/);
  const fixed = sampleHtml(entry, { ...defaultAssignment(entry), value: "100", "label text": "100%", "label width": "5ch" });
  assert.equal(markupReader(fixed)("stylos-progress-label", "style"), "width: 5ch");
});

test("alert previews share the reviewed heading anatomy and matching-size actions", () => {
  for (const id of ["Alert Inline", "Alert Popup"]) {
    const entry = entries.find(entry => entry.id === id);
    for (const size of ["extra small", "small", "medium", "large", "extra large"]) {
      const read = markupReader(sampleHtml(entry, { ...defaultAssignment(entry), size }));
      assert.equal(read("stylos-alert-heading").parentNode, read("stylos-alert-body"));
      assert.equal(read("stylos-alert-heading-row"), undefined);
      const buttons = read("stylos-alert-actions").childNodes.filter(node => node.tagName === "button");
      assert.equal(buttons.length, 2);
      for (const button of buttons) assert.equal(button.attrs.find(attr => attr.name === "data-size").value, size);
    }
  }
  const inline = entries.find(entry => entry.id === "Alert Inline");
  const read = markupReader(sampleHtml(inline, { ...defaultAssignment(inline), size: "large",
    "has heading": false, "has buttons": false, "has undo button": true }));
  assert.equal(read("stylos-alert-heading"), undefined);
  assert.equal(read("stylos-alert-actions"), undefined);
  assert.equal(read("stylos-button-outline").parentNode, read("stylos-alert-inline"));
  assert.equal(read("stylos-button-outline", "data-size"), "large");
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

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

test("urgent product components are complete draft contracts, implemented and in exactly one core wave", () => {
  const plan = readPlan(root);
  const waves = waveMembers(plan, entries);
  const later = milestoneMembers(plan, entries).flatMap(row => row.ids);
  const built = new Set(builtComponents(root, entries).map(entry => entry.id));
  for (const id of additions) {
    const entry = entries.find(entry => entry.id === id);
    assert.equal(entry.status, "draft", `${id} must not be promoted by implementation`);
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

test("every draft independent preview exposes its component root", () => {
  for (const id of additions) {
    const entry = entries.find(entry => entry.id === id);
    assert.ok(markupReader(sampleHtml(entry, defaultAssignment(entry)))(`stylos-${id.toLowerCase().replaceAll(" ", "-")}`), id);
  }
});

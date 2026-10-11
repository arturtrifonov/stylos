import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { defaultAssignment, sampleHtml, buildPreviewAssets } from "./preview.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const entries = loadRegistry(root);
const entry = entries.find(entry => entry.id === "Select");
const defaults = defaultAssignment(entry);
const render = props => sampleHtml(entry, { ...defaults, ...props });

test("Select previews retain separate full-field and clear buttons with escaped form data", () => {
  assert.equal(defaults.size, "medium");
  const html = render({ id: "workspace", name: "workspace", form: "settings", value: 'a&"b',
    "input text": "Design < team", "label text": "Workspace", "has clear button": true, "is required": true });
  assert.match(html, /<label[^>]*for="workspace">Workspace/);
  assert.match(html, /<button[^>]*role="combobox"[^>]*aria-label="Workspace" aria-required="true"/);
  assert.match(html, /Design &lt; team<\/span><\/span><\/button>/);
  assert.match(html, /<select[^>]*name="workspace" form="settings" required/);
  assert.match(html, /<option value="a&amp;&quot;b" selected>Design &lt; team/);
  assert.match(html, /aria-label="Clear Workspace"/);
  assert.doesNotMatch(html, /<button[^>]*>[\s\S]*?<button[^>]*>[\s\S]*?<\/button>[\s\S]*?<\/button>/);
});

test("empty, read-only and disabled Select states suppress clear and preserve semantics", () => {
  assert.doesNotMatch(render({ "has clear button": true }), /stylos-select-clear/);
  for (const state of ["read only", "disabled"]) {
    const html = render({ state, value: "design", validation: "error", "has clear button": true, "is required": true });
    assert.match(html, /data-validation="off"/);
    assert.doesNotMatch(html, /stylos-select-clear|data-name="arrow_drop_down"|aria-invalid="true"| required/);
    assert.match(html, state === "read only" ? /aria-readonly="true"/ : /<select[^>]* disabled/);
    if (state === "read only") assert.doesNotMatch(html, /<select[^>]* disabled/);
  }
});

test("Select errors and supporting descriptions remain associated with the trigger", () => {
  const html = render({ id: "field", "has label": false, "accessible name": "Workspace",
    "label ids": "external-label", "description ids": "external-hint", validation: "error",
    "has suffix text": true, "suffix text": "Team", "additional text": "Choose a workspace" });
  assert.match(html, /aria-labelledby="external-label" aria-describedby="external-hint field-message field-suffix" aria-invalid="true"/);
  assert.match(html, /id="field-message" hidden>Choose a workspace/);
  assert.match(html, /data-name="error"/);
});

test("Select independent CSS includes its shared field and popup profiles", () => {
  const css = buildPreviewAssets(root, entries).byId.get("Select");
  assert.match(css, /box-shadow: var\(--stylos-focus-base\)/);
  assert.match(css, /--stylos-motion-surface-layer-3-shift/);
  assert.match(css, /\.stylos-select:not\(\[data-size="extra large"\]\)\[data-is-filled="false"\]/);
  assert.doesNotMatch(css, /stylos-select-value[^}]*translateY/);
  assert.throws(() => render({ state: "hover" }), /no value/);
  assert.throws(() => render({ "is filled": "true" }), /no api property/);
});

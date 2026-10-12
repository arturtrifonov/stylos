import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./registry.mjs";
import { sampleHtml, defaultAssignment } from "./preview.mjs";
const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));

test("static windows retain the frame and optional actions without live visibility or temporary assets", () => {
  for (const name of ["Modal", "Drawer"]) {
    const entry = entries.find(e => e.id === name);
    const html = sampleHtml(entry, { ...defaultAssignment(entry), id: 'window"', width: "min(600px, 100%)", "heading text": "<Settings>", "has tertiary button": true });
    assert.match(html, /aria-labelledby="window&quot;-heading"/);
    assert.match(html, /&lt;Settings&gt;/);
    assert.match(html, /data-surface-layer="[56]"/);
    assert.match(html, /data-name="close"/);
    assert.equal((html.match(/<button /g) ?? []).length, 4);
    assert.equal((html.match(/ style=/g) ?? []).length, 1);
    assert.doesNotMatch(html, /data-surface-motion|<dialog|figma\.com\/api\/mcp/);
    const empty = sampleHtml(entry, { ...defaultAssignment(entry), "has primary button": false, "has secondary button": false });
    assert.equal((empty.match(/<button /g) ?? []).length, 1, "the close control remains present");
    assert.doesNotMatch(empty, /stylos-window-footer|stylos-window-actions/);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { componentCss } from "./component-css.mjs";
import { loadRegistry, slugPath } from "./registry.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const entries = loadRegistry(root);

test("Vertical trim matches the component-specific Figma setting", () => {
  for (const id of ["Button Base", "Button Outline", "Button Ghost", "Link", "Badge", "Label", "Tooltip", "Checkbox Label", "Radio Label", "Toggle Label"]) {
    const entry = entries.find(entry => entry.id === id);
    assert.ok(entry.figmaNotes.some(note => note.includes("leadingTrim=NONE")), id);
    assert.doesNotMatch(componentCss(root, slugPath(id)), /text-box-(trim|edge)/, `${id}: Figma disables Vertical trim`);
  }
  for (const id of ["Tag Fill", "Tag Outline"]) {
    const entry = entries.find(entry => entry.id === id);
    assert.ok(entry.figmaNotes.some(note => note.includes("leadingTrim=CAP_HEIGHT")), id);
    const css = componentCss(root, slugPath(id));
    assert.match(css, /@supports \(text-box-trim: trim-both\) and \(text-box-edge: cap alphabetic\)/, id);
    assert.match(css, /\.stylos-tag-label\s*\{\s*text-box-trim: trim-both;\s*text-box-edge: cap alphabetic;/, id);
    assert.doesNotMatch(css, /stylos-single-line-text|translateY/, `${id}: trim is scoped to tags without manual offsets`);
  }
});

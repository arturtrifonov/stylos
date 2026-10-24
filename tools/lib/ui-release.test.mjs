import test from "node:test";
import assert from "node:assert/strict";
import { releaseCases, markupReader, variantChecks } from "./ui-release.mjs";
import { verifyVariantCase } from "../ui-release/checks.mjs";
import { loadRegistry } from "./registry.mjs";
import { fileURLToPath } from "node:url";

test("release cases exhaust interactions between variants and retain optional content checks", () => {
  const entry = { id: "Example", api: [
    { name: "size", kind: "variant", default: "small", values: [{ value: "small" }, { value: "large" }] },
    { name: "tone", kind: "variant", default: "base", values: [{ value: "base" }, { value: "danger" }] },
    { name: "has icon", kind: "boolean", default: false },
    { name: "label text", kind: "text", default: "Example" },
    { name: "onclick", kind: "event" },
  ] };
  const cases = releaseCases(entry);
  assert.equal(cases.length, 5);
  assert.deepEqual(cases.filter(args => !args.hasIcon).map(args => `${args.size}/${args.tone}`).sort(),
    ["large/base", "large/danger", "small/base", "small/danger"]);
  assert.ok(cases.some(args => args.hasIcon));
  assert.ok(cases.every(args => args.labelText === "Example" && !("onclick" in args)));
});

test("an empty variant cannot quietly disappear from release coverage", () => {
  assert.throws(() => releaseCases({ id: "Example", api: [{ name: "size", kind: "variant", values: [] }] }), /empty variant/);
});

test("open left Drawer and sorted descending headers are covered at every size", () => {
  const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));
  for (const id of ["Modal", "Drawer", "Table Cell Heading"]) {
    const entry = entries.find(entry => entry.id === id);
    const cases = releaseCases(entry);
    for (const size of entry.api.find(property => property.name === "size").values.map(row => row.value)) {
      assert.ok(cases.some(args => args.size === size && (id === "Table Cell Heading"
        ? args.isSorted && args.sortDirection === "descending" : args.isOpen)), `${id}: ${size}`);
      if (id === "Drawer") assert.ok(cases.some(args => args.size === size && args.isOpen && args.position === "left"));
    }
  }
});

test("substring child classes cannot stand in for a missing component root", () => {
  const read = markupReader('<div class="stylos-radio-input-surface"></div>');
  assert.equal(read("stylos-radio-input"), undefined);
  assert.throws(() => verifyVariantCase({ selector: ".stylos-radio-input", variantChecks: [] }, {}, read), /root class/);
  assert.ok(markupReader('<span class="another stylos-radio-input extra"></span>')("stylos-radio-input"));
});

test("a fixture cannot silently drop a group role or descending aria-sort", () => {
  const entries = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)));
  const dropdown = entries.find(entry => entry.id === "Dropdown");
  const component = { id: dropdown.id, selector: ".stylos-dropdown", variantChecks: variantChecks(dropdown) };
  assert.throws(() => verifyVariantCase(component, { size: "medium", contentRole: "group" },
    markupReader('<div class="stylos-dropdown" data-size="medium"><ul class="stylos-dropdown-options" role="listbox"></ul></div>')), /contentRole/);
  const heading = entries.find(entry => entry.id === "Table Cell Heading");
  assert.throws(() => verifyVariantCase({ id: heading.id, selector: ".stylos-table-cell-heading", variantChecks: variantChecks(heading) },
    { size: "medium", alignment: "start", isSorted: true, sortDirection: "descending" },
    markupReader('<table><tr><th class="stylos-table-cell-heading" data-size="medium" data-alignment="start"></th></tr></table>')), /sortDirection/);
});

test("Accordion heading levels are checked against native tags rather than data attributes", () => {
  const entry = loadRegistry(fileURLToPath(new URL("../..", import.meta.url)))
    .find(entry => entry.id === "Accordion");
  const checks = variantChecks(entry).filter(check => check.prop === "headingLevel");
  assert.equal(checks.length, 1);
  const component = { id: entry.id, selector: ".stylos-accordion", variantChecks: checks };
  for (const headingLevel of ["1", "2", "3", "4", "5", "6"]) {
    verifyVariantCase(component, { headingLevel }, markupReader(
      `<section class="stylos-accordion"><h${headingLevel} class="stylos-accordion-heading"><button>Section</button></h${headingLevel}></section>`));
  }
  for (const heading of ['<h3 class="stylos-accordion-heading"></h3>',
    '<div class="stylos-accordion-heading"></div>', '']) {
    assert.throws(() => verifyVariantCase(component, { headingLevel: "2" }, markupReader(
      `<section class="stylos-accordion" data-heading-level="2">${heading}</section>`)), /headingLevel/);
  }
  // The browser reader returns uppercase HTML tag names; parse5 uses lowercase.
  verifyVariantCase(component, { headingLevel: "2" }, className =>
    className === "stylos-accordion" ? {} : { tagName: "H2" });
});

import test from "node:test";
import assert from "node:assert/strict";

import { checkRegistry } from "./lint-registry.mjs";

// A minimal entry in the shape lib/registry.mjs produces, so a test says only
// what it is about.
function entry(id, fields = {}) {
  return {
    file: `docs/components/registry/${id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.yaml`,
    id,
    name: id,
    level: "object",
    role: "content",
    flowBehavior: ["fill"],
    children: [],
    parents: [],
    notes: "",
    figma: null,
    import: null,
    extra: {},
    ...fields,
  };
}

// Reciprocal by construction, so a test about something else does not trip the
// relation report.
function pair(parentId, childId, fields = {}) {
  return [
    entry(parentId, { children: [childId], ...fields.parent }),
    entry(childId, { parents: [parentId], ...fields.child }),
  ];
}

test("passes a registry whose relations are reciprocal", () => {
  const result = checkRegistry(pair("Table", "Badge", { child: { level: "element" } }));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.reports, []);
  assert.equal(result.ok, true);
});

test("fails a dangling reference", () => {
  const result = checkRegistry([entry("Table", { children: ["Ghost"] })]);
  assert.match(result.errors.join("\n"), /references "Ghost", which has no matching component id/);
  assert.equal(result.ok, false);
});

test("fails two entries claiming one id, naming the file that got there first", () => {
  const result = checkRegistry([
    entry("Badge", { file: "docs/components/registry/badge.yaml" }),
    entry("Badge", { file: "docs/components/registry/badge-copy.yaml" }),
  ]);
  assert.match(
    result.errors.join("\n"),
    /badge-copy\.yaml: duplicate id "Badge", already declared by docs\/components\/registry\/badge\.yaml/
  );
  assert.equal(result.ok, false);
});

test("fails a file whose path does not follow from its id", () => {
  const result = checkRegistry([
    entry("Table / TD Text", { file: "docs/components/registry/td-text.yaml" }),
  ]);
  assert.match(
    result.errors.join("\n"),
    /belongs at docs\/components\/registry\/table\/td-text\.yaml/
  );
});

test("fails a level outside the five", () => {
  const result = checkRegistry([entry("Badge", { level: "atom" })]);
  assert.match(result.errors.join("\n"), /level "atom" is not one of primitive, element/);
});

test("accepts a complete figma block", () => {
  const result = checkRegistry([
    entry("Badge", {
      figma: {
        file_key: "WUc07ZBtjRvypXtsOlbVut",
        node_id: "4479-13507",
        last_verified: "2026-08-24",
      },
    }),
  ]);
  assert.deepEqual(result.errors, []);
});

test("says nothing about a field the figma block has grown", () => {
  const result = checkRegistry([
    entry("Badge", {
      figma: { file_key: "WUc07ZBtjRvypXtsOlbVut", node_id: "4479-13507", page: "Buttons" },
    }),
  ]);
  assert.deepEqual(result.errors, []);
});

test("fails a node id with no file to address it in", () => {
  const result = checkRegistry([entry("Badge", { figma: { node_id: "4479-13507" } })]);
  assert.match(result.errors.join("\n"), /figma\.node_id without figma\.file_key/);
});

test("fails a file key that is not one of the two component files", () => {
  const result = checkRegistry([
    entry("Badge", { figma: { file_key: "2OJYDoTE9EAdQKaJAJK9Kt", node_id: "4479-13507" } }),
  ]);
  assert.match(result.errors.join("\n"), /is not a component file/);
  assert.match(result.errors.join("\n"), /Stylos \/ Components/);
});

test("reports a relation recorded on one side only, from both sides", () => {
  const result = checkRegistry([
    entry("Table", { children: ["Badge"] }),
    entry("Badge", { level: "element" }),
  ]);
  assert.equal(result.ok, true);
  assert.match(
    result.reports.join("\n"),
    /"Table" lists "Badge" as a child, but "Badge" does not list it as a parent/
  );
});

test("reports the reverse direction too", () => {
  const result = checkRegistry([
    entry("Table"),
    entry("Badge", { level: "element", parents: ["Table"] }),
  ]);
  assert.match(
    result.reports.join("\n"),
    /"Badge" lists "Table" as a parent, but "Table" does not list it as a child/
  );
});

test("reports a child at or above its parent's level without failing", () => {
  const result = checkRegistry(pair("Modal", "Table", { parent: { level: "layout" }, child: { level: "layout" } }));
  assert.equal(result.ok, true);
  assert.match(result.reports.join("\n"), /is composed from "Table" \(layout\), which is at or above/);
});

test("says nothing about a child below its parent's level", () => {
  const result = checkRegistry(pair("Table", "Badge", { parent: { level: "layout" }, child: { level: "element" } }));
  assert.deepEqual(result.reports, []);
});

test("reports an entry with neither parents nor children", () => {
  const result = checkRegistry([entry("Popover")]);
  assert.deepEqual(result.reports, ['"Popover" has no parents and no children']);
});

test("reports everything it finds, not the first thing", () => {
  const result = checkRegistry([
    entry("Table", { children: ["Ghost", "Phantom"] }),
    entry("Popover"),
  ]);
  assert.equal(result.errors.length, 2);
  assert.equal(result.reports.length, 1);
});

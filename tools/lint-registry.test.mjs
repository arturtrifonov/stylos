import test from "node:test";
import assert from "node:assert/strict";

import { loadRegistry, readiness } from "./lib/registry.mjs";
import { fileURLToPath } from "node:url";
import { checkRegistry } from "./lint-registry.mjs";

// A minimal entry in the shape lib/registry.mjs produces, carrying none of the
// contract fields — the shape of a legacy entry. The contract checks
// have their own fixtures in build-component-page.test.mjs.
function entry(id, fields = {}) {
  return {
    file: `docs/components/registry/${id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.yaml`,
    id,
    name: id,
    family: null,
    level: "object",
    role: "content",
    html: null,
    status: null,
    version: null,
    summary: null,
    purpose: null,
    useWhen: [],
    doNotUseWhen: [],
    flowBehavior: ["fill"],
    children: [],
    parents: [],
    uses: [],
    usedBy: [],
    a11y: [],
    sizingModel: null,
    variants: null,
    motion: null,
    api: [],
    limitations: [],
    figmaNotes: [],
    notes: "",
    figma: null,
    import: null,
    extra: {},
    ...fields,
  };
}

test("accepts a string identifier without treating examples as a closed vocabulary", () => {
  const { errors } = checkRegistry([
    entry("Icon", {
      api: [{ name: "name", kind: "string", default: "more_horiz", values: [{ value: "check_circle" }] }],
    }),
  ]);
  assert.deepEqual(errors, []);
});

test("text and string properties reject non-string defaults and examples", () => {
  for (const kind of ["text", "string"]) {
    const { errors } = checkRegistry([
      entry("Icon", { api: [{ name: "name", kind, default: 42, values: [{ value: true }] }] }),
    ]);
    assert.ok(errors.some((error) => /default is not a string/.test(error)), kind);
    assert.ok(errors.some((error) => /example value is not a string/.test(error)), kind);
  }
});

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

// PLAN.md §4 and §9 together claim to place every entry exactly once. A run
// with no set to check against skips it entirely, which is what a fixture and
// a repository without a plan both get.
test("reports an entry that neither table in the plan names", () => {
  const entries = [entry("Badge"), entry("Icon")];
  const { ok, reports } = checkRegistry(entries, { planned: new Set(["Badge"]) });
  assert.equal(ok, true, "the plan not naming something is a judgement, not a failure");
  assert.equal(
    reports.filter((report) => /named by neither table/.test(report)).join("\n"),
    '"Icon" is named by neither table in PLAN.md — §4 waves nor §9 milestones'
  );
});

test("says nothing about the plan when there is no plan to check against", () => {
  const { reports } = checkRegistry([entry("Badge")]);
  assert.deepEqual(reports.filter((report) => /named by neither table/.test(report)), []);
});

// SPEC 0009 §5: `api` describes the web component. A property that only draws
// a state the real component decides for itself is drawing-only and belongs in
// `figma_notes` — a report, because moving it is a per-component judgement.
test("reports state carrying hover/active/focus inside api", () => {
  const { ok, reports } = checkRegistry([
    entry("Popover", {
      parents: ["Modal"],
      api: [
        {
          name: "state",
          kind: "variant",
          default: "default",
          description: "Interaction state.",
          values: [
            { value: "default" },
            { value: "hover" },
            { value: "active" },
            { value: "focus" },
            { value: "disabled" },
          ],
        },
      ],
    }),
    entry("Modal", { children: ["Popover"] }),
  ]);
  assert.equal(ok, true, "drawing-only values in api are a judgement, not a failure");
  assert.equal(
    reports.filter((report) => /drawing-only/.test(report)).join("\n"),
    '"Popover" api carries state = hover/active/focus — drawing-only values; record them in figma_notes'
  );
});

test("reports an is focused property inside api", () => {
  const { reports } = checkRegistry([
    entry("Popover", {
      parents: ["Modal"],
      api: [
        { name: "is focused", kind: "boolean", default: false, description: "Draws focus." },
      ],
    }),
    entry("Modal", { children: ["Popover"] }),
  ]);
  assert.equal(
    reports.filter((report) => /drawing-only/.test(report)).join("\n"),
    '"Popover" api carries "is focused" — a drawing-only property; record it in figma_notes'
  );
});

test("says nothing about state carrying only real states", () => {
  const { reports } = checkRegistry([
    entry("Popover", {
      parents: ["Modal"],
      api: [
        {
          name: "state",
          kind: "variant",
          default: "default",
          description: "Interaction state.",
          values: [{ value: "default" }, { value: "disabled" }, { value: "read only" }],
        },
      ],
    }),
    entry("Modal", { children: ["Popover"] }),
  ]);
  assert.deepEqual(reports.filter((report) => /drawing-only/.test(report)), []);
});


const realEntries = loadRegistry(fileURLToPath(new URL("../", import.meta.url)));
const realIcon = realEntries.find((item) => item.id === "Icon");
const checkIcon = (changed) => checkRegistry(realEntries.map((item) => item.id === "Icon" ? changed : item));

test("ready rejects missing required data that prose coverage used to conceal", () => {
  for (const [field, replacement, expected] of [
    ["doNotUseWhen", [], "do_not_use_when"],
    ["sizingModel", null, "sizing_model"],
    ["sizingModel", {...realIcon.sizingModel, intent: " "}, "sizing_model.intent"],
    ["role", null, "role"],
    ["api", realIcon.api.map((item) => ({...item, kind: undefined})), ".kind"],
  ]) {
    const changed = {...realIcon, [field]: replacement};
    assert.equal(readiness(changed), "in progress", field);
    const result = checkIcon(changed);
    assert.equal(result.ok, false, field);
    assert.ok(result.errors.some((line) => line.includes(expected)), field);
    assert.equal(checkIcon({...changed, status: "draft"}).ok, true, `draft may lack ${field}`);
  }
});

test("a complete contract without Figma evidence cannot be marked ready", () => {
  const changed = {...realIcon, figma: null};
  assert.equal(readiness(changed), "complete");
  assert.match(checkIcon(changed).errors.join("\n"), /figma.file_key or figma.node_id is missing/);
  assert.equal(checkIcon({...changed, status: "draft"}).ok, true);
});

test("ready requires a valid calendar date for recorded verification", () => {
  for (const last_verified of [undefined, "", "yesterday", "2026-02-30", "2026-13-01"]) {
    const changed = {...realIcon, figma: {...realIcon.figma, last_verified}};
    assert.equal(readiness(changed), "complete");
    assert.match(checkIcon(changed).errors.join("\n"), /figma.last_verified is missing or is not a valid/);
  }
  assert.equal(checkIcon(realIcon).ok, true);
});

test("a size variant requires sizing rows, while Icon needs no size run", () => {
  const checkbox = realEntries.find((item) => item.id === "Checkbox Input");
  for (const sizes of [undefined, []]) {
    const changed = {...checkbox, sizingModel: {...checkbox.sizingModel, sizes}};
    assert.equal(readiness(changed), "in progress");
    const result = checkRegistry(realEntries.map((item) => item.id === checkbox.id ? changed : item));
    assert.match(result.errors.join("\n"), /sizing_model.sizes/);
  }
  assert.equal(realIcon.sizingModel.sizes, undefined);
  assert.equal(readiness(realIcon), "complete");
  assert.equal(checkIcon(realIcon).ok, true);
});


test("boolean defaults are booleans while string defaults need not be listed examples", () => {
  for (const value of [true, false, "true", "false"]) {
    assert.equal(checkRegistry([entry("Checkbox", {
      api: [{name: "is checked", kind: "boolean", default: value}],
    })]).ok, true);
  }
  for (const value of [1, "maybe", null]) {
    assert.match(checkRegistry([entry("Checkbox", {
      api: [{name: "is checked", kind: "boolean", default: value}],
    })]).errors.join("\n"), /default is not true or false/);
  }
  for (const kind of ["text", "string"]) {
    const changed = {...realIcon, api: [{
      name: "name", kind, description: "An open string value.",
      default: "not_in_examples", values: [{value: "example"}],
    }]};
    assert.equal(readiness(changed), "complete");
    assert.equal(checkIcon(changed).ok, true);
  }
});

test("native callbacks reject unimplemented events and serialized defaults", () => {
  assert.deepEqual(checkRegistry([entry("Button Base",{api:[{name:"onclick",kind:"event"}]})]).errors, []);
  for (const property of [{name:"onunknown",kind:"event"},{name:"onclick",kind:"event",default:"handler"}]) {
    assert.ok(checkRegistry([entry("Button Base",{api:[property]})]).errors.some(error => /native event|event callback/.test(error)));
  }
});

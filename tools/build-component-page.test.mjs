import test from "node:test";
import assert from "node:assert/strict";

import { buildPages, pageContext, renderComponentPage } from "./build-component-page.mjs";
import { checkRegistry } from "./lint-registry.mjs";
import { composeFigmaDescription, registryPathFor } from "./lib/registry.mjs";

// A stand-in for tokens/. The real resolver reads the canonical set; a test
// says which names exist and nothing else, so a token renamed in tokens/ does
// not break a test that is about the contract.
const TOKENS = new Map([
  ["box:size/s-2_000", 16],
  ["box:size/s-3_000", 24],
  ["gap:gap/g-0_500", 4],
  ["font_size:size/0_750", 12],
  ["line_height:line height/string/0_750", 12],
]);
const resolveToken = (field, name) => TOKENS.get(`${field}:${name}`);

// An entry in the shape lib/registry.mjs produces. Two builders, because the
// registry holds two kinds of thing: 93 inventory rows with no contract at all,
// and the contracts. A test says only what it is about; everything else is
// valid by construction.

function legacy(id, fields = {}) {
  return {
    file: registryPathFor(id),
    id,
    name: id,
    family: null,
    level: "element",
    role: "input",
    status: null,
    version: null,
    summary: null,
    purpose: null,
    useWhen: [],
    doNotUseWhen: [],
    flowBehavior: ["hug"],
    children: [],
    parents: [],
    uses: [],
    usedBy: [],
    a11y: [],
    sizingModel: null,
    variants: null,
    api: [],
    limitations: [],
    notes: "",
    figma: null,
    import: null,
    extra: {},
    ...fields,
  };
}

function contract(fields = {}) {
  return legacy("Checkbox Input", {
    family: "Checkbox",
    status: "draft",
    version: "0.1",
    summary: "The checkbox control alone.",
    purpose: "Selection has to be shown where the surroundings already explain themselves.",
    useWhen: ["The surrounding content identifies what is being selected."],
    doNotUseWhen: [{ text: "The option is standalone.", instead: "Checkbox Label" }],
    a11y: [{ status: "requires", note: "The parent supplies the accessible name." }],
    sizingModel: {
      horizontal: "fixed",
      vertical: "fixed",
      adjustable: false,
      intent: "Square at every size, and the run is authored.",
      sizes: [
        {
          size: "extra small",
          box: "size/s-2_000",
          gap: "gap/g-0_500",
          font_size: "size/0_750",
          line_height: "line height/string/0_750",
        },
        { size: "medium", box: "size/s-3_000" },
      ],
    },
    variants: { count: 4, complete_cross_product: true },
    api: [
      {
        name: "size",
        kind: "variant",
        default: "extra small",
        description: "The box dimension.",
        values: [
          {
            value: "extra small",
            rationale: "Dense contexts where the row supplies the hit area.",
            a11y: { status: "warning", criterion: "WCAG 2.2 SC 2.5.8", note: "16 against 24." },
          },
          { value: "medium" },
        ],
      },
      {
        name: "is checked",
        kind: "variant",
        default: "false",
        description: "Selection.",
        values: [{ value: "false" }, { value: "true" }],
      },
    ],
    limitations: ["No validation property."],
    figma: {
      file_key: "WUc07ZBtjRvypXtsOlbVut",
      node_id: "4349-1753",
      last_verified: "2026-08-26",
    },
    ...fields,
  });
}

// `instead` is an anchor: the alternative has to exist for the contract to
// pass at all, so every registry a test runs against carries it.
const alternative = legacy("Checkbox Label", { family: "Checkbox" });

function check(entry, options) {
  return checkRegistry([entry, alternative], { resolveToken, ...options });
}

/** Apply a change to one property of the contract, leaving the rest valid. */
function withApi(change) {
  const entry = contract();
  entry.api = change(entry.api);
  return entry;
}

test("passes a contract that carries every field correctly", () => {
  const result = check(contract());
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test("fails a status outside the three", () => {
  assert.match(
    check(contract({ status: "wip" })).errors.join("\n"),
    /status "wip" is not one of draft, published, deprecated/
  );
});

test("fails a property kind outside the four", () => {
  const entry = withApi((api) => [{ ...api[0], kind: "enum" }, api[1]]);
  assert.match(check(entry).errors.join("\n"), /kind "enum", not one of variant, text, boolean, instance/);
});

test("fails an a11y status outside the four, wherever the finding hangs", () => {
  assert.match(
    check(contract({ a11y: [{ status: "note", note: "…" }] })).errors.join("\n"),
    /a11y has a11y\.status "note"/
  );

  const onProperty = withApi((api) => [{ ...api[0], a11y: { status: "note" } }, api[1]]);
  assert.match(check(onProperty).errors.join("\n"), /api "size" has a11y\.status "note"/);

  const onValue = withApi((api) => [
    {
      ...api[0],
      values: [{ ...api[0].values[0], a11y: { status: "note" } }, api[0].values[1]],
    },
    api[1],
  ]);
  assert.match(check(onValue).errors.join("\n"), /value "extra small" has a11y\.status "note"/);
});

test("fails a default that is not one of the property's values", () => {
  const entry = withApi((api) => [{ ...api[0], default: "tiny" }, api[1]]);
  assert.match(
    check(entry).errors.join("\n"),
    /defaults to "tiny", which is not one of its values \(extra small, medium\)/
  );
});

test("fails an instead naming a component that is not in the registry", () => {
  const entry = contract({ doNotUseWhen: [{ text: "…", instead: "Toggle Label" }] });
  assert.match(
    check(entry).errors.join("\n"),
    /do_not_use_when names "Toggle Label" as the alternative, which has no matching component id/
  );
});

test("says nothing about an instead that is deliberately null", () => {
  const entry = contract({ doNotUseWhen: [{ text: "Nothing else is right.", instead: null }] });
  assert.deepEqual(check(entry).errors, []);
});

test("fails a variant count that does not match the product of the value counts", () => {
  const entry = contract({ variants: { count: 60, complete_cross_product: true } });
  assert.match(
    check(entry).errors.join("\n"),
    /variants\.count is 60, but the variant properties .* multiply to 4/
  );
});

test("says nothing about a count where the cross product is declared incomplete", () => {
  const entry = contract({ variants: { count: 3, complete_cross_product: false } });
  assert.deepEqual(check(entry).errors, []);
});

test("fails a value that carries a finding and no rationale", () => {
  const entry = withApi((api) => [
    {
      ...api[0],
      values: [{ value: "extra small", a11y: { status: "warning", note: "…" } }, api[0].values[1]],
    },
    api[1],
  ]);
  assert.match(
    check(entry).errors.join("\n"),
    /value "extra small" carries an a11y finding and no rationale/
  );
});

test("fails controls naming a property this component does not have", () => {
  const entry = withApi((api) => [
    ...api,
    { name: "has icon", kind: "boolean", description: "…", controls: ["icon"] },
  ]);
  assert.match(
    check(entry).errors.join("\n"),
    /controls "icon", which is not a property of this component/
  );
});

test("fails controls on a property that is not a boolean", () => {
  const entry = withApi((api) => [
    { ...api[0], controls: ["is checked"] },
    api[1],
  ]);
  assert.match(check(entry).errors.join("\n"), /has controls but kind "variant"/);
});

test("fails a controlled property that does not immediately follow its boolean", () => {
  const entry = withApi((api) => [
    { name: "has icon", kind: "boolean", description: "…", controls: ["icon"] },
    ...api,
    { name: "icon", kind: "instance", description: "…" },
  ]);
  assert.match(
    check(entry).errors.join("\n"),
    /controls "icon", which does not immediately follow it in api order/
  );
});

test("says nothing about a controlled group that is adjacent", () => {
  const entry = withApi((api) => [
    ...api,
    { name: "has icon", kind: "boolean", description: "…", controls: ["icon", "icon size"] },
    { name: "icon", kind: "instance", description: "…" },
    { name: "icon size", kind: "variant", description: "…" },
  ]);
  assert.deepEqual(check(entry).errors, []);
});

test("fails a sizing run that does not match the size property, value for value", () => {
  const entry = contract();
  entry.sizingModel = {
    ...entry.sizingModel,
    sizes: [{ size: "medium", box: "size/s-3_000" }, { size: "extra small", box: "size/s-2_000" }],
  };
  assert.match(
    check(entry).errors.join("\n"),
    /sizing_model\.sizes is medium, extra small but the size property is extra small, medium/
  );
});

test("fails a sizing axis outside the four", () => {
  const entry = contract();
  entry.sizingModel = { ...entry.sizingModel, horizontal: "stretch" };
  assert.match(
    check(entry).errors.join("\n"),
    /sizing_model\.horizontal is "stretch", not one of hug, fixed, fill, absolute/
  );
});

test("fails a dimension or type measure written as a number", () => {
  const entry = contract();
  entry.sizingModel = {
    ...entry.sizingModel,
    sizes: [
      { size: "extra small", box: 16, gap: "gap/g-0_500" },
      { size: "medium", box: "size/s-3_000" },
    ],
  };
  assert.match(
    check(entry).errors.join("\n"),
    /has box: 16 — every dimension and type measure is a token name, never a number/
  );
});

test("fails a token name that addresses nothing in tokens/", () => {
  const entry = contract();
  entry.sizingModel = {
    ...entry.sizingModel,
    sizes: [
      { size: "extra small", box: "size/s-2_000", font_size: "size/9_999" },
      { size: "medium", box: "size/s-3_000" },
    ],
  };
  assert.match(
    check(entry).errors.join("\n"),
    /has font_size: "size\/9_999", which does not resolve against tokens\/font\.yaml/
  );
});

test("says nothing about token names where no resolver was handed in", () => {
  const entry = contract();
  entry.sizingModel = {
    ...entry.sizingModel,
    sizes: [
      { size: "extra small", box: "size/s-2_000", font_size: "size/9_999" },
      { size: "medium", box: "size/s-3_000" },
    ],
  };
  assert.deepEqual(checkRegistry([entry, alternative]).errors, []);
});

test("fails a line height family outside the four", () => {
  const entry = contract();
  entry.sizingModel = {
    ...entry.sizingModel,
    sizes: [
      { size: "extra small", box: "size/s-2_000", line_height_family: "label" },
      { size: "medium", box: "size/s-3_000" },
    ],
  };
  assert.match(
    check(entry).errors.join("\n"),
    /line_height_family "label", not one of text, string, heading, code/
  );
});

// §3.2 — judgements, and none of them stops a build.

test("reports a contract missing its narrative, without failing", () => {
  const result = check(contract({ summary: null, useWhen: [] }));
  assert.equal(result.ok, true);
  assert.match(result.reports.join("\n"), /has an api but no summary, use_when/);
});

test("reports a property with no description", () => {
  const entry = withApi((api) => [{ ...api[0], description: undefined }, api[1]]);
  assert.match(check(entry).reports.join("\n"), /property "size" has no description/);
});

test("reports a sizing model with no intent, and an api with no sizing model at all", () => {
  const entry = contract();
  entry.sizingModel = { ...entry.sizingModel, intent: undefined };
  assert.match(check(entry).reports.join("\n"), /has a sizing_model with no intent/);
  assert.match(check(contract({ sizingModel: null })).reports.join("\n"), /has an api but no sizing_model/);
});

test("reports a warning that names no criterion", () => {
  const entry = contract({ a11y: [{ status: "warning", note: "The copy is the accessible name." }] });
  assert.match(
    check(entry).reports.join("\n"),
    /records an a11y warning on the component without naming a criterion/
  );
});

test("reports a published contract whose Figma record has gone stale", () => {
  const fresh = contract({ status: "published" });
  const today = new Date("2026-09-30T00:00:00Z");
  assert.deepEqual(
    check(fresh, { today }).reports.filter((line) => line.includes("last verified")),
    []
  );
  assert.match(
    check(fresh, { today: new Date("2027-01-01T00:00:00Z") }).reports.join("\n"),
    /is published and was last verified against Figma \d+ days ago \(2026-08-26\)/
  );
});

test("reports a family with only one member in it", () => {
  const result = checkRegistry([contract(), legacy("Toggle")]);
  assert.match(result.reports.join("\n"), /is the only member of family "Checkbox"/);
});

// §3.3 — 93 entries carry none of this, and absence is never a failure.

test("a legacy entry with no contract fields fails nothing and still gets a page", () => {
  const entries = [legacy("Table / TD Text", { level: "object", role: "output" })];
  const result = checkRegistry(entries);
  assert.deepEqual(result.errors, []);

  const pages = buildPages(entries, { generated: "2026-08-27", resolveToken });
  const html = pages.get("table/td-text.html");
  assert.ok(html, "no page was written for the legacy entry");
  assert.match(html, /Table \/ TD Text/);
  assert.match(html, /No contract is written for this component/);
});

test("invents no copy for a field that is absent", () => {
  const html = buildPages([legacy("Popover")], { generated: "2026-08-27", resolveToken }).get(
    "popover.html"
  );
  assert.doesNotMatch(html, /not specified|none recorded|TBD|Purpose|Public API|Sizing model/);
});

test("groups and orders the sections as §4.1 fixes them", () => {
  const entry = contract();
  const html = renderComponentPage(entry, pageContext([entry, alternative], { resolveToken }));
  const headings = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((match) => match[1]);
  assert.deepEqual(headings, [
    "Purpose",
    "Use when / do not use when",
    "Requirements",
    "Public API",
    "Sizing and type",
    "Limitations",
    "Record",
  ]);
});

test("resolves every token name and prints the value with the name", () => {
  const entry = contract();
  const html = renderComponentPage(entry, pageContext([entry, alternative], { resolveToken }));

  // The value leads, the address follows. Neither reads on its own.
  assert.match(html, /<span class="value-px">16<span class="faint"> px<\/span><\/span>/);
  assert.match(html, /<span class="token">size\/s-2_000<\/span>/);
  assert.match(html, /<span class="value-px">4<span class="faint"> px<\/span><\/span>/);
  assert.match(html, /<span class="token">gap\/g-0_500<\/span>/);

  // Font size and line height are on the same rows, not in a section of their
  // own: they move with the box and are compared against it.
  assert.match(html, /<span class="token">line height\/string\/0_750<\/span>/);
  assert.doesNotMatch(html, /<h2>Typography<\/h2>/);

  // The field says which collection answers for it.
  assert.match(html, /<span class="from">dimension<\/span>/);
  assert.match(html, /<span class="from">font<\/span>/);
});

test("leaves no bare token name anywhere on the page", () => {
  const entry = contract();
  const html = renderComponentPage(entry, pageContext([entry, alternative], { resolveToken }));
  for (const match of html.matchAll(/<span class="token">([^<]+)<\/span>/g)) {
    assert.notEqual(resolveToken("box", match[1]) ?? resolveToken("gap", match[1]) ??
      resolveToken("font_size", match[1]) ?? resolveToken("line_height", match[1]), undefined,
      `${match[1]} is printed without a value`);
  }
});

test("gives every value a preview slot at the size a real render would take", () => {
  const entry = contract();
  const html = renderComponentPage(entry, pageContext([entry, alternative], { resolveToken }));
  // extra small resolves to a 16px box and medium to a 24px one, through
  // tokens/ — the slot is measured, not guessed.
  assert.match(html, /class="slot" style="width:16px;height:16px"/);
  assert.match(html, /class="slot" style="width:24px;height:24px"/);
  assert.match(html, /title="size=extra small, is checked=false"/);
});

test("takes the slot height from the taller of the box and the line box", () => {
  // Which is why no height is recorded: at extra small this component's line
  // box is 18 and its box is 16, so the render is 18 tall.
  const entry = contract({
    sizingModel: {
      horizontal: "hug",
      vertical: "hug",
      intent: "Height follows the line box where the copy wraps.",
      sizes: [{ size: "extra small", box: "size/s-2_000", line_height: "line height/text/0_750" }],
    },
  });
  const context = pageContext([entry, alternative], {
    resolveToken: (field, name) =>
      name === "line height/text/0_750" ? 18 : resolveToken(field, name),
  });
  assert.match(renderComponentPage(entry, context), /class="slot" style="width:168px;height:18px"/);
});

test("escapes every string out of the YAML — no field is trusted markup", () => {
  const entry = contract({ summary: '</style><script>alert(1)</script>' });
  const html = renderComponentPage(entry, pageContext([entry, alternative], { resolveToken }));
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(1\)/);
});

test("composes the Figma description to exactly three lines", () => {
  const lines = composeFigmaDescription(contract()).split("\n");
  assert.equal(lines.length, 3);
  assert.equal(lines[0], "The checkbox control alone.");
  assert.match(lines[1], /^Use when: The surrounding content identifies/);
  assert.equal(
    lines[2],
    "Do not use when: The option is standalone. Use Checkbox Label instead."
  );
});

test("reaches nothing over the network — no CDN, no font, no fetch", () => {
  const entry = contract();
  const pages = buildPages([entry, alternative], { generated: "2026-08-27", resolveToken });
  for (const [name, html] of pages) {
    const remote = [...html.matchAll(/(https?:)?\/\/[^"'\s)]+/g)].map((match) => match[0]);
    assert.ok(
      remote.every((url) => url.startsWith("https://www.figma.com/design/")),
      `${name} reaches ${remote.filter((url) => !url.startsWith("https://www.figma.com/design/"))}`
    );
    assert.doesNotMatch(html, /<script/);
    assert.doesNotMatch(html, /<link[^>]+stylesheet/);
  }
});

test("links between pages relatively, from wherever the page sits in the tree", () => {
  const nested = legacy("Table / TD Text", {
    level: "object",
    children: ["Checkbox Label"],
  });
  const pages = buildPages([nested, alternative], { generated: "2026-08-27", resolveToken });
  assert.match(pages.get("table/td-text.html"), /href="\.\.\/checkbox-label\.html"/);
  assert.match(pages.get("table/td-text.html"), /href="\.\.\/index\.html"/);
  assert.match(pages.get("checkbox-label.html"), /href="index\.html"/);
});

test("links a family member to its siblings and nothing else", () => {
  const entry = contract();
  const html = renderComponentPage(entry, pageContext([entry, alternative], { resolveToken }));
  assert.match(html, /Checkbox family: <a href="checkbox-label\.html">Checkbox Label<\/a>/);
  assert.doesNotMatch(html, /checkbox-input\.html">Checkbox Input/);
});

test("carries no token value onto the page", () => {
  const entry = contract();
  const html = renderComponentPage(entry, pageContext([entry, alternative], { resolveToken }));
  // The contract holds no token names and the page must not go looking for
  // any: every colour on the page is the viewer's own.
  assert.doesNotMatch(html, /--stylos|tokens\//);
});

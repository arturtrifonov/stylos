import test from "node:test";
import assert from "node:assert/strict";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCanonical } from "./lib/tokens.mjs";
import { readNaming } from "./check-tokens.mjs";
import { buildCss, slug, property, cssColor, cssNumber, slotOf, SLOT_BINDING } from "./build-css.mjs";

// Every test here is one line of docs/specs/0007-tokens-to-css.md §8. The
// build runs against the real token set, because the checks worth having —
// a slug collision, a role bound outside its slot — are checks on what Figma
// actually contains, and a fixture would only ever confirm the fixture.

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const collections = loadCanonical(root);
const naming = readNaming(root);
const built = buildCss({ collections, naming });

const declarations = (css) =>
  new Map([...css.matchAll(/^\s*(--stylos-[a-z0-9_-]+):\s*([\s\S]*?);$/gm)].map((m) => [m[1], m[2].trim()]));

/** The body of one scope, by its selector line. */
function scope(css, selector) {
  const at = css.indexOf(selector);
  assert.notEqual(at, -1, `no ${selector} in the output`);
  return css.slice(at, css.indexOf("\n}", at));
}

test("the canonical set projects without a complaint", () => {
  assert.deepEqual(built.errors, []);
});

// --- §2, the name rule -----------------------------------------------------

test("slugifies by exactly three substitutions, leaving _ and digits alone", () => {
  assert.equal(slug("font/line height/text/1_000"), "font-line-height-text-1_000");
  assert.equal(slug("dimension/size/s-2_000"), "dimension-size-s-2_000");
  assert.equal(slug("radius/extra small"), "radius-extra-small");
  assert.equal(property("palette", "light", "indigo/700"), "--stylos-palette-light-indigo-700");
});

test("the mode is in the name only for the palette, which no selector switches", () => {
  const properties = built.manifest.properties;
  assert.ok(properties["--stylos-palette-light-indigo-700"]);
  assert.ok(properties["--stylos-palette-dark-indigo-700"]);
  // One name, resolved per scope. That is the point of it.
  assert.ok(properties["--stylos-color-surface-bold-primary-default"].scoped);
  assert.equal(properties["--stylos-color-light-surface-bold-primary-default"], undefined);
});

// §8.3 — two names slugifying to one fail the build, naming both.
test("two tokens slugifying to one name fail, naming both", () => {
  const doubled = collections.map((c) => {
    if (c.name !== "radius") return c;
    const tokens = new Map(c.tokens);
    // `extra small` and `extra-small` are different tokens in Figma and one
    // custom property here.
    tokens.set("extra-small", tokens.get("extra small"));
    return { ...c, tokens };
  });

  const { errors } = buildCss({ collections: doubled, naming });
  const collision = errors.find((e) => e.startsWith("two tokens slugify"));
  assert.ok(collision, `no collision reported in:\n${errors.join("\n")}`);
  assert.match(collision, /one custom property "--stylos-radius-extra-small"/);
  assert.match(collision, /radius\/extra small/);
  assert.match(collision, /radius\/extra-small/);
  assert.match(collision, /does not disambiguate and does not rename/);
  // And the loser is then reported as a token that did not reach the CSS,
  // rather than being emitted under a name that is not its own.
  assert.ok(errors.some((e) => /radius\/extra-small is in tokens\/ and did not reach the CSS/.test(e)));
});

// --- §3, units -------------------------------------------------------------

test("every number is px except a font weight, and values pass through verbatim", () => {
  const d = declarations(built.css);
  assert.equal(d.get("--stylos-font-weight-normal"), "400");
  assert.equal(d.get("--stylos-font-size-0_875"), "14px");
  assert.equal(d.get("--stylos-border-width-normal"), "1px");
  // 1000px, not 9999px: a generator that improves a value is a second record.
  assert.equal(d.get("--stylos-radius-round"), "1000px");
  assert.equal(cssNumber(24, "line height/text/1_000"), "24px");
  assert.equal(cssNumber(450, "weight/semibold"), "450");
});

test("a colour is hex, and rgb() only where alpha is under 1", () => {
  assert.equal(cssColor("#5752F1"), "#5752f1");
  assert.equal(cssColor("#000000", 0.03), "rgb(0 0 0 / 0.03)");
  assert.equal(declarations(built.css).get("--stylos-palette-light-base-white"), "#ffffff");
});

test("a font family carries the authored fallback stack, and the typeface comes from the token", () => {
  const d = declarations(built.css);
  assert.equal(d.get("--stylos-font-family-normal"), '"Georama", system-ui, sans-serif');
  assert.equal(d.get("--stylos-font-family-code"), '"JetBrains Mono", ui-monospace, monospace');
});

test("a string token with no authored stack fails rather than shipping without one", () => {
  const extra = collections.map((c) => {
    if (c.name !== "font") return c;
    const tokens = new Map(c.tokens);
    tokens.set("family/serif", { ...c.tokens.get("family/normal"), values: new Map([["default", "Georgia"]]) });
    return { ...c, tokens };
  });
  assert.match(buildCss({ collections: extra, naming }).errors.join("\n"), /font\/family\/serif is a string/);
});

// --- §4.2, the slot layer --------------------------------------------------

test("a role takes the slot its name states, and disabled overrides that", () => {
  assert.deepEqual(slotOf("surface/bold/danger/default", { hasRef: true }), { slot: "danger", why: "named" });
  assert.deepEqual(slotOf("surface/bold/danger/disabled", { hasRef: true }), { slot: "base", why: "disabled" });
  assert.deepEqual(slotOf("surface/special/violet", { hasRef: true }), { slot: null, why: "special" });
  assert.deepEqual(slotOf("background/base", { hasRef: true }), { slot: null, why: "palette-base" });
  assert.deepEqual(slotOf("shadow/primary", { hasRef: false }), { slot: null, why: "literal" });
  // Neutral structure names no slot and belongs to base all the same.
  assert.deepEqual(slotOf("text/secondary", { hasRef: true }), { slot: "base", why: "neutral" });
});

test("all thirteen steps of every slot are emitted, used or not", () => {
  const light = scope(built.css, ":root {\n  color-scheme: light;");
  for (const slot of SLOT_BINDING.keys()) {
    const steps = [...light.matchAll(new RegExp(`--stylos-slot-${slot}-([0-9]+):`, "g"))];
    assert.equal(steps.length, 13, `${slot} has ${steps.length} steps`);
  }
});

test("a slot-bound role reaches its slot, and a special role reaches the palette", () => {
  const d = declarations(scope(built.css, ":root {\n  color-scheme: light;"));
  assert.equal(d.get("--stylos-color-surface-bold-primary-default"), "var(--stylos-slot-primary-700)");
  assert.equal(d.get("--stylos-color-surface-bold-danger-disabled"), "var(--stylos-slot-base-100)");
  assert.equal(d.get("--stylos-color-surface-special-violet"), "var(--stylos-palette-light-violet-700)");
  assert.equal(d.get("--stylos-color-background-base"), "var(--stylos-palette-light-base-white)");
  assert.equal(d.get("--stylos-color-shadow-base"), "rgb(0 0 0 / 0.03)");
});

// §8.4 — a role whose alias contradicts its slot fails, naming all three.
test("a role rebound to a hue outside its slot fails, naming the role, the slot and the group", () => {
  const rebound = collections.map((c) => {
    if (c.name !== "color") return c;
    const tokens = new Map(c.tokens);
    const role = tokens.get("surface/bold/danger/default");
    tokens.set("surface/bold/danger/default", { ...role, ref: new Map([["default", "palette/orange/700"]]) });
    return { ...c, tokens };
  });

  const message = buildCss({ collections: rebound, naming }).errors.join("\n");
  assert.match(message, /color\/surface\/bold\/danger\/default \(light\) resolves into the hue group "orange"/);
  assert.match(message, /"danger" slot, which is bound to "red"/);
});

test("a special role rebound off its own hue fails too — the hue is the meaning", () => {
  const rebound = collections.map((c) => {
    if (c.name !== "color") return c;
    const tokens = new Map(c.tokens);
    const role = tokens.get("surface/special/violet");
    tokens.set("surface/special/violet", { ...role, ref: new Map([["default", "palette/indigo/700"]]) });
    return { ...c, tokens };
  });
  assert.match(
    buildCss({ collections: rebound, naming }).errors.join("\n"),
    /color\/surface\/special\/violet \(light\) resolves into the hue group "indigo".*on "violet"/s
  );
});

// §8.9 — a rebrand is the slot bindings and nothing else.
test("rebinding a slot moves every slot-bound role and no special role", () => {
  const light = declarations(scope(built.css, ":root {\n  color-scheme: light;"));
  const throughPrimary = [...light].filter(([, v]) => v.includes("--stylos-slot-primary-"));
  assert.ok(throughPrimary.length > 0);
  // Nothing slot-bound names a palette step, so redeclaring the 13 slot
  // properties is the whole of the change.
  for (const [name, value] of light) {
    if (!name.includes("-special-")) continue;
    assert.match(value, /--stylos-palette-(light|dark)-/, `${name} should name its hue directly`);
  }
});

// --- §4.3 and §4.4, the two scopes and the switch --------------------------

// §8.6 — the light and dark scopes declare the same names.
test("both scopes declare all 110 roles and all 65 slots, complete both times", () => {
  const light = [...declarations(scope(built.css, ":root {\n  color-scheme: light;")).keys()];
  const dark = [...declarations(scope(built.css, ':root[data-theme="dark"] {')).keys()];

  assert.deepEqual(light, dark);
  assert.equal(light.filter((n) => n.startsWith("--stylos-color-")).length, 110);
  assert.equal(light.filter((n) => n.startsWith("--stylos-slot-")).length, 65);
});

test("a role that does not vary is still declared in dark, so an override cannot inherit into it", () => {
  const dark = declarations(scope(built.css, ':root[data-theme="dark"] {'));
  assert.equal(dark.get("--stylos-color-surface-bold-primary-default"), "var(--stylos-slot-primary-700)");
  // And one that does vary takes the other step.
  assert.equal(dark.get("--stylos-color-surface-bold-primary-disabled"), "var(--stylos-slot-base-200)");
});

// §8.8 — an explicit choice beats the system preference in both directions.
test("the switch has three states, and the dark body is emitted twice byte-identical", () => {
  const { css } = built;
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n  :root:not\(\[data-theme="light"\]\) \{/);
  assert.match(css, /:root\[data-theme="dark"\] \{\n  color-scheme: dark;/);

  const media = scope(css, ':root:not([data-theme="light"]) {');
  const explicit = scope(css, ':root[data-theme="dark"] {');
  // The media copy is one level deeper; the declarations are the same bytes.
  assert.deepEqual([...declarations(media)], [...declarations(explicit)]);
});

test("color-scheme rides along, so form controls follow without a second mechanism", () => {
  assert.equal((built.css.match(/color-scheme: dark;/g) ?? []).length, 2);
  assert.equal((built.css.match(/color-scheme: light;/g) ?? []).length, 1);
});

// --- §4.5, composed shadows ------------------------------------------------

// §8.7 — elevation N is N + 1 layers.
test("elevation 6 has seven layers and elevation 1 has two", () => {
  const d = declarations(built.css);
  const layers = (n) => d.get(`--stylos-shadow-elevation-${n}`).split(",").length;
  assert.equal(layers(1), 2);
  assert.equal(layers(3), 4);
  assert.equal(layers(6), 7);
});

test("the stack is cumulative, and the last layer repeats level N in the primary colour", () => {
  const layers = declarations(built.css)
    .get("--stylos-shadow-elevation-3")
    .split(",")
    .map((l) => l.trim());
  assert.deepEqual(layers, [
    "0 2px 2px -1px var(--stylos-color-shadow-base)",
    "0 4px 4px -2px var(--stylos-color-shadow-base)",
    "0 8px 8px -3px var(--stylos-color-shadow-base)",
    "0 8px 8px -3px var(--stylos-color-shadow-primary)",
  ]);
});

test("the effect scale is emitted as well — an input to the composition, not a substitute", () => {
  const d = declarations(built.css);
  assert.equal(d.get("--stylos-effect-shadow-elevation-level-3"), "8px");
  assert.equal(d.get("--stylos-effect-shadow-spread-level-3"), "-3px");
  assert.equal(d.get("--stylos-effect-shadow-color-base"), "var(--stylos-color-shadow-base)");
});

// --- §5 and §8.2, what is emitted ------------------------------------------

test("every token in tokens/ reaches the CSS, and every property is in the manifest", () => {
  const emitted = new Set(
    Object.values(built.manifest.properties).map((r) => r.token).filter(Boolean)
  );
  for (const c of collections) {
    for (const p of c.tokens.keys()) assert.ok(emitted.has(`${c.name}/${p}`), `${c.name}/${p} missing`);
  }
  for (const name of declarations(built.css).keys()) {
    assert.ok(built.manifest.properties[name], `${name} is not in the manifest`);
  }
});

test("the manifest records where a name came from, because the name rule is not reversible", () => {
  const p = built.manifest.properties;
  assert.equal(p["--stylos-font-line-height-text-1_000"].token, "font/line height/text/1_000");
  assert.equal(p["--stylos-palette-dark-indigo-700"].mode, "dark");
  assert.equal(p["--stylos-slot-primary-700"].synthesised, "slot");
  assert.equal(p["--stylos-shadow-elevation-3"].synthesised, "shadow");
});

test("the palette is emitted whole in both modes, hidden or not", () => {
  const properties = Object.keys(built.manifest.properties);
  assert.equal(properties.filter((n) => n.startsWith("--stylos-palette-light-")).length, 288);
  assert.equal(properties.filter((n) => n.startsWith("--stylos-palette-dark-")).length, 288);
});

// §8.5 — every var() resolves.
test("no property references a name the file does not define", () => {
  const declared = new Set(declarations(built.css).keys());
  for (const [, name] of built.css.matchAll(/var\((--stylos-[a-z0-9_-]+)\)/g)) {
    assert.ok(declared.has(name), `${name} is referenced and never declared`);
  }
});

test("a dangling reference is a failure, not a property that resolves to nothing", () => {
  const dangling = collections.map((c) => {
    if (c.name !== "dimension") return c;
    const tokens = new Map(c.tokens);
    const token = tokens.get("size/s-1_500");
    tokens.set("size/s-1_500", { ...token, ref: new Map([["default", "dimension-scale/s-99_000"]]) });
    return { ...c, tokens };
  });
  assert.match(
    buildCss({ collections: dangling, naming }).errors.join("\n"),
    /--stylos-dimension-scale-s-99_000 is referenced but never declared/
  );
});

// §8.10 — the build refuses to project a set that does not verify. That is
// the whole of its responsibility for a token that disappeared; the
// withdrawal itself is caught at import (§6).
test("refuses to run when the canonical set does not check out, and writes nothing", async () => {
  const { mkdtempSync, existsSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { main } = await import("./build-css.mjs");

  const empty = mkdtempSync(path.join(tmpdir(), "stylos-css-"));
  const said = [];
  const error = console.error;
  console.error = (line) => said.push(line);
  try {
    assert.equal(main(empty, ["--out", path.join(empty, "dist")]), 1);
  } finally {
    console.error = error;
  }

  assert.match(said.join("\n"), /tokens\/_naming\.yaml is missing/);
  assert.match(said.join("\n"), /nothing safe to project/);
  assert.equal(existsSync(path.join(empty, "dist")), false);
});

// The four rules, counted against the real set. 63 roles take a slot, 44 keep
// their hue, `background/base` reaches the palette group of the same name and
// two are literals — 110 in all.
test("every role is accounted for by one of the four rules", () => {
  const color = collections.find((c) => c.name === "color");
  const counted = {};
  for (const [p, token] of color.tokens) {
    const { why } = slotOf(p, { hasRef: Boolean(token.ref) });
    counted[why] = (counted[why] ?? 0) + 1;
  }
  assert.deepEqual(counted, { named: 43, disabled: 11, neutral: 9, special: 44, "palette-base": 1, literal: 2 });
});

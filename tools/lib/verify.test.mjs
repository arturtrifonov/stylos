import test from "node:test";
import assert from "node:assert/strict";

import { verifyCanonical } from "./verify.mjs";
import { resolve, themeModes } from "./tokens.mjs";

const empty = () => ({ errors: [], warnings: [] });

const token = (extra = {}) => ({
  type: "color",
  id: null,
  scopes: [],
  values: new Map(Object.entries(extra.values ?? {})),
  alpha: new Map(Object.entries(extra.alpha ?? {})),
  ref: extra.ref ?? null,
});

/**
 * palette (light/dark) — literals.
 * color  (light/dark) — references into palette.
 * effect (default)    — no theme modes of its own, references into color.
 */
function fixture(overrides = {}) {
  const palette = {
    "base/white": token({ values: { light: "#ffffff", dark: "#ffffff" } }),
    "base/black": token({ values: { light: "#000000", dark: "#000000" } }),
    "indigo/700": token({ values: { light: "#3333e6", dark: "#b3b3fa" } }),
  };
  const color = {
    "background/base": token({
      ref: new Map([["light", "palette/base/white"], ["dark", "palette/base/black"]]),
    }),
    "surface/base": token({ ref: new Map([["default", "palette/indigo/700"]]) }),
    // Figma cannot bind a variable and change its opacity, so a translucent
    // colour arrives as a literal and is stored as given.
    "shadow/base": token({
      values: { light: "#60758a", dark: "#b6c2d0" },
      alpha: { light: 0.03, dark: 0.03 },
    }),
    ...overrides.color,
  };
  const effect = {
    "shadow/color/base": token({ ref: new Map([["default", "color/shadow/base"]]) }),
    "shadow/elevation/1": token({ type: "number", values: { default: 2 } }),
    ...overrides.effect,
  };

  return [
    { name: "palette", layer: "primitive", modes: ["light", "dark"], tokens: new Map(Object.entries(palette)) },
    { name: "color", layer: "semantic", modes: ["light", "dark"], tokens: new Map(Object.entries(color)) },
    { name: "effect", layer: "semantic", modes: ["default"], tokens: new Map(Object.entries(effect)) },
  ];
}

const opts = (collections, modeDependent = ["color/background/base"]) => ({
  collections,
  modeDependent,
});

test("a consistent set verifies, with no Figma export present", () => {
  const problems = empty();
  verifyCanonical(opts(fixture()), problems);
  assert.deepEqual(problems.errors, []);
});

test("themeModes ignores `default`, which means 'does not vary'", () => {
  assert.deepEqual(themeModes(fixture()), ["light", "dark"]);
  assert.deepEqual(
    themeModes([{ name: "radius", modes: ["default"], tokens: new Map() }]),
    ["default"]
  );
});

test("a mode-less collection resolves through one that has modes", () => {
  // This is the case that must not be an error: effect does not vary by
  // theme, but what it points at does.
  const collections = fixture();

  const light = resolve(collections, "effect", "shadow/color/base", "light");
  const dark = resolve(collections, "effect", "shadow/color/base", "dark");

  assert.equal(light.value, "#60758a");
  assert.equal(dark.value, "#b6c2d0");
  assert.equal(Math.round(light.alpha * 100), 3);
  assert.deepEqual(light.chain, ["effect/shadow/color/base", "color/shadow/base"]);
});

test("alpha multiplies along the chain", () => {
  const collections = fixture({
    effect: {
      "shadow/color/base": token({
        ref: new Map([["default", "color/shadow/base"]]),
        alpha: { default: 0.5 },
      }),
    },
  });

  const { alpha } = resolve(collections, "effect", "shadow/color/base", "light");
  assert.equal(Math.round(alpha * 1000) / 1000, 0.015);
});

test("a reference to a token that does not exist fails", () => {
  const collections = fixture();
  collections[1].tokens.get("surface/base").ref = new Map([["default", "palette/indigo/999"]]);

  const problems = empty();
  verifyCanonical(opts(collections), problems);

  assert.ok(problems.errors.some((e) => /"palette\/indigo\/999" does not exist/.test(e)));
});

test("a reference loop fails, showing the loop", () => {
  const collections = fixture();
  collections[1].tokens.get("surface/base").ref = new Map([["default", "color/surface/base"]]);

  const problems = empty();
  verifyCanonical(opts(collections), problems);

  assert.ok(problems.errors.some((e) => /reference loop: color\/surface\/base/.test(e)));
});

test("a token with neither a value nor a reference fails", () => {
  const collections = fixture();
  collections[1].tokens.set("orphan", token());

  const problems = empty();
  verifyCanonical(opts(collections), problems);

  assert.ok(problems.errors.some((e) => /neither a value nor a reference/.test(e)));
});

test("a per-mode reference missing a mode fails", () => {
  const collections = fixture();
  collections[1].tokens.get("background/base").ref = new Map([["light", "palette/base/white"]]);

  const problems = empty();
  verifyCanonical(opts(collections), problems);

  assert.ok(problems.errors.some((e) => /no reference for mode "dark"/.test(e)));
});

test("a mode-dependent role missing from the list fails", () => {
  const problems = empty();
  verifyCanonical(opts(fixture(), []), problems);

  assert.ok(
    problems.errors.some((e) => /"color\/background\/base" references a different token per mode/.test(e))
  );
});

test("a mode-independent role listed as mode-dependent fails", () => {
  const problems = empty();
  verifyCanonical(
    opts(fixture(), ["color/background/base", "color/surface/base"]),
    problems
  );

  assert.ok(problems.errors.some((e) => /"color\/surface\/base" is listed under mode_dependent/.test(e)));
});

test("mode_dependent naming a literal, or nothing at all, fails", () => {
  const literal = empty();
  verifyCanonical(opts(fixture(), ["color/background/base", "palette/base/white"]), literal);
  assert.ok(literal.errors.some((e) => /holds a literal value rather than a reference/.test(e)));

  const missing = empty();
  verifyCanonical(opts(fixture(), ["color/background/base", "color/gone"]), missing);
  assert.ok(missing.errors.some((e) => /mode_dependent lists "color\/gone"/.test(e)));
});

test("mixing default and per-mode references in one ref fails", () => {
  const collections = fixture();
  collections[1].tokens.get("surface/base").ref = new Map([
    ["default", "palette/indigo/700"],
    ["dark", "palette/base/black"],
  ]);

  const problems = empty();
  verifyCanonical(opts(collections), problems);

  assert.ok(problems.errors.some((e) => /declares both "default" and per-mode references/.test(e)));
});

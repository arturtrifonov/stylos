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
    "mono/white": token({ values: { light: "#ffffff", dark: "#ffffff" } }),
    "mono/black": token({ values: { light: "#000000", dark: "#000000" } }),
    "indigo/700": token({ values: { light: "#3333e6", dark: "#b3b3fa" } }),
  };
  const color = {
    "background/base": token({
      ref: new Map([["light", "palette/mono/white"], ["dark", "palette/mono/black"]]),
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

const opts = (collections) => ({ collections });

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
  collections[1].tokens.get("background/base").ref = new Map([["light", "palette/mono/white"]]);

  const problems = empty();
  verifyCanonical(opts(collections), problems);

  assert.ok(problems.errors.some((e) => /no reference for mode "dark"/.test(e)));
});

test("mixing default and per-mode references in one ref fails", () => {
  const collections = fixture();
  collections[1].tokens.get("surface/base").ref = new Map([
    ["default", "palette/indigo/700"],
    ["dark", "palette/mono/black"],
  ]);

  const problems = empty();
  verifyCanonical(opts(collections), problems);

  assert.ok(problems.errors.some((e) => /declares both "default" and per-mode references/.test(e)));
});

test("a role taking a different step per mode is not a problem", () => {
  // It is what the two layers are for. Nothing declares it and nothing has to.
  const problems = empty();
  verifyCanonical(opts(fixture()), problems);
  assert.deepEqual(problems.errors, []);
});

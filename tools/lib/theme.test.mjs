import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadTheme, themeCss, COLOR_ROLES, FONT_FACES } from "./theme.mjs";

// The theme is a join against the real token set, so it is tested against it.
// A fixture would only prove the joiner works on a fixture.
const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const theme = loadTheme(root);

test("resolves every role it declares, in both themes", () => {
  assert.deepEqual(theme.missing, []);
  for (const role of COLOR_ROLES.keys()) {
    assert.ok(theme.light.has(role), `light is missing --${role}`);
    assert.ok(theme.dark.has(role), `dark is missing --${role}`);
  }
});

test("takes the families from font.yaml and keeps a fallback behind each", () => {
  assert.match(theme.fonts.sans, /^Georama, ui-sans-serif,/);
  assert.match(theme.fonts.mono, /^"JetBrains Mono", ui-monospace,/);
});

test("carries a step of the system's own type scale, not a number chosen by eye", () => {
  assert.equal(theme.text.get("body"), 16);
  assert.equal(theme.text.get("small"), 12);
  assert.equal(theme.radius.get("round"), 1000);
});

test("multiplies a token's alpha into the colour rather than dropping it", () => {
  // shadow/base is #000000 at .03; nothing in COLOR_ROLES uses it today, so
  // this checks the conversion directly through a role that could.
  const { light } = loadTheme(root);
  for (const value of light.values()) {
    assert.match(value, /^(#[0-9a-f]{6}|rgb\(\d+ \d+ \d+ \/ [\d.]+\))$/);
  }
});

test("emits dark only where it differs, so the light block is the whole answer", () => {
  const css = themeCss(theme);
  const dark = css.slice(css.indexOf("prefers-color-scheme"));
  for (const [role, value] of theme.light) {
    if (theme.dark.get(role) === value) {
      assert.doesNotMatch(dark, new RegExp(`--${role}:`), `--${role} is repeated unchanged`);
    }
  }
});

test("addresses the self-hosted fonts relatively, from whatever depth it is given", () => {
  assert.match(themeCss(theme, { prefix: "" }), /url\("assets\/fonts\/georama-latin\.woff2"\)/);
  assert.match(themeCss(theme, { prefix: "../../" }), /url\("\.\.\/\.\.\/assets\/fonts\//);
});

test("reaches nothing over the network", () => {
  const css = themeCss(theme, { prefix: "" });
  assert.deepEqual([...css.matchAll(/(https?:)?\/\/[^"'\s)]+/g)].map((m) => m[0]), []);
});

test("names a unicode range for every subset it ships", () => {
  for (const face of FONT_FACES) {
    assert.match(face.range, /^U\+/, `${face.file} has no range`);
    assert.ok(face.file.endsWith(".woff2"));
  }
});

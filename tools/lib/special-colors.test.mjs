import test from "node:test";
import assert from "node:assert/strict";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCanonical } from "./tokens.mjs";
import {
  claimedHue,
  generateSpecialRoles,
  isSpecialRole,
  loadSpecialScale,
  specialHues,
  validateSpecialScale,
  withSpecialRoles,
} from "./special-colors.mjs";

// FND-COLOR-14: the categorical family is generated from the palette and the
// authored scale, never recorded. Most tests run against the real set, because
// what matters is that the palette and the scale agree.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const scale = loadSpecialScale(root);
const [palette, recordedColor] = loadCanonical(root, ["palette", "color"], { derived: false });
const color = loadCanonical(root, ["color"])[0];

const step = (group, steps) => steps.map((s) => [`${group}/${s}`, { values: new Map() }]);
const smallPalette = {
  name: "palette",
  modes: ["light", "dark"],
  tokens: new Map([
    ...step("mono", ["black", "white"]),
    ...step("slate", ["25", "100", "200", "600"]),
    ...step("violet", ["25", "100", "200", "600"]),
  ]),
};
const smallScale = (roles, extra = {}) => ({
  source: { decided: "2026-10-21", rule: "FND-COLOR-14" },
  exclude: ["mono"],
  roles: Object.entries(roles).map(([template, ref]) => ({ template, ref: new Map(Object.entries(ref)) })),
  ...extra,
});
const smallColor = { name: "color", modes: ["light", "dark"], tokens: new Map() };

test("names a role special only by its segment, and its hue by the segment after", () => {
  assert.equal(isSpecialRole("surface/bold/special/violet/default"), true);
  assert.equal(isSpecialRole("surface/bold/primary/default"), false);
  assert.equal(claimedHue("surface/subtle/special/violet/hover"), "violet");
  assert.equal(claimedHue("text/special/violet"), "violet");
  assert.equal(claimedHue("surface/bold/special/violet/disabled"), null);
  assert.equal(claimedHue("text/primary"), null);
});

test("every palette hue but the excluded ones, in palette order", () => {
  assert.deepEqual(specialHues(smallPalette, { exclude: ["mono"] }), ["slate", "violet"]);
  const hues = specialHues(palette, scale);
  assert.equal(hues.length, 22);
  assert.equal(hues[0], "slate");
  assert.equal(hues.includes("mono"), false);
});

test("generates each template for each hue, grouped by prefix and then by hue", () => {
  const generated = generateSpecialRoles(
    smallScale({
      "surface/bold/special/{hue}/default": { light: "palette/{hue}/600", dark: "palette/{hue}/600" },
      "surface/bold/special/{hue}/disabled": { default: "palette/slate/100" },
      "text/special/{hue}": { default: "palette/{hue}/600" },
    }),
    smallPalette
  );
  assert.deepEqual([...generated.keys()], [
    "surface/bold/special/slate/default",
    "surface/bold/special/slate/disabled",
    "surface/bold/special/violet/default",
    "surface/bold/special/violet/disabled",
    "text/special/slate",
    "text/special/violet",
  ]);
  const role = generated.get("surface/bold/special/violet/default");
  assert.deepEqual([...role.ref], [["light", "palette/violet/600"], ["dark", "palette/violet/600"]]);
  assert.equal(role.type, "color");
  assert.equal(role.generated, "tokens/_special.yaml");
  assert.deepEqual([...generated.get("surface/bold/special/violet/disabled").ref], [["default", "palette/slate/100"]]);
});

test("the generated family follows its area's recorded roles and replaces a recorded twin", () => {
  const recorded = {
    ...smallColor,
    tokens: new Map([
      ["surface/bold/primary/default", { ref: new Map() }],
      ["text/special/slate", { ref: new Map(), stale: true }],
      ["text/base", { ref: new Map() }],
      ["border/default", { ref: new Map() }],
    ]),
  };
  const merged = withSpecialRoles(
    recorded,
    smallPalette,
    smallScale({
      "surface/bold/special/{hue}/default": { default: "palette/{hue}/600" },
      "text/special/{hue}": { default: "palette/{hue}/600" },
    })
  );
  assert.deepEqual([...merged.tokens.keys()], [
    "surface/bold/primary/default",
    "surface/bold/special/slate/default",
    "surface/bold/special/violet/default",
    "text/base",
    "text/special/slate",
    "text/special/violet",
    "border/default",
  ]);
  assert.equal(merged.tokens.get("text/special/slate").stale, undefined);
  assert.equal(recorded.tokens.size, 4, "the record itself is not modified");
});

test("the real scale is valid, and the real record holds no special role", () => {
  assert.deepEqual(
    validateSpecialScale(scale, { color, palette, paletteName: "palette", recorded: recordedColor.tokens.keys() }),
    []
  );
  assert.equal([...recordedColor.tokens.keys()].some(isSpecialRole), false);
});

test("the loaded colour collection carries eleven roles for each of 22 hues", () => {
  const generated = [...color.tokens].filter(([, token]) => token.generated);
  assert.equal(generated.length, 11 * 22);
  assert.deepEqual([...color.tokens.get("surface/bold/special/violet/default").ref], [
    ["light", "palette/violet/600"],
    ["dark", "palette/violet/700"],
  ]);
  assert.deepEqual([...color.tokens.get("text/special/violet").ref], [
    ["light", "palette/violet/700"],
    ["dark", "palette/violet/800"],
  ]);
});

test("a recorded special role fails, because the record never holds one", () => {
  const errors = validateSpecialScale(scale, {
    color, palette, paletteName: "palette", recorded: ["surface/special/violet"],
  });
  assert.match(errors.join("\n"), /records color\/surface\/special\/violet.*generated from tokens\/_special\.yaml/);
});

test("a role off its own hue fails unless it is disabled", () => {
  const errors = validateSpecialScale(
    smallScale({
      "surface/bold/special/{hue}/default": { default: "palette/slate/600" },
      "surface/bold/special/{hue}/disabled": { default: "palette/slate/100" },
    }),
    { color: smallColor, palette: smallPalette, paletteName: "palette" }
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /surface\/bold\/special\/\{hue\}\/default.*only a disabled role drops it/);
});

test("a step some hue lacks fails, naming the generated reference", () => {
  const errors = validateSpecialScale(
    smallScale({ "text/special/{hue}": { light: "palette/{hue}/600", dark: "palette/{hue}/975" } }),
    { color: smallColor, palette: smallPalette, paletteName: "palette" }
  );
  assert.deepEqual(errors, [
    `tokens/_special.yaml: "text/special/{hue}" (dark) generates "palette/slate/975", which the palette does not have.`,
    `tokens/_special.yaml: "text/special/{hue}" (dark) generates "palette/violet/975", which the palette does not have.`,
  ]);
});

test("a template must place special/{hue} once, and a reference must cover every mode", () => {
  const errors = validateSpecialScale(
    smallScale({
      "surface/{hue}/default": { default: "palette/{hue}/600" },
      "text/special/{hue}/{hue}": { default: "palette/{hue}/600" },
      "border/special/{hue}": { light: "palette/{hue}/600" },
    }),
    { color: smallColor, palette: smallPalette, paletteName: "palette" }
  );
  assert.equal(errors.length, 3);
  assert.match(errors[0], /"surface\/\{hue\}\/default" must name its area, then special\/\{hue\}/);
  assert.match(errors[1], /"text\/special\/\{hue\}\/\{hue\}" must name/);
  assert.match(errors[2], /"border\/special\/\{hue\}" needs a reference for "default", or one for each of light, dark/);
});

test("the scale names its rule and decision, and excludes only real hue groups", () => {
  const errors = validateSpecialScale(
    smallScale({ "text/special/{hue}": { default: "palette/{hue}/600" } }, { source: {}, exclude: ["mono", "chartreuse"] }),
    { color: smallColor, palette: smallPalette, paletteName: "palette" }
  );
  assert.match(errors.join("\n"), /needs its rule \(FND-COLOR-14\) and decision date/);
  assert.match(errors.join("\n"), /excludes "chartreuse", which is not a palette hue group/);
});

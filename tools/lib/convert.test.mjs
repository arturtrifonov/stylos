import test from "node:test";
import assert from "node:assert/strict";

import {
  flattenDocument,
  documentMode,
  toHex,
  checkRawValues,
  checkModeParity,
  buildCollectionDocument,
} from "./convert.mjs";

const color = (r, g, b, alpha = 1) => ({ colorSpace: "srgb", components: [r, g, b], alpha });
const empty = () => ({ errors: [], warnings: [] });
const rec = (value, extra = {}) => ({ type: "color", value, id: null, scopes: null, ...extra });

test("flattens a DTCG document into slash-joined paths, skipping $extensions", () => {
  const tokens = flattenDocument({
    width: {
      normal: { $type: "number", $value: 1, $extensions: { "com.figma.variableId": "VariableID:1" } },
      thick: { $type: "number", $value: 2, $extensions: { "com.figma.scopes": ["STROKE_FLOAT"] } },
    },
    $extensions: { "com.figma.modeName": "Mode 1" },
  });

  assert.deepEqual([...tokens.keys()], ["width/normal", "width/thick"]);
  assert.equal(tokens.get("width/normal").id, "VariableID:1");
  assert.deepEqual(tokens.get("width/thick").scopes, ["STROKE_FLOAT"]);
});

test("reads the mode name from the document root", () => {
  assert.equal(documentMode({ $extensions: { "com.figma.modeName": "Light Mode" } }), "Light Mode");
  assert.equal(documentMode({}), null);
});

test("converts colours to lowercase hex from the raw components", () => {
  assert.equal(toHex([0.34117648, 0.32156863, 0.94509804]), "#5752f1");
  assert.equal(toHex([0, 0, 0]), "#000000");
  assert.equal(toHex([1, 1, 1]), "#ffffff");
});

test("warns once per token, not once per channel", () => {
  // 0.94 * 255 = 239.7 — all three channels drift equally.
  const problems = empty();
  checkRawValues("palette", "light", new Map([["neutral/50", rec(color(0.94, 0.94, 0.94))]]), problems);

  assert.equal(problems.warnings.length, 1);
  assert.match(problems.warnings[0], /drift of 0\.30\/255/);
});

test("float32 representation noise does not warn", () => {
  const problems = empty();
  checkRawValues(
    "palette",
    "light",
    new Map([["slate/25", rec(color(0.9725490212440491, 0.9803921580314636, 0.9882352948188782))]]),
    problems
  );

  assert.deepEqual(problems.warnings, []);
});

test("an alpha surviving rounding to 3 places does not warn", () => {
  const problems = empty();
  checkRawValues(
    "color",
    "light",
    new Map([["shadow/base", rec(color(0, 0, 0, 0.029999999329447746))]]),
    problems
  );

  assert.deepEqual(problems.warnings, []);
});

test("a colour space other than sRGB fails rather than being stored as hex", () => {
  const problems = empty();
  checkRawValues(
    "palette",
    "light",
    new Map([["wide/1", rec({ colorSpace: "display-p3", components: [0.9, 0.2, 0.2], alpha: 1 })]]),
    problems
  );

  assert.equal(problems.errors.length, 1);
  assert.match(problems.errors[0], /colour space "display-p3"/);
});

test("token names differing between modes fail, naming both modes", () => {
  const problems = empty();
  checkModeParity(
    "color",
    new Map([
      ["light", new Map([["a", rec(color(0, 0, 0))], ["b", rec(color(1, 1, 1))]])],
      ["dark", new Map([["a", rec(color(0, 0, 0))]])],
    ]),
    problems
  );

  assert.equal(problems.errors.length, 1);
  assert.match(problems.errors[0], /modes "light" and "dark"/);
});

test("a bound token stores its reference and no value", () => {
  const document = buildCollectionDocument({
    name: "color",
    layer: "semantic",
    byMode: new Map([
      ["light", new Map([["surface/base", rec(color(0.2, 0.2, 0.9), { id: "VariableID:9" })]])],
      ["dark", new Map([["surface/base", rec(color(0.7, 0.7, 0.98), { id: "VariableID:9" })]])],
    ]),
    refs: new Map([
      ["surface/base", new Map([["light", "palette/indigo/700"], ["dark", "palette/indigo/700"]])],
    ]),
    imported: "2026-08-23 09:00Z",
    figma: { file: "Stylos / Styles", key: "abc" },
  });

  const token = document.get("tokens").get("surface/base");
  // The resolved colour is a derived fact; storing it would be a cache.
  assert.ok(!token.has("values"));
  assert.deepEqual([...token.get("ref")], [["default", "palette/indigo/700"]]);
});

test("a reference differing per mode is kept per mode", () => {
  const document = buildCollectionDocument({
    name: "color",
    layer: "semantic",
    byMode: new Map([
      ["light", new Map([["background/base", rec(color(1, 1, 1))]])],
      ["dark", new Map([["background/base", rec(color(0, 0, 0))]])],
    ]),
    refs: new Map([
      ["background/base", new Map([["light", "palette/base/white"], ["dark", "palette/base/black"]])],
    ]),
  });

  assert.deepEqual(
    [...document.get("tokens").get("background/base").get("ref")],
    [["light", "palette/base/white"], ["dark", "palette/base/black"]]
  );
});

test("a translucent colour Figma could not bind is stored as a literal, as given", () => {
  const document = buildCollectionDocument({
    name: "color",
    layer: "semantic",
    byMode: new Map([
      ["light", new Map([["shadow/base", rec(color(0.376, 0.459, 0.541, 0.03))]])],
      ["dark", new Map([["shadow/base", rec(color(0.714, 0.761, 0.816, 0.03))]])],
    ]),
    refs: new Map(),
  });

  const token = document.get("tokens").get("shadow/base");
  assert.ok(!token.has("ref"));
  assert.deepEqual([...token.get("values")], [["light", "#60758a"], ["dark", "#b6c2d0"]]);
  assert.deepEqual([...token.get("alpha")], [["light", 0.03], ["dark", 0.03]]);
});

test("a literal keeps its values, and omits empty optional keys", () => {
  const document = buildCollectionDocument({
    name: "palette",
    layer: "primitive",
    byMode: new Map([
      ["light", new Map([["base/black", rec(color(0, 0, 0), { id: "VariableID:1", scopes: [] })]])],
      ["dark", new Map([["base/black", rec(color(0, 0, 0), { id: "VariableID:2", scopes: [] })]])],
    ]),
    refs: new Map(),
  });

  const token = document.get("tokens").get("base/black");
  assert.deepEqual([...token.get("values")], [["light", "#000000"], ["dark", "#000000"]]);
  assert.ok(!token.has("ref"));
  assert.ok(!token.has("scopes"));
});

test("id is stored per mode when the modes hold different variables", () => {
  const perMode = buildCollectionDocument({
    name: "palette",
    layer: "primitive",
    byMode: new Map([
      ["light", new Map([["a", rec(color(0, 0, 0), { id: "VariableID:1" })]])],
      ["dark", new Map([["a", rec(color(1, 1, 1), { id: "VariableID:2" })]])],
    ]),
    refs: new Map(),
  });
  assert.deepEqual(
    [...perMode.get("tokens").get("a").get("id")],
    [["light", "VariableID:1"], ["dark", "VariableID:2"]]
  );

  const shared = buildCollectionDocument({
    name: "color",
    layer: "semantic",
    byMode: new Map([
      ["light", new Map([["a", rec(color(0, 0, 0), { id: "VariableID:9" })]])],
      ["dark", new Map([["a", rec(color(1, 1, 1), { id: "VariableID:9" })]])],
    ]),
    refs: new Map(),
  });
  assert.equal(shared.get("tokens").get("a").get("id"), "VariableID:9");
});

test("flattenDocument keeps Figma's own binding", () => {
  const tokens = flattenDocument({
    surface: {
      base: {
        $type: "color",
        $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 1 },
        $extensions: {
          "com.figma.variableId": "VariableID:1",
          "com.figma.aliasData": {
            targetVariableName: "indigo/700",
            targetVariableSetName: "palette.light",
          },
        },
      },
    },
  });

  assert.deepEqual(tokens.get("surface/base").alias, {
    collection: "palette.light",
    name: "indigo/700",
  });
});

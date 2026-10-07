import test from "node:test";
import assert from "node:assert/strict";
import { cssDuration, cssEasing } from "./motion.mjs";
import { buildCollectionDocument, checkRawValues } from "./convert.mjs";
import { parse, stringify, deepEqualOrdered } from "./yaml.mjs";
import { verifyCanonical } from "./verify.mjs";

test("duration import preserves units and survives the canonical YAML round trip", () => {
  const document = buildCollectionDocument({
    name: "motion", layer: "primitive", refs: new Map(),
    byMode: new Map([["default", new Map([
      ["duration/enter", { type: "duration", value: { value: 0.22, unit: "s" } }],
      ["easing/enter", { type: "easing", value: "cubic-bezier(0.22, 1, 0.36, 1)" }],
    ])]]),
  });
  const restored = parse(stringify(document));
  assert.ok(deepEqualOrdered(document, restored));
  assert.equal(cssDuration(restored.get("tokens").get("duration/enter").get("values").get("default")), "0.22s");
  assert.equal(cssEasing(restored.get("tokens").get("easing/enter").get("values").get("default")), "cubic-bezier(0.22, 1, 0.36, 1)");
  assert.equal(cssDuration({ value: 220, unit: "ms" }), "220ms");
});

test("invalid units, negative time and malformed curves fail at import", () => {
  for (const [type, value] of [
    ["duration", { value: 100, unit: "px" }],
    ["duration", { value: -1, unit: "ms" }],
    ["duration", { value: "100", unit: "ms" }],
    ["easing", "cubic-bezier(2, 0, 0, 1)"],
    ["easing", "cubic-bezier(0, , 1, 1)"],
    ["easing", "linear; color: red"],
  ]) {
    const problems = { errors: [], warnings: [] };
    checkRawValues("motion", "default", new Map([["invalid", { type, value }]]), problems);
    assert.equal(problems.errors.length, 1, JSON.stringify(value));
  }
  assert.equal(cssEasing("linear"), "linear");
});

test("canonical checks validate a duration reached through an alias", () => {
  const token = (type, values, ref = null) => ({ type, values, ref, alpha: new Map() });
  const problems = { errors: [], warnings: [] };
  verifyCanonical({ collections: [{
    name: "motion", modes: ["default"], tokens: new Map([
      ["duration/invalid", token("duration", new Map([["default", new Map([["value", 100], ["unit", "px"]])]]))],
      ["duration/alias", token("duration", new Map(), new Map([["default", "motion/duration/invalid"]]))],
    ]),
  }] }, problems);
  assert.ok(problems.errors.some((error) => error.includes("motion/duration/alias")));
});

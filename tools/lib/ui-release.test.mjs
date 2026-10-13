import test from "node:test";
import assert from "node:assert/strict";
import { releaseCases } from "./ui-release.mjs";

test("release cases exhaust interactions between variants and retain optional content checks", () => {
  const entry = { id: "Example", api: [
    { name: "size", kind: "variant", default: "small", values: [{ value: "small" }, { value: "large" }] },
    { name: "tone", kind: "variant", default: "base", values: [{ value: "base" }, { value: "danger" }] },
    { name: "has icon", kind: "boolean", default: false },
    { name: "label text", kind: "text", default: "Example" },
    { name: "onclick", kind: "event" },
  ] };
  const cases = releaseCases(entry);
  assert.equal(cases.length, 5);
  assert.deepEqual(cases.filter(args => !args.hasIcon).map(args => `${args.size}/${args.tone}`).sort(),
    ["large/base", "large/danger", "small/base", "small/danger"]);
  assert.ok(cases.some(args => args.hasIcon));
  assert.ok(cases.every(args => args.labelText === "Example" && !("onclick" in args)));
});

test("an empty variant cannot quietly disappear from release coverage", () => {
  assert.throws(() => releaseCases({ id: "Example", api: [{ name: "size", kind: "variant", values: [] }] }), /empty variant/);
});

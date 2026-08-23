import test from "node:test";
import assert from "node:assert/strict";

import { stringify, parse, deepEqualOrdered } from "./yaml.mjs";

const roundTrip = (root) => parse(stringify(root), { filename: "test.yaml" });

test("round-trips quoted keys, slashes, escapes, nested maps and sequences", () => {
  const root = new Map([
    ["collection", "color"],
    ["layer", "semantic"],
    ["modes", ["light", "dark"]],
    [
      "tokens",
      new Map([
        [
          "surface/bold/primary/default",
          new Map([
            ["type", "color"],
            ["id", "VariableID:1943:1229"],
            ["scopes", ["FRAME_FILL", "SHAPE_FILL"]],
            [
              "values",
              new Map([
                ["light", "#5752f1"],
                ["dark", "#b2bff8"],
              ]),
            ],
            ["ref", new Map([["default", "palette/indigo/700"]])],
          ]),
        ],
        [
          'quote " and backslash \\ in the key',
          new Map([
            ["text", 'a "quoted" word and a \\ backslash'],
            ["count", 42],
            ["ratio", -1.5],
            ["enabled", true],
            ["missing", null],
          ]),
        ],
      ]),
    ],
  ]);

  assert.ok(deepEqualOrdered(roundTrip(root), root));
});

test("round-trips a sequence of mappings", () => {
  const root = new Map([
    [
      "archives",
      [
        new Map([
          ["filename", "color.zip"],
          ["modes", [new Map([["mode", "Light Mode"], ["tokens", 110]])]],
        ]),
        new Map([["filename", "border.zip"]]),
      ],
    ],
  ]);

  assert.ok(deepEqualOrdered(roundTrip(root), root));
});

test("preserves insertion order for keys that look like array indices", () => {
  // A plain object would reorder these to 25, 50, 975. A Map must not.
  const root = new Map([
    ["steps", new Map([["975", "a"], ["25", "b"], ["50", "c"]])],
  ]);

  assert.deepEqual([...roundTrip(root).get("steps").keys()], ["975", "25", "50"]);
});

test("keeps leading comments out of the parsed result", () => {
  const text = stringify(new Map([["a", 1]]), {
    comments: ["GENERATED FILE — do not edit.", "Source: somewhere"],
  });

  assert.ok(text.startsWith("# GENERATED FILE"));
  assert.ok(deepEqualOrdered(parse(text), new Map([["a", 1]])));
});

test("refuses to serialize an empty collection", () => {
  assert.throws(() => stringify(new Map([["scopes", []]])), /omit the key instead/);
  assert.throws(() => stringify(new Map([["ref", new Map()]])), /omit the key instead/);
});

for (const [label, text] of [
  ["tab indentation", 'root:\n\t- "a"\n'],
  ["3-space indentation", 'root:\n   sub: "a"\n'],
  ["an unquoted scalar", "root:\n  sub: hello\n"],
  ["mapping and sequence mixed", 'root:\n  - "a"\n  key: "b"\n'],
  ["a duplicate key", 'a: "one"\na: "two"\n'],
]) {
  test(`rejects ${label}, naming the line`, () => {
    assert.throws(
      () => parse(text, { filename: "broken.yaml" }),
      (error) => /^broken\.yaml:\d+:/.test(error.message)
    );
  });
}

test("rejects an unquoted scalar with a message pointing at the right line", () => {
  assert.throws(
    () => parse('a: "one"\nb: hello\n', { filename: "broken.yaml" }),
    { message: /^broken\.yaml:2: unquoted scalar "hello"/ }
  );
});

test("deepEqualOrdered is sensitive to key order", () => {
  const a = new Map([["x", 1], ["y", 2]]);
  const b = new Map([["y", 2], ["x", 1]]);

  assert.ok(!deepEqualOrdered(a, b));
  assert.ok(deepEqualOrdered(a, new Map([["x", 1], ["y", 2]])));
});

import test from "node:test";
import assert from "node:assert/strict";
import { nativeLengthLimit, textAreaCounter } from "../packages/ui/src/behaviors/text-area.ts";

test("native length limits retain zero and reject invalid numeric constraints", () => {
  assert.equal(nativeLengthLimit(0), 0);
  assert.equal(nativeLengthLimit(1000), 1000);
  for (const value of [undefined, -1, 1.5, NaN, Infinity, "1000"]) assert.equal(nativeLengthLimit(value), undefined);
});

test("counter follows native UTF-16 length and textarea newline normalization", () => {
  assert.equal(textAreaCounter(""), "0");
  assert.equal(textAreaCounter("A😀"), "3");
  assert.equal(textAreaCounter("A\r\nB\rC", 10), "5 / 10");
  assert.equal(textAreaCounter("", 0), "0 / 0");
  assert.equal(textAreaCounter("over limit", 0), "10 / 0");
  assert.equal(textAreaCounter("abc", -1), "3");
  assert.equal(textAreaCounter("abc", 10, "3 characters remaining"), "3 characters remaining");
  assert.equal(textAreaCounter("abc", 10, ""), "");
});

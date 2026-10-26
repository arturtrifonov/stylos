import test from "node:test";
import assert from "node:assert/strict";
import { fitTabs } from "../packages/ui/src/behaviors/tabs.ts";

test("every tab stays in the row while all of them fit", () => {
  assert.deepEqual(fitTabs([100, 100, 100], 1, 302, 250), [0, 1, 2]);
});

test("tabs that do not fit beside the trigger leave the row in document order", () => {
  // Without the trigger 303 units are needed; beside it only 250 remain.
  assert.deepEqual(fitTabs([100, 100, 100], 1, 300, 250), [0, 1]);
  assert.deepEqual(fitTabs([100, 100, 100, 100], 1, 300, 201), [0, 1]);
  // A later tab that would fit after a wider one still leaves: order is kept.
  assert.deepEqual(fitTabs([100, 200, 20], 1, 300, 250), [0]);
});

test("the selected tab stays in the row, displacing the last tabs that fit", () => {
  assert.deepEqual(fitTabs([100, 100, 100, 100], 1, 300, 250, 3), [0, 3]);
  assert.deepEqual(fitTabs([100, 100, 100, 100], 1, 300, 250, 1), [0, 1]);
  assert.deepEqual(fitTabs([100, 100, 100, 100], 1, 300, 150, 3), [3]);
});

test("a row that hugs its tabs does not overflow by a rounding error", () => {
  assert.deepEqual(fitTabs([100.3, 100.3, 100.3], 1, 302.8, 260), [0, 1, 2]);
});

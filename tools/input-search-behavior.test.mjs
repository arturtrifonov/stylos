import test from "node:test";
import assert from "node:assert/strict";
import { clearSearchInput } from "../packages/ui/src/behaviors/input-search.ts";

function input({ value = "query", disabled = false, readOnly = false } = {}) {
  return Object.assign(new EventTarget(), {
    value, readOnly, focused: false,
    matches: selector => selector === ":disabled" && disabled,
    focus(options) { this.focused = options; },
  });
}

test("clear commits empty native value before input/change callbacks and restores focus", () => {
  const field = input();
  const events = [];
  for (const type of ["input", "change"]) field.addEventListener(type, event => {
    events.push([event.type, event.target.value, event.bubbles]);
  });
  clearSearchInput(field);
  assert.equal(field.value, "");
  assert.deepEqual(events, [["input", "", true], ["change", "", true]]);
  assert.deepEqual(field.focused, { preventScroll: true });
  clearSearchInput(field);
  assert.equal(events.length, 2);
});

test("clear respects readonly and native disabled state including disabled fieldsets", () => {
  for (const options of [{ readOnly: true }, { disabled: true }]) {
    const field = input(options);
    field.addEventListener("input", () => assert.fail("immutable value emitted input"));
    field.addEventListener("change", () => assert.fail("immutable value emitted change"));
    clearSearchInput(field);
    assert.equal(field.value, "query");
    assert.equal(field.focused, false);
  }
});

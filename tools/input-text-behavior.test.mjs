import test from "node:test";
import assert from "node:assert/strict";
import { inputTextBehavior } from "../packages/ui/src/behaviors/input-text.ts";

test("text reserves follow changing adornment widths and observers are removed", () => {
  const oldObserver = globalThis.ResizeObserver;
  const oldStyle = globalThis.getComputedStyle;
  let callback, disconnected = false;
  const observed = [];
  globalThis.ResizeObserver = class {
    constructor(update) { callback = update; }
    observe(element) { observed.push(element); }
    disconnect() { disconnected = true; }
  };
  globalThis.getComputedStyle = element => ({ columnGap: `${element.gap}px` });
  const group = (width, gap) => ({ width, gap, getBoundingClientRect() { return { width: this.width }; } });
  const leading = group(22, 6), trailing = group(60, 6);
  const properties = new Map();
  const field = {
    querySelector: selector => selector.endsWith("leading") ? leading : trailing,
    style: {
      getPropertyValue: name => properties.get(name) ?? "",
      setProperty: (name, value) => properties.set(name, value),
    },
  };
  try {
    const action = inputTextBehavior(field);
    assert.deepEqual(observed, [leading, trailing]);
    assert.equal(properties.get("--_stylos-input-leading-reserve"), "28px");
    assert.equal(properties.get("--_stylos-input-trailing-reserve"), "66px");
    // A longer suffix, loaded font or changed size changes its actual width.
    trailing.width = 130;
    trailing.gap = 8;
    callback();
    assert.equal(properties.get("--_stylos-input-trailing-reserve"), "138px");
    leading.width = 0;
    trailing.width = 0;
    callback();
    assert.equal(properties.get("--_stylos-input-leading-reserve"), "0px");
    assert.equal(properties.get("--_stylos-input-trailing-reserve"), "0px");
    action.destroy();
    assert.ok(disconnected);
  } finally {
    globalThis.ResizeObserver = oldObserver;
    globalThis.getComputedStyle = oldStyle;
  }
});

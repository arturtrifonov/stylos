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
      removeProperty: name => properties.delete(name),
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
    assert.equal(properties.size, 0);
  } finally {
    globalThis.ResizeObserver = oldObserver;
    globalThis.getComputedStyle = oldStyle;
  }
});

test("optional groups can mount and unmount without leaving stale padding", () => {
  const oldObserver = globalThis.ResizeObserver;
  const oldStyle = globalThis.getComputedStyle;
  const observed = new Set();
  const properties = new Map();
  let leading = null, trailing = null;
  globalThis.ResizeObserver = class {
    observe(element) { observed.add(element); }
    disconnect() { observed.clear(); }
  };
  globalThis.getComputedStyle = () => ({ columnGap: "6px" });
  const field = {
    querySelector: selector => selector.endsWith("leading") ? leading : trailing,
    style: {
      getPropertyValue: name => properties.get(name) ?? "",
      setProperty: (name, value) => properties.set(name, value),
      removeProperty: name => properties.delete(name),
    },
  };
  try {
    const action = inputTextBehavior(field);
    assert.equal(observed.size, 0);
    leading = { getBoundingClientRect: () => ({ width: 22 }) };
    trailing = { getBoundingClientRect: () => ({ width: 48 }) };
    action.update();
    assert.deepEqual([...observed], [leading, trailing]);
    assert.equal(properties.get("--_stylos-input-leading-reserve"), "28px");
    assert.equal(properties.get("--_stylos-input-trailing-reserve"), "54px");
    leading = trailing = null;
    action.update();
    assert.equal(observed.size, 0);
    assert.equal(properties.get("--_stylos-input-leading-reserve"), "0px");
    assert.equal(properties.get("--_stylos-input-trailing-reserve"), "0px");
    action.destroy();
    assert.equal(properties.size, 0);
  } finally {
    globalThis.ResizeObserver = oldObserver;
    globalThis.getComputedStyle = oldStyle;
  }
});

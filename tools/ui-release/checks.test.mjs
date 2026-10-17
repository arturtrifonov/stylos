import test from "node:test";
import assert from "node:assert/strict";
import { AXE_TAGS, hasLoadedFont, captureDiagnostics, settleAnimations } from "./checks.mjs";

test("font verification rejects fallback and unloaded faces", () => {
  assert.equal(hasLoadedFont([], "Georama"), false);
  assert.equal(hasLoadedFont([{ family: '"Georama"', status: "loading" }], "Georama"), false);
  assert.equal(hasLoadedFont([{ family: '"Georama"', status: "loaded" }], "Georama"), true);
  assert.ok(AXE_TAGS.includes("wcag21a") && AXE_TAGS.includes("wcag22a"));
});

test("async errors, rejections and Svelte warnings are recorded with case context and restored", () => {
  const target = new EventTarget();
  const logs = [];
  const console = { warn() {}, error() {} };
  const warn = console.warn;
  const capture = captureDiagnostics(target, console, entry => logs.push(entry));
  capture.context({ component: "Select", case: 3 });
  console.warn("Svelte runtime warning");
  const error = new Event("error"); error.message = "deferred action failed"; target.dispatchEvent(error);
  const rejection = new Event("unhandledrejection"); rejection.reason = new Error("machine rejected"); target.dispatchEvent(rejection);
  assert.deepEqual(logs.map(entry => entry.kind), ["console.warn", "error", "unhandledrejection"]);
  assert.ok(logs.every(entry => entry.component === "Select" && entry.case === 3));
  capture.stop();
  assert.equal(console.warn, warn);
  target.dispatchEvent(error);
  assert.equal(logs.length, 3);
});

test("surface animation settles before audit while cyclic Loader is ignored", async () => {
  let finish;
  const finished = new Promise(resolve => { finish = resolve; });
  let settled = false;
  const document = { getAnimations: () => [
    { playState: "running", effect: { getComputedTiming: () => ({ iterations: 1 }) }, finished },
    { playState: "running", effect: { getComputedTiming: () => ({ iterations: Infinity }) }, finished: new Promise(() => {}) },
  ] };
  const waiting = settleAnimations(document).then(() => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  finish();
  await waiting;
  assert.equal(settled, true);
});

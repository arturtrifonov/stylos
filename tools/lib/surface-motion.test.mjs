import test from "node:test";
import assert from "node:assert/strict";
import { surfaceMotion } from "../../packages/ui/src/behaviors/surface-motion.ts";

function fixture({ reduced = false, duration = "0.22s", enter = "translateY(8px) scale(0.85)", exit = "none" } = {}) {
  function element() {
    const attributes = new Map();
    const properties = new Map();
    return {
      getAttribute: name => attributes.get(name) ?? null,
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: name => attributes.delete(name),
      style: { transform: "", getPropertyValue: name => properties.get(name) ?? "",
        getPropertyPriority: () => "", setProperty: (name, value) => properties.set(name, value),
        removeProperty: name => properties.delete(name) },
    };
  }
  const listeners = new Set();
  const preference = {
    matches: reduced,
    addEventListener: (_, handler) => listeners.add(handler),
    removeEventListener: (_, handler) => listeners.delete(handler),
  };
  const visibility = { ...element(), visibility: "hidden", opacity: "0" };
  const animations = [];
  let presentedTransform;
  const variables = {
    "--_stylos-surface-enter-transform": enter,
    "--_stylos-surface-exit-transform": exit,
    "--_stylos-surface-enter-duration": duration,
    "--_stylos-surface-exit-duration": "260ms",
    "--_stylos-surface-enter-easing": "cubic-bezier(0.22, 1, 0.36, 1)",
    "--_stylos-surface-exit-easing": "cubic-bezier(0.64, 0, 0.78, 0)",
  };
  const surface = {
    ...element(),
    ownerDocument: { defaultView: {
      matchMedia: () => preference,
      getComputedStyle: element => element === visibility ? visibility : {
        ...visibility,
        transform: presentedTransform ?? (surface.style.transform || "none"),
        getPropertyValue: name => variables[name] ?? "",
      },
    } },
    animate(keyframes, timing) {
      const animation = { keyframes, timing, playState: "running", cancelled: false,
        cancel() { this.cancelled = true; this.playState = "idle"; presentedTransform = undefined; } };
      animations.push(animation);
      return animation;
    },
  };
  return { surface, visibility, animations, preference, listeners,
    present(value) { presentedTransform = value; },
    reduce() { preference.matches = true; for (const handler of listeners) handler(); } };
}

test("an interrupted entry holds its geometry while fading and resumes when reopened", () => {
  const f = fixture();
  const motion = surfaceMotion(f.surface, f.visibility);
  motion.update(true);
  f.visibility.visibility = "visible";
  f.visibility.opacity = "0.5";
  const halfway = "matrix(0.93, 0, 0, 0.93, 0, 4)";
  f.present(halfway);
  motion.update(false);
  assert.equal(f.surface.style.transform, halfway);
  assert.equal(f.animations[0].cancelled, true);
  assert.equal(f.animations.length, 1, "exit creates no spatial animation");
  motion.update(true);
  assert.equal(f.animations[1].keyframes[0].transform, halfway);
  assert.equal(f.animations[1].keyframes[1].transform, "none");
  motion.update(true);
  assert.equal(f.animations.length, 2, "ordinary renders do not replay entry");
  motion.destroy();
});

test("a fully dismissed surface starts a fresh entry using its profile and token timing", () => {
  const f = fixture({ duration: "220ms" });
  const motion = surfaceMotion(f.surface, f.visibility);
  motion.update(true);
  f.present("matrix(0.93, 0, 0, 0.93, 0, 4)");
  motion.update(false);
  motion.update(true);
  const entry = f.animations.at(-1);
  assert.equal(entry.keyframes[0].transform, "translateY(8px) scale(0.85)");
  assert.equal(entry.timing.duration, 220);
  motion.destroy();
});

test("reduced motion skips entry and cancels active motion when the preference changes", () => {
  const reduced = fixture({ reduced: true });
  const immediate = surfaceMotion(reduced.surface);
  immediate.update(true);
  assert.equal(reduced.animations.length, 0);
  immediate.destroy();
  const f = fixture();
  const motion = surfaceMotion(f.surface);
  motion.update(true);
  assert.equal(f.animations[0].timing.duration, 220);
  f.reduce();
  assert.equal(f.animations[0].cancelled, true);
  assert.equal(f.surface.style.transform, "");
  motion.destroy();
  assert.equal(f.listeners.size, 0);
});

test("teardown cancels motion, restores the caller's transform and removes the listener", () => {
  const f = fixture();
  f.surface.style.transform = "translateX(2px)";
  const motion = surfaceMotion(f.surface);
  motion.update(true);
  assert.equal(f.animations[0].keyframes[1].transform, "translateX(2px)");
  motion.destroy();
  assert.equal(f.animations[0].cancelled, true);
  assert.equal(f.surface.style.transform, "translateX(2px)");
  assert.equal(f.listeners.size, 0);
});


test("unraised and in-layout profiles never introduce spatial entry", () => {
  const f = fixture({ enter: "none" });
  const motion = surfaceMotion(f.surface, f.visibility);
  motion.update(true);
  motion.update(false);
  assert.equal(f.animations.length, 0);
  motion.destroy();
});

test("edge attachment uses its profile for entry and exit and reverses from current geometry", () => {
  const f = fixture({ enter: "translateX(100%)", exit: "translateX(100%)", duration: "350ms" });
  const motion = surfaceMotion(f.surface, f.visibility);
  motion.update(true);
  assert.equal(f.animations[0].keyframes[0].transform, "translateX(100%)");
  assert.equal(f.animations[0].timing.duration, 350);
  f.visibility.visibility = "visible";
  f.visibility.opacity = "1";
  f.present("matrix(1, 0, 0, 1, 40, 0)");
  motion.update(false);
  assert.equal(f.animations[1].keyframes[0].transform, "matrix(1, 0, 0, 1, 40, 0)");
  assert.equal(f.animations[1].keyframes[1].transform, "translateX(100%)");
  assert.equal(f.animations[1].timing.duration, 260);
  f.present("matrix(1, 0, 0, 1, 70, 0)");
  motion.update(true);
  assert.equal(f.animations[2].keyframes[0].transform, "matrix(1, 0, 0, 1, 70, 0)");
  assert.equal(f.animations[1].cancelled, true);
  motion.destroy();
});

test("a separate visibility node follows surface timing and teardown restores its metadata", () => {
  const f = fixture();
  f.visibility.setAttribute("data-surface-motion", "owner");
  f.visibility.style.setProperty("--_stylos-surface-exit-duration", "90ms");
  const motion = surfaceMotion(f.surface, f.visibility);
  motion.update(true);
  assert.equal(f.visibility.style.getPropertyValue("--_stylos-surface-enter-duration"), "0.22s");
  assert.equal(f.visibility.style.getPropertyValue("--_stylos-surface-exit-duration"), "260ms");
  motion.destroy();
  assert.equal(f.visibility.getAttribute("data-surface-motion"), "owner");
  assert.equal(f.visibility.style.getPropertyValue("--_stylos-surface-exit-duration"), "90ms");
  assert.equal(f.visibility.style.getPropertyValue("--_stylos-surface-enter-duration"), "");
});

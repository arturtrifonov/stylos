import test from "node:test";
import assert from "node:assert/strict";
import { dropdownLevelMotion } from "../../packages/ui/src/behaviors/dropdown-level-motion.ts";

function fixture({ reduced = false } = {}) {
  const listeners = new Set();
  const preference = { matches: reduced, addEventListener: (_, handler) => listeners.add(handler),
    removeEventListener: (_, handler) => listeners.delete(handler) };
  const tokens = { "motion-duration-medium-enter": "220ms", "motion-duration-medium-exit": "0.15s",
    "motion-easing-enter": "cubic-bezier(0.22, 1, 0.36, 1)", "motion-easing-exit": "cubic-bezier(0.32, 0, 0.67, 0)" };
  function element(height, hidden = false) {
    const attributes = new Map();
    const animations = [];
    return { height, hidden, opacity: "1", transform: "none", animations,
      getAttribute: name => attributes.get(name) ?? null,
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: name => attributes.delete(name),
      animate(keyframes, timing) {
        const animation = { keyframes, timing, currentTime: 0, cancelled: false, onfinish: null,
          cancel() { this.cancelled = true; } };
        animations.push(animation); return animation;
      },
    };
  }
  const root = element("200px"), child = element("160px", true), grandchild = element("180px", true), container = element("200px");
  container.ownerDocument = { defaultView: {
    matchMedia: () => preference,
    getComputedStyle: element => ({ height: element.height, opacity: element.opacity, transform: element.transform,
      getPropertyValue: name => tokens[name.replace("--stylos-", "")] ?? "" }),
  } };
  return { root, child, grandchild, container, preference, listeners };
}

test("a second descent skips a level whose entry has not started, without sliding it through the viewport", () => {
  const f = fixture();
  const motion = dropdownLevelMotion(f.container, [f.root, f.child, f.grandchild]);
  motion.show(f.child, 1);
  f.root.transform = "matrix(1, 0, 0, 1, -20, 0)";
  f.child.transform = "matrix(1, 0, 0, 1, 260, 0)";
  f.child.animations[0].currentTime = 60;
  motion.show(f.grandchild, 1);
  assert.equal(f.child.hidden, true);
  assert.equal(f.child.animations.length, 1);
  assert.equal(f.child.animations[0].cancelled, true);
  assert.equal(f.grandchild.hidden, false);
  assert.equal(f.grandchild.animations[0].timing.delay, 150);
  motion.destroy();
});

test("slide-in starts after slide-out, holding the frame height and avoiding a crossfade", () => {
  const f = fixture();
  const motion = dropdownLevelMotion(f.container, [f.root, f.child]);
  motion.show(f.child, 1);
  assert.equal(f.root.hidden, false);
  assert.equal(f.root.getAttribute("inert"), "");
  assert.equal(f.root.getAttribute("aria-hidden"), "true");
  assert.equal(f.child.hidden, false);
  assert.equal(f.child.getAttribute("inert"), null);
  const outgoing = f.root.animations[0], incoming = f.child.animations[0];
  assert.equal(outgoing.keyframes[1].transform, "translateX(-100%)");
  assert.equal(incoming.keyframes[0].transform, "translateX(100%)");
  assert.equal(incoming.timing.delay, outgoing.timing.duration);
  assert.equal(incoming.timing.fill, "both");
  assert.equal(f.container.animations[0].timing.delay, outgoing.timing.duration);
  assert.ok([...outgoing.keyframes, ...incoming.keyframes].every(frame => !("opacity" in frame)));
  f.root.animations[0].onfinish();
  assert.equal(f.root.hidden, true);
  assert.equal(f.child.hidden, false);
  motion.destroy();
  assert.equal(f.listeners.size, 0);
});

test("a fast return continues the presented levels and height, ignoring stale completion callbacks", () => {
  const f = fixture();
  const motion = dropdownLevelMotion(f.container, [f.root, f.child]);
  motion.show(f.child, 1);
  const staleFinish = f.root.animations[0].onfinish;
  f.root.transform = "matrix(1, 0, 0, 1, -4, 0)";
  f.child.transform = "matrix(1, 0, 0, 1, 260, 0)";
  f.container.height = "184px";
  motion.show(f.root, -1);
  assert.deepEqual(f.root.animations[1].keyframes[0], { transform: "matrix(1, 0, 0, 1, -4, 0)" });
  assert.equal(f.root.animations[1].timing.delay, 0);
  assert.equal(f.child.hidden, true);
  assert.equal(f.child.animations.length, 1);
  assert.equal(f.child.animations[0].cancelled, true);
  assert.deepEqual(f.container.animations[1].keyframes, [{ height: "184px" }, { height: "200px" }]);
  assert.equal(f.container.animations[0].cancelled, true);
  staleFinish();
  assert.equal(f.root.hidden, false);
  assert.equal(f.root.getAttribute("inert"), null);
  assert.equal(f.child.getAttribute("inert"), null);
  motion.destroy();
  assert.equal(f.child.getAttribute("data-navigation-leaving"), null);
});

test("reduced motion and preference changes immediately settle to one level without leftover motion", () => {
  const f = fixture({ reduced: true });
  const motion = dropdownLevelMotion(f.container, [f.root, f.child]);
  motion.show(f.child, 1);
  assert.equal(f.root.hidden, true);
  assert.equal(f.child.animations.length, 0);
  f.preference.matches = false;
  motion.show(f.root, -1);
  assert.equal(f.child.hidden, false);
  f.preference.matches = true;
  f.listeners.forEach(handler => handler());
  assert.equal(f.child.hidden, true);
  assert.equal(f.root.hidden, false);
  assert.equal(f.root.animations[0].cancelled, true);
  assert.equal(f.child.getAttribute("inert"), null);
  motion.destroy();
});

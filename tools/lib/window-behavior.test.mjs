import test from "node:test";
import assert from "node:assert/strict";
import { windowBehavior } from "../../packages/ui/src/behaviors/window.ts";
import { onOwnerDismiss } from "../../packages/ui/src/behaviors/overlay-host.ts";

// The browser verification covers native focus containment and hit testing.
// This fixture controls exit completion to exercise races and shared locks.
function environment() {
  const timers = new Map();
  let timerId = 0;
  const preference = new EventTarget();
  preference.matches = false;
  const doc = new EventTarget();
  class Element extends EventTarget {
    constructor() {
      super(); this.ownerDocument = doc; this.children = []; this.dataset = {};
      this.attributes = new Map(); this.style = { transform: "", overflow: "", scrollbarGutter: "",
        getPropertyValue: () => "", getPropertyPriority: () => "", setProperty() {}, removeProperty() {} };
      this.isConnected = true;
    }
    get parentNode() { return this.parentElement; }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(c => c !== this); this.parentElement = null; }
    append(child) {
      if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(c => c !== child);
      this.children.push(child); child.parentElement = this;
    }
    before(child) { this.parentElement.append(child); }
    replaceWith(child) { const parent = this.parentElement; parent.children = parent.children.filter(c => c !== this); parent.append(child); }
    contains(child) { for (let n = child; n; n = n.parentElement) if (n === this) return true; return false; }
    closest(selector) {
      for (let n = this; n; n = n.parentElement) {
        if (selector === "[data-overlay-host]" && n.host) return n;
        if (selector === "[inert]" && n.inert) return n;
      }
      return null;
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    focus() { doc.activeElement = this; }
  }
  doc.body = new Element(); doc.documentElement = new Element();
  doc.createComment = () => new Element();
  doc.defaultView = {
    HTMLElement: Element, matchMedia: () => preference,
    setTimeout(handler) { timers.set(++timerId, handler); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    getComputedStyle(element) { return {
      opacity: element.dataset.state === "open" ? "1" : "0",
      visibility: element.dataset.state === "open" ? "visible" : "hidden",
      transform: element.style.transform || "none",
      getPropertyValue(name) {
        return { "--_stylos-surface-enter-transform": "translateY(16px) scale(0.7)",
          "--_stylos-surface-exit-transform": "none", "--_stylos-surface-enter-duration": "220ms",
          "--_stylos-surface-exit-duration": "180ms", "--_stylos-surface-enter-easing": "ease-out",
          "--_stylos-surface-exit-easing": "ease-in" }[name] ?? "";
      },
    }; },
  };
  function create({ modal = true, parent = doc.body } = {}) {
    const trigger = new Element(); parent.append(trigger); trigger.focus();
    const root = new Element(); root.host = true; root.open = false;
    root.classList = { contains: name => name === "stylos-modal-root" && modal };
    const panel = new Element(); panel.dataset.state = "closed"; root.append(panel);
    const close = new Element(); panel.append(close);
    panel.querySelector = selector => selector === "[autofocus]" ? null : close;
    panel.animate = () => ({ cancel() {} });
    root.querySelector = () => panel;
    let opened = 0, closed = 0;
    root.show = root.showModal = () => { root.open = true; opened++; doc.activeElement = root; };
    root.close = () => { if (!root.open) return; root.open = false; closed++; root.dispatchEvent(new Event("close")); };
    parent.append(root);
    let behavior;
    const options = open => ({ isOpen: open, onOpenChange: value => behavior.update(options(value)) });
    behavior = windowBehavior(root, options(false));
    return { root, panel, close, trigger, behavior, open: () => behavior.update(options(true)),
      dismiss: () => behavior.update(options(false)), counts: () => ({ opened, closed }) };
  }
  return { doc, create, preference, timers,
    flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(handler => handler()); },
    escape(prevent = false) {
      const event = new Event("keydown", { cancelable: true }); event.key = "Escape";
      if (prevent) event.preventDefault(); doc.dispatchEvent(event); return event;
    },
  };
}

test("nested modals keep the shared lock until the last exit and Escape closes only the top window", () => {
  const e = environment(); e.doc.documentElement.style.overflow = "auto";
  const first = e.create(); first.open();
  const child = e.create({ parent: first.panel }); child.open();
  assert.equal(e.doc.activeElement, child.close);
  e.escape(true); assert.equal(child.panel.dataset.state, "open", "a child popup consumed Escape");
  e.escape(); assert.equal(child.panel.dataset.state, "closed");
  assert.equal(first.panel.dataset.state, "open");
  assert.ok(child.root.open, "native modal stays present during its exit");
  assert.equal(e.doc.documentElement.style.overflow, "hidden");
  e.flush(); assert.equal(child.root.open, false);
  assert.equal(e.doc.documentElement.style.overflow, "hidden");
  assert.equal(e.doc.activeElement, child.trigger);
  e.escape(); e.flush();
  assert.equal(e.doc.documentElement.style.overflow, "auto");
  assert.equal(e.doc.documentElement.style.scrollbarGutter, "");
  child.behavior.destroy(); first.behavior.destroy();
});

test("reopening cancels a pending native close and owner dismissal also closes anchored children", () => {
  const e = environment(), w = e.create(); w.open();
  let popupCloses = 0;
  const cleanup = onOwnerDismiss(w.close, () => popupCloses++);
  w.dismiss(); assert.equal(popupCloses, 1);
  assert.equal(w.root.inert, true);
  w.open(); e.flush();
  assert.deepEqual(w.counts(), { opened: 1, closed: 0 });
  assert.equal(w.root.inert, false);
  w.dismiss(); e.flush();
  assert.deepEqual(w.counts(), { opened: 1, closed: 1 });
  assert.equal(e.doc.activeElement, w.trigger);
  cleanup(); w.behavior.destroy(); assert.equal(e.timers.size, 0);
});

test("a non-modal drawer preserves page focus and a child drawer receives Escape before its modal owner", () => {
  const e = environment(), drawer = e.create({ modal: false }); drawer.open();
  assert.equal(e.doc.documentElement.style.overflow, "");
  drawer.trigger.focus(); drawer.dismiss(); e.flush();
  assert.equal(e.doc.activeElement, drawer.trigger);
  const modal = e.create(); modal.open();
  const child = e.create({ modal: false, parent: modal.panel }); child.open();
  e.escape(); assert.equal(child.panel.dataset.state, "closed");
  assert.equal(modal.panel.dataset.state, "open");
  e.preference.matches = true; e.preference.dispatchEvent(new Event("change"));
  assert.equal(child.root.open, false, "enabling reduced motion completes an exit immediately");
  child.behavior.destroy(); modal.behavior.destroy(); drawer.behavior.destroy();
  assert.equal(e.doc.documentElement.style.overflow, "");
});

test("unmount removes a portalled window even when its original placeholder is gone", () => {
  const e = environment(), w = e.create(); w.open();
  const anchor = e.doc.body.children.find(node => node !== w.trigger && node !== w.root);
  anchor.remove(); w.dismiss(); w.behavior.destroy(); e.flush();
  assert.equal(w.root.parentNode, null);
  assert.equal(e.doc.documentElement.style.overflow, "");
  assert.equal(e.timers.size, 0);
});

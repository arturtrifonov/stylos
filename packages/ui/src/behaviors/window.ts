import { overlayHost } from "./overlay-host.ts";
import { surfaceMotion } from "./surface-motion.ts";

export type WindowBehaviorOptions = { isOpen: boolean; onOpenChange: (open: boolean) => void };
type Entry = { root: HTMLDialogElement; modal: boolean; requestClose: () => void };
const windows = new WeakMap<Document, Entry[]>();
const scrollLocks = new WeakMap<Document, { count: number; overflow: string; gutter: string }>();

export function windowBehavior(root: HTMLDialogElement, initial: WindowBehaviorOptions) {
  let options = initial;
  const doc = root.ownerDocument;
  const view = doc.defaultView!;
  const panel = root.querySelector<HTMLElement>(".stylos-window")!;
  const modal = root.classList.contains("stylos-modal-root");
  const host = overlayHost(root.parentElement!);
  const anchor = doc.createComment("window host");
  root.before(anchor);
  host.append(root);
  const motion = surfaceMotion(panel);
  const entry: Entry = { root, modal, requestClose: () => options.onOpenChange(false) };
  const stack = windows.get(doc) ?? [];
  windows.set(doc, stack);
  let previousFocus: HTMLElement | null = null;
  let closing: number | undefined;
  let requestedOpen = false;
  let focusWasInside = false;
  let locked = false;
  let destroyed = false;
  const reduced = view.matchMedia("(prefers-reduced-motion: reduce)");

  function lock() {
    if (!modal || locked) return;
    locked = true;
    const state = scrollLocks.get(doc) ?? { count: 0, overflow: doc.documentElement.style.overflow, gutter: doc.documentElement.style.scrollbarGutter };
    state.count++;
    scrollLocks.set(doc, state);
    doc.documentElement.style.scrollbarGutter = "stable";
    doc.documentElement.style.overflow = "hidden";
  }
  function unlock() {
    if (!locked) return;
    locked = false;
    const state = scrollLocks.get(doc)!;
    if (--state.count === 0) {
      doc.documentElement.style.overflow = state.overflow;
      doc.documentElement.style.scrollbarGutter = state.gutter;
      scrollLocks.delete(doc);
    }
  }
  function removeEntry() {
    const index = stack.indexOf(entry);
    if (index !== -1) stack.splice(index, 1);
  }
  function finishClose() {
    closing = undefined;
    if (requestedOpen || destroyed) return;
    const ownedFocus = focusWasInside || root.contains(doc.activeElement);
    root.close();
    unlock();
    removeEntry();
    // Non-modal windows do not take focus back from an unrelated page task.
    if ((modal || ownedFocus) && previousFocus?.isConnected && !previousFocus.closest("[inert]")) {
      previousFocus.focus({ preventScroll: true });
    }
  }
  function update(next: WindowBehaviorOptions) {
    options = next;
    if (options.isOpen === requestedOpen) return;
    requestedOpen = options.isOpen;
    view.clearTimeout(closing);
    closing = undefined;
    if (requestedOpen) {
      const newlyOpened = !root.open;
      if (newlyOpened) {
        previousFocus = doc.activeElement instanceof view.HTMLElement ? doc.activeElement as HTMLElement : null;
        host.append(root); // Most recently opened sibling at this depth.
        removeEntry();
        stack.push(entry);
        root.inert = false;
        root.removeAttribute("aria-hidden");
        modal ? root.showModal() : root.show();
        lock();
      }
      root.inert = false;
      root.removeAttribute("aria-hidden");
      // Establish the hidden starting style before selecting the open state.
      view.getComputedStyle(panel).opacity;
      motion.update(true);
      panel.dataset.state = "open";
      if (newlyOpened) {
        const focus = panel.querySelector<HTMLElement>("[autofocus]") ?? panel.querySelector<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex='0']");
        focus?.focus({ preventScroll: true });
      }
    } else {
      focusWasInside = root.contains(doc.activeElement);
      root.dispatchEvent(new Event("stylos-window-dismiss"));
      root.inert = true;
      for (const child of [...stack].reverse()) {
        if (child !== entry && root.contains(child.root)) child.requestClose();
      }
      motion.update(false);
      panel.dataset.state = "closed";
      const style = view.getComputedStyle(panel);
      const value = style.getPropertyValue("--_stylos-surface-exit-duration").trim();
      const duration = Number.parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
      if (reduced.matches || !duration) finishClose();
      else closing = view.setTimeout(finishClose, duration);
    }
  }
  function onCancel(event: Event) {
    event.preventDefault();
    if (requestedOpen) topWindow()?.requestClose();
  }
  function topWindow() {
    const modalTop = [...stack].reverse().find(window => window.modal && window.root.open);
    return [...stack].reverse().find(window => window.root.open && (!modalTop || window === modalTop || modalTop.root.contains(window.root)));
  }
  function onKey(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.defaultPrevented || !requestedOpen) return;
    if (topWindow() !== entry) return;
    event.preventDefault();
    entry.requestClose();
  }
  function onClose() {
    view.clearTimeout(closing);
    closing = undefined;
    if (requestedOpen) {
      requestedOpen = false;
      motion.update(false);
      panel.dataset.state = "closed";
      options.onOpenChange(false);
    }
    unlock();
    removeEntry();
  }
  function onReduced() {
    if (reduced.matches && closing !== undefined) {
      view.clearTimeout(closing);
      finishClose();
    }
  }
  root.addEventListener("cancel", onCancel);
  root.addEventListener("close", onClose);
  doc.addEventListener("keydown", onKey);
  reduced.addEventListener("change", onReduced);
  update(initial);
  return {
    update,
    destroy() {
      destroyed = true;
      view.clearTimeout(closing);
      root.removeEventListener("cancel", onCancel);
      root.removeEventListener("close", onClose);
      doc.removeEventListener("keydown", onKey);
      reduced.removeEventListener("change", onReduced);
      motion.destroy();
      if (root.open) root.close();
      unlock();
      removeEntry();
      if (anchor.parentNode) anchor.replaceWith(root);
      else root.remove();
    },
  };
}

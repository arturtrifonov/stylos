import * as popover from "@zag-js/popover";
import { VanillaMachine, normalizeProps, spreadProps } from "@zag-js/vanilla";
import { surfaceMotion } from "./surface-motion.js";
import { dropdownLevelMotion } from "./dropdown-level-motion.js";

export type DropdownNavigationBehaviorOptions = {
  id: string;
  accessibleName: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
};

// A single popup hosts named, mounted levels. Parent enters another level;
// only a leaf commits a value. Native buttons keep their normal Tab order.
export function dropdownNavigationBehavior(root: HTMLElement, initial: DropdownNavigationBehaviorOptions) {
  let options = initial;
  const trigger = root.querySelector<HTMLButtonElement>("[data-dropdown-trigger] button, button[data-dropdown-trigger]");
  const positioner = root.querySelector<HTMLElement>("[data-dropdown-positioner]");
  const content = positioner?.querySelector<HTMLElement>("[data-dropdown-navigation]");
  const panels = [...(content?.querySelectorAll<HTMLElement>("[data-dropdown-panel]") ?? [])];
  if (!trigger || !positioner || !content || !panels.length || panels.some(panel => !panel.id)) {
    throw new Error("dropdownNavigationBehavior needs a button trigger, a positioner and named panels inside data-dropdown-navigation.");
  }
  const doc = root.ownerDocument;
  const parents = [...content.querySelectorAll<HTMLButtonElement>(".stylos-dropdown-item-parent")];
  const leaves = [...content.querySelectorAll<HTMLButtonElement>("button.stylos-dropdown-item-default")]
    .filter(leaf => !leaf.closest(".stylos-dropdown-back"));
  if (new Set(panels.map(panel => panel.id)).size !== panels.length ||
      parents.some(parent => !panels.some(panel => panel.id === parent.getAttribute("aria-controls"))) ||
      leaves.some(leaf => !leaf.dataset.value) || new Set(leaves.map(leaf => leaf.dataset.value)).size !== leaves.length ||
      panels.some(panel => !panel.querySelector('.stylos-dropdown-options[role="group"]')) ||
      content.querySelector('[role="option"], input, .stylos-dropdown-search, .stylos-dropdown-actions') ||
      panels.slice(1).some(panel => !panel.querySelector('.stylos-dropdown-back button.stylos-dropdown-item-default'))) {
    throw new Error("Navigation levels need unique panel IDs, valid Parent controls, unique non-empty leaf values and contentRole=group.");
  }
  const elements = [trigger, positioner, content, ...panels, ...leaves];
  const originals = elements.map(element => new Map([...element.attributes].map(a => [a.name, a.value])));
  const anchor = doc.createComment("dropdown navigation positioner");
  positioner.before(anchor);
  doc.body.append(positioner);
  content.dataset.surfaceLayer = "3";
  content.dataset.surfaceAttachment = "control";
  const motion = surfaceMotion(content, positioner);
  const levelMotion = dropdownLevelMotion(content, panels);
  let active = panels[0];
  let path: { panel: HTMLElement; parent: HTMLButtonElement; scroll: number }[] = [];
  let open = false;
  let cleanups: (() => void)[] = [];
  function rows(panel = active) {
    return [...panel.querySelectorAll<HTMLElement>(".stylos-dropdown-item")]
      .filter(row => row.dataset.state !== "disabled" && !row.matches(":disabled"));
  }
  function show(panel: HTMLElement, direction?: 1 | -1) {
    active = panel;
    levelMotion.show(panel, direction);
  }
  function forward(parent: HTMLButtonElement) {
    const next = panels.find(panel => panel.id === parent.getAttribute("aria-controls"));
    if (!next || next === active || path.some(entry => entry.panel === next)) return;
    const scroller = active.querySelector<HTMLElement>(".stylos-dropdown-options");
    path.push({ panel: active, parent, scroll: scroller?.scrollTop ?? 0 });
    show(next, 1);
    search = "";
    const nextScroller = next.querySelector<HTMLElement>(".stylos-dropdown-options");
    if (nextScroller) nextScroller.scrollTop = 0;
    const first = rows().find(row => !row.closest(".stylos-dropdown-back"));
    (first ?? rows()[0])?.focus({ preventScroll: true });
  }
  function back() {
    const previous = path.pop();
    if (!previous) return;
    show(previous.panel, -1);
    search = "";
    const scroller = active.querySelector<HTMLElement>(".stylos-dropdown-options");
    if (scroller) scroller.scrollTop = previous.scroll;
    previous.parent.focus({ preventScroll: true });
  }
  const machineProps = () => ({
    id: options.id, getRootNode: () => doc, modal: false, portalled: true,
    ids: { trigger: trigger.id || `dropdown-navigation-trigger-${options.id}`, content: `dropdown-navigation-${options.id}` },
    positioning: { placement: options.placement ?? "bottom-start", sameWidth: true,
      gutter: Number.parseFloat(doc.defaultView!.getComputedStyle(trigger).getPropertyValue("--stylos-dimension-gap-g-0_500")) },
  });
  const machine = new VanillaMachine(popover.machine, machineProps);
  function render() {
    const api = popover.connect(machine.service, normalizeProps);
    if (api.open && !open) { path = []; search = ""; show(panels[0]); }
    open = api.open;
    motion.update(open);
    cleanups = [
      spreadProps(trigger!, { ...api.getTriggerProps(), disabled: !!options.disabled,
        "data-state": options.disabled ? "disabled" : "default" }),
      spreadProps(positioner!, { ...api.getPositionerProps(), hidden: false,
        "data-state": open ? "open" : "closed", inert: !open, "aria-hidden": !open }),
      spreadProps(content!, { ...api.getContentProps(), hidden: false,
        "aria-labelledby": undefined, "aria-describedby": undefined, "aria-label": options.accessibleName }),
      ...leaves.map(leaf => spreadProps(leaf, { "aria-pressed": leaf.dataset.value === options.value,
        "data-is-selected": String(leaf.dataset.value === options.value) })),
    ];
  }
  function activate(row: HTMLElement) {
    if (row.dataset.state === "disabled" || row.matches(":disabled")) return;
    if (row.closest(".stylos-dropdown-back")) back();
    else if (row.matches(".stylos-dropdown-item-parent")) forward(row as HTMLButtonElement);
    else if (row.matches(".stylos-dropdown-item-default")) {
      options.onValueChange(row.dataset.value!);
      popover.connect(machine.service, normalizeProps).setOpen(false);
    }
  }
  function click(event: MouseEvent) {
    if (event.defaultPrevented) return;
    const row = (event.target as Element).closest<HTMLElement>(".stylos-dropdown-item");
    if (row && active.contains(row)) activate(row);
  }
  let search = "";
  let lastKey = 0;
  function keydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const row = (event.target as Element).closest<HTMLElement>(".stylos-dropdown-item");
    if (!row || !active.contains(row)) return;
    const available = rows();
    const index = available.indexOf(row);
    if (event.key === "ArrowLeft" && path.length) { event.preventDefault(); back(); return; }
    if (event.key === "ArrowRight" && row.matches(".stylos-dropdown-item-parent")) { event.preventDefault(); activate(row); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? available.length - 1
        : (index + (event.key === "ArrowDown" ? 1 : -1) + available.length) % available.length;
      available[next]?.focus();
    } else if (event.key.length === 1 && event.key !== " ") {
      const now = Date.now();
      search = now - lastKey > 500 ? event.key : search + event.key;
      lastKey = now;
      const query = [...search].every(letter => letter === search[0]) ? search[0] : search;
      const ordered = [...available.slice(index + 1), ...available.slice(0, index + 1)];
      const match = ordered.find(item => (item.dataset.label ?? item.textContent ?? "").trim().toLocaleLowerCase().startsWith(query.toLocaleLowerCase()));
      if (match) { event.preventDefault(); match.focus(); }
    }
  }
  show(active);
  content.addEventListener("click", click);
  content.addEventListener("keydown", keydown);
  render();
  const unsubscribe = machine.subscribe(render);
  machine.start();
  return {
    update(next: DropdownNavigationBehaviorOptions) {
      options = next;
      machine.updateProps(machineProps);
      if (options.disabled) popover.connect(machine.service, normalizeProps).setOpen(false);
      render();
    },
    destroy() {
      content.removeEventListener("click", click);
      content.removeEventListener("keydown", keydown);
      levelMotion.destroy(); motion.destroy(); unsubscribe(); machine.stop();
      cleanups.forEach(cleanup => cleanup());
      elements.forEach((element, i) => {
        for (const attribute of [...element.attributes]) if (!originals[i].has(attribute.name)) element.removeAttribute(attribute.name);
        for (const [name, value] of originals[i]) element.setAttribute(name, value);
      });
      anchor.replaceWith(positioner);
    },
  };
}

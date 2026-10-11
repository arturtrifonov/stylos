import { surfaceMotion } from "./surface-motion.js";
import * as select from "@zag-js/select";
import { VanillaMachine, normalizeProps, spreadProps } from "@zag-js/vanilla";

export type DropdownBehaviorOptions = {
  id: string;
  value: string;
  accessibleName: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
};

// The owner supplies the trigger and the value. This adapter supports only
// a plain single-choice panel; search and nested/staged choices need their own
// behaviour, even when they reuse the same visual panel.
export function dropdownBehavior(root: HTMLElement, options: DropdownBehaviorOptions) {
  const trigger = root.querySelector<HTMLButtonElement>("[data-dropdown-trigger] button, button[data-dropdown-trigger]");
  const positioner = root.querySelector<HTMLElement>("[data-dropdown-positioner]");
  const content = positioner?.querySelector<HTMLElement>(".stylos-dropdown-options");
  if (!trigger || !positioner || !content || positioner.querySelector(".stylos-dropdown-back, .stylos-dropdown-search, .stylos-dropdown-actions")) {
    throw new Error("dropdownBehavior needs a button trigger and a plain single-choice Dropdown panel.");
  }
  const doc = root.ownerDocument;
  const surface = positioner.querySelector<HTMLElement>(".stylos-dropdown")!;
  const anchor = doc.createComment("dropdown positioner");
  const originalTrigger = new Map([...trigger.attributes].map(a => [a.name, a.value]));
  let items: { element: HTMLElement; value: string; label: string; disabled: boolean }[] = [];
  let cleanups: (() => void)[] = [];
  function readItems() {
    items = [...content!.querySelectorAll<HTMLElement>(".stylos-dropdown-item-default")].map(element => ({
      element, value: element.dataset.value ?? "", label: element.dataset.label ?? "",
      disabled: element.dataset.state === "disabled",
    }));
    if (items.some(item => !item.value) || new Set(items.map(item => item.value)).size !== items.length) {
      throw new Error("Dropdown options need unique non-empty values.");
    }
    return select.collection({ items, itemToValue: item => item.value, itemToString: item => item.label,
      isItemDisabled: item => item.disabled });
  }
  let collection = readItems();
  positioner.before(anchor);
  doc.body.append(positioner);
  const motion = surfaceMotion(surface, positioner);
  const machineProps = () => ({
    id: options.id, collection, value: options.value ? [options.value] : [],
    disabled: options.disabled, multiple: false, closeOnSelect: true,
    getRootNode: () => doc,
    ids: { trigger: trigger.id || `dropdown-trigger-${options.id}`, content: content.id || `dropdown-options-${options.id}` },
    positioning: { placement: options.placement ?? "bottom-start", sameWidth: true,
      gutter: Number.parseFloat(doc.defaultView!.getComputedStyle(trigger).getPropertyValue("--stylos-dimension-gap-g-0_500")) },
    onValueChange: ({ value }: { value: string[] }) => options.onValueChange(value[0] ?? ""),
  });
  const machine = new VanillaMachine(select.machine, machineProps);
  function render() {
    const api = select.connect(machine.service, normalizeProps);
    const contentProps = api.getContentProps();
    motion.update(api.open);
    cleanups = [
      spreadProps(trigger!, { ...api.getTriggerProps(), "aria-labelledby": undefined, "aria-label": options.accessibleName,
        // Keep Button's native disabled styling independent of Zag's open state.
        "data-state": options.disabled ? "disabled" : "default" }),
      spreadProps(positioner!, { ...api.getPositionerProps(),
        // Keep the surface mounted for reversible fades. Closed content stops
        // participating in interaction and accessibility immediately.
        hidden: false, "data-state": api.open ? "open" : "closed",
        inert: !api.open, "aria-hidden": !api.open }),
      spreadProps(content!, { ...contentProps, hidden: false, "aria-labelledby": undefined, "aria-label": options.accessibleName,
        onkeydown(event: KeyboardEvent) {
          if (event.defaultPrevented) return;
          if (event.key === "Tab") {
            // Zag prevents Tab at the edges of content. A select-only popup
            // must instead dismiss and continue from its trigger in page order,
            // including when its panel has been portaled to the document end.
            trigger!.focus({ preventScroll: true });
            machine.send({ type: "CLOSE", restoreFocus: false });
            return;
          }
          contentProps.onkeydown?.(event);
        } }),
      ...items.map(item => spreadProps(item.element, { ...api.getItemProps({ item }),
        "data-state": item.disabled ? "disabled" : "default", "data-is-selected": String(api.value.includes(item.value)) })),
    ];
  }
  render();
  const unsubscribe = machine.subscribe(render);
  machine.start();
  const observer = new MutationObserver(records => {
    if (!records.some(record => record.type !== "attributes" || record.oldValue !== (record.target as Element).getAttribute(record.attributeName!))) return;
    collection = readItems();
    machine.updateProps(machineProps);
    render();
  });
  observer.observe(content, { childList: true, subtree: true, characterData: true,
    attributes: true, attributeOldValue: true, attributeFilter: ["data-label", "data-value", "data-state"] });
  return {
    update(next: DropdownBehaviorOptions) {
      options = next;
      collection = readItems();
      machine.updateProps(machineProps);
      if (options.disabled) machine.send({ type: "CLOSE", restoreFocus: false });
      render();
    },
    destroy() {
      observer.disconnect();
      motion.destroy();
      unsubscribe();
      machine.stop();
      for (const cleanup of cleanups) cleanup();
      for (const attribute of [...trigger.attributes]) {
        if (!originalTrigger.has(attribute.name)) trigger.removeAttribute(attribute.name);
      }
      for (const [name, value] of originalTrigger) trigger.setAttribute(name, value);
      anchor.replaceWith(positioner);
    },
  };
}

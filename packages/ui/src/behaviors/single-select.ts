import { overlayHost, onOwnerDismiss } from "./overlay-host.ts";
import { surfaceMotion } from "./surface-motion.js";
import * as select from "@zag-js/select";
import { VanillaMachine, normalizeProps, spreadProps } from "@zag-js/vanilla";

export type SingleSelectOptions = {
  id: string;
  value: string;
  accessibleName: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  name?: string;
  form?: string;
  autocomplete?: string;
  labelIds?: string;
  descriptionIds?: string;
  onLabelChange?: (label: string) => void;
  onDisabledChange?: (disabled: boolean) => void;
  oninput?: (event: Event) => void;
  onchange?: (event: Event) => void;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  /** Match the panel to the trigger's width (default). A compact trigger lets the panel size to its rows. */
  sameWidth?: boolean;
};

// The owner supplies the trigger and the value. This adapter supports only
// a plain single-choice panel; search and nested/staged choices need their own
// behaviour, even when they reuse the same visual panel.
export function singleSelectBehavior(root: HTMLElement, options: SingleSelectOptions) {
  const trigger = root.querySelector<HTMLButtonElement>("[data-dropdown-trigger] button, button[data-dropdown-trigger]");
  const positioner = root.querySelector<HTMLElement>("[data-dropdown-positioner]");
  const content = positioner?.querySelector<HTMLElement>(".stylos-dropdown-options");
  if (!trigger || !positioner || !content || content.getAttribute("role") !== "listbox" || content.querySelector("input, button") || positioner.querySelector(".stylos-dropdown-back, .stylos-dropdown-search, .stylos-dropdown-actions")) {
    throw new Error("dropdownBehavior needs a button trigger and a plain single-choice Dropdown panel.");
  }
  const doc = root.ownerDocument;
  const native = root.querySelector<HTMLSelectElement>("[data-select-native]");
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
    if (native) {
      const empty = new Option("", "");
      empty.defaultSelected = options.value === "";
      native.replaceChildren(empty, ...items.map(item => {
        const option = new Option(item.label, item.value);
        option.disabled = item.disabled;
        return option;
      }));
      native.value = options.value;
    }
    return select.collection({ items, itemToValue: item => item.value, itemToString: item => item.label,
      isItemDisabled: item => item.disabled });
  }
  let collection = readItems();
  positioner.before(anchor);
  overlayHost(trigger).append(positioner);
  const motion = surfaceMotion(surface, positioner);
  const machineProps = () => ({
    id: options.id, collection, value: options.value ? [options.value] : [],
    disabled: options.disabled, readOnly: options.readOnly, invalid: options.invalid,
    required: options.required, name: options.name, form: options.form, autoComplete: options.autocomplete, multiple: false, closeOnSelect: true,
    getRootNode: () => doc,
    ids: { hiddenSelect: native?.id, trigger: trigger.id || `dropdown-trigger-${options.id}`, content: content.id || `dropdown-options-${options.id}` },
    positioning: { placement: options.placement ?? "bottom-start", sameWidth: options.sameWidth ?? true,
      gutter: Number.parseFloat(doc.defaultView!.getComputedStyle(trigger).getPropertyValue("--stylos-dimension-gap-g-0_500")) },
    onValueChange: ({ value }: { value: string[] }) => options.onValueChange(value[0] ?? ""),
  });
  const machine = new VanillaMachine(select.machine, machineProps);
  function render() {
    const api = select.connect(machine.service, normalizeProps);
    const contentProps = api.getContentProps();
    const disabled = !!api.getTriggerProps().disabled;
    options.onDisabledChange?.(disabled);
    if (disabled && api.open) machine.send({ type: "CLOSE", restoreFocus: false });
    motion.update(api.open);
    options.onLabelChange?.(items.find(item => item.value === options.value)?.label ?? "");
    cleanups = [
      spreadProps(trigger!, { ...api.getTriggerProps(), "aria-labelledby": options.labelIds, "aria-label": options.accessibleName || undefined,
        "aria-describedby": options.descriptionIds, "aria-readonly": options.readOnly || undefined,
        // Keep Button's native disabled styling independent of Zag's open state.
        "data-state": options.disabled ? "disabled" : options.readOnly ? "read only" : "default" }),
      spreadProps(positioner!, { ...api.getPositionerProps(),
        // Keep the surface mounted for reversible fades. Closed content stops
        // participating in interaction and accessibility immediately.
        hidden: false, "data-state": api.open ? "open" : "closed",
        inert: !api.open, "aria-hidden": !api.open }),
      spreadProps(content!, { ...contentProps, hidden: false, "aria-labelledby": options.labelIds, "aria-label": options.accessibleName || undefined,
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
      ...(native ? [spreadProps(native, { ...api.getHiddenSelectProps(),
        "aria-labelledby": undefined, required: !!options.required && !options.readOnly,
        oninput(event: Event) {
          api.getHiddenSelectProps().oninput?.(event);
          options.oninput?.(event);
        },
        onchange(event: Event) {
          api.getHiddenSelectProps().onchange?.(event);
          options.onchange?.(event);
        },
        oninvalid() { trigger!.focus({ preventScroll: true }); },
      })] : []),
      ...items.map(item => spreadProps(item.element, { ...api.getItemProps({ item }),
        "data-state": item.disabled ? "disabled" : "default", "data-is-selected": String(api.value.includes(item.value)) })),
    ];
  }
  render();
  const unsubscribe = machine.subscribe(render);
  machine.start();
  const stopOwnerDismiss = onOwnerDismiss(trigger, () => select.connect(machine.service, normalizeProps).setOpen(false));

  const observer = new MutationObserver(records => {
    if (!records.some(record => record.type !== "attributes" || record.oldValue !== (record.target as Element).getAttribute(record.attributeName!))) return;
    collection = readItems();
    machine.updateProps(machineProps);
    render();
  });
  observer.observe(content, { childList: true, subtree: true, characterData: true,
    attributes: true, attributeOldValue: true, attributeFilter: ["data-label", "data-value", "data-state"] });
  return {
    update(next: SingleSelectOptions) {
      options = next;
      collection = readItems();
      machine.updateProps(machineProps);
      if (options.disabled || options.readOnly) machine.send({ type: "CLOSE", restoreFocus: false });
      render();
    },
    destroy() {
      stopOwnerDismiss();
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

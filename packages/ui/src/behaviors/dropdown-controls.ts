import * as popover from "@zag-js/popover";
import { VanillaMachine, normalizeProps, spreadProps } from "@zag-js/vanilla";
import { surfaceMotion } from "./surface-motion.js";

export type DropdownControlsBehaviorOptions = {
  id: string;
  accessibleName: string;
  disabled?: boolean;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
};

// Native controls retain their checked state, labels and form participation.
// Zag owns the non-modal popup, positioning, dismissal and focus restoration.
export function dropdownControlsBehavior(root: HTMLElement, initial: DropdownControlsBehaviorOptions) {
  let options = initial;
  const trigger = root.querySelector<HTMLButtonElement>("[data-dropdown-trigger] button, button[data-dropdown-trigger]");
  const positioner = root.querySelector<HTMLElement>("[data-dropdown-positioner]");
  const surface = positioner?.querySelector<HTMLElement>(".stylos-dropdown");
  const group = surface?.querySelector<HTMLElement>('.stylos-dropdown-options[role="group"]');
  if (!trigger || !positioner || !surface || !group || surface.querySelector('[role="option"], .stylos-dropdown-back, .stylos-dropdown-search, .stylos-dropdown-actions')) {
    throw new Error('dropdownControlsBehavior needs a button trigger and a plain Dropdown with contentRole="group" and native control rows.');
  }
  const doc = root.ownerDocument;
  const anchor = doc.createComment("dropdown controls positioner");
  const elements = [trigger, positioner, surface];
  const originalAttributes = elements.map(element => new Map([...element.attributes].map(a => [a.name, a.value])));
  positioner.before(anchor);
  doc.body.append(positioner);
  const motion = surfaceMotion(surface, positioner);
  const machineProps = () => ({
    id: options.id, getRootNode: () => doc, modal: false, portalled: true,
    ids: { trigger: trigger.id || `dropdown-controls-trigger-${options.id}`, content: `dropdown-controls-${options.id}` },
    positioning: { placement: options.placement ?? "bottom-start", sameWidth: true,
      gutter: Number.parseFloat(doc.defaultView!.getComputedStyle(trigger).getPropertyValue("--stylos-dimension-gap-g-0_500")) },
  });
  const machine = new VanillaMachine(popover.machine, machineProps);
  let cleanups: (() => void)[] = [];
  function render() {
    const api = popover.connect(machine.service, normalizeProps);
    motion.update(api.open);
    cleanups = [
      spreadProps(trigger!, { ...api.getTriggerProps(), disabled: !!options.disabled,
        "data-state": options.disabled ? "disabled" : "default" }),
      spreadProps(positioner!, { ...api.getPositionerProps(), hidden: false,
        "data-state": api.open ? "open" : "closed", inert: !api.open, "aria-hidden": !api.open }),
      spreadProps(surface!, { ...api.getContentProps(), hidden: false,
        "aria-labelledby": undefined, "aria-describedby": undefined, "aria-label": options.accessibleName }),
    ];
  }
  render();
  const unsubscribe = machine.subscribe(render);
  machine.start();
  return {
    update(next: DropdownControlsBehaviorOptions) {
      options = next;
      machine.updateProps(machineProps);
      if (options.disabled) popover.connect(machine.service, normalizeProps).setOpen(false);
      render();
    },
    destroy() {
      motion.destroy();
      unsubscribe();
      machine.stop();
      for (const cleanup of cleanups) cleanup();
      elements.forEach((element, i) => {
        for (const attribute of [...element.attributes]) {
          if (!originalAttributes[i].has(attribute.name)) element.removeAttribute(attribute.name);
        }
        for (const [name, value] of originalAttributes[i]) element.setAttribute(name, value);
      });
      anchor.replaceWith(positioner);
    },
  };
}

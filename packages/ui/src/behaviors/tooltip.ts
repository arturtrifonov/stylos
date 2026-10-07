import * as tooltip from "@zag-js/tooltip";
import { VanillaMachine, normalizeProps, spreadProps } from "@zag-js/vanilla";

type Options = { id: string; placement: "top" | "bottom" | "left" | "right" };

// The Svelte wrapper supplies elements and lifecycle; Zag owns interaction.
export function tooltipBehavior(root: HTMLElement, options: Options) {
  const positioner = root.querySelector<HTMLElement>(".stylos-tooltip-positioner")!;
  const content = positioner.querySelector<HTMLElement>(".stylos-tooltip")!;
  const trigger = root.firstElementChild as HTMLElement;
  if (!trigger || trigger === positioner || root.children.length !== 2) {
    throw new Error("Tooltip needs one trigger element as its child.");
  }

  const doc = root.ownerDocument;
  const contentId = `stylos-tooltip-${options.id}`;
  const originalAttributes = new Map<string, string | null>();
  let cleanTrigger = () => {};
  let cleanPositioner = () => {};
  let cleanContent = () => {};

  // Escape clipping ancestors; return the node before Svelte unmounts it.
  doc.body.append(positioner);
  const machineProps = () => ({
    id: options.id,
    ids: { trigger: trigger.id || `stylos-tooltip-trigger-${options.id}`, content: contentId },
    getRootNode: () => doc,
    // Zag uses "interactive" for hover retention; content stays text-only.
    interactive: true,
    // Behavioural waits are independent from the Motion transition durations.
    openDelay: 400,
    closeDelay: 150,
    positioning: {
      placement: options.placement,
      gutter: Number.parseFloat(
        doc.defaultView!.getComputedStyle(trigger).getPropertyValue("--stylos-dimension-gap-g-0_500"),
      ),
    },
  });
  const machine = new VanillaMachine(tooltip.machine, machineProps);

  function render() {
    const api = tooltip.connect(machine.service, normalizeProps);
    const triggerProps = api.getTriggerProps();
    for (const key of Object.keys(triggerProps)) {
      if (!key.startsWith("on") && !originalAttributes.has(key)) {
        originalAttributes.set(key, trigger.getAttribute(key));
      }
    }
    if (!originalAttributes.has("aria-describedby")) {
      originalAttributes.set("aria-describedby", trigger.getAttribute("aria-describedby"));
    }
    const descriptions = (trigger.getAttribute("aria-describedby") ?? "")
      .split(/\s+/).filter((id) => id && id !== contentId);
    if (api.open) descriptions.push(contentId);
    cleanTrigger = spreadProps(trigger, {
      ...triggerProps,
      "aria-describedby": descriptions.join(" ") || undefined,
      onpointerleave(event: PointerEvent) {
        // Pointer departure must not remove a keyboard-focused description.
        if (!trigger.contains(doc.activeElement)) triggerProps.onpointerleave?.(event);
      },
      onfocusout(event: FocusEvent) {
        triggerProps.onfocusout?.(event);
        // A guarded pointer departure can precede Escape/blur. Reset that
        // hover cycle once focus leaves so the next pointer entry can open.
        if (!trigger.contains(event.relatedTarget as Node | null)) {
          machine.send({ type: "pointer.leave" });
        }
      },
    });
    cleanPositioner = spreadProps(positioner, api.getPositionerProps());
    const contentProps = api.getContentProps();
    cleanContent = spreadProps(content, {
      ...contentProps,
      // Keep the surface mounted so CSS can reverse interrupted fades.
      hidden: false,
      "aria-hidden": !api.open,
      style: { pointerEvents: api.open ? "auto" : "none" },
      onpointerleave(event: PointerEvent) {
        if (!trigger.contains(doc.activeElement)) contentProps.onpointerleave?.(event);
      },
    });
  }

  render();
  const unsubscribe = machine.subscribe(render);
  machine.start();

  // Zag's closing grace state does not track Escape. Dismiss it there too.
  const dismissClosing = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !event.isComposing && machine.service.state.matches("closing")) {
      tooltip.connect(machine.service, normalizeProps).setOpen(false);
    }
  };
  doc.addEventListener("keydown", dismissClosing, true);

  return {
    update(next: Options) {
      options = next;
      machine.updateProps(machineProps);
      const api = tooltip.connect(machine.service, normalizeProps);
      if (api.open) api.reposition({ placement: options.placement });
    },
    destroy() {
      unsubscribe();
      doc.removeEventListener("keydown", dismissClosing, true);
      machine.stop();
      cleanTrigger();
      cleanPositioner();
      cleanContent();
      for (const [key, value] of originalAttributes) {
        if (value === null) trigger.removeAttribute(key);
        else trigger.setAttribute(key, value);
      }
      root.append(positioner);
    },
  };
}

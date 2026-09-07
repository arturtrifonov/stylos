<script lang="ts">
  // Tooltip — docs/components/registry/tooltip.yaml. The wrapper takes the
  // contract's props and writes the data attributes tooltip.css reads; it is
  // the only Svelte-specific file in the component (ADR 0002).
  //
  // A slab of text and nothing else. The entry's `html` is "no semantic
  // html", and its limitations say so outright: nothing here is interactive,
  // nothing dismisses it, it has no state and no way to be pinned open. A
  // tooltip that needs any of those is a Popover.
  //
  // The behaviour is not missing, it is assigned. Three `requires` findings
  // put it on whoever places this: tie it to the control it describes, so the
  // description reaches assistive technology as part of that control; show it
  // on keyboard focus and not only under the pointer, and keep it while the
  // reader moves onto it; and never let anything live only here, because it
  // is unavailable on touch and gone the moment attention moves. The
  // association wants an id, which the consumer puts on a wrapper — this
  // element takes only the contract's props.
  //
  // ADR 0002 classes Tooltip among the pattern components a behaviour library
  // covers, and that classification is about what a product's tooltip needs
  // rather than about this component: nothing in the contract is a state
  // machine, so nothing here takes a dependency.
  import "./tooltip.css";
  import type { TooltipProps } from "./props.ts";

  let {
    tooltipText = "Tooltip text",
    type = "string",
    tone = "base",
    size = "medium",
  }: TooltipProps = $props();
</script>

<div class="stylos-tooltip" data-type={type} data-tone={tone} data-size={size}>{tooltipText}</div>

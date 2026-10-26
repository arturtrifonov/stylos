<script module lang="ts">
  const expandIcons = {
    chevron: ["expand_more", "expand_less"],
    plus: ["add", "remove"],
    dropdown: ["arrow_drop_down", "arrow_drop_up"],
  } as const;
</script>

<script lang="ts">
  import "./accordion-header.css";
  import Icon from "../icon/Icon.svelte";
  import type { AccordionHeaderProps } from "./props.ts";
  let { size = "extra small", state = "default", isExpanded = $bindable(false),
    expandIconPosition = "leading", expandIcon = "chevron", labelText = "Accordion title", hasIcon = false,
    icon, id, controls, onclick }: AccordionHeaderProps = $props();
  const supplied = $derived(hasIcon ? icon : undefined);
</script>

<button type="button" class="stylos-accordion-header" {id}
  data-size={size} data-state={state} data-is-expanded={isExpanded} data-expand-icon-position={expandIconPosition} data-expand-icon={expandIcon}
  disabled={state === "disabled"} aria-expanded={isExpanded} aria-controls={controls}
  onclick={event => { isExpanded = !isExpanded; onclick?.(event); }}>
  <Icon name={expandIcons[expandIcon][isExpanded ? 1 : 0]} />
  {@render supplied?.()}
  <span class="stylos-accordion-title">{labelText}</span>
</button>

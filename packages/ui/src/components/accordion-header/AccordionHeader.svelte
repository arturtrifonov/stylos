<script lang="ts">
  import "./accordion-header.css";
  import Icon from "../icon/Icon.svelte";
  import type { AccordionHeaderProps } from "./props.ts";
  let { size = "extra small", state = "default", isExpanded = $bindable(false),
    expandIconPosition = "leading", labelText = "Accordion title", hasIcon = false,
    icon, id, controls, onclick }: AccordionHeaderProps = $props();
</script>

<button type="button" class="stylos-accordion-header" {id}
  data-size={size} data-state={state} data-is-expanded={isExpanded} data-expand-icon-position={expandIconPosition}
  disabled={state === "disabled"} aria-expanded={isExpanded} aria-controls={controls}
  onclick={event => { isExpanded = !isExpanded; onclick?.(event); }}>
  <span class="stylos-accordion-chevron" aria-hidden="true"><Icon name={isExpanded ? "expand_less" : "expand_more"} /></span>
  {#if hasIcon && icon}<span class="stylos-accordion-icon" aria-hidden="true">{@render icon()}</span>{/if}
  <span class="stylos-accordion-title">{labelText}</span>
</button>

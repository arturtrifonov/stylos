<script lang="ts">
  import "./accordion.css";
  import AccordionHeader from "../accordion-header/AccordionHeader.svelte";
  import type { AccordionProps } from "./props.ts";
  let { size = "extra small", state = "default", isExpanded = $bindable(false),
    expandIconPosition = "trailing", labelText = "Accordion title", hasIcon = false,
    icon, children, id, onchange }: AccordionProps = $props();
  const instanceId = $props.id();
  const base = $derived(id ?? `accordion-${instanceId}`);
</script>

<section class="stylos-accordion" data-size={size} data-state={state}
  data-is-expanded={isExpanded} data-expand-icon-position={expandIconPosition} aria-labelledby={`${base}-heading`}>
  <AccordionHeader {size} {state} bind:isExpanded {expandIconPosition} {labelText} {hasIcon} {icon}
    id={`${base}-heading`} controls={`${base}-body`} onclick={event => onchange?.(event)} />
  <div class="stylos-accordion-body" id={`${base}-body`} hidden={!isExpanded}>
    {@render children?.()}
  </div>
</section>

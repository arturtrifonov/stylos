<script lang="ts">
  import { Accordion, Button, Icon, InputText } from "@stylos/ui";
  import type { AccordionProps } from "@stylos/ui";
  let { size = "medium", expandIconPosition = "trailing", expandIcon = "chevron", hasIcon = false }: AccordionProps = $props();
  let value = $state("");
  let changes = $state(0);
</script>

{#snippet mark()}<Icon name="add" />{/snippet}

<div class="review">
  <Accordion id="accordion-review" {size} {expandIconPosition} {expandIcon} {hasIcon} icon={mark}
    headingLevel="2" labelText="Workspace settings" onchange={() => { changes++; }}>
    <InputText labelText="Workspace name" bind:value />
  </Accordion>
  <Accordion id="accordion-disabled" {size} state="disabled" labelText="Unavailable section">
    <InputText labelText="Unavailable field" />
  </Accordion>
  <div dir="rtl">
    <Accordion id="accordion-rtl" {size} {expandIconPosition} {expandIcon} labelText="RTL section">
      <p>Content follows the surrounding writing direction.</p>
    </Accordion>
  </div>
  <Button labelText="After accordions" />
  <p role="status">Disclosure changes: {changes}</p>
</div>

<style>
  .review { width: 24rem; max-width: 100%; }
  .review > :global(:not(.stylos-accordion)) { margin-block-start: var(--stylos-dimension-gap-g-1_500); }
</style>

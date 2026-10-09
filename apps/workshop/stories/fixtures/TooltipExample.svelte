<script lang="ts">
  import { Tooltip } from "@stylos/ui";
  import type { TooltipProps } from "@stylos/ui";

  let { ...args }: TooltipProps = $props();
  const id = $props.id();
  const helpId = `tooltip-help-${id}`;
</script>

<div class="example">
  <Tooltip {...args}>
    <button type="button" aria-describedby={helpId}>Hover or focus me</button>
  </Tooltip>
  <span id={helpId} class="help">A short description is available on hover or keyboard focus.</span>
</div>

<style>
  .example {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: var(--stylos-dimension-gap-g-1_000);
    padding: calc(4 * var(--stylos-dimension-gap-g-1_000));
  }

  .help {
    font-family: var(--stylos-font-family-normal);
    font-size: var(--stylos-font-size-0_750);
    color: var(--stylos-color-text-secondary);
  }

  button {
    font-family: var(--stylos-font-family-normal);
    font-size: var(--stylos-font-size-0_875);
    color: var(--stylos-color-text-base);
    background-color: var(--stylos-color-background-base);
    border: var(--stylos-border-width-normal) solid var(--stylos-color-border-secondary);
    border-radius: var(--stylos-radius-small);
    padding-block: var(--stylos-dimension-gap-g-0_625);
    padding-inline: var(--stylos-dimension-gap-g-1_250);
  }

  button:focus-visible {
    outline: var(--stylos-border-width-normal) solid var(--stylos-color-text-base);
    outline-offset: var(--stylos-dimension-gap-g-0_250);
  }
</style>

<script lang="ts">
  import "./tooltip.css";
  import { tooltipBehavior } from "../../behaviors/tooltip.ts";
  import type { TooltipProps } from "./props.ts";

  let {
    children,
    tooltipText = "Tooltip text",
    type = "string",
    tone = "base",
    size = "medium",
    placement = "bottom",
    contentWidth = "auto",
  }: TooltipProps = $props();
  const id = $props.id();
</script>

{#if children}
  <span class="stylos-tooltip-root" use:tooltipBehavior={{ id, placement }}>
    {@render children()}
    <span class="stylos-tooltip-positioner">
      <span
        class="stylos-tooltip"
        data-type={type}
        data-tone={tone}
        data-size={size}
        data-state="closed"
        aria-hidden="true"
        style:--_stylos-tooltip-width={contentWidth}
      >{tooltipText}</span>
    </span>
  </span>
{/if}

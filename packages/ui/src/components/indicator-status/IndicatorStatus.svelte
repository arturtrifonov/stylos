<script lang="ts">
  // Indicator Status — docs/components/registry/indicator-status.yaml. The
  // wrapper takes the contract's props and writes the data attributes
  // indicator-status.css reads; it is the only Svelte-specific file in the
  // component (ADR 0002).
  //
  // Not interactive, no content, no accessible name of its own — colour is
  // the only thing that differs between values, so whatever it marks must
  // also state the condition without colour (the entry's `requires` finding
  // is the consumer's obligation).
  import "./indicator-status.css";
  import type { IndicatorStatusProps } from "./props.ts";

  let { tone = "primary", size = "medium" }: IndicatorStatusProps = $props();
</script>

<span class="stylos-indicator-status" data-tone={tone} data-size={size}></span>

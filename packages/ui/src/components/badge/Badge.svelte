<script lang="ts">
  // Badge — docs/components/registry/badge.yaml. The wrapper takes the
  // contract's props and writes the data attributes badge.css reads; it is
  // the only Svelte-specific file in the component (ADR 0002).
  //
  // Not interactive, no state property, no accessible name of its own — the
  // context that supplies the count's subject supplies the name too (the
  // entry's `requires` findings are the consumer's obligations).
  import "./badge.css";
  import type { BadgeProps } from "./props.ts";

  let { numberText = "1", tone = "base", size = "medium" }: BadgeProps = $props();
</script>

<span class="stylos-badge" data-tone={tone} data-size={size}>{numberText}</span>

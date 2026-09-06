<script lang="ts">
  // Indicator Special — docs/components/registry/indicator-special.yaml. The
  // wrapper takes the contract's props and writes the data attributes
  // indicator-special.css reads; it is the only Svelte-specific file in the
  // component (ADR 0002).
  //
  // Not interactive, no content, no accessible name of its own — a hue alone
  // identifies nothing, so whatever it marks must also name the category
  // without colour (the entry's `requires` finding is the consumer's
  // obligation).
  import "./indicator-special.css";
  import type { IndicatorSpecialProps } from "./props.ts";

  let { tone = "slate", size = "medium" }: IndicatorSpecialProps = $props();
</script>

<span class="stylos-indicator-special" data-tone={tone} data-size={size}></span>

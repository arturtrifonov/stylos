<script lang="ts">
  // Loader — docs/components/registry/loader.yaml. The wrapper takes the
  // contract's props and writes the data attributes loader.css reads; it is
  // the only Svelte-specific file in the component (ADR 0002).
  //
  // `angle` is the phase the turn starts from, never a resting position —
  // the CSS animates from it, so no value places a stopped loader. The spin
  // conveys nothing to a screen reader: announcing the waiting state and
  // marking the busy region are the consumer's obligations (the entry's
  // `requires` findings); reduced motion is handled in the CSS.
  import "./loader.css";
  import type { LoaderProps } from "./props.ts";

  let { angle = "0" }: LoaderProps = $props();
</script>

<span class="stylos-loader" data-angle={angle}></span>

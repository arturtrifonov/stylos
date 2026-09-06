<script lang="ts">
  // Loader — docs/components/registry/loader.yaml. No props: the contract
  // has no properties — the animation is the component, not a setting, and
  // another size is width/height in CSS rather than a parameter. The spin
  // conveys nothing to a screen reader: announcing the waiting state and
  // marking the busy region are the consumer's obligations (the entry's
  // `requires` findings); reduced motion is handled in the CSS.
  import "./loader.css";
</script>

<span class="stylos-loader"></span>

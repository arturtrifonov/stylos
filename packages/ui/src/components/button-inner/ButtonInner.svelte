<script lang="ts">
  import "./button-inner.css";
  import type { ButtonInnerProps } from "./props.ts";

  let {
    icon, state = "default", accessibleName = "", id,
    descriptionIds = "", onclick,
  }: ButtonInnerProps = $props();
</script>

<button
  type="button"
  {id}
  {onclick}
  class="stylos-button-inner"
  data-state={state}
  disabled={state === "disabled"}
  aria-label={accessibleName || undefined}
  aria-describedby={descriptionIds || undefined}
>
  {#if icon}
    <span class="stylos-button-inner-icon" aria-hidden="true">{@render icon()}</span>
  {/if}
</button>

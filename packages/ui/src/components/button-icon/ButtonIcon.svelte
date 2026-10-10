<script lang="ts">
  import "./button-icon.css";
  import type { ButtonIconProps } from "./props.ts";

  let {
    variant = "base", tone = "primary", size = "medium", state = "default", icon,
    accessibleName = "", type = "button", id, name = "", value = "", form = "",
    descriptionIds = "", onclick,
  }: ButtonIconProps = $props();
</script>

<button
  {type}
  {id}
  name={name || undefined}
  {value}
  form={form || undefined}
  aria-label={accessibleName || undefined}
  aria-describedby={descriptionIds || undefined}
  {onclick}
  class={`stylos-button-icon stylos-button-${variant}`}
  data-variant={variant}
  data-tone={tone}
  data-size={size}
  data-state={state}
  disabled={state === "disabled"}
>
  {#if icon}
    <span class="stylos-button-icon-mark" aria-hidden="true">{@render icon()}</span>
  {/if}
</button>

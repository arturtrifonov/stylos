<script lang="ts">
  import "./button.css";
  import type { ButtonProps } from "./props.ts";

  let {
    variant = "base", tone = "primary", size = "medium", state = "default", labelText = "Button",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
    type = "button", id, name = "", value = "", form = "", descriptionIds = "", onclick,
  }: ButtonProps = $props();
</script>

<button
  {type}
  {id}
  name={name || undefined}
  {value}
  form={form || undefined}
  aria-describedby={descriptionIds || undefined}
  {onclick}
  class={`stylos-button stylos-button-${variant}`}
  data-variant={variant}
  data-tone={tone}
  data-size={size}
  data-state={state}
  disabled={state === "disabled"}
>
  {#if hasLeadingIcon && leadingIcon}
    <span class={`stylos-button-${variant}-icon`} data-position="leading" aria-hidden="true">{@render leadingIcon()}</span>
  {/if}
  <span>{labelText}</span>
  {#if hasTrailingIcon && trailingIcon}
    <span class={`stylos-button-${variant}-icon`} data-position="trailing" aria-hidden="true">{@render trailingIcon()}</span>
  {/if}
</button>

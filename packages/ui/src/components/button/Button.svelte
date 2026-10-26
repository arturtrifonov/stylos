<script lang="ts">
  import "./button.css";
  import type { ButtonProps } from "./props.ts";

  let {
    variant = "base", tone = "primary", size = "medium", state = "default", labelText = "Button",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
    type = "button", id, name = "", value = "", form = "", descriptionIds = "", onclick,
  }: ButtonProps = $props();
  const leading = $derived(hasLeadingIcon ? leadingIcon : undefined);
  const trailing = $derived(hasTrailingIcon ? trailingIcon : undefined);
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
  data-surface-layer={variant === "ghost" ? "0" : "1"}
  data-surface-attachment="in-layout"
  data-variant={variant}
  data-tone={tone}
  data-size={size}
  data-state={state}
  disabled={state === "disabled"}
  data-leading-icon={leading ? "" : undefined}
  data-trailing-icon={trailing ? "" : undefined}
>{@render leading?.()}{labelText}{@render trailing?.()}</button>

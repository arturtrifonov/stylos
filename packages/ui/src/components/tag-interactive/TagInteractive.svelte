<script lang="ts">
  import "./tag-interactive.css";
  import type { TagInteractiveProps } from "./props.ts";

  let {
    variant = "fill", tone = "base", size = "medium", textCase = "uppercase", state = "default", labelText = "Tag",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
    type = "button", id, name = "", value = "", form = "", descriptionIds = "", onclick,
  }: TagInteractiveProps = $props();
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
  class={`stylos-tag-interactive stylos-tag-interactive-${variant}`}
  data-variant={variant}
  data-tone={tone}
  data-size={size}
  data-text-case={textCase}
  data-state={state}
  disabled={state === "disabled"}
  data-leading-icon={leading ? "" : undefined}
  data-trailing-icon={trailing ? "" : undefined}
>{@render leading?.()}<span class="stylos-tag-label">{labelText}</span>{@render trailing?.()}</button>

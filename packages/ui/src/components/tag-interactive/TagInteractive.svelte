<script lang="ts">
  import "./tag-interactive.css";
  import type { TagInteractiveProps } from "./props.ts";

  let {
    variant = "fill", tone = "base", size = "medium", textCase = "uppercase", state = "default", labelText = "Tag",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
    type = "button", id, name = "", value = "", form = "", descriptionIds = "", onclick,
  }: TagInteractiveProps = $props();
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
>
  {#if hasLeadingIcon && leadingIcon}
    <span class="stylos-tag-icon" data-position="leading" aria-hidden="true">{@render leadingIcon()}</span>
  {/if}
  <span class="stylos-tag-label">{labelText}</span>
  {#if hasTrailingIcon && trailingIcon}
    <span class="stylos-tag-icon" data-position="trailing" aria-hidden="true">{@render trailingIcon()}</span>
  {/if}
</button>

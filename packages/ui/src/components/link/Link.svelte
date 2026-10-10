<script lang="ts">
  import "./link.css";
  import type { LinkProps } from "./props.ts";

  let {
    tone = "primary",
    size = "medium",
    state = "default",
    hasLeadingIcon = false,
    leadingIcon,
    hasTrailingIcon = false,
    trailingIcon,
    labelText = "Link",
    href = "#",
  }: LinkProps = $props();

  const disabled = $derived(state === "disabled");
</script>

<a
  class="stylos-link"
  data-tone={tone}
  data-size={size}
  data-state={state}
  href={disabled ? undefined : href}
  role={disabled ? "link" : undefined}
  aria-disabled={disabled ? "true" : undefined}
  tabindex={disabled ? -1 : undefined}
>
  {#if hasLeadingIcon && leadingIcon}
    <span class="stylos-link-icon" aria-hidden="true">{@render leadingIcon()}</span>
  {/if}
  <span class="stylos-link-label">{labelText}</span>
  {#if hasTrailingIcon && trailingIcon}
    <span class="stylos-link-icon" aria-hidden="true">{@render trailingIcon()}</span>
  {/if}
</a>

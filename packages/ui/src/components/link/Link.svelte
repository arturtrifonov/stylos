<script lang="ts">
  import "./link.css";
  import type { LinkProps } from "./props.ts";

  let {
    tone = "primary",
    size = "medium",
    state = "default",
    hasExpandedHitArea = false,
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
  data-has-expanded-hit-area={hasExpandedHitArea}
  href={disabled ? undefined : href}
  role={disabled ? "link" : undefined}
  aria-disabled={disabled ? "true" : undefined}
  tabindex={disabled ? -1 : undefined}
>
  <span class="stylos-link-content">
    {#if hasLeadingIcon && leadingIcon}
      {@render leadingIcon()}
    {/if}
    {labelText}
    {#if hasTrailingIcon && trailingIcon}
      {@render trailingIcon()}
    {/if}
  </span>
</a>

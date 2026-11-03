<script lang="ts">
  import "./tag.css";
  import type { TagProps } from "./props.ts";

  let {
    variant = "fill", tone = "base", size = "medium", textCase = "uppercase", labelText = "Tag",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
  }: TagProps = $props();
  const leading = $derived(hasLeadingIcon ? leadingIcon : undefined);
  const trailing = $derived(hasTrailingIcon ? trailingIcon : undefined);
</script>

<span class={`stylos-tag stylos-tag-${variant}`} data-variant={variant} data-tone={tone} data-size={size} data-text-case={textCase}
  data-leading-icon={leading ? "" : undefined} data-trailing-icon={trailing ? "" : undefined}>{@render leading?.()}<span class="stylos-tag-label">{labelText}</span>{@render trailing?.()}</span>

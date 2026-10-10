<script lang="ts">
  import "./tag-fill.css";
  import type { TagFillProps } from "./props.ts";

  let {
    tone = "base", size = "medium", textCase = "uppercase", labelText = "Tag",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
  }: TagFillProps = $props();
</script>

<span class="stylos-tag-fill" data-tone={tone} data-size={size} data-text-case={textCase}>
  {#if hasLeadingIcon && leadingIcon}
    <span class="stylos-tag-icon" data-position="leading" aria-hidden="true">{@render leadingIcon()}</span>
  {/if}
  <span class="stylos-tag-label">{labelText}</span>
  {#if hasTrailingIcon && trailingIcon}
    <span class="stylos-tag-icon" data-position="trailing" aria-hidden="true">{@render trailingIcon()}</span>
  {/if}
</span>

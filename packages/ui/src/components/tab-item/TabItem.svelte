<script lang="ts">
  import { getContext } from "svelte";
  import { tabsContext, type SelectionContext } from "../../internal/selection-context.ts";
  import Badge from "../badge/Badge.svelte";
  import "./tab-item.css";
  import type { TabItemProps } from "./props.ts";
  let { size = "extra small", state = "default", value = "tab", labelText = "Tab item", id, controls,
    hasBadge = false, numberText = "1", hasLeadingIcon = false, leadingIcon,
    hasTrailingIcon = false, trailingIcon }: TabItemProps = $props();
  const group = getContext<SelectionContext | undefined>(tabsContext);
  const actualSize = $derived(group?.size() ?? size);
  const selected = $derived(group?.value() === value);
</script>

<button type="button" role="tab" class="stylos-tab-item" {id} aria-controls={controls}
  aria-selected={selected} tabindex={selected ? 0 : -1} disabled={state === "disabled"}
  data-size={actualSize} data-state={state} data-is-selected={selected}
  onclick={event => group?.select(value, event)}>
  <span class="stylos-tab-label">
    {#if hasLeadingIcon && leadingIcon}<span class="stylos-selection-icon" aria-hidden="true">{@render leadingIcon()}</span>{/if}
    {labelText}
    {#if hasBadge}<Badge size="extra small" {numberText} />{/if}
    {#if hasTrailingIcon && trailingIcon}<span class="stylos-selection-icon" aria-hidden="true">{@render trailingIcon()}</span>{/if}
  </span>
</button>

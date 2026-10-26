<script lang="ts">
  import { getContext } from "svelte";
  import { tabsContext, type SelectionContext } from "../../internal/selection-context.ts";
  import Badge from "../badge/Badge.svelte";
  import "./tab-item-icon.css";
  import type { TabItemIconProps } from "./props.ts";
  let { size = "medium", state = "default", value = "tab", accessibleName = "", id, controls,
    hasBadge = false, numberText = "1", icon }: TabItemIconProps = $props();
  const group = getContext<SelectionContext | undefined>(tabsContext);
  const actualSize = $derived(group?.size() ?? size);
  const selected = $derived(group?.value() === value);
  $effect(() => group?.register?.(() => ({ value, label: accessibleName, disabled: state === "disabled", icon })));
</script>

<button type="button" role="tab" class="stylos-tab-item stylos-tab-item-icon" {id} aria-controls={controls}
  aria-label={accessibleName || undefined} aria-selected={selected} tabindex={selected ? 0 : -1}
  disabled={state === "disabled"} data-size={actualSize} data-state={state} data-value={value}
  onclick={event => group?.select(value, event)}>
  {@render icon?.()}{#if hasBadge}<Badge size={actualSize} {numberText}
    tone={state === "disabled" ? "disabled" : selected ? "primary" : "base"} />{/if}
</button>

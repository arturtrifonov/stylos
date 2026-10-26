<script lang="ts">
  import { getContext } from "svelte";
  import { tabsContext, type SelectionContext } from "../../internal/selection-context.ts";
  import Badge from "../badge/Badge.svelte";
  import "./tab-item.css";
  import type { TabItemProps } from "./props.ts";
  let { size = "medium", state = "default", value = "tab", labelText = "Tab item", id, controls,
    hasBadge = false, numberText = "1", hasLeadingIcon = false, leadingIcon,
    hasTrailingIcon = false, trailingIcon }: TabItemProps = $props();
  const group = getContext<SelectionContext | undefined>(tabsContext);
  const actualSize = $derived(group?.size() ?? size);
  const selected = $derived(group?.value() === value);
  const leading = $derived(hasLeadingIcon ? leadingIcon : undefined);
  const trailing = $derived(hasTrailingIcon ? trailingIcon : undefined);
  $effect(() => group?.register?.(() => ({ value, label: labelText, disabled: state === "disabled", icon: leading })));
</script>

<button type="button" role="tab" class="stylos-tab-item" {id} aria-controls={controls}
  aria-selected={selected} tabindex={selected ? 0 : -1} disabled={state === "disabled"}
  data-size={actualSize} data-state={state} data-value={value}
  data-leading-icon={leading ? "" : undefined} data-trailing-icon={trailing ? "" : undefined}
  onclick={event => group?.select(value, event)}>
  {@render leading?.()}{labelText}{#if hasBadge}<Badge size={actualSize} {numberText}
    tone={state === "disabled" ? "disabled" : selected ? "primary" : "base"} />{/if}{@render trailing?.()}
</button>

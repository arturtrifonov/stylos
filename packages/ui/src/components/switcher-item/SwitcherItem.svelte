<script lang="ts">
  import { getContext } from "svelte";
  import { switcherContext, type SelectionContext } from "../../internal/selection-context.ts";
  import "./switcher-item.css";
  import type { SwitcherItemProps } from "./props.ts";
  let { size = "extra small", tone = "base", state = "default", value = "option", labelText = "Option",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon }: SwitcherItemProps = $props();
  const group = getContext<SelectionContext | undefined>(switcherContext);
  const actualSize = $derived(group?.size() ?? size);
  const actualTone = $derived(group?.tone?.() ?? tone);
  const selected = $derived(group?.value() === value);
</script>

<label class="stylos-switcher-item" data-size={actualSize} data-tone={actualTone} data-state={state} data-is-selected={selected}>
  <input type="radio" name={group?.name?.()} form={group?.form?.()} {value} checked={selected}
    disabled={state === "disabled"} onchange={event => group?.select(value, event)} />
  {#if hasLeadingIcon && leadingIcon}<span class="stylos-selection-icon" aria-hidden="true">{@render leadingIcon()}</span>{/if}
  <span>{labelText}</span>
  {#if hasTrailingIcon && trailingIcon}<span class="stylos-selection-icon" aria-hidden="true">{@render trailingIcon()}</span>{/if}
</label>

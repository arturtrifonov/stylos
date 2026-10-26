<script lang="ts">
  import { getContext } from "svelte";
  import { switcherContext, type SelectionContext } from "../../internal/selection-context.ts";
  import "./switcher-item-icon.css";
  import type { SwitcherItemIconProps } from "./props.ts";
  let { size = "medium", tone = "base", state = "default", value = "option", accessibleName = "",
    icon }: SwitcherItemIconProps = $props();
  const group = getContext<SelectionContext | undefined>(switcherContext);
  const actualSize = $derived(group?.size() ?? size);
  const actualTone = $derived(group?.tone?.() ?? tone);
</script>

<label class="stylos-switcher-item stylos-switcher-item-icon" data-size={actualSize} data-tone={actualTone} data-state={state}>
  <input type="radio" name={group?.name?.()} form={group?.form?.()} {value} checked={group?.value() === value}
    aria-label={accessibleName || undefined} disabled={state === "disabled"} onchange={event => group?.select(value, event)} />
  {@render icon?.()}
</label>

<script lang="ts">
  import { getContext } from "svelte";
  import { switcherContext, type SelectionContext } from "../../internal/selection-context.ts";
  import "./switcher-item.css";
  import type { SwitcherItemProps } from "./props.ts";
  let { size = "medium", tone = "base", state = "default", value = "option", labelText = "Option",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon }: SwitcherItemProps = $props();
  const group = getContext<SelectionContext | undefined>(switcherContext);
  const actualSize = $derived(group?.size() ?? size);
  const actualTone = $derived(group?.tone?.() ?? tone);
  const leading = $derived(hasLeadingIcon ? leadingIcon : undefined);
  const trailing = $derived(hasTrailingIcon ? trailingIcon : undefined);
</script>

<label class="stylos-switcher-item" data-size={actualSize} data-tone={actualTone} data-state={state}
  data-leading-icon={leading ? "" : undefined} data-trailing-icon={trailing ? "" : undefined}>
  <input type="radio" name={group?.name?.()} form={group?.form?.()} {value} checked={group?.value() === value}
    disabled={state === "disabled"} onchange={event => group?.select(value, event)} />
  {@render leading?.()}{labelText}{@render trailing?.()}
</label>

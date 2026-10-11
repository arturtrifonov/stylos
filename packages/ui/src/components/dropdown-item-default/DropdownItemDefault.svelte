<script lang="ts">
  import { getContext } from "svelte";
  import { dropdownSizeContext } from "../dropdown/context.ts";
  import "./dropdown-item-default.css";
  import Icon from "../icon/Icon.svelte";
  import type { DropdownItemDefaultProps } from "./props.ts";
  let { size, state = "default", isSelected = "false", value = "",
    hasIcon = false, icon, labelText = "Option", hasAdditionalText = false,
    additionalText = "Additional" }: DropdownItemDefaultProps = $props();
  const panelSize = getContext<() => DropdownItemDefaultProps["size"]>(dropdownSizeContext);
  const resolvedSize = $derived(panelSize?.() ?? size ?? "medium");
</script>

<li class="stylos-dropdown-item-default" role="option" data-size={resolvedSize}
  data-state={state} data-value={value} data-label={labelText}
  data-is-selected={isSelected} data-disabled={state === "disabled" ? "" : undefined}
  aria-selected={isSelected === "true"} aria-disabled={state === "disabled" ? "true" : undefined}>
  {#if hasIcon && icon}<span class="stylos-dropdown-item-leading" aria-hidden="true">{@render icon()}</span>{/if}
  <span class="stylos-dropdown-item-content">
    <span class="stylos-dropdown-item-label">{labelText}</span>
    {#if hasAdditionalText}<span class="stylos-dropdown-item-additional">{additionalText}</span>{/if}
  </span>
  <span class="stylos-dropdown-item-selected" aria-hidden="true"><Icon name="check" /></span>
</li>

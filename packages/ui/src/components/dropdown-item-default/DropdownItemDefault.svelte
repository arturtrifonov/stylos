<script lang="ts">
  import { getContext } from "svelte";
  import { dropdownSizeContext } from "../dropdown/context.ts";
  import "./dropdown-item-default.css";
  import Icon from "../icon/Icon.svelte";
  import type { DropdownItemDefaultProps } from "./props.ts";
  let { size, state = "default", isSelected = "false", value = "", interaction = "option", onclick,
    hasIcon = false, icon, labelText = "Option", hasAdditionalText = false,
    additionalText = "Additional" }: DropdownItemDefaultProps = $props();
  const panelSize = getContext<() => DropdownItemDefaultProps["size"]>(dropdownSizeContext);
  const resolvedSize = $derived(panelSize?.() ?? size ?? "medium");
  const instanceId = $props.id();
  const descriptionId = `dropdown-action-${instanceId}-description`;
  const leading = $derived(hasIcon ? icon : undefined);
</script>

{#snippet rowContent()}
  {@render leading?.()}
  <span class="stylos-dropdown-item-content">
    <span class="stylos-dropdown-item-label">{labelText}</span>
    {#if hasAdditionalText}<span class="stylos-dropdown-item-additional" id={interaction === "action" ? descriptionId : undefined}>{additionalText}</span>{/if}
  </span>
  <Icon name="check" />
{/snippet}

{#if interaction === "action"}
  <li role="presentation">
    <button class="stylos-dropdown-item stylos-dropdown-item-default" type="button" data-size={resolvedSize}
      data-state={state} data-value={value} data-label={labelText} data-is-selected={isSelected}
      data-leading-icon={leading ? "" : undefined}
      disabled={state === "disabled"} aria-label={labelText}
      aria-describedby={hasAdditionalText ? descriptionId : undefined}
      aria-pressed={value ? isSelected === "true" : undefined} {onclick}>
      {@render rowContent()}
    </button>
  </li>
{:else}
  <li class="stylos-dropdown-item stylos-dropdown-item-default" role="option" data-size={resolvedSize}
    data-state={state} data-value={value} data-label={labelText}
    data-is-selected={isSelected} data-disabled={state === "disabled" ? "" : undefined}
    data-leading-icon={leading ? "" : undefined}
    aria-selected={isSelected === "true"} aria-disabled={state === "disabled" ? "true" : undefined}>
    {@render rowContent()}
  </li>
{/if}

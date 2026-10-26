<script lang="ts">
  import { getContext } from "svelte";
  import { dropdownSizeContext } from "../dropdown/context.ts";
  import "./dropdown-item-parent.css";
  import Icon from "../icon/Icon.svelte";
  import type { DropdownItemParentProps } from "./props.ts";
  let { size, state = "default", hasIcon = false, icon, labelText = "Option",
    hasAdditionalText = false, additionalText = "Additional", id, controls, onclick }: DropdownItemParentProps = $props();
  const panelSize = getContext<() => DropdownItemParentProps["size"]>(dropdownSizeContext);
  const resolvedSize = $derived(panelSize?.() ?? size ?? "medium");
  const instanceId = $props.id();
  const descriptionId = $derived(`${id ?? `dropdown-parent-${instanceId}`}-description`);
  const leading = $derived(hasIcon ? icon : undefined);
</script>

<li role="presentation">
  <button class="stylos-dropdown-item stylos-dropdown-item-parent" type="button" {id}
    data-size={resolvedSize} data-state={state} data-label={labelText}
    aria-label={labelText} aria-controls={controls || undefined} aria-describedby={hasAdditionalText ? descriptionId : undefined}
    data-leading-icon={leading ? "" : undefined} disabled={state === "disabled"} {onclick}>
    {@render leading?.()}
    <span class="stylos-dropdown-item-content">
      <span class="stylos-dropdown-item-label">{labelText}</span>
      {#if hasAdditionalText}<span class="stylos-dropdown-item-additional" id={descriptionId}>{additionalText}</span>{/if}
    </span>
    <Icon name="arrow_right" />
  </button>
</li>

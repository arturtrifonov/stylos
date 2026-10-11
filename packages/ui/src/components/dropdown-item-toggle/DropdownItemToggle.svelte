<script lang="ts">
  import { getContext } from "svelte";
  import { dropdownSizeContext } from "../dropdown/context.ts";
  import ToggleInput from "../toggle-input/ToggleInput.svelte";
  import "./dropdown-item-toggle.css";
  import type { DropdownItemToggleProps } from "./props.ts";
  const generatedId = $props.id();
  let { size, state = "default", isSelected = $bindable("false"), alignment = "start",
    labelText = "Option", hasAdditionalText = false, additionalText = "Additional",
    id, name = "", value = "on", form = "", onchange }: DropdownItemToggleProps = $props();
  const panelSize = getContext<() => DropdownItemToggleProps["size"]>(dropdownSizeContext);
  const resolvedSize = $derived(panelSize?.() ?? size ?? "medium");
  const controlId = $derived(id || generatedId);
  const descriptionId = $derived(`${controlId}-description`);
</script>

<li role="presentation">
  <label class="stylos-dropdown-item stylos-dropdown-item-toggle" for={controlId}
    data-size={resolvedSize} data-state={state} data-is-selected={isSelected} data-alignment={alignment} {onchange}>
    <span class="stylos-dropdown-item-control">
      <ToggleInput size={resolvedSize} {state} bind:isChecked={isSelected}
        id={controlId} {name} {value} {form} accessibleName={labelText}
        descriptionIds={hasAdditionalText ? descriptionId : ""} />
    </span>
    <span class="stylos-dropdown-item-content">
      <span class="stylos-dropdown-item-label">{labelText}</span>
      {#if hasAdditionalText}<span class="stylos-dropdown-item-additional" id={descriptionId}>{additionalText}</span>{/if}
    </span>
  </label>
</li>

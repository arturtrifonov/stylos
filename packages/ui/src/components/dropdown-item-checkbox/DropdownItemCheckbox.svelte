<script lang="ts">
  import { getContext } from "svelte";
  import { dropdownSizeContext } from "../dropdown/context.ts";
  import CheckboxInput from "../checkbox-input/CheckboxInput.svelte";
  import "./dropdown-item-checkbox.css";
  import type { DropdownItemCheckboxProps } from "./props.ts";
  const generatedId = $props.id();
  let { size, state = "default", isSelected = $bindable("false"),
    labelText = "Option", hasAdditionalText = false, additionalText = "Additional",
    id, name = "", value = "on", form = "", onchange }: DropdownItemCheckboxProps = $props();
  const panelSize = getContext<() => DropdownItemCheckboxProps["size"]>(dropdownSizeContext);
  const resolvedSize = $derived(panelSize?.() ?? size ?? "medium");
  const controlId = $derived(id || generatedId);
  const descriptionId = $derived(`${controlId}-description`);
</script>

<li role="presentation">
  <label class="stylos-dropdown-item stylos-dropdown-item-checkbox" for={controlId}
    data-size={resolvedSize} data-state={state} data-is-selected={isSelected} {onchange}>
    <span class="stylos-dropdown-item-control">
      <CheckboxInput size={resolvedSize} {state} bind:isChecked={
        () => isSelected,
        (next) => { isSelected = next === "true" ? "true" : "false"; }
      }
        id={controlId} {name} {value} {form} accessibleName={labelText}
        descriptionIds={hasAdditionalText ? descriptionId : ""} />
    </span>
    <span class="stylos-dropdown-item-content">
      <span class="stylos-dropdown-item-label">{labelText}</span>
      {#if hasAdditionalText}<span class="stylos-dropdown-item-additional" id={descriptionId}>{additionalText}</span>{/if}
    </span>
  </label>
</li>

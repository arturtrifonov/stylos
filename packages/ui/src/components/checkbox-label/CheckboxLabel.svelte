<script lang="ts">
  import "./checkbox-label.css";
  import CheckboxInput from "../checkbox-input/CheckboxInput.svelte";
  import type { CheckboxLabelProps } from "./props.ts";
  const generatedId = $props.id();
  let {
    size = "medium", state = "default", isChecked = $bindable("false"), labelText = "Checkbox",
    id, name = "", value = "on", form = "", accessibleName = "", descriptionIds = "", isRequired = false
  }: CheckboxLabelProps = $props();
  const controlId = $derived(id || generatedId);
</script>

<label class="stylos-checkbox-label" data-size={size} data-state={state} for={controlId}>
  <CheckboxInput {size} {state} bind:isChecked id={controlId} {name} {value} {form} {accessibleName} {descriptionIds} {isRequired} />
  <span class="stylos-checkbox-copy">{labelText}</span>
</label>

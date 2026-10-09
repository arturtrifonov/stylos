<script lang="ts">
  import "./radio-label.css";
  import RadioInput from "../radio-input/RadioInput.svelte";
  import type { RadioLabelProps } from "./props.ts";
  const generatedId = $props.id();
  let {
    size = "extra small", state = "default", isChecked = $bindable("false"), labelText = "Radio",
    id, name = "", value = "on", form = "", accessibleName = "", descriptionIds = "", isRequired = false
  }: RadioLabelProps = $props();
  const controlId = $derived(id || generatedId);
</script>

<label class="stylos-radio-label" data-size={size} data-state={state} for={controlId}>
  <RadioInput {size} {state} bind:isChecked id={controlId} {name} {value} {form} {accessibleName} {descriptionIds} {isRequired} />
  <span class="stylos-radio-copy">{labelText}</span>
</label>

<script lang="ts">
  import "./checkbox-text.css";
  import CheckboxInput from "../checkbox-input/CheckboxInput.svelte";
  import type { CheckboxTextProps } from "./props.ts";
  const generatedId = $props.id();
  let {
    size = "medium", state = "default", isChecked = $bindable("false"), labelText = "Checkbox",
    id, name = "", value = "on", form = "", accessibleName = "", descriptionIds = "", isRequired = false, children
  }: CheckboxTextProps = $props();
  const controlId = $derived(id || generatedId);
</script>

<label class="stylos-checkbox-text" data-size={size} data-state={state} for={controlId}>
  <CheckboxInput {size} {state} bind:isChecked id={controlId} {name} {value} {form} {accessibleName} {descriptionIds} {isRequired} />
  <span class="stylos-checkbox-copy">{#if children}{@render children()}{:else}{labelText}{/if}</span>
</label>

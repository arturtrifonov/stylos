<script lang="ts">
  import "./radio-text.css";
  import RadioInput from "../radio-input/RadioInput.svelte";
  import type { RadioTextProps } from "./props.ts";
  const generatedId = $props.id();
  let {
    size = "extra small", state = "default", isChecked = $bindable("false"), labelText = "Radio",
    id, name = "", value = "on", form = "", accessibleName = "", descriptionIds = "", isRequired = false, children
  }: RadioTextProps = $props();
  const controlId = $derived(id || generatedId);
</script>

<label class="stylos-radio-text" data-size={size} data-state={state} for={controlId}>
  <RadioInput {size} {state} bind:isChecked id={controlId} {name} {value} {form} {accessibleName} {descriptionIds} {isRequired} />
  <span class="stylos-radio-copy">{#if children}{@render children()}{:else}{labelText}{/if}</span>
</label>

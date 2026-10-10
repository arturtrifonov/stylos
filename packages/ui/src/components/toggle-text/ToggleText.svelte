<script lang="ts">
  import "./toggle-text.css";
  import ToggleInput from "../toggle-input/ToggleInput.svelte";
  import type { ToggleTextProps } from "./props.ts";
  const generatedId = $props.id();
  let {
    size = "extra small", state = "default", isChecked = $bindable("false"), labelText = "Toggle",
    id, name = "", value = "on", form = "", accessibleName = "", descriptionIds = "", isRequired = false, children
  }: ToggleTextProps = $props();
  const controlId = $derived(id || generatedId);
</script>

<label class="stylos-toggle-text" data-size={size} data-state={state} for={controlId}>
  <ToggleInput {size} {state} bind:isChecked id={controlId} {name} {value} {form} {accessibleName} {descriptionIds} {isRequired} />
  <span class="stylos-toggle-copy">{#if children}{@render children()}{:else}{labelText}{/if}</span>
</label>

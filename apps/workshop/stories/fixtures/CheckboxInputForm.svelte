<script lang="ts">
  import { CheckboxInput } from "@stylos/ui";
  import type { CheckboxInputProps } from "@stylos/ui";
  let { isChecked: initial = "mixed", size = "medium" }: CheckboxInputProps = $props();
  let selection = $state(initial);
  let state = $state<"default" | "disabled">("default");
  let submitted = $state("Not submitted");
  let cancelReset = $state(false);
  const id = $props.id();
</script>

<form id={`checkbox-form-${id}`} onsubmit={(event) => {
  event.preventDefault();
  submitted = JSON.stringify([...new FormData(event.currentTarget)]);
}} onreset={(event) => { if (cancelReset) event.preventDefault(); }}>
  <div class="checkbox-example-row">
    <CheckboxInput id={`row-${id}`} name="rows" value="row-42" {size} {state} bind:isChecked={selection} descriptionIds={`help-${id}`} />
    <label for={`row-${id}`}>Select row</label>
  </div>
  <p id={`help-${id}`}>Select this row for the next batch action.</p>
  <div class="checkbox-example-row">
    <CheckboxInput id={`disabled-${id}`} name="disabled" value="excluded" size="medium" state="disabled" isChecked="true" />
    <label for={`disabled-${id}`}>Unavailable row</label>
  </div>
  <fieldset disabled>
    <legend>Unavailable group</legend>
    <CheckboxInput accessibleName="Fieldset row" name="fieldset" isChecked="true" size="medium" />
  </fieldset>
  <button type="submit">Submit</button>
  <button type="reset">Reset</button>
</form>

<p data-testid="selection">Selection: {selection}</p>
<p data-testid="submitted">{submitted}</p>
<button type="button" onclick={() => { selection = "mixed"; }}>Set mixed</button>
<button type="button" onclick={() => { selection = "true"; }}>Set checked</button>
<button type="button" onclick={() => { selection = "false"; }}>Clear</button>
<button type="button" onclick={() => { state = state === "default" ? "disabled" : "default"; }}>Toggle availability</button>
<button type="button" onclick={() => { cancelReset = !cancelReset; }}>Toggle reset cancellation</button>

<form id={`external-${id}`} onsubmit={(event) => {
  event.preventDefault();
  submitted = JSON.stringify([...new FormData(event.currentTarget)]);
}}>
  <button type="submit">Submit external form</button>
</form>
<CheckboxInput accessibleName="External required choice" form={`external-${id}`} name="external" value="yes" isRequired size="medium" />

<style>
  .checkbox-example-row { display: flex; align-items: center; gap: var(--stylos-dimension-gap-g-1_000); }
  p { font-family: var(--stylos-font-family-normal); color: var(--stylos-color-text-base); }
</style>

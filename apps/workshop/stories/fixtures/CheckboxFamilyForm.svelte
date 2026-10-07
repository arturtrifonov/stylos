<script lang="ts">
  import { CheckboxLabel, CheckboxText } from "@stylos/ui";
  let labelSelection = $state<"false" | "true" | "mixed">("mixed");
  let textSelection = $state<"false" | "true" | "mixed">("false");
  let isDisabled = $state(false);
  let submitted = $state("");
  let linkVisits = $state(0);
</script>

<form onsubmit={(event) => { event.preventDefault(); submitted = JSON.stringify([...new FormData(event.currentTarget)]); }}>
  <CheckboxLabel labelText="Send release notes" name="notes" value="yes" bind:isChecked={labelSelection} state={isDisabled ? "disabled" : "default"} descriptionIds="family-help" />
  <div class="text-column">
    <CheckboxText labelText="I agree to the processing of my personal data in accordance with the privacy policy." name="consent" value="yes" isRequired bind:isChecked={textSelection} descriptionIds="family-help" state={isDisabled ? "disabled" : "default"} />
  </div>
  <p id="family-help">The visible copy is clickable; Tab and Space work on the native controls.</p>
  <fieldset disabled><legend>Unavailable choices</legend><CheckboxLabel labelText="Disabled label" isChecked="true" name="disabled-label" /><CheckboxText labelText="Disabled wrapping choice." isChecked="true" name="disabled-text" /></fieldset>
  <button type="submit">Submit</button><button type="reset">Reset</button>
  <button type="button" onclick={() => isDisabled = !isDisabled}>Toggle availability</button>
  <output data-testid="family-selection">Label: {labelSelection}; Text: {textSelection}</output>
  <output data-testid="family-submitted">{submitted}</output>
</form>
<div class="text-column">
  <CheckboxText labelText="Review the privacy policy before agreeing.">
    Review the <a href="#privacy-policy" onclick={(event) => { event.preventDefault(); linkVisits += 1; }}>privacy policy</a> before agreeing.
  </CheckboxText>
</div>
<output data-testid="link-visits">Link visits: {linkVisits}</output>
<div class="text-column">
  <CheckboxText accessibleName="Long choice" descriptionIds="long-description" labelText="This longer option names exactly what the user agrees to and wraps across several lines." />
</div>
<p id="long-description">Separate supporting explanation.</p>

<style>
  form { display: grid; justify-items: start; gap: var(--stylos-dimension-gap-g-1_500); }
  .text-column { width: 240px; }
  p, output, legend { font-family: var(--stylos-font-family-normal); color: var(--stylos-color-text-base); }
</style>

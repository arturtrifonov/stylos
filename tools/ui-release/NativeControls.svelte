<script>
  import { Button, CheckboxLabel, RadioLabel, ToggleLabel, InputText, InputSearch } from "@stylos/ui";
  let checked = $state("mixed");
  let switched = $state("false");
  let standard = $state("true");
  let research = $state("false");
  let pro = $state("false");
  let disabled = $state(false);
  let value = $state("Workspace");
  let submitted = $state("");
  let query = $state("Components");
  let searchEvents = $state("");
  function recordSearch(event) {
    searchEvents += `${event.type}:${query}:${event.currentTarget.value};`;
  }
</script>

<form onsubmit={event => { event.preventDefault(); submitted = JSON.stringify([...new FormData(event.currentTarget)]); }}>
  <fieldset {disabled}>
    <legend>Native controls</legend>
    <CheckboxLabel labelText="Receive updates" name="updates" value="yes" bind:isChecked={checked} />
    <ToggleLabel labelText="Notifications" name="notifications" value="yes" bind:isChecked={switched} />
    <fieldset><legend>Plan</legend>
      <RadioLabel labelText="Standard" name="plan" value="standard" bind:isChecked={standard} />
      <RadioLabel labelText="Research" name="plan" value="research" state="disabled" bind:isChecked={research} />
      <RadioLabel labelText="Pro" name="plan" value="pro" bind:isChecked={pro} />
    </fieldset>
    <InputText labelText="Workspace" name="workspace" bind:value />
    <InputSearch labelText="Search" name="query" bind:value={query}
      oninput={recordSearch} onchange={recordSearch} />
  </fieldset>
  <p>Checkbox: {checked}; Toggle: {switched}; Standard: {standard}; Pro: {pro}</p>
  <Button labelText="Submit" type="submit" />
  <Button labelText="Reset" type="reset" variant="outline" />
  <Button labelText={disabled ? "Enable fieldset" : "Disable fieldset"} variant="outline" onclick={() => { disabled = !disabled; }} />
  <p data-testid="search-value">Search value: {query}</p>
  <p data-testid="search-events">Search events: {searchEvents}</p>
  <p aria-live="polite">{submitted}</p>
</form>

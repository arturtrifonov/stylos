<script lang="ts">
  import { Select, DropdownItemDefault, Button } from "@stylos/ui";
  let value = $state("design");
  let status = $state("");
  let disabled = $state(false);
  let readOnly = $state(false);
  let showSelect = $state(true);
</script>

<form onsubmit={event => { event.preventDefault(); status = new FormData(event.currentTarget).get("workspace")?.toString() ?? "No submitted value"; }}>
  <fieldset {disabled} style:width="320px" style:border="0" style:padding="0" style:margin="0">
    {#if showSelect}
      <Select labelText="Workspace" name="workspace" bind:value inputText="Design" hasClearButton isRequired
        state={readOnly ? "read only" : "default"}>
        <DropdownItemDefault value="design" labelText="Design" />
        <DropdownItemDefault value="development" labelText="Development" />
        <DropdownItemDefault value="research" labelText="Research" state="disabled" />
        <DropdownItemDefault value="a-long-option" labelText="An option with a much longer label than the available field width" />
      </Select>
    {/if}
  </fieldset>
  <p>Value: {value || "Empty"}</p>
  <Button labelText="Submit" type="submit" />
  <Button labelText="Reset" type="reset" variant="outline" />
  <p aria-live="polite">{status}</p>
</form>
  <label><input type="checkbox" bind:checked={disabled} /> Disable fieldset</label>
  <label><input type="checkbox" bind:checked={readOnly} /> Read only</label>
  <label><input type="checkbox" bind:checked={showSelect} /> Show Select</label>
  <button type="button" onclick={() => { value = "development"; }}>Set Development</button>

<script lang="ts">
  import { Icon, Switcher, SwitcherItem, SwitcherItemIcon } from "@stylos/ui";
  let view = $state("list");
</script>

{#snippet grid()}<Icon name="calendar_month" />{/snippet}
<form>
  <Switcher size="medium" name="view" accessibleName="Workspace view" bind:value={view}>
    <SwitcherItem value="list" labelText="List" />
    <SwitcherItem value="archived" labelText="Archived" state="disabled" />
    <SwitcherItemIcon value="grid" accessibleName="Grid view" icon={grid} />
  </Switcher>
  <button type="reset">Reset</button>
  <p role="status">View: {view}</p>
</form>

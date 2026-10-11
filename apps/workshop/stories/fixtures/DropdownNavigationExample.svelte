<script lang="ts">
  import { Button, Dropdown, DropdownItemDefault, DropdownItemParent, Icon, dropdownNavigationBehavior } from "@stylos/ui";
  import type { DropdownProps } from "@stylos/ui";
  let { size = "medium", hasAdditionalText = false }: { size?: DropdownProps["size"]; hasAdditionalText?: boolean } = $props();
  let value = $state("website");
  let show = $state(true);
  const id = $props.id();
  const labels: Record<string, string> = { website: "Website", app: "Application", library: "Design library", api: "API", docs: "Documentation" };
</script>

{#snippet back()}
  <ul style:list-style="none" style:margin="0" style:padding="0">
    <DropdownItemDefault {size} interaction="action" labelText="Back" hasIcon>
      {#snippet icon()}<Icon name="arrow_back" />{/snippet}
    </DropdownItemDefault>
  </ul>
{/snippet}

{#if show}
  <div class="dropdown-navigation-example" style:width="260px" use:dropdownNavigationBehavior={{ id, value, accessibleName: "Choose a project", onValueChange: next => { value = next; } }}>
    <span data-dropdown-trigger><Button variant="outline" tone="base" {size} labelText={labels[value]} hasTrailingIcon>
      {#snippet trailingIcon()}<Icon name="arrow_drop_down" />{/snippet}
    </Button></span>
    <div data-dropdown-positioner hidden>
      <div data-dropdown-navigation>
        <section data-dropdown-panel id={`${id}-root`}>
          <Dropdown {size} contentRole="group" accessibleName="Project groups">
            {#snippet contentSlot()}
              <DropdownItemParent labelText="Design" controls={`${id}-design`} {hasAdditionalText} additionalText="Design projects" />
              <DropdownItemParent labelText="Development" controls={`${id}-development`} {hasAdditionalText} additionalText="Development projects" />
              <DropdownItemParent labelText="Archived" state="disabled" controls={`${id}-design`} />
              <DropdownItemDefault interaction="action" value="docs" labelText="Documentation" />
            {/snippet}
          </Dropdown>
        </section>
        <section data-dropdown-panel id={`${id}-design`} hidden>
          <Dropdown {size} contentRole="group" accessibleName="Design projects" backSlot={back}>
            {#snippet contentSlot()}
              <DropdownItemParent labelText="Products" controls={`${id}-products`} {hasAdditionalText} additionalText="Product interfaces" />
              <DropdownItemDefault interaction="action" value="library" labelText="Design library" />
            {/snippet}
          </Dropdown>
        </section>
        <section data-dropdown-panel id={`${id}-products`} hidden>
          <Dropdown {size} contentRole="group" accessibleName="Product interfaces" backSlot={back}>
            {#snippet contentSlot()}
              <DropdownItemDefault interaction="action" value="website" labelText="Website" />
              <DropdownItemDefault interaction="action" value="app" labelText="Application" />
              <DropdownItemDefault interaction="action" value="prototype" labelText="Prototype" state="disabled" />
            {/snippet}
          </Dropdown>
        </section>
        <section data-dropdown-panel id={`${id}-development`} hidden>
          <Dropdown {size} contentRole="group" accessibleName="Development projects" backSlot={back}>
            {#snippet contentSlot()}<DropdownItemDefault interaction="action" value="api" labelText="API" />{/snippet}
          </Dropdown>
        </section>
      </div>
    </div>
  </div>
{/if}
<p aria-live="polite">Selected: {labels[value]}</p>
<label><input type="checkbox" bind:checked={show} /> Show Dropdown</label>

<style>
  .dropdown-navigation-example :global(.stylos-button) { width: calc(100%); }
</style>

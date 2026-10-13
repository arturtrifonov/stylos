<script lang="ts">
  import { Button, Dropdown, DropdownItemDefault, DropdownItemCheckbox, Icon, dropdownBehavior, dropdownControlsBehavior } from "@stylos/ui";
  import type { DropdownProps } from "@stylos/ui";
  let { size = "medium", accessibleName = "Choose a workspace", maxHeight = "", contentRole = "listbox", ...args }: DropdownProps = $props();
  let value = $state("design");
  const id = $props.id();
  const options = [
    { value: "design", label: "Design" }, { value: "development", label: "Development" },
    { value: "marketing", label: "Marketing" }, { value: "research", label: "Research", disabled: true },
    { value: "operations", label: "Operations" }, { value: "support", label: "Support" },
    { value: "finance", label: "Finance" }, { value: "legal", label: "Legal" },
  ];
  const label = $derived(options.find(option => option.value === value)?.label ?? "Choose a workspace");
</script>

{#if contentRole === "group"}
<div class="dropdown-example" style:width={"220px"} use:dropdownControlsBehavior={{ id, accessibleName }}>
  <span data-dropdown-trigger><Button {size} labelText={accessibleName} /></span>
  <div data-dropdown-positioner hidden>
    <Dropdown {...args} {size} {accessibleName} {maxHeight} {contentRole}>
      {#snippet contentSlot()}
        {#each options as option (option.value)}
          <DropdownItemCheckbox value={option.value} labelText={option.label} state={option.disabled ? "disabled" : "default"} />
        {/each}
      {/snippet}
    </Dropdown>
  </div>
</div>
{:else}
<div class="dropdown-example" style:width={"220px"} use:dropdownBehavior={{ id, value, accessibleName, onValueChange: next => { value = next; } }}>
  <span data-dropdown-trigger><Button variant="outline" tone="base" {size} labelText={label} hasTrailingIcon={true}>
    {#snippet trailingIcon()}<Icon name="arrow_drop_down" />{/snippet}
  </Button></span>
  <div data-dropdown-positioner hidden>
    <Dropdown {...args} {size} {accessibleName} {maxHeight} {contentRole}>
      {#snippet contentSlot()}
        {#each options as option (option.value)}
          <DropdownItemDefault value={option.value} labelText={option.label}
            state={option.disabled ? "disabled" : "default"} isSelected={option.value === value ? "true" : "false"} />
        {/each}
      {/snippet}
    </Dropdown>
  </div>
</div>
{/if}

<style>
  .dropdown-example :global(.stylos-button) { width: calc(100%); }
</style>

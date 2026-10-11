<script lang="ts">
  import { Button, Dropdown, DropdownItemCheckbox, DropdownItemToggle, dropdownControlsBehavior } from "@stylos/ui";
  import type { DropdownProps, DropdownItemToggleProps } from "@stylos/ui";
  let { size = "medium", maxHeight = "", kind = "checkbox", alignment = "start", hasAdditionalText = false }:
    Pick<DropdownProps, "size" | "maxHeight"> & Pick<DropdownItemToggleProps, "alignment" | "hasAdditionalText"> & { kind?: "checkbox" | "toggle" } = $props();
  const id = $props.id();
  let choices = $state([
    { label: "Design", description: "Design workspace", value: "design", selected: "true" as "false" | "true", disabled: false },
    { label: "Development", description: "Development workspace", value: "development", selected: "false" as "false" | "true", disabled: false },
    { label: "Marketing", description: "Marketing workspace", value: "marketing", selected: "false" as "false" | "true", disabled: false },
    { label: "Archived", description: "Not available", value: "archived", selected: "false" as "false" | "true", disabled: true },
  ]);
  const name = $derived(kind === "checkbox" ? "Choose workspaces" : "Workspace notifications");
</script>

<div use:dropdownControlsBehavior={{ id, accessibleName: name }}>
  <span data-dropdown-trigger><Button {size} labelText={name} /></span>
  <div data-dropdown-positioner hidden>
    <Dropdown {size} {maxHeight} accessibleName={name} contentRole="group">
      {#snippet contentSlot()}
        {#each choices as choice (choice.value)}
          {#if kind === "checkbox"}
            <DropdownItemCheckbox labelText={choice.label} additionalText={choice.description}
              {hasAdditionalText} state={choice.disabled ? "disabled" : "default"}
              bind:isSelected={choice.selected} value={choice.value} />
          {:else}
            <DropdownItemToggle labelText={choice.label} additionalText={choice.description}
              {hasAdditionalText} {alignment} state={choice.disabled ? "disabled" : "default"}
              bind:isSelected={choice.selected} value={choice.value} />
          {/if}
        {/each}
      {/snippet}
    </Dropdown>
  </div>
</div>
<p>{kind === "checkbox" ? "Selected" : "Enabled"}: {choices.filter(choice => choice.selected === "true").map(choice => choice.label).join(", ") || "None"}</p>

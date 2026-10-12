<script lang="ts">
  import { Dropdown, DropdownItemParent, Icon } from "@stylos/ui";
  import type { DropdownItemParentProps } from "@stylos/ui";
  let args: DropdownItemParentProps = $props();
</script>

{#snippet defaultIcon()}<Icon name="home" />{/snippet}

<div style:width="220px">
  <Dropdown size={args.size ?? "medium"} contentRole="group" accessibleName="Parent preview">
    {#snippet contentSlot()}
      <DropdownItemParent {...args} icon={args.icon ?? defaultIcon} />
    {/snippet}
  </Dropdown>
</div>

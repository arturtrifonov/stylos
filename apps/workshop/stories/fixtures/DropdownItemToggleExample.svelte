<script lang="ts">
  import { Dropdown, DropdownItemToggle } from "@stylos/ui";
  import type { DropdownItemToggleProps } from "@stylos/ui";
  let args: DropdownItemToggleProps = $props();
</script>

<Dropdown size={args.size ?? "medium"} contentRole="group" accessibleName="Option preview">
  {#snippet contentSlot()}<DropdownItemToggle {...args} />{/snippet}
</Dropdown>

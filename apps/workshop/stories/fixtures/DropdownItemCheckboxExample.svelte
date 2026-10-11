<script lang="ts">
  import { Dropdown, DropdownItemCheckbox } from "@stylos/ui";
  import type { DropdownItemCheckboxProps } from "@stylos/ui";
  let args: DropdownItemCheckboxProps = $props();
</script>

<Dropdown size={args.size ?? "medium"} contentRole="group" accessibleName="Option preview">
  {#snippet contentSlot()}<DropdownItemCheckbox {...args} />{/snippet}
</Dropdown>

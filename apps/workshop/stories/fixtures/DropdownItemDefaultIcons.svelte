<script lang="ts">
  import { Dropdown, DropdownItemDefault, Icon } from "@stylos/ui";
  import type { DropdownItemDefaultProps } from "@stylos/ui";
  type Props = Omit<DropdownItemDefaultProps, "icon"> & { iconName?: string };
  let { iconName = "home", ...args }: Props = $props();
</script>

<Dropdown size={args.size ?? "medium"} accessibleName="Option preview">
  {#snippet contentSlot()}
    <DropdownItemDefault {...args}>
      {#snippet icon()}<Icon name={iconName} />{/snippet}
    </DropdownItemDefault>
  {/snippet}
</Dropdown>

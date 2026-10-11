<script lang="ts">
  import { Dropdown, DropdownItemDefault, Icon } from "@stylos/ui";
  import type { DropdownItemDefaultProps } from "@stylos/ui";
  let args: DropdownItemDefaultProps = $props();
</script>

<Dropdown size={args.size ?? "medium"} contentRole={args.interaction === "action" ? "group" : "listbox"} accessibleName="Option preview">
  {#snippet contentSlot()}
    <DropdownItemDefault {...args}>
      {#snippet icon()}<Icon name="home" />{/snippet}
    </DropdownItemDefault>
  {/snippet}
</Dropdown>

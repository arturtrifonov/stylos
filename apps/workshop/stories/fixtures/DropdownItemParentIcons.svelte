<script lang="ts">
  import { Icon } from "@stylos/ui";
  import type { DropdownItemParentProps } from "@stylos/ui";
  import Example from "./DropdownItemParentExample.svelte";
  type Props = Omit<DropdownItemParentProps, "icon"> & { iconName?: string };
  let { iconName = "home", ...args }: Props = $props();
</script>

{#snippet icon()}<Icon name={iconName} />{/snippet}
<Example {...args} {icon} />

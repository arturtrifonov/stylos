<script lang="ts">
  import { Icon } from "@stylos/ui";
  import type { TableCellHeadingProps } from "@stylos/ui";
  import Example from "./TableCellHeadingExample.svelte";
  type Props = Omit<TableCellHeadingProps, "icon"> & { iconName?: string };
  let { iconName = "home", ...args }: Props = $props();
</script>
{#snippet icon()}<Icon name={iconName} />{/snippet}
<Example {...args} {icon} />

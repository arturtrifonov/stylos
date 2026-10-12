<script lang="ts">
  import { Icon } from "@stylos/ui";
  import type { TableCellTextProps } from "@stylos/ui";
  import Example from "./TableCellTextExample.svelte";
  type Props = Omit<TableCellTextProps, "icon"> & { iconName?: string };
  let { iconName = "home", ...args }: Props = $props();
</script>
{#snippet icon()}<Icon name={iconName} />{/snippet}
<Example {...args} {icon} />

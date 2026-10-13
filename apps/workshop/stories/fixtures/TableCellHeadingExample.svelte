<script lang="ts">
  import { TableCellHeading, TableCellText, Icon } from "@stylos/ui";
  import type { TableCellHeadingProps } from "@stylos/ui";
  let args: TableCellHeadingProps = $props();
</script>

{#snippet fallbackIcon()}<Icon name="home" />{/snippet}
<table class="stylos-table" style:width="220px" aria-label="Cell preview">
  <thead><tr>
    <TableCellHeading {...args} icon={args.icon ?? fallbackIcon} />
  </tr></thead>
  <tbody><tr><TableCellText size={args.size} cellText="Example" /></tr></tbody>
</table>

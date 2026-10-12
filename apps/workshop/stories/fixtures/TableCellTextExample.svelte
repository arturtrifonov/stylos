<script lang="ts">
  import { TableCellText, Icon, TableCellHeading } from "@stylos/ui";
  import type { TableCellTextProps } from "@stylos/ui";
  let args: TableCellTextProps = $props();
</script>

{#snippet fallbackIcon()}<Icon name="home" />{/snippet}
<table class="stylos-table" style:width="220px" aria-label="Cell preview">
  <thead><tr><TableCellHeading size={args.size} cellText="Value" /></tr></thead>
  <tbody><tr>
    <TableCellText {...args} icon={args.icon ?? fallbackIcon} />
  </tr></tbody>
</table>

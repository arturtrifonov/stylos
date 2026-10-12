<script lang="ts">
  import { TableRowHead, TableRowBody, TableCellHeading, TableCellText } from "@stylos/ui";
  import type { TableRowBodyProps } from "@stylos/ui";
  let args: TableRowBodyProps = $props();
</script>

<table class="stylos-table" style:width="520px" aria-label="Row preview">
  <thead><TableRowHead size={args.size}><TableCellHeading cellText="Workspace" /><TableCellHeading cellText="Owner" /><TableCellHeading cellText="Plan" /><TableCellHeading cellText="Amount" /></TableRowHead></thead><tbody><TableRowBody {...args}><TableCellText cellText="Design" /><TableCellText cellText="Alex" /><TableCellText cellText="Monthly" /><TableCellText cellText="€24" /></TableRowBody></tbody>
</table>

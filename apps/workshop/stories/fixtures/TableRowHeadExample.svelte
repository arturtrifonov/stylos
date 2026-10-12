<script lang="ts">
  import { TableRowHead, TableRowBody, TableCellHeading, TableCellText } from "@stylos/ui";
  import type { TableRowHeadProps } from "@stylos/ui";
  let args: TableRowHeadProps = $props();
</script>

<table class="stylos-table" style:width="520px" aria-label="Row preview">
  <thead><TableRowHead {...args}><TableCellHeading cellText="Workspace" /><TableCellHeading cellText="Owner" /><TableCellHeading cellText="Plan" /><TableCellHeading cellText="Amount" /></TableRowHead></thead>
</table>

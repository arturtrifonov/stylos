<script lang="ts">
  import { TableRowHead, TableRowBody, TableCellHeading, TableCellText } from "@stylos/ui";
  import type { TableRowBodyProps } from "@stylos/ui";
  let { size = "medium", hasBackground = true, hasDivider = false, hasAdditionalText = false }:
    TableRowBodyProps & { hasAdditionalText?: boolean } = $props();
  let direction = $state<"ascending" | "descending">("ascending");
  let filtered = $state(false);
  const records = [
    { id: "design", name: "Design workspace", owner: "Alex", status: "Active", amount: 24 },
    { id: "development", name: "Development workspace with a longer name", owner: "Sam", status: "Trial", amount: 12 },
    { id: "marketing", name: "Marketing workspace", owner: "Robin", status: "Active", amount: 48 },
    { id: "research", name: "Research workspace", owner: "Lee", status: "Trial", amount: 8 },
  ];
  const rows = $derived(records.filter(record => !filtered || record.status === "Active")
    .toSorted((a, b) => (direction === "ascending" ? 1 : -1) * (a.amount - b.amount)));
</script>

<div style:overflow="auto">
  <table class="stylos-table" style:min-width="480px" aria-label="Workspace subscriptions">
    <colgroup><col style:width="45%" /><col style:width="25%" /><col style:width="30%" /></colgroup>
    <thead>
      <TableRowHead {size}>
        <TableCellHeading cellText="Workspace" />
        <TableCellHeading cellText="Status" isFiltered={filtered} filterAccessibleName="Clear status filter" onclick={() => { filtered = false; }} />
        <TableCellHeading cellText="Amount" alignment="end" isSorted sortDirection={direction}
          onclick={() => { direction = direction === "ascending" ? "descending" : "ascending"; }} />
      </TableRowHead>
    </thead>
    <tbody>
      {#each rows as record, index (record.id)}
        <TableRowBody {size} hasBackground={hasBackground && index % 2 === 1} {hasDivider}>
          <TableCellText cellText={record.name} {hasAdditionalText} additionalText={record.owner} />
          <TableCellText cellText={record.status} />
          <TableCellText cellText={`€${record.amount}`} alignment="end" />
        </TableRowBody>
      {/each}
    </tbody>
  </table>
</div>
<label><input type="checkbox" bind:checked={filtered} /> Active workspaces only</label>

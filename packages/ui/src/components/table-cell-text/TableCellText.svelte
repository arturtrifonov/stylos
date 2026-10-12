<script lang="ts">
  import { getContext } from "svelte";
  import { tableSizeContext } from "../../behaviors/table-context.ts";
  import "./table-cell-text.css";
  import type { TableCellTextProps } from "./props.ts";
  let { size, alignment = "start", hasIcon = false, icon, cellText = "Cell text",
    hasAdditionalText = false, additionalText = "Additional text", id, headers }: TableCellTextProps = $props();
  const rowSize = getContext<() => TableCellTextProps["size"]>(tableSizeContext);
  const resolvedSize = $derived(rowSize?.() ?? size ?? "medium");
</script>

<td class="stylos-table-cell stylos-table-cell-text" {id} {headers} data-size={resolvedSize} data-alignment={alignment}>
  <div class="stylos-table-cell-frame">
    {#if hasIcon && icon}<span class="stylos-table-cell-icon" aria-hidden="true">{@render icon()}</span>{/if}
    <span class="stylos-table-cell-copy">
      <span class="stylos-table-cell-label" title={cellText}>{cellText}</span>
      {#if hasAdditionalText}<span class="stylos-table-cell-additional" title={additionalText}>{additionalText}</span>{/if}
    </span>
  </div>
</td>

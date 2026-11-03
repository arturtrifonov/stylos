<script lang="ts">
  import { getContext } from "svelte";
  import { tableSizeContext } from "../../behaviors/table-context.ts";
  import "./table-cell-heading.css";
  import ButtonInner from "../button-inner/ButtonInner.svelte";
  import Icon from "../icon/Icon.svelte";
  import type { TableCellHeadingProps } from "./props.ts";
  let { size, alignment = "start", hasIcon = false, icon, cellText = "Cell text",
    hasAdditionalText = false, additionalText = "Additional text", isSorted = false, isFiltered = false,
    sortDirection = "ascending", sortAccessibleName, filterAccessibleName, onsortclick, onfilterclick, id }: TableCellHeadingProps = $props();
  const rowSize = getContext<() => TableCellHeadingProps["size"]>(tableSizeContext);
  const resolvedSize = $derived(rowSize?.() ?? size ?? "medium");
  const leading = $derived(hasIcon ? icon : undefined);
</script>

<th class="stylos-table-cell stylos-table-cell-heading" scope="col" {id} data-size={resolvedSize} data-alignment={alignment}
  aria-sort={isSorted ? sortDirection : undefined} data-constrained={isSorted || isFiltered}>
  <div class="stylos-table-cell-frame" data-icon={leading ? "" : undefined}>
    {@render leading?.()}
    <span class="stylos-table-cell-copy">
      <span class="stylos-table-cell-label" title={cellText}>{cellText}</span>
      {#if hasAdditionalText}<span class="stylos-table-cell-additional" title={additionalText}>{additionalText}</span>{/if}
    </span>
    {#if isSorted}
      <ButtonInner accessibleName={sortAccessibleName || `Sort by ${cellText}`} onclick={onsortclick}>
        {#snippet icon()}<Icon name={sortDirection === "ascending" ? "arrow_downward" : "arrow_upward"} />{/snippet}
      </ButtonInner>
    {/if}
    {#if isFiltered}
      <ButtonInner accessibleName={filterAccessibleName || `Filter by ${cellText}`} onclick={onfilterclick}>
        {#snippet icon()}<Icon name="filter_list" />{/snippet}
      </ButtonInner>
    {/if}
  </div>
</th>

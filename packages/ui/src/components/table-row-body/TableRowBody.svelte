<script lang="ts">
  import { setContext } from "svelte";
  import { tableSizeContext } from "../../behaviors/table-context.ts";
  import "./table-row-body.css";
  import type { TableRowBodyProps } from "./props.ts";
  let { size = "medium", children, hasBackground = false, hasDivider = false }: TableRowBodyProps = $props();
  setContext(tableSizeContext, () => size);
</script>

<tr class="stylos-table-row stylos-table-row-body" data-size={size} data-has-background={hasBackground} data-has-divider={hasDivider}>
  {#if children}{@render children()}{/if}
</tr>

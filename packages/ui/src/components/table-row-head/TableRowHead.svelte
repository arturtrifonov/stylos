<script lang="ts">
  import { setContext } from "svelte";
  import { tableSizeContext } from "../../behaviors/table-context.ts";
  import "./table-row-head.css";
  import type { TableRowHeadProps } from "./props.ts";
  let { size = "medium", children }: TableRowHeadProps = $props();
  setContext(tableSizeContext, () => size);
</script>

<tr class="stylos-table-row stylos-table-row-head" data-size={size}>
  {#if children}{@render children()}{/if}
</tr>

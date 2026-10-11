<script lang="ts">
  import { setContext } from "svelte";
  import { dropdownSizeContext } from "./context.ts";
  import "./dropdown.css";
  import type { DropdownProps } from "./props.ts";
  let { size = "medium", contentSlot, backSlot, searchSlot, actionsSlot,
    id, accessibleName = "", maxHeight = "", contentRole = "listbox" }: DropdownProps = $props();
  setContext(dropdownSizeContext, () => size);
</script>

<div class="stylos-dropdown" data-surface-layer="3" data-surface-attachment="control" data-size={size} style:--_stylos-dropdown-height-limit={maxHeight || undefined}>
  {#if backSlot}<div class="stylos-dropdown-back">{@render backSlot()}</div>{/if}
  {#if searchSlot}<div class="stylos-dropdown-search">{@render searchSlot()}</div>{/if}
  {#if contentRole === "listbox"}
    <ul class="stylos-dropdown-options stylos-scrollbar" data-scrollbar-size="small" data-scrollbar-position="absolute" {id} role="listbox" aria-label={accessibleName || undefined} tabindex="0">
      {#if contentSlot}{@render contentSlot()}{/if}
    </ul>
  {:else}
    <ul class="stylos-dropdown-options stylos-scrollbar" data-scrollbar-size="small" data-scrollbar-position="absolute" {id} role="group" aria-label={accessibleName || undefined}>
      {#if contentSlot}{@render contentSlot()}{/if}
    </ul>
  {/if}
  {#if actionsSlot}<div class="stylos-dropdown-actions">{@render actionsSlot()}</div>{/if}
</div>

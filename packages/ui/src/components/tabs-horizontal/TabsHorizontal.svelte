<script lang="ts">
  import { setContext, untrack } from "svelte";
  import { tabsContext, type SelectionContext } from "../../internal/selection-context.ts";
  import { tabsBehavior } from "../../behaviors/tabs.ts";
  import "./tabs-horizontal.css";
  import type { TabsHorizontalProps } from "./props.ts";
  let { size = "extra small", value = $bindable(""), accessibleName = "Options",
    tabsSlot, panelsSlot, onchange }: TabsHorizontalProps = $props();
  setContext<SelectionContext>(tabsContext, { value: () => value, size: () => size, initialValue: untrack(() => value),
    select: (next, event) => { if (next !== value) { value = next; onchange?.(event); } } });
</script>

<div class="stylos-tabs-horizontal" data-size={size}>
  <div class="stylos-tabs-list" role="tablist" aria-label={accessibleName} aria-orientation="horizontal" use:tabsBehavior>
    {@render tabsSlot?.()}
  </div>
  {@render panelsSlot?.()}
</div>

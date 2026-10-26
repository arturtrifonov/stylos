<script lang="ts">
  import { setContext, tick, untrack } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { tabsContext, type SelectionContext, type TabEntry } from "../../internal/selection-context.ts";
  import { tabsBehavior } from "../../behaviors/tabs.ts";
  import { dropdownBehavior } from "../../behaviors/dropdown.ts";
  import Dropdown from "../dropdown/Dropdown.svelte";
  import DropdownItemDefault from "../dropdown-item-default/DropdownItemDefault.svelte";
  import Icon from "../icon/Icon.svelte";
  import "./tabs-horizontal.css";
  import type { TabsHorizontalProps } from "./props.ts";
  let { size = "medium", value = $bindable(""), accessibleName = "Options", moreAccessibleName = "More tabs",
    tabsSlot, panelsSlot, onchange }: TabsHorizontalProps = $props();
  const instanceId = $props.id();
  const entries = new SvelteMap<symbol, () => TabEntry>();
  let overflowed = $state<string[]>([]);
  let list: HTMLElement;
  function select(next: string, event: Event) {
    if (next !== value) { value = next; onchange?.(event); }
  }
  setContext<SelectionContext>(tabsContext, { value: () => value, size: () => size, initialValue: untrack(() => value), select,
    register: entry => { const key = Symbol(); entries.set(key, entry); return () => entries.delete(key); } });
  // A tab chosen from the menu takes its place in the row; focus follows it
  // there once the menu has closed and restored focus to its trigger.
  async function choose(next: string) {
    select(next, new Event("change"));
    await tick();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      [...list.querySelectorAll<HTMLElement>('[role="tab"]')].find(tab => tab.dataset.value === next)?.focus();
    }));
  }
  // The selected tab never sits in the menu, so the menu has no value of its
  // own and keyboard highlight starts from its first row.
  // Overflowed tabs in document order, offered by the menu with their label and icon.
  const hidden = $derived(overflowed.map(next => [...entries.values()].map(entry => entry()).find(entry => entry.value === next))
    .filter((entry): entry is TabEntry => !!entry));
</script>

<div class="stylos-tabs-horizontal" data-size={size} use:tabsBehavior={{ onOverflowChange: values => { overflowed = values; } }}>
  <div class="stylos-tabs-list" bind:this={list} role="tablist" aria-label={accessibleName} aria-orientation="horizontal">
    {@render tabsSlot?.()}
  </div>
  {#if hidden.length}
    <!-- Exists only while tabs overflow; display: contents keeps the trigger in the row. -->
    <div class="stylos-tabs-overflow" use:dropdownBehavior={{ id: `tabs-more-${instanceId}`, value: "", accessibleName: moreAccessibleName,
      placement: "bottom-end", sameWidth: false, onValueChange: next => { if (next) void choose(next); } }}>
      <button type="button" class="stylos-tab-item stylos-tab-item-icon stylos-tabs-more" data-size={size}
        data-dropdown-trigger><Icon name="more_horiz" /></button>
      <div data-dropdown-positioner hidden>
        <Dropdown {size} accessibleName={moreAccessibleName}>
          {#snippet contentSlot()}
            {#each hidden as tab (tab.value)}
              <DropdownItemDefault value={tab.value} labelText={tab.label} state={tab.disabled ? "disabled" : "default"}
                hasIcon={!!tab.icon} icon={tab.icon} />
            {/each}
          {/snippet}
        </Dropdown>
      </div>
    </div>
  {/if}
</div>
{@render panelsSlot?.()}

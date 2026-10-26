<script lang="ts">
  import { Icon, TabsHorizontal, TabItem, TabItemIcon } from "@stylos/ui";

  const sizes = ["extra small", "small", "medium", "large", "extra large"] as const;
  let values = $state<Record<string, string>>(Object.fromEntries(sizes.map(size => [size, ""])));
  let overflowValue = $state("one");
  let changes = $state(0);
  const id = $props.id();
  const many = ["Overview", "Activity", "Members", "Settings", "Billing", "Integrations", "Audit log", "Archive"];
</script>

{#snippet home()}<Icon name="home" />{/snippet}
{#snippet forward()}<Icon name="arrow_forward" />{/snippet}
{#snippet calendar()}<Icon name="calendar_month" />{/snippet}
{#snippet filter()}<Icon name="filter_list" />{/snippet}

<div class="tabs-review">
  {#each sizes as size}
    <section class="tabs-row" data-size={size}>
      <TabsHorizontal {size} accessibleName={`${size} tabs`} bind:value={values[size]}>
        {#snippet tabsSlot()}
          <TabItem value="one" labelText="Tab item 1" />
          <TabItem value="two" labelText="Leading" hasLeadingIcon leadingIcon={home} />
          <TabItem value="three" labelText="Badge" hasBadge numberText="3" />
          <TabItem value="four" labelText="Trailing" hasTrailingIcon trailingIcon={forward} />
          <TabItem value="five" labelText="Off" state="disabled" />
          <TabItemIcon value="six" accessibleName="Calendar" icon={calendar} />
          <TabItemIcon value="seven" accessibleName="Filters" icon={filter} />
          <TabItemIcon value="eight" accessibleName="Unread" icon={calendar} hasBadge numberText="12" />
        {/snippet}
      </TabsHorizontal>
    </section>
  {/each}
  <section class="tabs-overflow">
    <TabsHorizontal accessibleName="Workspace" bind:value={overflowValue} onchange={() => { changes++; }}>
      {#snippet tabsSlot()}
        {#each many as label, index}
          <TabItem value={index === 0 ? "one" : label.toLowerCase()} labelText={label} id={`${id}-${index}`}
            controls={`${id}-panel`} hasLeadingIcon={index === 1} leadingIcon={home} />
        {/each}
      {/snippet}
      {#snippet panelsSlot()}
        <div role="tabpanel" tabindex="0" id={`${id}-panel`}>Panel: {overflowValue}</div>
      {/snippet}
    </TabsHorizontal>
    <p role="status">Changes: {changes}</p>
  </section>
</div>

<style>
  .tabs-review { display: grid; gap: var(--stylos-dimension-gap-g-3_000); padding-inline: var(--stylos-dimension-gap-g-3_000); }
  .tabs-row { width: max-content; }
  .tabs-overflow { width: 30rem; max-width: 100%; }
</style>

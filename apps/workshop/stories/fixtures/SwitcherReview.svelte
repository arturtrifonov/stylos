<script lang="ts">
  import { Icon, Switcher, SwitcherItem, SwitcherItemIcon } from "@stylos/ui";

  const sizes = ["extra small", "small", "medium", "large", "extra large"] as const;
  const tones = ["base", "primary"] as const;
</script>

{#snippet check()}<Icon name="check" />{/snippet}
{#snippet forward()}<Icon name="arrow_forward" />{/snippet}
{#snippet calendar()}<Icon name="calendar_month" />{/snippet}
{#snippet list()}<Icon name="filter_list" />{/snippet}

<div class="switcher-review">
  {#each tones as tone}
    <section class="switcher-tone" data-tone={tone}>
      {#each sizes as size}
        <div class="switcher-row" data-size={size}>
          <Switcher {size} {tone} accessibleName={`${tone} ${size} options`}>
            {#each ["Option 1", "Option 2", "Option 3", "Option 4"] as labelText}
              <SwitcherItem value={labelText} {labelText} />
            {/each}
          </Switcher>
          <Switcher {size} {tone} accessibleName={`${tone} ${size} icons`}>
            <SwitcherItem value="leading" labelText="Leading" hasLeadingIcon leadingIcon={check} />
            <SwitcherItem value="trailing" labelText="Trailing" hasTrailingIcon trailingIcon={forward} />
            <SwitcherItem value="off" labelText="Off" state="disabled" hasLeadingIcon leadingIcon={check} />
          </Switcher>
          <Switcher {size} {tone} accessibleName={`${tone} ${size} views`}>
            <SwitcherItemIcon value="calendar" accessibleName="Calendar view" icon={calendar} />
            <SwitcherItemIcon value="list" accessibleName="List view" icon={list} />
            <SwitcherItemIcon value="off" accessibleName="Unavailable view" state="disabled" icon={list} />
          </Switcher>
          <Switcher {size} {tone} state="disabled" accessibleName={`${tone} ${size} disabled`}>
            <SwitcherItem value="one" labelText="Option 1" />
            <SwitcherItem value="two" labelText="Option 2" />
          </Switcher>
        </div>
      {/each}
    </section>
  {/each}
</div>

<style>
  .switcher-review { display: grid; gap: var(--stylos-dimension-gap-g-3_000); }
  .switcher-tone { display: grid; gap: var(--stylos-dimension-gap-g-1_500); }
  .switcher-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--stylos-dimension-gap-g-1_500); }
</style>

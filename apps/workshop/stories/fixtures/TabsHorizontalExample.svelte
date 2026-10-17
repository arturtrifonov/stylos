<script lang="ts">
  import { TabsHorizontal, TabItem } from "@stylos/ui";
  import type { TabsHorizontalProps } from "@stylos/ui";
  let args: TabsHorizontalProps = $props();
  let selected = $state("");
  const base = $props.id();
</script>
<TabsHorizontal {...args} bind:value={selected}>
  {#snippet tabsSlot()}
    <TabItem value="one" labelText="Tab item 1" id={`${base}-one`} controls={`${base}-panel-one`} />
    <TabItem value="two" labelText="Tab item 2" id={`${base}-two`} controls={`${base}-panel-two`} />
    <TabItem value="three" labelText="Tab item 3" id={`${base}-three`} controls={`${base}-panel-three`} />
  {/snippet}
  {#snippet panelsSlot()}
    {#each ["one", "two", "three"] as key}
      <div role="tabpanel" tabindex="0" id={`${base}-panel-${key}`} aria-labelledby={`${base}-${key}`} hidden={selected !== key}>Panel {key}</div>
    {/each}
  {/snippet}
</TabsHorizontal>

<script lang="ts">
  import { TabsHorizontal, TabItem } from "@stylos/ui";
  import type { TabItemProps } from "@stylos/ui";
  let args: TabItemProps = $props();
  const id = $props.id();
</script>
<TabsHorizontal size={args.size} value={args.value}>
  {#snippet tabsSlot()}<TabItem {...args} id={`${id}-tab`} controls={`${id}-panel`} />{/snippet}
  {#snippet panelsSlot()}<div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab`}>Tab content</div>{/snippet}
</TabsHorizontal>

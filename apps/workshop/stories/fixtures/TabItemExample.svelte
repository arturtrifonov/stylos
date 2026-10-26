<script lang="ts">
  import { Icon, TabsHorizontal, TabItem } from "@stylos/ui";
  import type { TabItemProps } from "@stylos/ui";

  type Props = Omit<TabItemProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };
  let { leadingIconName = "home", trailingIconName = "arrow_forward", ...args }: Props = $props();
  const id = $props.id();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<TabsHorizontal size={args.size} value={args.value}>
  {#snippet tabsSlot()}<TabItem {...args} id={`${id}-tab`} controls={`${id}-panel`} leadingIcon={leading} trailingIcon={trailing} />{/snippet}
  {#snippet panelsSlot()}<div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab`}>Tab content</div>{/snippet}
</TabsHorizontal>

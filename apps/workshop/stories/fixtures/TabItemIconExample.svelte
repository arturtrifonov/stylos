<script lang="ts">
  import { Icon, TabsHorizontal, TabItemIcon } from "@stylos/ui";
  import type { TabItemIconProps } from "@stylos/ui";

  type Props = Omit<TabItemIconProps, "icon"> & { iconName?: string };
  let { iconName = "calendar_month", ...args }: Props = $props();
  const id = $props.id();
</script>

{#snippet mark()}<Icon name={iconName} />{/snippet}
<TabsHorizontal size={args.size} value={args.value} accessibleName="Views">
  {#snippet tabsSlot()}<TabItemIcon {...args} id={`${id}-tab`} controls={`${id}-panel`} icon={mark} />{/snippet}
  {#snippet panelsSlot()}<div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab`}>Tab content</div>{/snippet}
</TabsHorizontal>

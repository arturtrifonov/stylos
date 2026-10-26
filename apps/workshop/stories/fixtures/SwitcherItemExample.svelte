<script lang="ts">
  import { Icon, Switcher, SwitcherItem } from "@stylos/ui";
  import type { SwitcherItemProps } from "@stylos/ui";

  type Props = Omit<SwitcherItemProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };
  let { leadingIconName = "check", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<Switcher size={args.size} tone={args.tone}><SwitcherItem {...args} leadingIcon={leading} trailingIcon={trailing} /></Switcher>

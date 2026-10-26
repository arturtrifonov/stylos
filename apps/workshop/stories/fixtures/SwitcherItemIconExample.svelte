<script lang="ts">
  import { Icon, Switcher, SwitcherItemIcon } from "@stylos/ui";
  import type { SwitcherItemIconProps } from "@stylos/ui";

  type Props = Omit<SwitcherItemIconProps, "icon"> & { iconName?: string };
  let { iconName = "calendar_month", ...args }: Props = $props();
</script>

{#snippet mark()}<Icon name={iconName} />{/snippet}
<Switcher size={args.size} tone={args.tone} accessibleName="View"><SwitcherItemIcon {...args} icon={mark} /></Switcher>

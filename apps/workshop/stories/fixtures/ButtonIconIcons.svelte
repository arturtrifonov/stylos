<script lang="ts">
  import { ButtonIcon, Icon } from "@stylos/ui";
  import type { ButtonIconProps } from "@stylos/ui";

  type Props = Omit<ButtonIconProps, "icon"> & { iconName?: string };
  let { iconName = "add", ...args }: Props = $props();
</script>

{#snippet mark()}<Icon name={iconName} />{/snippet}
<ButtonIcon {...args} icon={mark} />

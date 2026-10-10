<script lang="ts">
  import { ButtonInner, Icon } from "@stylos/ui";
  import type { ButtonInnerProps } from "@stylos/ui";

  type Props = Omit<ButtonInnerProps, "icon"> & { iconName?: string };
  let { iconName = "close", ...args }: Props = $props();
</script>

{#snippet mark()}<Icon name={iconName} />{/snippet}
<ButtonInner {...args} icon={mark} />

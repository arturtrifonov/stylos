<script lang="ts">
  import { ButtonBase, Icon } from "@stylos/ui";
  import type { ButtonBaseProps } from "@stylos/ui";

  type Props = Omit<ButtonBaseProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };

  let { leadingIconName = "add", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<ButtonBase {...args} leadingIcon={leading} trailingIcon={trailing} />

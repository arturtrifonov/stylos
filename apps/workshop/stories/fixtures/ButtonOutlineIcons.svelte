<script lang="ts">
  import { ButtonOutline, Icon } from "@stylos/ui";
  import type { ButtonOutlineProps } from "@stylos/ui";

  type Props = Omit<ButtonOutlineProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };

  let { leadingIconName = "add", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<ButtonOutline {...args} leadingIcon={leading} trailingIcon={trailing} />

<script lang="ts">
  import { ButtonGhost, Icon } from "@stylos/ui";
  import type { ButtonGhostProps } from "@stylos/ui";

  type Props = Omit<ButtonGhostProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };

  let { leadingIconName = "add", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<ButtonGhost {...args} leadingIcon={leading} trailingIcon={trailing} />

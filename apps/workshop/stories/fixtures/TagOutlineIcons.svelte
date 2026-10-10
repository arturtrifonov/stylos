<script lang="ts">
  import { TagOutline, Icon } from "@stylos/ui";
  import type { TagOutlineProps } from "@stylos/ui";

  type Props = Omit<TagOutlineProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };
  let { leadingIconName = "check", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<TagOutline {...args} leadingIcon={leading} trailingIcon={trailing} />

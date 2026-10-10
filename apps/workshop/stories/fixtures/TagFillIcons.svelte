<script lang="ts">
  import { TagFill, Icon } from "@stylos/ui";
  import type { TagFillProps } from "@stylos/ui";

  type Props = Omit<TagFillProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };
  let { leadingIconName = "check", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<TagFill {...args} leadingIcon={leading} trailingIcon={trailing} />

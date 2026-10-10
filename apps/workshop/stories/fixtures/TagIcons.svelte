<script lang="ts">
  import { Tag, Icon } from "@stylos/ui";
  import type { TagProps } from "@stylos/ui";

  type Props = Omit<TagProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };
  let { leadingIconName = "check", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<Tag {...args} leadingIcon={leading} trailingIcon={trailing} />

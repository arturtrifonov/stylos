<script lang="ts">
  import { TagInteractive, Icon } from "@stylos/ui";
  import type { TagInteractiveProps } from "@stylos/ui";

  type Props = Omit<TagInteractiveProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };
  let { leadingIconName = "check", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<TagInteractive {...args} leadingIcon={leading} trailingIcon={trailing} />

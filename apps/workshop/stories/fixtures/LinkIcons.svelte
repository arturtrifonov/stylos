<script lang="ts">
  import { Link, Icon } from "@stylos/ui";
  import type { LinkProps } from "@stylos/ui";

  type Props = Omit<LinkProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };

  let { leadingIconName = "add", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<Link {...args} leadingIcon={leading} trailingIcon={trailing} />

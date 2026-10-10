<script lang="ts">
  import { Button, Icon } from "@stylos/ui";
  import type { ButtonProps } from "@stylos/ui";

  type Props = Omit<ButtonProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };

  let { leadingIconName = "add", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<Button {...args} leadingIcon={leading} trailingIcon={trailing} />

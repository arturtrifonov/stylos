<script lang="ts">
  import { InputText, Icon } from "@stylos/ui";
  import type { InputTextProps } from "@stylos/ui";

  type Props = Omit<InputTextProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };
  let { leadingIconName = "person", trailingIconName = "search", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
<InputText {...args} leadingIcon={leading} trailingIcon={trailing} />

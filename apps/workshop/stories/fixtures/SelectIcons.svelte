<script lang="ts">
  import { Icon } from "@stylos/ui";
  import type { SelectProps } from "@stylos/ui";
  import Example from "./SelectExample.svelte";
  type Props = Omit<SelectProps, "leadingIcon"> & { leadingIconName?: string };
  let { leadingIconName = "person", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
<Example {...args} leadingIcon={leading} />

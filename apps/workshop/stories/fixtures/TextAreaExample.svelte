<script lang="ts">
  import { untrack } from "svelte";
  import { TextArea, Icon } from "@stylos/ui";
  import type { TextAreaProps } from "@stylos/ui";

  let { value: suppliedValue = "", ...args }: TextAreaProps = $props();
  let previousValue = untrack(() => suppliedValue);
  let value = $state(previousValue);
  // Controls own their supplied value; unrelated control changes keep typing.
  $effect(() => {
    if (suppliedValue !== previousValue) {
      previousValue = suppliedValue;
      value = suppliedValue;
    }
  });
</script>

{#snippet leading()}<Icon name="person" />{/snippet}
{#snippet trailing()}<Icon name="edit" />{/snippet}
<TextArea {...args} bind:value leadingIcon={leading} trailingIcon={trailing} />

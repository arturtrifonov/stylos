<script lang="ts">
  import { untrack } from "svelte";
  import { InputSearch, Icon } from "@stylos/ui";
  import type { InputSearchProps } from "@stylos/ui";

  let { value: suppliedValue = "", ...args }: InputSearchProps = $props();
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
<InputSearch {...args} bind:value leadingIcon={leading} />

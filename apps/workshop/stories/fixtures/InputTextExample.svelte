<script lang="ts">
  import { untrack } from "svelte";
  import { InputText } from "@stylos/ui";
  import type { InputTextProps } from "@stylos/ui";

  let { value: suppliedValue = "", ...args }: InputTextProps = $props();
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

<InputText {...args} bind:value />

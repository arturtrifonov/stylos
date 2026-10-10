<script lang="ts">
  import Example from "./TagIcons.svelte";
  import type { TagProps } from "@stylos/ui";
  let args: TagProps = $props();
</script>

<Example {...args} />

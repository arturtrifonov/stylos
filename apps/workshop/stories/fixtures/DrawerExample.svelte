<script lang="ts">
  import WindowExample from "./WindowExample.svelte";
  import type { DrawerProps } from "@stylos/ui";
  let args: DrawerProps = $props();
</script>
<WindowExample {...args} kind="drawer" />

<script lang="ts">
  import WindowExample from "./WindowExample.svelte";
  import type { ModalProps } from "@stylos/ui";
  let args: ModalProps = $props();
</script>
<WindowExample {...args} kind="modal" />

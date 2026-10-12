<script lang="ts">
  import "./modal.css";
  import WindowFrame from "../../behaviors/WindowFrame.svelte";
  import { windowBehavior } from "../../behaviors/window.ts";
  import type { ModalProps } from "./props.ts";
  let { isOpen = $bindable(false), onclose, ...frame }: ModalProps = $props();
  const instanceId = $props.id();
  const headingId = $derived(`${frame.id || instanceId}-heading`);
  function closed(event: Event) { isOpen = false; onclose?.(event); }
</script>

<dialog class="stylos-window-root stylos-modal-root" id={frame.id} aria-labelledby={headingId}
  data-overlay-host onclose={closed}
  use:windowBehavior={{ isOpen, onOpenChange: open => { isOpen = open; } }}>
  <WindowFrame {...frame} kind="modal" {headingId} dismiss={() => { isOpen = false; }} />
</dialog>

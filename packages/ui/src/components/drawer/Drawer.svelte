<script lang="ts">
  import "./drawer.css";
  import WindowFrame from "../../behaviors/WindowFrame.svelte";
  import { windowBehavior } from "../../behaviors/window.ts";
  import type { DrawerProps } from "./props.ts";
  let { isOpen = $bindable(false), onclose, ...frame }: DrawerProps = $props();
  const instanceId = $props.id();
  const headingId = $derived(`${frame.id || instanceId}-heading`);
  function closed(event: Event) { isOpen = false; onclose?.(event); }
</script>

<dialog class="stylos-window-root stylos-drawer-root" id={frame.id} aria-labelledby={headingId}
  data-overlay-host onclose={closed}
  use:windowBehavior={{ isOpen, onOpenChange: open => { isOpen = open; } }}>
  <WindowFrame {...frame} kind="drawer" {headingId} dismiss={() => { isOpen = false; }} />
</dialog>

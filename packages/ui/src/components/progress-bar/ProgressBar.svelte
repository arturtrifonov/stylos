<script lang="ts">
  import "./progress-bar.css";
  import type { ProgressBarProps } from "./props.ts";
  let { value = "0", hasLabel = true, labelText = "", labelWidth = "auto", accessibleName = "Progress Bar" }: ProgressBarProps = $props();
  const unknown = $derived(value.trim() === "unknown");
  const numeric = $derived(Number(value.trim().replace(/%$/, "")));
  const percent = $derived(Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : 0);
  const label = $derived(labelText || (unknown ? "" : String(percent)));
  function syncValue(node: HTMLProgressElement) {
    // Native progress is indeterminate only while value is absent. Svelte's
    // property setter otherwise coerces the removed value to 0 on updates.
    $effect(() => {
      if (unknown) node.removeAttribute("value");
      else node.setAttribute("value", String(percent));
    });
  }
</script>

<div class="stylos-progress-bar">
  <progress max="100" value={unknown ? undefined : percent} {@attach syncValue} aria-label={accessibleName}
    aria-valuetext={labelText || undefined}></progress>
  {#if hasLabel && label}<span class="stylos-progress-label" style:width={labelWidth} aria-hidden="true">{label}</span>{/if}
</div>

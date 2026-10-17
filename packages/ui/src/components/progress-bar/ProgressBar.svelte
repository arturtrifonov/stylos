<script lang="ts">
  import "./progress-bar.css";
  import Icon from "../icon/Icon.svelte";
  import type { ProgressBarProps } from "./props.ts";
  let { type = "default", state = "static", value = "0", hasLabel = true,
    labelText = "", hasIcon = true, accessibleName = "Progress" }: ProgressBarProps = $props();
  const percent = $derived(Number.isFinite(Number(value)) ? Math.min(100, Math.max(0, Number(value))) : 0);
  const mark = $derived({ default: "", warning: "warning", danger: "error", success: "check_circle" }[type]);
</script>

<div class="stylos-progress-bar" data-type={type} data-state={state}>
  <progress max="100" value={state === "skeleton" ? undefined : percent} aria-label={accessibleName}
    aria-valuetext={state === "skeleton" ? undefined : labelText || (type === "default" ? undefined : `${type === "danger" ? "Error" : type}, ${percent}%`)}></progress>
  {#if state === "static"}
    {#if mark && hasIcon}<span class="stylos-progress-icon" aria-hidden="true"><Icon name={mark} /></span>
    {:else if hasLabel}<span class="stylos-progress-label" aria-hidden="true">{labelText || String(percent)}</span>{/if}
  {/if}
</div>

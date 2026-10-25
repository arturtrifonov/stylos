<script lang="ts">
  import "./alert-popup-timer.css";
  import Button from "../button/Button.svelte";
  import ButtonInner from "../button-inner/ButtonInner.svelte";
  import Icon from "../icon/Icon.svelte";
  import ProgressBar from "../progress-bar/ProgressBar.svelte";
  import type { AlertPopupTimerProps } from "./props.ts";
  let { size = "extra small", isOpen = $bindable(true), headingText = "Heading Text",
    hasContent = false, children, hasCloseButton = false, closeAccessibleName = "Close",
    announcement = "polite", onclose,
    hasUndoButton = true, undoButtonText = "Undo", onundoclick, hasTimerCounter = true, timeUnit = "", duration = 3, remainingTime = 3 }: AlertPopupTimerProps = $props();
  const total = $derived(Number.isFinite(duration) ? Math.max(0, duration) : 0);
  const remaining = $derived(Number.isFinite(remainingTime) ? Math.min(total, Math.max(0, remainingTime)) : 0);
  const progress = $derived(total > 0 ? remaining / total * 100 : 0);
  function close() { isOpen = false; onclose?.(new Event("close")); }
  const titleId = $props.id();
</script>

{#snippet closeIcon()}<Icon name="close" />{/snippet}
<section class="stylos-alert stylos-alert-popup-timer" data-size={size} data-announcement={announcement}
  data-surface-layer="4" data-surface-attachment="free"
  hidden={!isOpen} aria-labelledby={titleId}>
  <div class="stylos-alert-body">
    <div class="stylos-alert-heading-row">
      <div class="stylos-alert-timer-header">
        {#if hasTimerCounter}<span class="stylos-alert-timer-count">{Math.ceil(remaining)}{timeUnit}</span>{/if}
        <p class="stylos-alert-heading" id={titleId}
          role={announcement === "off" ? undefined : announcement === "assertive" ? "alert" : "status"}
          aria-atomic={announcement === "off" ? undefined : "true"}>{headingText}</p>
        {#if hasUndoButton}<Button {size} variant="outline" tone="base" labelText={undoButtonText} onclick={onundoclick} />{/if}
      </div>
      {#if hasCloseButton}<ButtonInner accessibleName={closeAccessibleName} icon={closeIcon} onclick={close} />{/if}
    </div>
    {#if hasContent}<div class="stylos-alert-content">{@render children?.()}</div>{/if}
  </div>
  <div class="stylos-alert-timer-progress" aria-hidden="true"><ProgressBar value={String(progress)} hasLabel={false} /></div>
</section>

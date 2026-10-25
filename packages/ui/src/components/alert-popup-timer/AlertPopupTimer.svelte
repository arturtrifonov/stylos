<script lang="ts">
  import "./alert-popup-timer.css";
  import Button from "../button/Button.svelte";
  import ButtonInner from "../button-inner/ButtonInner.svelte";
  import Icon from "../icon/Icon.svelte";
  import ProgressBar from "../progress-bar/ProgressBar.svelte";
  import type { AlertPopupTimerProps } from "./props.ts";
  let { type = "default", isOpen = $bindable(true), hasHeading = true, headingText = "Heading Text",
    hasContent = false, children, hasCloseButton = true, closeAccessibleName = "Close",
    announcement = "polite", onclose,
    hasUndoButton = true, undoButtonText = "Undo", onundoclick, hasTimerCounter = true, timerText = "3", progressValue = "30" }: AlertPopupTimerProps = $props();
  function close() { isOpen = false; onclose?.(new Event("close")); }
  const titleId = $props.id();
</script>

{#snippet closeIcon()}<Icon name="close" />{/snippet}
<section class="stylos-alert stylos-alert-popup-timer" data-type={type}  data-announcement={announcement}
  data-surface-layer="6" data-surface-attachment="free"
  hidden={!isOpen} aria-labelledby={hasHeading ? titleId : undefined}>
  <div class="stylos-alert-body">
    <div class="stylos-alert-heading-row">
      {#if hasTimerCounter}<span class="stylos-alert-timer-count">{timerText}</span>{/if}
      {#if hasHeading}<p class="stylos-alert-heading" id={titleId}
        role={announcement === "off" ? undefined : announcement === "assertive" ? "alert" : "status"}>{headingText}</p>{/if}
      {#if hasUndoButton}<Button size="extra small" variant="outline" tone="base" labelText={undoButtonText} onclick={onundoclick} />{/if}
      {#if hasCloseButton}<span class="stylos-alert-close"><ButtonInner accessibleName={closeAccessibleName} icon={closeIcon} onclick={close} /></span>{/if}
    </div>
    {#if hasContent}<div class="stylos-alert-content">{@render children?.()}</div>{/if}
  </div>
  <div class="stylos-alert-timer-progress" aria-hidden="true"><ProgressBar value={progressValue} hasLabel={false} /></div>
</section>

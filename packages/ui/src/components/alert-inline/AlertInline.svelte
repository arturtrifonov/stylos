<script lang="ts">
  import "./alert-inline.css";
  import Button from "../button/Button.svelte";
  import ButtonInner from "../button-inner/ButtonInner.svelte";
  import Icon from "../icon/Icon.svelte";

  import type { AlertInlineProps } from "./props.ts";
  let { type = "default", isOpen = $bindable(true), hasHeading = true, headingText = "Heading Text",
    hasContent = true, children, hasCloseButton = false, closeAccessibleName = "Close",
    announcement = "polite", onclose,
    hasIcon = true, icon, hasButtons = true, primaryButtonText = "Accept", secondaryButtonText = "Cancel", onprimaryclick, onsecondaryclick,
    hasUndoButton = false, undoButtonText = "Undo", onundoclick }: AlertInlineProps = $props();
  function close() { isOpen = false; onclose?.(new Event("close")); }
  const titleId = $props.id();
</script>

{#snippet closeIcon()}<Icon name="close" />{/snippet}
<section class="stylos-alert stylos-alert-inline" data-type={type}  data-announcement={announcement}
  data-surface-layer="1" data-surface-attachment="in-layout"
  hidden={!isOpen} role={announcement === "off" ? undefined : announcement === "assertive" ? "alert" : "status"}
  aria-atomic={announcement === "off" ? undefined : "true"} aria-labelledby={hasHeading ? titleId : undefined}>
  {#if hasIcon && icon}<span class="stylos-alert-icon" aria-hidden="true">{@render icon()}</span>{/if}
  <div class="stylos-alert-body">
    <div class="stylos-alert-heading-row">
      {#if hasHeading}<p class="stylos-alert-heading" id={titleId}>{headingText}</p>{/if}
      {#if hasUndoButton}<Button size="extra small" variant="outline" tone="base" labelText={undoButtonText} onclick={onundoclick} />{/if}
    </div>
    {#if hasContent}<div class="stylos-alert-content">{@render children?.()}</div>{/if}
    {#if hasButtons}<div class="stylos-alert-actions"><Button size={"small"} tone="primary" labelText={primaryButtonText} onclick={onprimaryclick} /><Button size={"small"} variant="outline" tone="base" labelText={secondaryButtonText} onclick={onsecondaryclick} /></div>{/if}
  </div>
  {#if hasCloseButton}<span class="stylos-alert-close"><ButtonInner accessibleName={closeAccessibleName} icon={closeIcon} onclick={close} /></span>{/if}
</section>

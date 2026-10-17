<script lang="ts">
  import "./alert-popup.css";
  import Button from "../button/Button.svelte";
  import ButtonInner from "../button-inner/ButtonInner.svelte";
  import Icon from "../icon/Icon.svelte";

  import type { AlertPopupProps } from "./props.ts";
  let { size = "extra small", type = "default", isOpen = $bindable(true), hasHeading = true, headingText = "Heading Text",
    hasContent = true, children, hasCloseButton = true, closeAccessibleName = "Close",
    announcement = "polite", onclose,
    hasIcon = true, icon, hasButtons = true, primaryButtonText = "Accept", secondaryButtonText = "Cancel", onprimaryclick, onsecondaryclick }: AlertPopupProps = $props();
  function close() { isOpen = false; onclose?.(new Event("close")); }
  const titleId = $props.id();
</script>

{#snippet closeIcon()}<Icon name="close" />{/snippet}
<section class="stylos-alert stylos-alert-popup" data-type={type} data-size={size} data-announcement={announcement}
  data-surface-layer="6" data-surface-attachment="free"
  hidden={!isOpen} role={announcement === "off" ? undefined : announcement === "assertive" ? "alert" : "status"}
  aria-atomic={announcement === "off" ? undefined : "true"} aria-labelledby={hasHeading ? titleId : undefined}>
  {#if hasIcon && icon}<span class="stylos-alert-icon" aria-hidden="true">{@render icon()}</span>{/if}
  <div class="stylos-alert-body">
    <div class="stylos-alert-heading-row">
      {#if hasHeading}<p class="stylos-alert-heading" id={titleId}>{headingText}</p>{/if}
    </div>
    {#if hasContent}<div class="stylos-alert-content">{@render children?.()}</div>{/if}
    {#if hasButtons}<div class="stylos-alert-actions"><Button size={size} tone="primary" labelText={primaryButtonText} onclick={onprimaryclick} /><Button size={size} variant="outline" tone="base" labelText={secondaryButtonText} onclick={onsecondaryclick} /></div>{/if}
  </div>
  {#if hasCloseButton}<span class="stylos-alert-close"><ButtonInner accessibleName={closeAccessibleName} icon={closeIcon} onclick={close} /></span>{/if}
</section>

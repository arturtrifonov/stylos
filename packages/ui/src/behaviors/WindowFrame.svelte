<script lang="ts">
  import Button from "../components/button/Button.svelte";
  import ButtonInner from "../components/button-inner/ButtonInner.svelte";
  import Icon from "../components/icon/Icon.svelte";
  import type { ModalProps } from "../components/modal/props.ts";
  let { kind, headingId, dismiss, size = "medium", headingText = "", children,
    hasPrimaryButton = true, hasSecondaryButton = true, hasTertiaryButton = false,
    primaryButtonText = "Confirm", secondaryButtonText = "Cancel", tertiaryButtonText = "Alternative",
    closeAccessibleName = "Close", width, onprimaryclick, onsecondaryclick, ontertiaryclick, position = "right" }:
    ModalProps & { kind: "modal" | "drawer"; headingId: string; dismiss: () => void; position?: "left" | "right" } = $props();
  function cancel(event: MouseEvent) {
    onsecondaryclick?.(event);
    if (!event.defaultPrevented) dismiss();
  }
</script>

<div class="stylos-window stylos-{kind}" data-size={size} data-position={position}
  data-state="closed" data-surface-layer={kind === "modal" ? "6" : "5"}
  data-surface-attachment={kind === "modal" ? "free" : "window-edge"} data-surface-edge={position}
  style:--stylos-window-width={width || undefined}>
  <div class="stylos-window-header">
    <h2 class="stylos-window-heading" id={headingId}>{headingText || (kind === "modal" ? "Modal heading" : "Drawer heading")}</h2>
    <ButtonInner accessibleName={closeAccessibleName} onclick={dismiss}>
      {#snippet icon()}<Icon name="close" />{/snippet}
    </ButtonInner>
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (The named Drawer overflow region needs a keyboard scroll target.) -->
  <div class="stylos-window-content stylos-scrollbar" data-scrollbar-size="medium" data-scrollbar-position="absolute"
    tabindex={kind === "drawer" ? 0 : undefined} role={kind === "drawer" ? "region" : undefined}
    aria-labelledby={kind === "drawer" ? headingId : undefined}>
    {#if children}{@render children()}{/if}
  </div>
  {#if hasPrimaryButton || hasSecondaryButton || hasTertiaryButton}
  <div class="stylos-window-footer">
    {#if hasTertiaryButton}<Button {size} variant="ghost" tone="base" labelText={tertiaryButtonText} onclick={ontertiaryclick} />{/if}
    {#if hasSecondaryButton}<Button {size} variant="outline" tone="base" labelText={secondaryButtonText} onclick={cancel} />{/if}
    {#if hasPrimaryButton}<Button {size} tone="primary" labelText={primaryButtonText} onclick={onprimaryclick} />{/if}
  </div>
  {/if}
</div>

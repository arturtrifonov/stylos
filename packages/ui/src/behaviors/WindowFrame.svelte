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
  // The Drawer's overflow region is a tab stop only while it holds nothing
  // focusable: otherwise its controls reach and scroll it, and the extra stop
  // only confused (verification/orca-2026-11-03.md). Chrome and Firefox make
  // such a scroller focusable themselves; Safari does not, hence the attribute.
  // Only a control Tab can actually reach counts: hidden inputs, controls in a
  // disabled fieldset, tabindex="-1", inert or unrendered elements do not.
  const candidates = "a[href], area[href], button, input, select, textarea, iframe, summary, [contenteditable]:not([contenteditable='false']), [tabindex]";
  // Visibility is judged within the region alone, so the window opening or
  // closing around it does not change the answer.
  function reachable(element: HTMLElement, region: HTMLElement) {
    if (element.tabIndex < 0 || element.matches(":disabled, input[type='hidden']") || element.closest("[inert]")) return false;
    for (let node: HTMLElement | null = element; node && node !== region; node = node.parentElement)
      if (getComputedStyle(node).display === "none") return false;
    const visibility = getComputedStyle(element).visibility;
    return visibility === "visible" || visibility === getComputedStyle(region).visibility;
  }
  function scrollStop(region: HTMLElement) {
    // Writes only on a change: the observer also sees this attribute.
    const update = () => {
      const stop = ![...region.querySelectorAll<HTMLElement>(candidates)].some(element => reachable(element, region));
      if (stop && region.getAttribute("tabindex") !== "0") region.setAttribute("tabindex", "0");
      else if (!stop && region.hasAttribute("tabindex")) region.removeAttribute("tabindex");
    };
    update();
    const mutations = new MutationObserver(update);
    mutations.observe(region, { childList: true, subtree: true, attributes: true,
      attributeFilter: ["disabled", "tabindex", "href", "type", "hidden", "inert", "style", "class", "contenteditable"] });
    return () => mutations.disconnect();
  }
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
  <div class="stylos-window-content stylos-scrollbar" data-scrollbar-size="medium" data-scrollbar-position="absolute"
    {@attach kind === "drawer" ? scrollStop : undefined}
    role={kind === "drawer" ? "region" : undefined}
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

// BEH-OVERLAYS-01/04: anchored children stay inside their window's native
// dialog host, outside the clipped visual panel and inside its focus scope.
export function overlayHost(anchor: Element): HTMLElement {
  return anchor.closest<HTMLElement>("[data-overlay-host]") ?? anchor.ownerDocument.body;
}

export function onOwnerDismiss(anchor: Element, close: () => void) {
  const owner = anchor.closest<HTMLElement>("[data-overlay-host]");
  owner?.addEventListener("stylos-window-dismiss", close);
  return () => owner?.removeEventListener("stylos-window-dismiss", close);
}

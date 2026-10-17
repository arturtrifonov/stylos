// Framework-free roving focus with automatic activation, scoped to one list.
export function tabsBehavior(list: HTMLElement) {
  function tabs() { return [...list.querySelectorAll<HTMLButtonElement>(':scope > .stylos-tab-item:not(:disabled)')]; }
  function keydown(event: KeyboardEvent) {
    const options = tabs();
    const current = options.indexOf(event.target as HTMLButtonElement);
    if (current < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const rtl = getComputedStyle(list).direction === "rtl";
    const forward = event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const index = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
      : (current + (forward ? 1 : -1) + options.length) % options.length;
    options[index]?.focus();
    options[index]?.click();
  }
  function initialise() {
    const options = tabs();
    if (!options.some(tab => tab.getAttribute("aria-selected") === "true")) options[0]?.click();
  }
  list.addEventListener("keydown", keydown);
  const observer = new MutationObserver(initialise);
  observer.observe(list, { childList: true, attributes: true, attributeFilter: ["disabled"], subtree: true });
  queueMicrotask(initialise);
  return { destroy() { list.removeEventListener("keydown", keydown); observer.disconnect(); } };
}

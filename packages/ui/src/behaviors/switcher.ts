// Native radio input owns keyboard and form behaviour. Mirror reset into the
// bound group value only if the form's reset was not cancelled by its owner.
export function switcherBehavior(group: HTMLElement, options: { reset: () => void }) {
  let form: HTMLFormElement | null = null;
  let resetFrame: number | undefined;
  function reset(event: Event) {
    if (resetFrame !== undefined) cancelAnimationFrame(resetFrame);
    resetFrame = requestAnimationFrame(() => {
      resetFrame = undefined;
      if (!event.defaultPrevented) { options.reset(); queueMicrotask(initialise); }
    });
  }
  function connect() {
    const next = group.querySelector<HTMLInputElement>("input[type=radio]")?.form ?? null;
    if (next === form) return;
    form?.removeEventListener("reset", reset);
    form = next;
    form?.addEventListener("reset", reset);
  }
  function initialise() {
    connect();
    const inputs = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    if (!inputs.some(input => input.checked)) {
      const first = inputs.find(input => !input.matches(":disabled"));
      if (first) { first.checked = true; first.dispatchEvent(new Event("change", { bubbles: true })); }
    }
  }
  const observer = new MutationObserver(initialise);
  observer.observe(group, { childList: true, attributes: true, attributeFilter: ["form", "disabled"], subtree: true });
  queueMicrotask(initialise);
  return { destroy() {
    observer.disconnect(); form?.removeEventListener("reset", reset);
    if (resetFrame !== undefined) cancelAnimationFrame(resetFrame);
  } };
}

// Framework-free roving focus with automatic activation, plus automatic
// overflow: tabs that do not fit leave the row for the owner's menu. The
// selected tab always stays in the row, taking the last place that fits.

export type TabsBehaviorOptions = {
  /** Values of tabs moved out of the row, in document order. */
  onOverflowChange?: (values: string[]) => void;
};

/**
 * Which tabs stay in the row. Widths are in document order; the row holds
 * `capacity` without the overflow trigger and `overflowCapacity` beside it.
 * Returns the indices that stay visible, in document order.
 */
export function fitTabs(widths: number[], gap: number, capacity: number, overflowCapacity: number, selected = -1): number[] {
  // Fractional layout widths may exceed a hugging row by a rounding error.
  const tolerance = 0.5;
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
  if (total <= capacity + tolerance) return widths.map((_, index) => index);
  const visible: number[] = [];
  let used = 0;
  for (const [index, width] of widths.entries()) {
    const next = used + (visible.length ? gap : 0) + width;
    if (next > overflowCapacity + tolerance) break;
    visible.push(index);
    used = next;
  }
  if (selected >= 0 && !visible.includes(selected)) {
    while (visible.length && used + gap + widths[selected] > overflowCapacity + tolerance) {
      const removed = visible.pop()!;
      used -= widths[removed] + (visible.length ? gap : 0);
    }
    visible.push(selected);
  }
  return visible;
}

export function tabsBehavior(root: HTMLElement, initial: TabsBehaviorOptions = {}) {
  let options = initial;
  const list = root.matches('[role="tablist"]') ? root : root.querySelector<HTMLElement>('[role="tablist"]')!;
  const widths = new WeakMap<Element, number>();
  let reported = "";
  function all() { return [...list.querySelectorAll<HTMLButtonElement>(":scope > .stylos-tab-item")]; }
  function tabs() { return all().filter(tab => !tab.disabled && !tab.hasAttribute("data-overflowed")); }

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

  // Overflow is measured only for an owner that offers hidden tabs in a menu;
  // without one, tabs stay in the row and the row scrolls.
  function layout() {
    if (!options.onOverflowChange) return;
    const items = all();
    for (const tab of items) if (!tab.hasAttribute("data-overflowed")) widths.set(tab, tab.getBoundingClientRect().width);
    const style = getComputedStyle(list);
    const gap = Number.parseFloat(style.columnGap) || 0;
    // The row hangs its first and last label padding outside the root; beside
    // the trigger only the leading overhang remains.
    const hang = -(Number.parseFloat(style.marginInlineStart) || 0);
    const width = root.clientWidth;
    const square = items.find(tab => !tab.hasAttribute("data-overflowed"))?.getBoundingClientRect().height ?? 0;
    const selected = items.findIndex(tab => tab.getAttribute("aria-selected") === "true");
    const visible = new Set(fitTabs(items.map(tab => widths.get(tab) ?? 0), gap, width + 2 * hang, width + hang - square, selected));
    const overflowed = items.filter((_, index) => !visible.has(index));
    for (const [index, tab] of items.entries()) tab.toggleAttribute("data-overflowed", !visible.has(index));
    root.toggleAttribute("data-overflowing", overflowed.length > 0);
    const values = overflowed.map(tab => tab.dataset.value ?? "");
    const key = values.join("\u0000");
    if (key !== reported) { reported = key; options.onOverflowChange?.(values); }
  }

  function initialise() {
    // A selected tab may still be in the menu until layout pulls it into the row.
    const available = all().filter(tab => !tab.disabled);
    if (!available.some(tab => tab.getAttribute("aria-selected") === "true")) available[0]?.click();
    layout();
  }

  list.addEventListener("keydown", keydown);
  const mutations = new MutationObserver(initialise);
  mutations.observe(list, { childList: true, characterData: true, attributes: true,
    attributeFilter: ["disabled", "aria-selected", "data-size"], subtree: true });
  const resizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => layout());
  resizes?.observe(root);
  for (const tab of all()) resizes?.observe(tab);
  const tabObserver = new MutationObserver(() => { for (const tab of all()) resizes?.observe(tab); });
  tabObserver.observe(list, { childList: true });
  queueMicrotask(initialise);
  return {
    update(next: TabsBehaviorOptions) { options = next; layout(); },
    destroy() {
      list.removeEventListener("keydown", keydown);
      mutations.disconnect();
      tabObserver.disconnect();
      resizes?.disconnect();
      for (const tab of all()) tab.removeAttribute("data-overflowed");
      root.removeAttribute("data-overflowing");
    },
  };
}

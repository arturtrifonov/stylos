<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  import Example from "./fixtures/TabsReview.svelte";

  const heights = ["3_000", "4_000", "5_000", "6_000", "7_000"];
  const paddings = ["1_000", "1_250", "1_500", "2_000", "2_500"];
  const bands = ["0_500", "0_500", "0_750", "0_750", "1_000"];
  const lines = ["0_250", "0_250", "0_375", "0_375", "0_500"];
  const icons = ["2_000", "2_500", "3_000", "3_500", "4_000"];
  const opticals = ["0_250", "0_250", "0_250", "0_375", "0_375"];

  const { Story } = defineMeta({
    id: "components-tabs-horizontal",
    title: "Components/Tabs/Tabs Horizontal",
    component: Example,
  });

  function tokens(element: Element) {
    const style = getComputedStyle(element);
    const probe = element.ownerDocument.createElement("span");
    element.ownerDocument.body.append(probe);
    return {
      size: (name: string) => parseFloat(style.getPropertyValue(`--stylos-dimension-${name}`)),
      color: (name: string) => {
        probe.style.color = `var(--stylos-color-${name})`;
        return getComputedStyle(probe).color;
      },
      done: () => probe.remove(),
    };
  }

  function settle(doc: Document) {
    for (const animation of doc.getAnimations()) if (animation instanceof CSSTransition) animation.finish();
  }
</script>

<Story name="Review" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  settle(canvasElement.ownerDocument);
  const token = tokens(canvasElement);
  const anchored = CSS.supports("anchor-name: --stylos-tab-selection");
  for (const [index, row] of [...canvasElement.querySelectorAll<HTMLElement>(".tabs-row")].entries()) {
    const root = row.querySelector<HTMLElement>(".stylos-tabs-horizontal")!;
    const list = root.querySelector<HTMLElement>('[role="tablist"]')!;
    const [selected, leading, badged, trailing, disabled, square, , squareBadge] = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const height = token.size(`size-s-${heights[index]}`);
    const padding = token.size(`gap-g-${paddings[index]}`);
    const optical = token.size(`gap-g-${opticals[index]}`);
    const rootBox = root.getBoundingClientRect();
    const box = (element: Element) => element.getBoundingClientRect();
    // One button per tab: no label or icon wrappers.
    await expect([...selected.children]).toHaveLength(0);
    await expect([...leading.children].map(child => child.tagName)).toEqual(["svg"]);
    await expect([...badged.children].map(child => child.className)).toEqual(["stylos-badge"]);
    await expect(root.querySelector(".stylos-tab-label, .stylos-selection-icon")).toBeNull();
    // Geometry: tab height, band, 1-unit gap and the row's optical hang.
    await expect(box(selected).height).toBeCloseTo(height, 1);
    await expect(rootBox.height).toBeCloseTo(height + token.size(`gap-g-${bands[index]}`), 1);
    await expect(box(leading).left - box(selected).right).toBeCloseTo(token.size("gap-g-0_125"), 1);
    await expect(rootBox.left - box(selected).left).toBeCloseTo(padding, 1);
    // Icons keep their footprint; the padding on their side gives way.
    const mark = box(leading.querySelector("svg")!);
    await expect(mark.width).toBeCloseTo(token.size(`size-s-${icons[index]}`), 1);
    await expect(mark.left - box(leading).left).toBeCloseTo(padding - optical, 1);
    await expect(box(trailing).right - box(trailing.querySelector("svg")!).right).toBeCloseTo(padding - optical, 1);
    await expect(box(square).width).toBeCloseTo(box(square).height, 1);
    // With a badge the icon tab widens: half the free height as padding and gap.
    const inset = (height - token.size(`size-s-${icons[index]}`)) / 2;
    const count = squareBadge.querySelector<HTMLElement>(".stylos-badge")!;
    await expect(count.dataset.size).toBe(row.dataset.size);
    await expect(box(squareBadge).width).toBeCloseTo(2 * inset + token.size(`size-s-${icons[index]}`) + inset + box(count).width, 1);
    await expect(box(squareBadge.querySelector("svg")!).left - box(squareBadge).left).toBeCloseTo(inset, 1);
    // Badge follows size and selection.
    const badge = badged.querySelector<HTMLElement>(".stylos-badge")!;
    await expect(badge.dataset.size).toBe(row.dataset.size);
    await expect(badge.dataset.tone).toBe("base");
    // Colours.
    await expect(getComputedStyle(selected).color).toBe(token.color("text-primary"));
    await expect(getComputedStyle(leading).color).toBe(token.color("text-base"));
    await expect(getComputedStyle(disabled).color).toBe(token.color("text-disabled"));
    // The indicator spans the selected tab's content, at the bottom of the band.
    if (anchored) {
      const indicator = getComputedStyle(list, "::after");
      await expect(parseFloat(indicator.left) - (box(selected).left - box(list).left)).toBeCloseTo(padding, 1);
      await expect(parseFloat(indicator.width)).toBeCloseTo(box(selected).width - 2 * padding, 1);
      await expect(parseFloat(indicator.height)).toBeCloseTo(token.size(`gap-g-${lines[index]}`), 1);
      await expect(indicator.backgroundColor).toBe(token.color("surface-bold-primary-default"));
    }
  }
  token.done();
}}>
  {#snippet template()}<Example />{/snippet}
</Story>

<Story name="Overflow" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const section = canvasElement.querySelector<HTMLElement>(".tabs-overflow")!;
  const canvas = within(section);
  const root = section.querySelector<HTMLElement>(".stylos-tabs-horizontal")!;
  const tabs = () => [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
  const hidden = () => tabs().filter(tab => tab.hasAttribute("data-overflowed")).map(tab => tab.dataset.value);
  await waitFor(() => expect(root).toHaveAttribute("data-overflowing"));
  const trigger = canvas.getByRole("combobox", { name: "More tabs" });
  await expect(trigger).toBeVisible();
  const before = hidden();
  await expect(before.length).toBeGreaterThan(0);
  // The row ends before the trigger.
  const lastVisible = tabs().filter(tab => !tab.hasAttribute("data-overflowed")).at(-1)!;
  await expect(lastVisible.getBoundingClientRect().right).toBeLessThanOrEqual(trigger.getBoundingClientRect().left + 0.5);
  await userEvent.click(trigger);
  const listbox = canvasElement.ownerDocument.getElementById(trigger.getAttribute("aria-controls")!)!;
  const options = [...listbox.querySelectorAll<HTMLElement>('[role="option"]')];
  await expect(options.map(option => option.dataset.value)).toEqual(before);
  const target = before.at(-1)!;
  await userEvent.click(options.at(-1)!);
  // The chosen tab joins the row as its last visible tab; one change event.
  await waitFor(() => expect(tabs().find(tab => tab.dataset.value === target)).toHaveAttribute("aria-selected", "true"));
  await waitFor(() => expect(hidden()).not.toContain(target));
  await expect(canvas.getByRole("status")).toHaveTextContent("Changes: 1");
  await expect(canvas.getByRole("tabpanel")).toHaveTextContent(`Panel: ${target}`);
}}>
  {#snippet template()}<Example />{/snippet}
</Story>

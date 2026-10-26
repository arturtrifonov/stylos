<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  import Example from "./fixtures/SwitcherReview.svelte";
  import SwitcherForm from "./fixtures/SwitcherForm.svelte";

  const heights = ["2_500", "3_250", "4_000", "4_750", "5_500"];
  const paddings = ["1_250", "1_500", "1_750", "2_250", "2_500"];
  const icons = ["1_750", "2_000", "2_250", "2_500", "2_750"];
  const insets = ["0_125", "0_250", "0_375", "0_500", "0_625"];
  const gaps = ["0_125", "0_125", "0_250", "0_375", "0_500"];

  const { Story } = defineMeta({
    id: "components-switcher",
    title: "Components/Switcher/Switcher",
    component: Example,
  });

  // The bold selection surface: the group's anchored indicator where anchor
  // positioning exists, otherwise the checked segment's own background.
  function selection(group: HTMLElement, item: HTMLElement) {
    if (!CSS.supports("anchor-name: --stylos-switcher-selection")) {
      return { background: getComputedStyle(item).backgroundColor, offset: [0, 0, 0, 0] };
    }
    const surface = getComputedStyle(group, "::after");
    const groupBox = group.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(group).borderTopWidth);
    return {
      background: surface.backgroundColor,
      itemBackground: getComputedStyle(item).backgroundColor,
      offset: [
        parseFloat(surface.left) - (itemBox.left - groupBox.left - border),
        parseFloat(surface.top) - (itemBox.top - groupBox.top - border),
        parseFloat(surface.width) - itemBox.width,
        parseFloat(surface.height) - itemBox.height,
      ],
    };
  }

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
</script>

<Story name="Review" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  // The first segment is selected after mount; measure its settled colours.
  for (const animation of canvasElement.ownerDocument.getAnimations()) animation.finish();
  const token = tokens(canvasElement);
  for (const section of canvasElement.querySelectorAll<HTMLElement>(".switcher-tone")) {
    const primary = section.dataset.tone === "primary";
    for (const [index, row] of [...section.querySelectorAll<HTMLElement>(".switcher-row")].entries()) {
      const [texts, withIcons, squares, disabled] = row.querySelectorAll<HTMLFieldSetElement>(".stylos-switcher");
      for (const group of [texts, withIcons, squares, disabled]) {
        const style = getComputedStyle(group);
        const items = [...group.querySelectorAll<HTMLElement>(":scope > label")];
        const border = parseFloat(style.borderTopWidth);
        const inset = token.size(`gap-g-${insets[index]}`);
        await expect(parseFloat(style.paddingTop)).toBeCloseTo(inset, 2);
        await expect(style.borderTopColor).toBe(token.color(primary ? "border-primary" : "border-default"));
        await expect(group.getBoundingClientRect().height).toBeCloseTo(token.size(`size-s-${heights[index]}`) + 2 * (inset + border), 1);
        for (const [position, item] of items.entries()) {
          await expect(item.getBoundingClientRect().height).toBeCloseTo(token.size(`size-s-${heights[index]}`), 1);
          if (position > 0) {
            await expect(item.getBoundingClientRect().left - items[position - 1].getBoundingClientRect().right).toBeCloseTo(token.size(`gap-g-${gaps[index]}`), 1);
          }
        }
      }

      const [selected, rest] = [...texts.querySelectorAll<HTMLElement>(":scope > label")];
      await expect([...selected.children].map(child => child.tagName)).toEqual(["INPUT"]);
      await expect(selected.querySelector("input")!.checked).toBe(true);
      const surface = selection(texts, selected);
      await expect(surface.background).toBe(token.color(`surface-bold-${primary ? "primary" : "base"}-default`));
      for (const delta of surface.offset) await expect(Math.abs(delta)).toBeLessThan(0.5);
      if (surface.itemBackground) await expect(surface.itemBackground).toBe("rgba(0, 0, 0, 0)");
      await expect(getComputedStyle(selected).color).toBe(token.color("text-inverted"));
      await expect(getComputedStyle(rest).color).toBe(token.color(primary ? "text-primary" : "text-base"));
      await expect(getComputedStyle(rest).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      await expect(parseFloat(getComputedStyle(rest).paddingLeft)).toBeCloseTo(token.size(`gap-g-${paddings[index]}`), 2);

      const [leading, trailing, unavailable] = [...withIcons.querySelectorAll<HTMLElement>(":scope > label")];
      const optical = token.size("gap-g-0_250");
      const padding = token.size(`gap-g-${paddings[index]}`);
      const leadingIcon = leading.querySelector(":scope > svg")!.getBoundingClientRect();
      const trailingIcon = trailing.querySelector(":scope > svg")!.getBoundingClientRect();
      await expect(leadingIcon.width).toBeCloseTo(token.size(`size-s-${icons[index]}`), 1);
      await expect(leadingIcon.left - leading.getBoundingClientRect().left).toBeCloseTo(padding - optical, 1);
      await expect(trailing.getBoundingClientRect().right - trailingIcon.right).toBeCloseTo(padding - optical, 1);
      await expect(getComputedStyle(unavailable).backgroundColor).toBe(token.color(`surface-subtle-${primary ? "primary" : "base"}-disabled`));
      await expect(getComputedStyle(unavailable).color).toBe(token.color("text-disabled"));

      for (const square of squares.querySelectorAll<HTMLElement>(":scope > label")) {
        const box = square.getBoundingClientRect();
        const mark = square.querySelector(":scope > svg")!.getBoundingClientRect();
        await expect([...square.children].map(child => child.tagName)).toEqual(["INPUT", "svg"]);
        await expect(box.width).toBeCloseTo(box.height, 1);
        await expect(mark.width).toBeCloseTo(token.size(`size-s-${icons[index]}`), 1);
        await expect(mark.left + mark.width / 2).toBeCloseTo(box.left + box.width / 2, 1);
      }

      const lockedSelection = disabled.querySelector<HTMLElement>(":scope > label")!;
      await expect(disabled.disabled).toBe(true);
      await expect(getComputedStyle(lockedSelection).color).toBe(token.color("text-disabled"));
    }
  }
  token.done();
}}>
  {#snippet template()}<Example />{/snippet}
</Story>

<Story name="Keyboard and form" play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const grid = canvas.getByRole("radio", { name: "Grid view" });
  const list = canvas.getByRole("radio", { name: "List" });
  await expect(canvas.getByRole("group", { name: "Workspace view" })).toBeInTheDocument();
  await expect(list).toBeChecked();
  await userEvent.click(list);
  await userEvent.keyboard("{ArrowRight}");
  if (CSS.supports("anchor-name: --stylos-switcher-selection")) {
    const slide = canvasElement.ownerDocument.getAnimations()
      .find(animation => (animation as CSSTransition).transitionProperty === "left") as CSSTransition | undefined;
    await expect((slide?.effect as KeyframeEffect | null)?.pseudoElement).toBe("::after");
    await expect(slide?.effect?.getTiming().duration).toBe(220);
    const [from, to] = slide!.effect!.getKeyframes().map(frame => parseFloat(String(frame.left)));
    await expect(to).toBeGreaterThan(from);
  }
  await expect(grid).toBeChecked();
  await expect(grid).toHaveFocus();
  await expect(canvas.getByRole("status")).toHaveTextContent("grid");
  await expect(new FormData(canvasElement.querySelector("form")!).get("view")).toBe("grid");
  await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
  await waitFor(() => expect(list).toBeChecked());
  await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("list"));
  await expect(canvas.getByRole("radio", { name: "Archived" })).toBeDisabled();
}}>
  {#snippet template()}<SwitcherForm />{/snippet}
</Story>

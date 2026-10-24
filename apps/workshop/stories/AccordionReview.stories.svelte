<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within } from "storybook/test";
  import { Accordion, Icon } from "@stylos/ui";
  import Example from "./fixtures/AccordionReview.svelte";

  const sizes = ["extra small", "small", "medium", "large", "extra large"] as const;
  const { Story } = defineMeta({
    id: "components-accordion",
    title: "Components/Accordion/Accordion",
    component: Example,
    args: { size: "medium", expandIconPosition: "trailing", expandIcon: "chevron", hasIcon: false },
    argTypes: {
      size: { control: "inline-radio", options: sizes },
      expandIconPosition: { control: "inline-radio", options: ["leading", "trailing"] },
      expandIcon: { control: "inline-radio", options: ["chevron", "plus", "dropdown"] },
      hasIcon: { control: "boolean" },
    },
  });
</script>

<Story name="Review" />

<Story name="Interaction checks" play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByRole("button", { name: "Workspace settings" });
  const heading = canvas.getByRole("heading", { name: "Workspace settings", level: 2 });
  const panel = canvasElement.querySelector<HTMLElement>("#accordion-review-body")!;
  const input = panel.querySelector("input")!;
  const originalHeading = heading;
  await expect(heading).toContainElement(button);
  await expect(button).toHaveAttribute("aria-controls", panel.id);
  await expect(panel).not.toBeVisible();
  await expect(canvas.getByRole("button", { name: "Unavailable section" })).toBeDisabled();
  button.focus();
  await userEvent.keyboard(" ");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();
  await userEvent.tab();
  await expect(input).toHaveFocus();
  await userEvent.type(input, "Keep this value");
  button.focus();
  await userEvent.keyboard("{Enter}");
  await expect(panel).toHaveAttribute("inert");
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect(panel).not.toBeVisible();
  await expect(button).toHaveFocus();
  await userEvent.tab();
  await expect(canvas.getByRole("button", { name: "RTL section" })).toHaveFocus();
  await userEvent.click(button);
  await expect(panel.querySelector("input")).toBe(input);
  await expect(input).toHaveValue("Keep this value");
  await expect(canvas.getByRole("heading", { name: "Workspace settings", level: 2 })).toBe(originalHeading);
  await expect(canvas.getByRole("status")).toHaveTextContent("Disclosure changes: 3");
}} />

<Story name="Densities" parameters={{ controls: { exclude: ["size"] } }} play={async ({ canvasElement, args }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const heights = ["3_000", "4_000", "5_000", "6_000", "7_000"];
  const iconSizes = ["2_000", "2_500", "3_000", "3_500", "4_000"];
  for (const [index, sample] of [...canvasElement.querySelectorAll<HTMLElement>(".accordion-density")].entries()) {
    const root = sample.querySelector<HTMLElement>(".stylos-accordion")!;
    const header = root.querySelector<HTMLButtonElement>("button")!;
    const panel = root.querySelector<HTMLElement>(".stylos-accordion-body")!;
    const style = getComputedStyle(root);
    const token = (name: string) => parseFloat(style.getPropertyValue(`--stylos-${name}`));
    const outerInset = token("dimension-gap-g-0_500");
    await expect(header.getBoundingClientRect().height).toBeCloseTo(token(`dimension-size-s-${heights[index]}`), 1);
    await expect(root.getBoundingClientRect().height).toBeCloseTo(header.getBoundingClientRect().height + 2 * outerInset, 1);
    await expect(header.getBoundingClientRect().top - root.getBoundingClientRect().top).toBeCloseTo(outerInset, 1);
    const icon = header.querySelector<SVGElement>(":scope > svg")!;
    const optical = token(`dimension-gap-g-${index < 3 ? "0_250" : "0_375"}`);
    const headerBox = header.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    const headerStyle = getComputedStyle(header);
    await expect(iconBox.width).toBeCloseTo(token(`dimension-size-s-${iconSizes[index]}`), 1);
    if (args.expandIconPosition === "leading") {
      await expect(iconBox.left).toBeCloseTo(headerBox.left + parseFloat(headerStyle.paddingLeft) - optical, 1);
    } else {
      await expect(iconBox.right).toBeCloseTo(headerBox.right - parseFloat(headerStyle.paddingRight) + optical, 1);
    }
    const title = root.querySelector<HTMLElement>(".stylos-accordion-title")!;
    const text = canvasElement.ownerDocument.createRange();
    text.selectNodeContents(title);
    const ink = text.getBoundingClientRect();
    await expect(ink.top).toBeGreaterThanOrEqual(title.getBoundingClientRect().top);
    await expect(ink.bottom).toBeLessThanOrEqual(title.getBoundingClientRect().bottom);
    await userEvent.click(header);
    await expect(panel.getBoundingClientRect().top - header.getBoundingClientRect().bottom).toBeCloseTo(parseFloat(style.getPropertyValue("--_stylos-input-gap")), 1);
    const bodyPadding = index === 2 ? token("dimension-gap-g-0_625") : parseFloat(style.getPropertyValue("--_stylos-input-gap"));
    await expect(parseFloat(getComputedStyle(panel).paddingTop)).toBeCloseTo(bodyPadding, 1);
    await expect(getComputedStyle(panel).overflow).toBe("visible");
  }
}}>
  {#snippet template(args)}
    {#snippet mark()}<Icon name="add" />{/snippet}
    <div class="accordion-densities">
      {#each sizes as size}
        <div class="accordion-density">
          <p>{size}</p>
          <Accordion {size} expandIconPosition={args.expandIconPosition} expandIcon={args.expandIcon}
            hasIcon={args.hasIcon} icon={mark} labelText="Workspace settings">
            <p class="density-content">Related section content.</p>
          </Accordion>
        </div>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Expand icons" parameters={{ controls: { exclude: ["expandIcon"] } }} play={async ({ canvasElement }) => {
  const pairs = { chevron: ["expand_more", "expand_less"], plus: ["add", "remove"], dropdown: ["arrow_drop_down", "arrow_drop_up"] };
  const roots = [...canvasElement.querySelectorAll<HTMLElement>(".stylos-accordion")];
  for (const [index, root] of roots.entries()) {
    const pair = pairs[root.dataset.expandIcon as keyof typeof pairs];
    const header = root.querySelector<HTMLButtonElement>("button")!;
    await expect(root.querySelector(".stylos-accordion-header > svg")).toHaveAttribute("data-name", pair[0]);
    if (index > 0) {
      await expect(parseFloat(getComputedStyle(root).borderTopWidth)).toBe(0);
      await expect(parseFloat(getComputedStyle(roots[index - 1]).borderBottomWidth)).toBeGreaterThan(0);
      await expect(root.getBoundingClientRect().top).toBeCloseTo(roots[index - 1].getBoundingClientRect().bottom, 1);
    }
    await userEvent.click(header);
    await expect(root.querySelector(".stylos-accordion-header > svg")).toHaveAttribute("data-name", pair[1]);
  }
}}>
  {#snippet template(args)}
    {#snippet mark()}<Icon name="add" />{/snippet}
    <div class="accordion-icon-choices">
      {#each ["chevron", "plus", "dropdown"] as expandIcon}
        <Accordion size={args.size} expandIconPosition={args.expandIconPosition} {expandIcon}
          hasIcon={args.hasIcon} icon={mark} labelText={`${expandIcon} / Workspace settings`}>
          <p class="density-content">This sibling shares one divider with the previous section.</p>
        </Accordion>
      {/each}
    </div>
  {/snippet}
</Story>

<style>
  .accordion-densities,
  .accordion-icon-choices { width: 21.25rem; max-width: 100%; }
  .accordion-density + .accordion-density { margin-block-start: var(--stylos-dimension-gap-g-1_500); }
  .density-content { margin: 0; }
</style>

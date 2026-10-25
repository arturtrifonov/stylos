<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, fn, userEvent, within } from "storybook/test";
  import { AlertInline } from "@stylos/ui";
  import Example from "./fixtures/AlertInlineExample.svelte";

  const types = ["default", "warning", "danger", "success"] as const;
  const sizes = ["extra small", "small", "medium", "large", "extra large"] as const;
  const primary = fn();
  const secondary = fn();
  const close = fn();
  const { Story } = defineMeta({
    id: "components-alert-inline",
    title: "Components/Alert/Alert Inline",
    component: AlertInline,
  });
</script>

<Story name="Variants" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const roots = canvasElement.querySelectorAll<HTMLElement>(".stylos-alert-inline");
  await expect(roots).toHaveLength(types.length);
  for (const root of roots) {
    const heading = root.querySelector<HTMLElement>(".stylos-alert-heading")!;
    const line = parseFloat(getComputedStyle(heading).lineHeight);
    const slot = root.querySelector<HTMLElement>(".stylos-alert-icon")!;
    const icon = slot.querySelector("svg")!.getBoundingClientRect();
    const box = slot.getBoundingClientRect();
    await expect(box.height).toBeCloseTo(line, 1);
    await expect(box.top).toBeCloseTo(heading.getBoundingClientRect().top, 1);
    await expect(icon.top - box.top).toBeCloseTo(box.bottom - icon.bottom, 1);
    await expect(root.querySelector(".stylos-alert-heading-row")).toBeNull();
    for (const button of root.querySelectorAll(".stylos-alert-actions button")) {
      await expect(button).toHaveAttribute("data-size", "extra small");
    }
    const close = root.querySelector<HTMLButtonElement>(":scope > .stylos-button-inner")!;
    const closeBox = close.getBoundingClientRect();
    await expect(closeBox.width).toBeCloseTo(closeBox.height, 1);
    await expect(closeBox.top + closeBox.height / 2).toBeCloseTo(heading.getBoundingClientRect().top + line / 2, 1);
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  }
}}>
  {#snippet template()}
    <div class="inline-review-grid">
      {#each types as type}
        <div>
          <p class="stylos-label-base-small">{type}</p>
          <Example {type} />
        </div>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Densities" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const roots = canvasElement.querySelectorAll<HTMLElement>(".stylos-alert-inline");
  await expect(roots).toHaveLength(sizes.length * types.length);
  for (const root of roots) {
    const heading = root.querySelector<HTMLElement>(".stylos-alert-heading")!;
    const line = parseFloat(getComputedStyle(heading).lineHeight);
    await expect(line % 2).toBe(0);
    for (const slot of root.querySelectorAll<HTMLElement>(".stylos-alert-icon")) {
      const box = slot.getBoundingClientRect();
      const icon = slot.querySelector("svg")!.getBoundingClientRect();
      await expect(box.height).toBeCloseTo(line, 1);
      await expect(box.top).toBeCloseTo(heading.getBoundingClientRect().top, 1);
      await expect(icon.top - box.top).toBeCloseTo(box.bottom - icon.bottom, 1);
    }
    for (const button of root.querySelectorAll(".stylos-alert-actions button")) {
      await expect(button).toHaveAttribute("data-size", root.dataset.size!);
    }
    await expect(getComputedStyle(root).boxShadow).not.toBe("none");
    if (root.dataset.type === "default") {
      const outline = root.querySelector<HTMLElement>(".stylos-button-outline")!;
      await expect(getComputedStyle(root).borderColor).toBe(getComputedStyle(outline, "::before").borderColor);
    }
    const close = root.querySelector<HTMLButtonElement>(":scope > .stylos-button-inner")!;
    const closeBox = close.getBoundingClientRect();
    await expect(closeBox.width).toBeCloseTo(closeBox.height, 1);
    await expect(closeBox.top + closeBox.height / 2).toBeCloseTo(heading.getBoundingClientRect().top + line / 2, 1);
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  }
}}>
  {#snippet template()}
    <div class="inline-densities">
      {#each sizes as size, index}
        {#each types as type}
          <div class="inline-density" style:width={`${400 + index * 20}px`}>
            <p class="stylos-label-base-small">{size} / {type}</p>
            <Example {size} {type} hasCloseButton={true} />
          </div>
        {/each}
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Optional content" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const [wrapped, noHeading, noIcon] = canvasElement.querySelectorAll<HTMLElement>(".stylos-alert-inline");
  const heading = wrapped.querySelector<HTMLElement>(".stylos-alert-heading")!;
  const line = parseFloat(getComputedStyle(heading).lineHeight);
  await expect(heading.getBoundingClientRect().height).toBeGreaterThan(line);
  const closeBox = wrapped.querySelector(":scope > .stylos-button-inner")!.getBoundingClientRect();
  await expect(closeBox.top + closeBox.height / 2).toBeCloseTo(heading.getBoundingClientRect().top + line / 2, 1);
  await expect(noHeading.querySelector(".stylos-alert-heading")).toBeNull();
  const body = noHeading.querySelector(".stylos-alert-body")!.getBoundingClientRect();
  await expect(noHeading.querySelector(".stylos-alert-content")!.getBoundingClientRect().top).toBeCloseTo(body.top, 1);
  await expect(noHeading.querySelector(".stylos-alert-actions")).toBeNull();
  await expect(noIcon.querySelector(".stylos-alert-icon")).toBeNull();
}}>
  {#snippet template()}
    <div class="inline-review-grid">
      <Example headingText="Workspace settings and notification preferences for everyone on the team" hasCloseButton={true} />
      <Example hasHeading={false} hasCloseButton={true} hasButtons={false} />
      <Example hasIcon={false} hasButtons={false} />
    </div>
  {/snippet}
</Story>

<Story name="Interaction checks" play={async ({ canvasElement }) => {
  primary.mockClear();
  secondary.mockClear();
  close.mockClear();
  const canvas = within(canvasElement);
  const root = canvasElement.querySelector<HTMLElement>(".stylos-alert-inline")!;
  await userEvent.click(canvas.getByRole("button", { name: "Accept" }));
  await expect(primary).toHaveBeenCalledTimes(1);
  await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
  await expect(secondary).toHaveBeenCalledTimes(1);
  await expect(root).toBeVisible();
  await userEvent.click(canvas.getByRole("button", { name: "Close" }));
  await expect(close).toHaveBeenCalledTimes(1);
  await expect(root).not.toBeVisible();
}}>
  {#snippet template()}
    <div class="inline-review-grid">
      <Example size="extra large" hasHeading={false} hasCloseButton={true} onprimaryclick={primary} onsecondaryclick={secondary} onclose={close} />
    </div>
  {/snippet}
</Story>

<style>
  .inline-review-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 400px)); align-items: start; gap: 24px; }
  .inline-densities { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr)); align-items: start; gap: 24px; }
  .inline-density { max-width: 100%; }
</style>

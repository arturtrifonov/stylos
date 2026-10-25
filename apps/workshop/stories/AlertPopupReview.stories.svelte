<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect } from "storybook/test";
  import { AlertPopup } from "@stylos/ui";
  import Example from "./fixtures/AlertPopupExample.svelte";

  const sizes = ["extra small", "small", "medium", "large", "extra large"] as const;
  const types = ["default", "warning", "danger", "success"] as const;
  const { Story } = defineMeta({
    id: "components-alert-popup",
    title: "Components/Alert/Alert Popup",
    component: AlertPopup,
  });
</script>

<Story name="Densities" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const roots = canvasElement.querySelectorAll<HTMLElement>(".popup-density .stylos-alert-popup");
  await expect(roots).toHaveLength(sizes.length * types.length);
  for (const root of roots) {
    const heading = root.querySelector<HTMLElement>(".stylos-alert-heading")!;
    const line = parseFloat(getComputedStyle(heading).lineHeight);
    await expect(line % 2).toBe(0);
    for (const slot of root.querySelectorAll<HTMLElement>(".stylos-alert-icon, .stylos-alert-close")) {
      const box = slot.getBoundingClientRect();
      const icon = slot.querySelector("svg")!.getBoundingClientRect();
      await expect(box.height).toBeCloseTo(line, 1);
      await expect(box.top).toBeCloseTo(heading.getBoundingClientRect().top, 1);
      await expect(icon.top - box.top).toBeCloseTo(box.bottom - icon.bottom, 1);
    }
    await expect(root.querySelector(".stylos-alert-heading-row")).toBeNull();
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  }
}}>
  {#snippet template()}
    <div class="popup-densities">
      {#each sizes as size, index}
        {#each types as type}
          <div class="popup-density" style:width={`${400 + index * 20}px`}>
            <p class="stylos-label-base-small">{size} / {type}</p>
            <Example {size} {type} />
          </div>
        {/each}
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Heading layout" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const [wrapped, absent] = canvasElement.querySelectorAll<HTMLElement>(".stylos-alert-popup");
  const heading = wrapped.querySelector<HTMLElement>(".stylos-alert-heading")!;
  const line = parseFloat(getComputedStyle(heading).lineHeight);
  await expect(heading.getBoundingClientRect().height).toBeGreaterThan(line);
  await expect(wrapped.querySelector(".stylos-alert-icon")!.getBoundingClientRect().height).toBeCloseTo(line, 1);
  await expect(absent.querySelector(".stylos-alert-heading")).toBeNull();
  await expect(absent.querySelector(".stylos-alert-heading-row")).toBeNull();
  const body = absent.querySelector(".stylos-alert-body")!.getBoundingClientRect();
  const content = absent.querySelector(".stylos-alert-content")!.getBoundingClientRect();
  await expect(content.top).toBeCloseTo(body.top, 1);
}}>
  {#snippet template()}
    <div class="popup-heading-cases">
      <Example size="medium" headingText="Workspace settings and notification preferences for everyone on the team" />
      <Example size="medium" hasHeading={false} />
    </div>
  {/snippet}
</Story>

<style>
  .popup-densities { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr)); gap: 24px; }
  .popup-density { max-width: 100%; }
  .popup-heading-cases { display: grid; gap: 24px; max-width: 440px; }
</style>

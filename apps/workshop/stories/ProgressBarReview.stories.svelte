<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within } from "storybook/test";
  import { ProgressBar } from "@stylos/ui";
  import UpdatingProgress from "./fixtures/UpdatingProgress.svelte";
  import ProgressFillDemo from "./fixtures/ProgressFillDemo.svelte";

  const values = [...Array.from({ length: 11 }, (_, i) => String(i * 10)), "unknown"];
  const { Story } = defineMeta({
    id: "components-progress-bar",
    title: "Components/Progress/Progress Bar",
    component: ProgressBar,
  });
</script>

<Story name="Values" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const roots = canvasElement.querySelectorAll<HTMLElement>(".stylos-progress-bar");
  await expect(roots).toHaveLength(values.length);
  for (const [index, root] of Array.from(roots).entries()) {
    const progress = root.querySelector("progress")!;
    const label = root.querySelector<HTMLElement>(".stylos-progress-label")!;
    await expect(root.getBoundingClientRect().width).toBeCloseTo(220, 1);
    await expect(progress.getBoundingClientRect().height).toBeCloseTo(8, 1);
    await expect(getComputedStyle(root).gap).toBe("4px");
    await expect(getComputedStyle(label).fontSize).toBe("12px");
    await expect(getComputedStyle(label).fontWeight).toBe("450");
    const barBox = progress.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    await expect(barBox.top + barBox.height / 2).toBeCloseTo(labelBox.top + labelBox.height / 2, 1);
    if (values[index] === "unknown") {
      await expect(progress).not.toHaveAttribute("value");
      await expect(progress.matches(":indeterminate")).toBe(true);
      await expect(getComputedStyle(progress).backgroundImage).toContain("linear-gradient");
    } else {
      await expect(progress.value).toBe(Number(values[index]));
    }
  }
}}>
  {#snippet template()}
    <div class="progress-values">
      {#each values as value}
        <ProgressBar {value} labelText="20" accessibleName={`Example ${value}`} />
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Label options" play={async ({ canvasElement }) => {
  const roots = canvasElement.querySelectorAll<HTMLElement>(".stylos-progress-bar");
  await expect(roots[0].querySelector(".stylos-progress-label")).toHaveTextContent("37.5");
  await expect(roots[1].querySelector("progress")).toHaveAttribute("aria-valuetext", "3 of 8 files");
  await expect(roots[2].querySelector(".stylos-progress-label")).toBeNull();
  await expect(roots[3].querySelector(".stylos-progress-label")).toBeNull();
  await expect(roots[3].querySelector("progress")).not.toHaveAttribute("value");
  await expect(roots[4].querySelector(".stylos-progress-label")).toHaveTextContent("Preparing");
  for (const root of roots) await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  for (const root of roots) {
    await expect(root.querySelector("progress")!.getBoundingClientRect().height).toBeCloseTo(8, 4);
    await expect(getComputedStyle(root.querySelector("progress")!).height).toBe("8px");
  }
}}>
  {#snippet template()}
    <div class="progress-options">
      <ProgressBar value="37.5%" accessibleName="File import" />
      <ProgressBar value="37.5" labelText="3 of 8 files" accessibleName="File import" />
      <ProgressBar value="37.5" hasLabel={false} accessibleName="File import" />
      <ProgressBar value="unknown" accessibleName="File import" />
      <ProgressBar value="unknown" labelText="Preparing" accessibleName="File import" />
    </div>
  {/snippet}
</Story>

<Story name="Filling">
  {#snippet template()}<ProgressFillDemo />{/snippet}
</Story>

<Story name="Fixed label width" play={async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const roots = canvasElement.querySelectorAll<HTMLElement>(".stylos-progress-bar");
  const firstTrackWidth = roots[0].querySelector("progress")!.getBoundingClientRect().width;
  const firstLabelWidth = roots[0].querySelector(".stylos-progress-label")!.getBoundingClientRect().width;
  for (const root of roots) {
    const track = root.querySelector("progress")!;
    const label = root.querySelector<HTMLElement>(".stylos-progress-label")!;
    await expect(track.getBoundingClientRect().width).toBeCloseTo(firstTrackWidth, 4);
    await expect(label.getBoundingClientRect().width).toBeCloseTo(firstLabelWidth, 4);
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
    await expect(track.getBoundingClientRect().height).toBeCloseTo(8, 4);
    await expect(getComputedStyle(label).fontVariantNumeric).toBe("tabular-nums");
  }
}}>
  {#snippet template()}
    <div class="progress-options">
      {#each ["0", "9", "10", "99", "100"] as value}
        <ProgressBar {value} labelText={`${value}%`} labelWidth="5ch" accessibleName={`Progress ${value}%`} />
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Interaction checks" play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const progress = canvas.getByRole("progressbar", { name: "Workspace import" });
  await expect(progress).not.toHaveAttribute("value");
  await userEvent.click(canvas.getByRole("button", { name: "37.5%" }));
  await expect(progress).toHaveAttribute("value", "37.5");
  await expect(canvasElement.querySelector(".stylos-progress-label")).toHaveTextContent("37.5");
  await userEvent.click(canvas.getByRole("button", { name: "Unknown" }));
  await expect(progress).not.toHaveAttribute("value");
  await expect(canvasElement.querySelector(".stylos-progress-label")).toBeNull();
  await userEvent.click(canvas.getByRole("button", { name: "Complete" }));
  await expect(progress).toHaveAttribute("value", "100");
}}>
  {#snippet template()}<UpdatingProgress />{/snippet}
</Story>

<style>
  .progress-values { display: grid; gap: 20px; width: 220px; padding-block: 8px; }
  .progress-options { display: grid; gap: 24px; max-width: 320px; padding-block: 8px; }
</style>

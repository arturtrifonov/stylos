<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Tooltip } from "@stylos/ui";
  import type { TooltipProps } from "@stylos/ui";
  import Example from "./fixtures/TooltipExample.svelte";
  import { expect, userEvent, waitFor, within } from "storybook/test";

  const { Story } = defineMeta({
    title: "Components/Tooltip",
    component: Tooltip,
  });
</script>

<Story name="Interaction" args={{ tooltipText: "Tooltip text" }} play={async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByRole("button", { name: "Hover or focus me" });
  const doc = canvasElement.ownerDocument;
  const content = doc.getElementById(`stylos-tooltip-${button.getAttribute("data-ownedby")}`)!;
  const originalDescription = button.getAttribute("aria-describedby")!;
  await expect(content).not.toBeVisible();

  await step("Hover opens and preserves the original description", async () => {
    await userEvent.hover(button);
    await waitFor(() => expect(content).toHaveAttribute("data-state", "open"));
    await waitFor(() => expect(content).toBeVisible());
    await expect(button).toHaveAttribute("aria-describedby", `${originalDescription} ${content.id}`);
    await expect(content).toHaveAttribute("role", "tooltip");
  });

  await step("Moving onto the surface keeps it open; leaving closes it", async () => {
    await userEvent.hover(content);
    // Wait beyond the leave grace period: an incorrectly unretained surface closes.
    await new Promise((resolve) => setTimeout(resolve, 250));
    await expect(content).toHaveAttribute("data-state", "open");
    await userEvent.unhover(content);
    await waitFor(() => expect(content).toHaveAttribute("data-state", "closed"));
    await waitFor(() => expect(content).not.toBeVisible());
    await expect(button).toHaveAttribute("aria-describedby", originalDescription);
  });

  await step("Keyboard focus opens and Escape closes without moving focus", async () => {
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(content).toHaveAttribute("data-state", "open"));
    await userEvent.hover(button);
    await userEvent.unhover(button);
    await new Promise((resolve) => setTimeout(resolve, 250));
    await expect(content).toHaveAttribute("data-state", "open");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(content).toHaveAttribute("data-state", "closed"));
    await expect(button).toHaveFocus();
    await expect(button).toHaveAttribute("aria-describedby", originalDescription);
    await userEvent.tab();
    await expect(button).not.toHaveFocus();
  });

  await step("Click closes without replacing the control's action", async () => {
    await userEvent.hover(button);
    await waitFor(() => expect(content).toHaveAttribute("data-state", "open"));
    await userEvent.click(button);
    await waitFor(() => expect(content).toHaveAttribute("data-state", "closed"));
    await expect(button).toHaveAttribute("data-activations", "1");
  });

  await step("Escape also dismisses during the pointer-leave grace period", async () => {
    await userEvent.tab();
    await userEvent.unhover(button);
    await userEvent.hover(button);
    await waitFor(() => expect(content).toHaveAttribute("data-state", "open"));
    await userEvent.unhover(button);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(content).toHaveAttribute("data-state", "closed"));
  });
}}>
  {#snippet template(args)}
    <Example {...args} />
  {/snippet}
</Story>

<Story name="Wrapping description" args={{
  type: "text",
  tooltipText: "A longer description wraps within the width chosen for this example.",
  contentWidth: "16rem",
}}>
  {#snippet template(args)}
    <Example {...args} />
  {/snippet}
</Story>

<!-- A deliberately open CSS sample for visual inspection, separate from interaction. -->
<Story name="Appearance" args={{ type: "string", tone: "base", size: "medium", tooltipText: "Tooltip text" }}>
  {#snippet template(args: TooltipProps)}
    <span class="stylos-tooltip" data-type={args.type} data-tone={args.tone} data-size={args.size}>{args.tooltipText}</span>
  {/snippet}
</Story>

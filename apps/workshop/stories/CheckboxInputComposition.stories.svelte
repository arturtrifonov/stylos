<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { CheckboxInput } from "@stylos/ui";
  import FormExample from "./fixtures/CheckboxInputForm.svelte";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  const { Story } = defineMeta({ title: "Components/Checkbox Input", component: CheckboxInput });
  const sizes = ["extra small", "small", "medium", "large", "extra large"];
  const states = ["default", "hover", "active", "disabled"];
  const selections = ["false", "true", "mixed"];
</script>

<Story name="Interaction" play={async ({canvasElement, step}) => {
  const canvas = within(canvasElement);
  const row = canvas.getByRole("checkbox", {name:"Select row"});
  await step("Native mixed selection, keyboard and clickable label", async () => {
    await expect(row).toHaveProperty("indeterminate", true);
    await expect(row).not.toBeChecked();
    await userEvent.tab();
    await expect(row).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(row).toBeChecked();
    await expect(row).toHaveProperty("indeterminate", false);
    await expect(canvas.getByTestId("selection")).toHaveTextContent("Selection: true");
    await userEvent.click(canvas.getByText("Select row", {exact:true}));
    await expect(row).not.toBeChecked();
    await expect(canvas.getByTestId("selection")).toHaveTextContent("Selection: false");
  });
  await step("Form submits only checked enabled controls", async () => {
    await userEvent.click(canvas.getByRole("button", {name:"Set checked",exact:true}));
    await expect(row).toBeChecked();
    await userEvent.click(canvas.getByRole("button", {name:"Submit",exact:true}));
    await expect(canvas.getByTestId("submitted")).toHaveTextContent('[["rows","row-42"]]');
    await expect(canvas.getByRole("checkbox", {name:"Unavailable row"})).toBeDisabled();
    await expect(canvas.getByRole("checkbox", {name:"Fieldset row"})).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", {name:"Set mixed",exact:true}));
    await userEvent.click(canvas.getByRole("button", {name:"Submit",exact:true}));
    await expect(canvas.getByTestId("submitted")).toHaveTextContent("[]");
  });
  await step("Dynamic disabled and programmatic selection", async () => {
    await userEvent.click(canvas.getByRole("button", {name:"Toggle availability"}));
    await expect(row).toBeDisabled();
    await userEvent.click(row);
    await expect(canvas.getByTestId("selection")).toHaveTextContent("Selection: mixed");
    await userEvent.click(canvas.getByRole("button", {name:"Toggle availability"}));
    await expect(row).toBeEnabled();
    await userEvent.click(row);
    await expect(row).toBeChecked();
  });
  await step("Reset restores initial mixed selection and respects cancellation", async () => {
    await userEvent.click(canvas.getByRole("button", {name:"Reset",exact:true}));
    await waitFor(() => expect(row).toHaveProperty("indeterminate",true));
    await expect(canvas.getByTestId("selection")).toHaveTextContent("Selection: mixed");
    await userEvent.click(canvas.getByRole("button", {name:"Set checked",exact:true}));
    await userEvent.click(canvas.getByRole("button", {name:"Toggle reset cancellation"}));
    await userEvent.click(canvas.getByRole("button", {name:"Reset",exact:true}));
    await expect(row).toBeChecked();
    await expect(canvas.getByTestId("selection")).toHaveTextContent("Selection: true");
  });
  await step("External form association and required validity", async () => {
    const external = canvas.getByRole("checkbox", {name:"External required choice"});
    await expect(external).toBeInvalid();
    await userEvent.click(external);
    await expect(external).toBeValid();
    await userEvent.click(canvas.getByRole("button", {name:"Submit external form"}));
    await expect(canvas.getByTestId("submitted")).toHaveTextContent('[["external","yes"]]');
  });
}}>
  {#snippet template()}<FormExample />{/snippet}
</Story>

<!-- Static samples explicitly force drawing states; live controls derive them. -->
<Story name="Visual states" play={async ({canvasElement}) => {
  const expected = [16,20,24,28,32];
  const samples = canvasElement.querySelectorAll<HTMLElement>(".stylos-checkbox-input");
  await expect(samples).toHaveLength(60);
  for (const sample of samples) {
    const dimension = expected[sizes.indexOf(sample.dataset.size!)];
    await expect(sample.getBoundingClientRect().width).toBe(dimension);
    await expect(sample.getBoundingClientRect().height).toBe(dimension);
    if (sample.dataset.isChecked !== "false") {
      const token = sample.dataset.isChecked === "mixed" ? "--_stylos-checkbox-mixed" : "--_stylos-checkbox-check";
      const mask = getComputedStyle(sample.querySelector(".stylos-checkbox-input-surface")!, "::after").maskImage;
      await expect(mask).toBe(getComputedStyle(sample).getPropertyValue(token).trim());
    }
  }
}}>
  {#snippet template()}
    <div class="checkbox-visual-grid">
      {#each selections as selection}
        {#each states as state}
          <div class="checkbox-visual-row">
            <span>{selection} / {state}</span>
            {#each sizes as size}
              <span class="stylos-checkbox-input" data-size={size} data-state={state} data-is-checked={selection} aria-hidden="true">
                <span class="stylos-checkbox-input-surface"></span>
              </span>
            {/each}
          </div>
        {/each}
      {/each}
    </div>
  {/snippet}
</Story>

<style>
  .checkbox-visual-grid { display: grid; gap: var(--stylos-dimension-gap-g-1_500); }
  .checkbox-visual-row { display: flex; gap: var(--stylos-dimension-gap-g-2_000); align-items: center; font-family: var(--stylos-font-family-normal); color: var(--stylos-color-text-base); }
  .checkbox-visual-row > span:first-child { width: var(--stylos-dimension-size-s-20_000); }
</style>

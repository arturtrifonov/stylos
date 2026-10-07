<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { CheckboxLabel } from "@stylos/ui";
  import FormExample from "./fixtures/CheckboxFamilyForm.svelte";
  import Visual from "./fixtures/CheckboxFamilyVisual.svelte";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  const { Story } = defineMeta({title:"Compositions/Checkbox family",component:CheckboxLabel});
  const sizes = ["extra small", "small", "medium", "large", "extra large"];
  async function checkVisual(canvasElement: HTMLElement, kind: string) {
    const options = canvasElement.querySelectorAll<HTMLElement>(`.stylos-checkbox-${kind}`);
    await expect(options).toHaveLength(60);
    for (const option of options) {
      const i = sizes.indexOf(option.dataset.size!);
      const box = option.querySelector<HTMLElement>(".stylos-checkbox-input")!;
      const copy = option.querySelector<HTMLElement>(".stylos-checkbox-copy")!;
      const style = getComputedStyle(option);
      const line = kind === "label" ? [12,14,16,20,24][i] : [18,22,24,30,36][i];
      await expect(box.getBoundingClientRect().width).toBe([16,20,24,28,32][i]);
      await expect(box.getBoundingClientRect().height).toBe([16,20,24,28,32][i]);
      await expect(style.gap).toBe(`${[4,5,6,7,8][i]}px`);
      await expect(style.fontSize).toBe(`${[12,14,16,20,24][i]}px`);
      await expect(style.lineHeight).toBe(`${line}px`);
      await expect(style.fontWeight).toBe(kind === "label" ? "450" : "400");
      const offset = box.getBoundingClientRect().top - copy.getBoundingClientRect().top;
      await expect(offset).toBe(kind === "label" ? -([16,20,24,28,32][i] - line)/2 : [1,1,0,1,2][i]);
      await expect(style.color).toBe(option.dataset.state === "disabled" ? "rgb(163, 179, 196)" : "rgb(26, 42, 58)");
    }
  }
</script>

<Story name="Interaction" play={async ({canvasElement,step}) => {
  const canvas = within(canvasElement);
  const label = canvas.getByRole("checkbox", {name:"Send release notes"});
  const consent = canvas.getByRole("checkbox", {name:"I agree to the processing of my personal data in accordance with the privacy policy."});
  await step("Whole label, mixed binding, keyboard and default medium", async () => {
    await expect(label).toHaveProperty("indeterminate",true);
    await expect(label.closest(".stylos-checkbox-input")).toHaveAttribute("data-size","medium");
    await userEvent.click(canvas.getByText("Send release notes", {exact:true}));
    await expect(label).toBeChecked();
    await expect(canvas.getByTestId("family-selection")).toHaveTextContent("Label: true");
    label.focus();
    await userEvent.keyboard(" ");
    await expect(label).not.toBeChecked();
    await userEvent.click(canvas.getByText("Send release notes", {exact:true}));
  });
  await step("Wrapping copy, required validity and submitted values", async () => {
    await expect(consent).toBeInvalid();
    const copy = consent.closest("label")!.querySelector(".stylos-checkbox-copy")!;
    await expect(copy.getBoundingClientRect().height).toBeGreaterThan(24);
    await expect(consent.getBoundingClientRect().top).toBe(copy.getBoundingClientRect().top);
    await userEvent.click(copy);
    await expect(consent).toBeChecked();
    await expect(consent).toBeValid();
    await userEvent.click(canvas.getByRole("button", {name:"Submit",exact:true}));
    await expect(canvas.getByTestId("family-submitted")).toHaveTextContent('[["notes","yes"],["consent","yes"]]');
    await expect(canvas.getByRole("checkbox",{name:"Disabled label"})).toBeDisabled();
    await expect(canvas.getByRole("checkbox",{name:"Disabled wrapping choice."})).toBeDisabled();
  });
  await step("Reset and dynamic availability", async () => {
    await userEvent.click(canvas.getByRole("button",{name:"Reset",exact:true}));
    await waitFor(() => expect(label).toHaveProperty("indeterminate",true));
    await expect(consent).not.toBeChecked();
    await expect(canvas.getByTestId("family-selection")).toHaveTextContent("Label: mixed; Text: false");
    await userEvent.click(canvas.getByRole("button",{name:"Toggle availability"}));
    await expect(label).toBeDisabled();
    await expect(consent).toBeDisabled();
    await userEvent.click(canvas.getByText("Send release notes",{exact:true}));
    await expect(label).toHaveProperty("indeterminate",true);
  });
  await step("Inline link remains independent and long copy can have a short name", async () => {
    const linkChoice = canvas.getByRole("checkbox",{name:"Review the privacy policy before agreeing."});
    await userEvent.click(canvas.getByRole("link",{name:"privacy policy"}));
    await expect(canvas.getByTestId("link-visits")).toHaveTextContent("Link visits: 1");
    await expect(linkChoice).not.toBeChecked();
    await userEvent.click(canvas.getByText("before agreeing.",{exact:false}));
    await expect(linkChoice).toBeChecked();
    await expect(canvas.getByRole("checkbox",{name:"Long choice"})).toHaveAccessibleDescription("Separate supporting explanation.");
  });
}}>{#snippet template()}<FormExample />{/snippet}</Story>
<Story name="Form example">{#snippet template()}<FormExample />{/snippet}</Story>
<Story name="Label visual states" play={async ({canvasElement}) => checkVisual(canvasElement,"label")}>
  {#snippet template()}<Visual kind="label" />{/snippet}
</Story>
<Story name="Text visual states" play={async ({canvasElement}) => checkVisual(canvasElement,"text")}>
  {#snippet template()}<Visual kind="text" />{/snippet}
</Story>

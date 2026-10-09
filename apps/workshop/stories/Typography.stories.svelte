<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import TypographyDocument from "./fixtures/TypographyDocument.svelte";
  import { expect } from "storybook/test";
  // This committed record is generated from Figma; do not maintain a second
  // style inventory in the workshop.
  import styleRecord from "../../../figma/text-styles.yaml?raw";
  import { parse } from "../../../tools/lib/yaml.mjs";
  const recordedStyles = parse(styleRecord).get("styles");
  const styles = [...recordedStyles.keys()];
  const sizes = ["extra small", "small", "medium", "large", "extra large"];
  // Check rendered distances against the contract, rather than checking only
  // CSS declarations: summing margins can look correct in computed styles.
  async function checkDocumentSpacing(article: HTMLElement) {
    await article.ownerDocument.fonts.ready;
    const style = getComputedStyle(article);
    const gap = (step: string) => parseFloat(style.getPropertyValue(`--stylos-dimension-gap-g-${step}`));
    const profile: Record<string, number[]> = {
      H1: [gap("3_500"), gap("1_500")], H2: [gap("3_500"), gap("1_500")],
      H3: [gap("3_000"), gap("1_000")], H4: [gap("3_000"), gap("1_000")],
      H5: [gap("2_000"), gap("1_000")], H6: [gap("2_000"), gap("1_000")],
      P: [0, parseFloat(style.getPropertyValue("--stylos-paragraph-spacing"))],
    };
    const blocks = [...article.children] as HTMLElement[];
    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index];
      const [before, after] = profile[block.tagName];
      const computed = getComputedStyle(block);
      await expect(parseFloat(computed.marginBlockStart)).toBe(index === 0 ? 0 : before);
      await expect(parseFloat(computed.marginBlockEnd)).toBe(index === blocks.length - 1 ? 0 : after);
      if (index > 0) {
        const previous = blocks[index - 1];
        const distance = block.getBoundingClientRect().top - previous.getBoundingClientRect().bottom;
        await expect(distance).toBeCloseTo(Math.max(profile[previous.tagName][1], before), 1);
      }
    }
    await expect(blocks[0].getBoundingClientRect().top).toBeCloseTo(article.getBoundingClientRect().top, 1);
    await expect(blocks.at(-1)!.getBoundingClientRect().bottom).toBeCloseTo(article.getBoundingClientRect().bottom, 1);
  }
  const { Story } = defineMeta({
    title: "Foundations/Typography",
    component: TypographyDocument,
    argTypes: { textStyle: { control: "select", options: styles.filter((name) => name.startsWith("text/")) } },
    args: { textStyle: "text/base/medium" },
  });
</script>

<Story name="Document" play={async ({ canvasElement, args }) => {
  const article = canvasElement.querySelector("article")!;
  const paragraph = article.querySelector("p")!;
  const paragraphStyle = getComputedStyle(paragraph);
  const body = recordedStyles.get(args.textStyle) ?? recordedStyles.get("text/base/medium");
  const token = (key: string) => `--stylos-${body.get(key).replace(/[ /]/g, "-")}`;
  await expect(paragraphStyle.fontSize).toBe(getComputedStyle(article).getPropertyValue(token("font size")).trim());
  await expect(paragraphStyle.lineHeight).toBe(getComputedStyle(article).getPropertyValue(token("line height")).trim());
  await expect(article.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(6);
  await checkDocumentSpacing(article);
}} />

<Story name="Recorded styles">
  {#snippet template()}
    <div class="typography-samples">
      {#each styles as name}
        <section>
          <p class="stylos-label-base-small">{name}</p>
          <p class={`stylos-${name.replace(/[ /]/g, "-")}`}>The quick brown fox jumps over the lazy dog.</p>
        </section>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Body sizes" play={async ({ canvasElement }) => {
  for (const article of canvasElement.querySelectorAll<HTMLElement>(".stylos-prose")) {
    await checkDocumentSpacing(article);
  }
}}>
  {#snippet template()}
    <div class="typography-samples">
      {#each sizes as size}
        <section>
          <p class="stylos-label-base-small">text/base/{size}</p>
          <div class="stylos-prose" data-text-style={`text/base/${size}`}>
            <p>A paragraph using the selected recorded text style.</p>
            <p>A second paragraph uses the same text style.</p>
          </div>
        </section>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Spacing cases" play={async ({ canvasElement }) => {
  const article = canvasElement.querySelector<HTMLElement>("article")!;
  await checkDocumentSpacing(article);
  const heading = article.querySelector("h2")!;
  await expect(heading.getBoundingClientRect().height).toBeGreaterThan(parseFloat(getComputedStyle(heading).lineHeight));
}}>
  {#snippet template()}
    <article class="stylos-prose">
      <p>A document can start with a paragraph without adding space above it.</p>
      <h2>Invite people to the workspace and choose the access they need to find project information, update their work and collaborate with the rest of the team</h2>
      <h3>Two headings next to each other</h3>
      <p>The gap between these headings uses the larger margin, while a heading that wraps keeps the same outside gaps.</p>
      <p>Consecutive paragraphs keep the selected text style's paragraph spacing.</p>
      <h6>A final heading has no outside gap below it</h6>
    </article>
  {/snippet}
</Story>

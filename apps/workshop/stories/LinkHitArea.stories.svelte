<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent } from "storybook/test";
  import Example from "./fixtures/LinkHitArea.svelte";

  const { Story } = defineMeta({
    id: "components-link",
    title: "Components/Link/Link",
    component: Example,
  });
</script>

<Story name="Expanded hit area" play={async ({ canvasElement }) => {
  const doc = canvasElement.ownerDocument;
  const card = (name: string) => canvasElement.querySelector<HTMLElement>(`[data-example="${name}"]`)!;
  const expanded = card("expanded");
  const link = expanded.querySelector<HTMLAnchorElement>("a")!;
  const button = expanded.querySelector<HTMLButtonElement>("button")!;
  const secondary = expanded.querySelector<HTMLAnchorElement>('a[href="#activity"]')!;
  const disabled = card("disabled").querySelector<HTMLAnchorElement>("a")!;
  const ordinary = card("ordinary").querySelector<HTMLAnchorElement>("a")!;
  // Both modes keep the same single wrapper and size the SVG itself.
  for (const anchor of [link, ordinary]) {
    await expect([...anchor.children].map(element => element.className)).toEqual(["stylos-link-content"]);
    await expect([...anchor.firstElementChild!.children].map(element => element.tagName.toLowerCase())).toEqual(["svg"]);
    const icon = anchor.querySelector("svg")!;
    const footprint = parseFloat(getComputedStyle(anchor).height);
    await expect(icon.getBoundingClientRect().width).toBeCloseTo(footprint, 1);
    await expect(icon.getBoundingClientRect().height).toBeCloseTo(footprint, 1);
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(anchor).toHaveAccessibleName(anchor.textContent!.trim());
  }
  // Native hit testing includes pseudo-elements: the returned element is their anchor.
  const hit = (element: HTMLElement) => {
    element.scrollIntoView({ block: "center" });
    const rect = element.getBoundingClientRect();
    return doc.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };
  for (const name of ["expanded", "neighbour"]) {
    const container = card(name);
    const anchor = container.querySelector("a")!;
    container.scrollIntoView({ block: "center" });
    const rect = container.getBoundingClientRect();
    await expect(doc.elementFromPoint(rect.left + 8, rect.bottom - 8)).toBe(anchor);
    await expect(hit(container.querySelector("p")!)).toBe(anchor);
  }
  await expect(button.contains(hit(button))).toBe(true);
  await expect(secondary.contains(hit(secondary))).toBe(true);
  await expect(hit(card("disabled").querySelector("p")!)).not.toBe(disabled);
  await expect(hit(card("ordinary").querySelector("p")!)).not.toBe(card("ordinary").querySelector("a"));
  await expect(disabled).not.toHaveAttribute("href");
  await expect(disabled).toHaveAttribute("tabindex", "-1");
  await expect(getComputedStyle(disabled, "::after").content).toBe("none");

  // A raised control stays in its card even if its box reaches another card.
  const raised = button.parentElement!;
  const originalStyle = raised.getAttribute("style");
  try {
    const neighbour = card("neighbour");
    neighbour.scrollIntoView({ block: "center" });
    const from = raised.getBoundingClientRect();
    const to = neighbour.getBoundingClientRect();
    raised.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px)`;
    await expect(doc.elementFromPoint(to.left + 8, to.top + 8)).toBe(neighbour.querySelector("a"));
  } finally {
    if (originalStyle === null) raised.removeAttribute("style");
    else raised.setAttribute("style", originalStyle);
  }

  let navigations = 0;
  let saves = 0;
  const navigate = (event: MouseEvent) => { event.preventDefault(); navigations++; };
  const save = () => { saves++; };
  link.addEventListener("click", navigate);
  button.addEventListener("click", save);
  try {
    const target = hit(expanded.querySelector("p")!)!;
    await userEvent.click(target);
    await expect(navigations).toBe(1);
    await userEvent.click(button);
    await expect(saves).toBe(1);
    await expect(navigations).toBe(1);
    link.focus();
    await userEvent.keyboard("{Enter}");
    await expect(navigations).toBe(2);
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.tab();
    await expect(secondary).toHaveFocus();
    await userEvent.tab();
    await expect(card("neighbour").querySelector("a")).toHaveFocus();
    await userEvent.tab();
    await expect(card("disabled").querySelector("button")).toHaveFocus();
  } finally {
    link.removeEventListener("click", navigate);
    button.removeEventListener("click", save);
  }
}} />

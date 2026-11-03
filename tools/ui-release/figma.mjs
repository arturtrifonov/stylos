// Figma comparison: each Figma variant of a component, rendered by the package with the
// matching arguments, beside the Figma screenshot, with Figma and rendered sizes compared.
// Reference data is collected through the Figma MCP into build/figma-compare/<slug>.json
// ({ id, node, set, variants: [{ name, id, width, height }] }) and <slug>.png; the page
// reads them from /figma-data/. window.__figmaResult holds the comparison for automation.
import { mount, unmount, tick } from "svelte";
import Case from "./Case.svelte";
import "@stylos/ui/tokens.css";
import "@stylos/ui/fonts.css";
import "@stylos/ui/text.css";

const app = document.querySelector("#app");
const nav = document.querySelector("#nav");
const manifest = await (await fetch("/manifest.json")).json();
// Figma's metadata reports whole pixels, and text measures slightly differently there.
const TOLERANCE = 1;
// Overlays open one at a time through their example's trigger and are measured where they render.
const OPEN = {};
const POPUP = { dropdown: "click", tooltip: "hover", modal: "click", drawer: "click" };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
// Known measurement artefacts, from the 2026-11-03 comparison: what differs and why it is no finding.
const NOTES = {
  "checkbox-text": "Ширина и высота: пример подставляет текст «Acceptance sample», в крупных размерах он переносится; в Figma одно короткое слово. Высота одной строки совпадает.",
  "radio-text": "Как у Checkbox Text: перенос длинного текста примера.",
  "toggle-text": "Как у Checkbox Text: перенос длинного текста примера.",
  "dropdown-item-default": "Ширина: пример рисует строку в списке шириной 210 px; высоты совпадают.",
  "dropdown-item-parent": "Ширина: пример рисует строку в списке шириной 210 px; высоты совпадают.",
  "dropdown-item-checkbox": "Ширина: пример рисует строку в списке шириной 210 px; высоты совпадают.",
  "dropdown-item-toggle": "Ширина: пример рисует строку в списке шириной 210 px; высоты совпадают.",
  select: "Ширина: пример задаёт полю 320 px; высоты совпадают.",
  "table-row-body": "Ширина: таблица примера 520 px; высоты совпадают.",
  drawer: "Высота: Drawer занимает всю высоту окна, в Figma рамка 500 px; ширины совпадают.",
  tooltip: "Многострочный тип: в Figma длинный текст фиксированной ширины 220 px, в примере короткий; высоты совпадают.",
  dropdown: "Режим hug: в примере 8 пунктов, в Figma 6, поэтому панель упирается в максимальную высоту. По составляющим панель из 6 пунктов совпадает с Figma во всех размерах; режим fixed совпадает напрямую.",
};
const visible = element => element && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
const escape = text => String(text).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const norm = text => String(text).toLowerCase().replace(/[\s_-]+/g, "");
const load = async slug => { try { const r = await fetch(`/figma-data/${slug}.json`); return r.ok ? r.json() : null; } catch { return null; } };

/** "tone=base, size=medium" → arguments for the component, and the pairs that map to nothing. */
function argumentsFor(component, variantName) {
  const args = { ...(component.cases[0] ?? {}), ...(OPEN[component.slug] ?? {}) }; const unmapped = [];
  for (const pair of variantName.split(",").map(part => part.trim()).filter(Boolean)) {
    const [key, value = ""] = pair.split("=").map(part => part.trim());
    const prop = component.props.find(candidate => norm(candidate.name) === norm(key));
    if (!prop) { unmapped.push(pair); continue; }
    if (prop.kind === "boolean") { args[prop.key] = norm(value) === "true"; continue; }
    const match = prop.values.find(candidate => norm(candidate) === norm(value));
    if (match === undefined) unmapped.push(pair); else args[prop.key] = match;
  }
  return { args, unmapped };
}

const instances = [];
async function showComponent(component, theme) {
  for (const instance of instances.splice(0)) await unmount(instance);
  document.documentElement.dataset.theme = theme;
  const figma = await load(component.slug);
  app.innerHTML = `<h1>${escape(component.id)}</h1>
    <p class="meta">${figma ? `Figma node ${escape(figma.node)} · ${figma.variants.length} variants` : "No Figma data in build/figma-compare/ for this component."}</p>
    ${NOTES[component.slug] ? `<p class="note">${escape(NOTES[component.slug])}</p>` : ""}
    <div class="bar"><label>Тема <select id="theme"><option value="light"${theme === "light" ? " selected" : ""}>светлая</option><option value="dark"${theme === "dark" ? " selected" : ""}>тёмная</option></select></label>
      <span id="summary"></span></div>
    <div class="pair"><section class="panel figma"><h2>Figma</h2>${figma ? `<img src="/figma-data/${component.slug}.png" alt="Figma component set ${escape(component.id)}">` : ""}</section>
      <section class="panel"><h2>Код</h2><div class="grid" id="grid"></div></section></div>
    <table class="results"><thead><tr><th>Вариант Figma</th><th>Figma</th><th>Код</th><th>Δ</th><th>Замечание</th></tr></thead><tbody id="rows"></tbody></table>`;
  app.querySelector("#theme").addEventListener("change", event => { location.hash = `${component.slug}:${event.target.value}`; });
  const result = { id: component.id, slug: component.slug, theme, variants: [] };
  if (!figma) { window.__figmaResult = result; return result; }
  const grid = app.querySelector("#grid");
  for (const variant of figma.variants) {
    const { args, unmapped } = argumentsFor(component, variant.name);
    const cell = document.createElement("div"); cell.className = "cell";
    // The cell is as wide as the Figma variant, so a component that fills its container compares fairly.
    cell.innerHTML = `<div class="name">${escape(variant.name)}</div><div class="render" style="width:${variant.width}px"></div>`;
    grid.append(cell);
    instances.push(mount(Case, { target: cell.querySelector(".render"), props: { name: component.name, args } }));
    result.variants.push({ variant, cell, unmapped });
  }
  await tick(); await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const rows = app.querySelector("#rows"); let off = 0;
  for (const entry of result.variants) {
    let root = entry.cell.querySelector(component.selector);
    if (POPUP[component.slug]) {
      const trigger = entry.cell.querySelector("button");
      if (POPUP[component.slug] === "click") trigger?.click();
      else for (const type of ["pointerenter", "pointermove"]) trigger?.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" }));
      await wait(700);
      root = [...document.querySelectorAll(component.selector)].find(element => visible(element) && !element.closest(".frozen")) ?? null;
    }
    const box = root?.getBoundingClientRect();
    entry.code = box ? { width: Math.round(box.width * 100) / 100, height: Math.round(box.height * 100) / 100 } : null;
    entry.dw = entry.code ? Math.round((entry.code.width - entry.variant.width) * 100) / 100 : null;
    entry.dh = entry.code ? Math.round((entry.code.height - entry.variant.height) * 100) / 100 : null;
    entry.off = !entry.code || Math.abs(entry.dh) > TOLERANCE || Math.abs(entry.dw) > TOLERANCE;
    if (entry.off) { off++; entry.cell.classList.add("off"); }
    if (POPUP[component.slug]) {
      // Leave a static copy of the open surface in the cell, so the eye compares it with Figma.
      if (root) {
        const copy = document.createElement("div"); copy.className = "frozen";
        copy.innerHTML = root.outerHTML; copy.firstElementChild.removeAttribute("id");
        for (const node of copy.querySelectorAll("[id]")) node.removeAttribute("id");
        entry.cell.querySelector(".render").append(copy);
      }
      document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      entry.cell.querySelector("button")?.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }));
      await wait(400);
    }
    const note = [!entry.code ? "корень не найден" : "", entry.unmapped.length ? `не сопоставлено: ${entry.unmapped.join(", ")}` : ""].filter(Boolean).join("; ");
    rows.insertAdjacentHTML("beforeend", `<tr class="${entry.off ? "off" : ""}"><td>${escape(entry.variant.name)}</td>
      <td class="num">${entry.variant.width} × ${entry.variant.height}</td><td class="num">${entry.code ? `${entry.code.width} × ${entry.code.height}` : "—"}</td>
      <td class="num">${entry.code ? `${entry.dw > 0 ? "+" : ""}${entry.dw} × ${entry.dh > 0 ? "+" : ""}${entry.dh}` : "—"}</td><td class="note">${escape(note)}</td></tr>`);
  }
  app.querySelector("#summary").textContent = `Расходится по размеру: ${off} из ${result.variants.length}`;
  window.__figmaResult = { ...result, variants: result.variants.map(({ variant, code, dw, dh, off: isOff, unmapped }) => ({ name: variant.name, figma: [variant.width, variant.height], code: code && [code.width, code.height], dw, dh, off: isOff, unmapped })) };
  return result;
}

const components = manifest.components.filter(component => component.props);
async function route() {
  const [slug, theme = "light"] = location.hash.slice(1).split(":");
  const component = components.find(entry => entry.slug === slug) ?? components[0];
  nav.innerHTML = components.map(entry => `<a href="#${entry.slug}:${theme}"${entry === component ? ' aria-current="page"' : ""}>${escape(entry.id)}</a>`).join("");
  window.__figmaResult = null;
  await showComponent(component, theme);
}
window.addEventListener("hashchange", route);
await route();

// State checks beyond the Default compositions, for 0.3.0 acceptance. One check per load:
//   ?check=contrast&theme=light|dark  axe colour-contrast on every variant case
//   ?check=motion                      transitions and animations left under reduced motion
//   ?check=reflow                      horizontal overflow of each Default case in the viewport
//   ?check=sheet&theme=light|dark      every Default case on one page, for forced-colour review
// Media features (reduced motion, forced colours) and the viewport are set by the caller,
// e.g. over the DevTools protocol. Results are in window.__statesResult when done.
import { mount, unmount, tick } from "svelte";
import axe from "axe-core";
import Case from "./Case.svelte";
import { settleAnimations } from "./checks.mjs";
import "@stylos/ui/tokens.css";
import "@stylos/ui/fonts.css";
import "@stylos/ui/text.css";

const params = new URLSearchParams(location.search);
const check = params.get("check") ?? "contrast";
const only = params.get("component");
document.documentElement.dataset.theme = params.get("theme") ?? "light";
const stage = document.querySelector("#stage");
const status = document.querySelector("#status");
const manifest = await (await fetch("/manifest.json")).json();
const components = manifest.components.filter(component => !only || component.slug === only);
const pause = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

async function render(component, args, target = stage) {
  const instance = mount(Case, { target, props: { name: component.name, args } });
  await tick(); await pause();
  try { await settleAnimations(document, 2000); } catch {}
  return instance;
}

const seconds = value => Math.max(0, ...value.split(",").map(part => (part.trim().endsWith("ms") ? parseFloat(part) / 1000 : parseFloat(part)) || 0));
function moving(element) {
  const found = [];
  for (const pseudo of [null, "::before", "::after"]) {
    const style = getComputedStyle(element, pseudo);
    if (pseudo && style.content === "none") continue;
    const transition = seconds(style.transitionDuration);
    const animation = style.animationName !== "none" ? seconds(style.animationDuration) : 0;
    if (transition > 0.001 || animation > 0.001) found.push({ pseudo: pseudo ?? "", transition, animation, name: style.animationName, iterations: style.animationIterationCount });
  }
  return found;
}
const describe = element => element.tagName.toLowerCase() + (element.className && typeof element.className === "string" ? "." + element.className.trim().split(/\s+/)[0] : "");

const result = { check, theme: document.documentElement.dataset.theme, components: components.length, cases: 0, findings: [] };
if (check === "sheet") {
  const sheet = document.createElement("div"); sheet.className = "sheet"; stage.append(sheet);
  for (const component of components) {
    const section = document.createElement("section"); section.innerHTML = `<h2>${component.id}</h2>`; sheet.append(section);
    await render(component, component.cases[0] ?? {}, section); result.cases++;
  }
} else {
  for (const [index, component] of components.entries()) {
    status.textContent = `${check}: ${component.id} (${index + 1}/${components.length})`;
    const cases = check === "reflow" ? [component.cases[0] ?? {}] : component.cases;
    for (const [caseIndex, args] of cases.entries()) {
      const instance = await render(component, args); result.cases++;
      if (check === "contrast") {
        const audit = await axe.run({ include: [stage, ...document.querySelectorAll("[data-dropdown-positioner],.stylos-tooltip-positioner")] }, { runOnly: ["color-contrast"], resultTypes: ["violations"] });
        for (const violation of audit.violations) for (const node of violation.nodes)
          result.findings.push({ component: component.id, case: caseIndex, args, target: node.target.join(" "), summary: node.any.map(item => item.message).join("; ") });
      } else if (check === "motion") {
        for (const element of [stage, ...stage.querySelectorAll("*")]) for (const motion of moving(element))
          result.findings.push({ component: component.id, case: caseIndex, element: describe(element), ...motion });
      } else if (check === "reflow") {
        const width = document.documentElement.clientWidth;
        for (const element of stage.querySelectorAll("*")) {
          const box = element.getBoundingClientRect();
          if (box.width && (box.right > width + 0.5 || box.left < -0.5)) { result.findings.push({ component: component.id, element: describe(element), left: Math.round(box.left), right: Math.round(box.right), viewport: width }); break; }
        }
        if (stage.scrollWidth > stage.clientWidth + 0.5) result.findings.push({ component: component.id, element: "#stage", scrollWidth: stage.scrollWidth, viewport: stage.clientWidth });
      }
      await unmount(instance);
      for (const dialog of document.querySelectorAll("dialog[open]")) dialog.close();
    }
  }
}
status.textContent = `${check}: ${result.cases} cases, ${result.findings.length} findings`;
window.__statesResult = result;

import { mount, unmount, tick } from "svelte";
import axe from "axe-core";
import Case from "./Case.svelte";
import { verifyVariantCase, captureDiagnostics, hasLoadedFont, settleAnimations, AXE_TAGS } from "./checks.mjs";
import { REPORT_VERSION } from "../lib/ui-release-report.mjs";
import "@stylos/ui/tokens.css";
import "@stylos/ui/fonts.css";
import "@stylos/ui/text.css";

const sample = document.querySelector("#sample");
const status = document.querySelector("#status");
const results = document.querySelector("#results");
const button = document.querySelector("#run");
const showButton = document.querySelector("#show");
const manifest = await (await fetch("/manifest.json")).json();
const inspect = document.querySelector("#inspect");
for (const component of manifest.components) {
  const option = document.createElement("option");
  option.value = component.id;
  option.textContent = component.id;
  inspect.append(option);
}
for (const [name, label] of [["NativeControls", "Native controls form"], ["DropdownControls", "Dropdown controls"],
  ["DropdownNavigation", "Nested navigation"], ["ModalForm", "Modal form"], ["DrawerForm", "Drawer form"], ["SelectForm", "Select form"], ["StartingSet", "Starting set form"]]) {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = label;
  inspect.append(option);
}
let instance;

async function show(component, args) {
  if (instance) await unmount(instance);
  instance = mount(Case, { target: sample, props: { name: component.name, args } });
  await tick();
}

showButton.addEventListener("click", async () => {
  const component = manifest.components.find(component => component.id === inspect.value)
    ?? { name: inspect.value, cases: [{}] };
  await show(component, component.cases[0]);
});

button.addEventListener("click", async () => {
  button.disabled = true;
  showButton.disabled = true;
  inspect.disabled = true;
  const errors = [];
  const a11y = [];
  const incomplete = [];
  let rendered = 0;
  const diagnostics = captureDiagnostics(window, console, error => errors.push(error));
  try {
    await document.fonts.ready;
    for (const theme of ["light", "dark"]) {
      document.documentElement.dataset.theme = theme;
      for (const component of manifest.components) {
        status.textContent = `${theme}: ${component.id} (${rendered} rendered)`;
        for (let index = 0; index < component.cases.length; index++) {
          try {
            diagnostics.context({ theme, component: component.id, case: index, phase: "render" });
            await show(component, component.cases[index]);
            await new Promise(resolve => requestAnimationFrame(resolve));
            verifyVariantCase(component, component.cases[index], (className, attribute) => {
              const node = document.querySelector(`.${className}`);
              return node ? attribute === undefined ? node : node.getAttribute(attribute) : undefined;
            });
            if (["Modal", "Drawer"].includes(component.id) && component.cases[index].isOpen) {
              const dialog = document.querySelector(`.stylos-${component.id.toLowerCase()}-root`);
              if (!dialog.open) throw new Error("Open window did not become visible");
            }
            rendered++;
          } catch (error) {
            errors.push({ theme, component: component.id, case: index, error: error.message });
          }
        }
        // Default stories supply names, icons and required parent structures.
        const auditArgs = ["Modal", "Drawer"].includes(component.id)
          ? { ...component.cases[0], isOpen: true } : component.cases[0];
        diagnostics.context({ theme, component: component.id, phase: "axe" });
        await show(component, auditArgs);
        await new Promise(resolve => requestAnimationFrame(resolve));
        await document.fonts.ready;
        await settleAnimations(document);
        const audit = await axe.run({ include: [sample, ...document.querySelectorAll("[data-dropdown-positioner],.stylos-tooltip-positioner")] },
          { runOnly: { type: "tag", values: AXE_TAGS } });
        for (const violation of audit.violations) {
          a11y.push({ theme, component: component.id, rule: violation.id, impact: violation.impact,
            nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) });
        }
        for (const finding of audit.incomplete) incomplete.push({ theme, component: component.id, rule: finding.id,
          nodes: finding.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) });
        // Give progress and browser input a turn between components.
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }
    if (instance) { await unmount(instance); instance = null; }
    const frame = document.querySelector("iframe");
    const doc = frame.contentDocument;
    await doc.fonts.ready;
    if (!hasLoadedFont(document.fonts, "Georama") || !hasLoadedFont(doc.fonts, "Georama")) {
      errors.push({ error: "Georama did not load in the component or CSS-only page" });
    }
    if (doc.querySelector("script")) errors.push({ error: "CSS-only page contains JavaScript" });
    for (const component of manifest.components) {
      const node = doc.querySelector(`[data-component="${component.id}"] ${component.selector}`);
      if (!node) { errors.push({ component: component.id, error: "CSS-only DOM is absent" }); continue; }
      const style = frame.contentWindow.getComputedStyle(node);
      const box = node.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0 || style.display === "none") {
        errors.push({ component: component.id, error: "CSS-only sample has no visible footprint" });
      }
    }
    diagnostics.context({ phase: "cleanup" });
    await new Promise(resolve => requestAnimationFrame(resolve));
    diagnostics.stop();
    const report = { schemaVersion: REPORT_VERSION, generatedAt: new Date().toISOString(), userAgent: navigator.userAgent,
      components: manifest.components.length, rendered, expected: manifest.cases * 2, sourceFingerprint: manifest.sourceFingerprint,
      errors, a11y, incomplete, scope: "All variant combinations and individual boolean toggles construct DOM; axe covers Default examples with Modal/Drawer opened. No visual-parity, screen-reader or full-page conformance claim." };
    results.textContent = JSON.stringify(report, null, 2);
    const response = await fetch("/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(report) });
    if (!response.ok) throw new Error(`Could not save browser evidence: ${await response.text()}`);
    status.textContent = `Complete: ${rendered}/${report.expected} renders; ${errors.length} rendering errors; ${a11y.length} axe violations; ${incomplete.length} axe checks need review. Evidence saved.`;
  } catch (error) {
    status.textContent = `Failed: ${error.message}`;
  } finally {
    if (instance) { await unmount(instance); instance = null; }
    diagnostics.stop();
    document.documentElement.dataset.theme = "light";
    button.disabled = false;
    showButton.disabled = false;
    inspect.disabled = false;
  }
});

// Harness layout is test infrastructure, outside the component design contract.
const style = document.createElement("style");
style.textContent = "body{font:16px system-ui;margin:24px;background:var(--stylos-color-background-base);color:var(--stylos-color-text-base)}#sample{padding:24px;min-height:80px;background:var(--stylos-color-background-base)}pre{white-space:pre-wrap}iframe{width:100%;height:500px}main{max-width:1000px;margin:auto}";
document.head.append(style);

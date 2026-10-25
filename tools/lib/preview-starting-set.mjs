// Static instances of the draft DOM contracts, using the component CSS.
// The CSS-only page deliberately has no behaviour or live announcements.
export const startingSetIds = new Set(["Accordion", "Accordion Header", "Alert Inline", "Alert Popup", "Alert Popup Timer", "Progress Bar", "Switcher", "Switcher Item", "Tabs Horizontal", "Tab Item"]);
let sequence = 0;
export function startingSetPreview(entry, props, { cls, attr, esc, icon, button }) {
  const id = `starting-preview-${++sequence}`;
  const size = props.size ?? "extra small";
  const disabled = props.state === "disabled" ? " disabled" : "";
  if (entry.id.startsWith("Accordion")) {
    const expanded = !!props["is expanded"];
    const standalone = entry.id === "Accordion Header";
    const base = props.id ?? id;
    const headerId = standalone ? props.id : `${base}-heading`;
    const controls = standalone ? props.controls : `${base}-body`;
    const iconPosition = props["expand icon position"] ?? (standalone ? "leading" : "trailing");
    const association = `${headerId ? ` id="${esc(headerId)}"` : ""}${controls ? ` aria-controls="${esc(controls)}"` : ""}`;
    const pair = { chevron: ["expand_more", "expand_less"], plus: ["add", "remove"], dropdown: ["arrow_drop_down", "arrow_drop_up"] }[props["expand icon"] ?? "chevron"];
    const heading = `<button type="button" class="stylos-accordion-header" data-size="${esc(size)}" data-state="${esc(props.state ?? "default")}" data-is-expanded="${expanded}" data-expand-icon-position="${esc(iconPosition)}" data-expand-icon="${esc(props["expand icon"] ?? "chevron")}" aria-expanded="${expanded}"${association}${disabled}>${icon(pair[expanded ? 1 : 0])}<span class="stylos-accordion-title">${esc(props["label text"] ?? "Accordion title")}</span></button>`;
    if (standalone) return heading;
    const headingTag = `h${props["heading level"] ?? "3"}`;
    return `<section class="${cls}"${attr} aria-labelledby="${esc(headerId)}"><${headingTag} class="stylos-accordion-heading">${heading}</${headingTag}><div class="stylos-accordion-body" id="${esc(controls)}"${expanded ? ' aria-hidden="false"' : ' hidden inert aria-hidden="true"'}>${props["content slot"] ?? ""}</div></section>`;
  }
  if (entry.id === "Progress Bar") {
    const raw = String(props.value ?? "0").trim();
    const unknown = raw === "unknown";
    const numeric = Number(raw.replace(/%$/, ""));
    const value = Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : 0;
    const label = props["label text"] || (unknown ? "" : String(value));
    return `<div class="${cls}"${attr}><progress max="100"${unknown ? "" : ` value="${value}"`} aria-label="${esc(props["accessible name"] || "Progress Bar")}"${props["label text"] ? ` aria-valuetext="${esc(props["label text"])}"` : ""}></progress>${props["has label"] && label ? `<span class="stylos-progress-label" style="width: ${esc(props["label width"] || "auto")}" aria-hidden="true">${esc(label)}</span>` : ""}</div>`;
  }
  if (entry.id.startsWith("Alert ")) {
    const timer = entry.id === "Alert Popup Timer";
    const inline = entry.id === "Alert Inline";
    const close = props["has close button"] ? `<span class="stylos-alert-close"><button class="stylos-button-inner" type="button" aria-label="${esc(props["close accessible name"] || "Close")}"><span class="stylos-button-inner-icon">${icon("close")}</span></button></span>` : "";
    const undo = props["has undo button"] ? button(props["undo button text"] || "Undo", "outline", timer ? "extra small" : size) : "";
    const content = props["has content"] ? `<div class="stylos-alert-content">${props["content slot"] ?? ""}</div>` : "";
    const heading = props["has heading"] ? `<p class="stylos-alert-heading">${esc(props["heading text"] ?? "Heading Text")}</p>` : "";
    if (!timer) {
      const actions = props["has buttons"] ? `<div class="stylos-alert-actions">${button(props["primary button text"] || "Accept", "base", size)}${button(props["secondary button text"] || "Cancel", "outline", size)}</div>` : "";
      return `<section class="stylos-alert ${cls}"${attr} data-surface-layer="${inline ? 1 : 6}" data-surface-attachment="${inline ? "in-layout" : "free"}"${props["is open"] === false ? " hidden" : ""}><div class="stylos-alert-body">${heading}${content}${actions}</div>${undo}${close}</section>`;
    }
    const counter = props["has timer counter"] ? `<span class="stylos-alert-timer-count">${esc(props["timer text"])}</span>` : "";
    const progress = startingSetPreview({ id: "Progress Bar" }, { value: props["progress value"] ?? "30", "has label": false }, { cls: "stylos-progress-bar", attr: "", esc, icon, button });
    return `<section class="stylos-alert ${cls}"${attr} data-surface-layer="6" data-surface-attachment="free"${props["is open"] === false ? " hidden" : ""}><div class="stylos-alert-body"><div class="stylos-alert-heading-row">${counter}${heading}${undo}${close}</div>${content}</div><div class="stylos-alert-timer-progress" aria-hidden="true">${progress}</div></section>`;
  }
  const segment = (label, checked = false) => `<label class="stylos-switcher-item" data-size="${esc(size)}" data-tone="${esc(props.tone ?? "base")}" data-state="${esc(props.state ?? "default")}" data-is-selected="${checked}"><input type="radio" name="${id}" value="${esc(label)}"${checked ? " checked" : ""}${disabled}><span>${esc(label)}</span></label>`;
  if (entry.id === "Switcher Item") return segment(props["label text"] ?? "Option");
  if (entry.id === "Switcher") return `<fieldset class="${cls}"${attr} aria-label="${esc(props["accessible name"] || "Options")}"${disabled}>${props["content slot"] || ["Option 1", "Option 2", "Option 3", "Option 4"].map((s,i) => segment(s, i === 0)).join("")}</fieldset>`;
  const tab = (label, selected = false) => `<button type="button" role="tab" class="stylos-tab-item" data-size="${esc(size)}" data-state="${esc(props.state ?? "default")}" data-is-selected="${selected}" aria-selected="${selected}" tabindex="${selected ? 0 : -1}"${disabled}><span class="stylos-tab-label">${esc(label)}</span></button>`;
  if (entry.id === "Tab Item") return `<div role="tablist" aria-label="Tabs">${tab(props["label text"] || "Tab item", true)}</div>`;
  if (entry.id === "Tabs Horizontal") return `<div class="${cls}"${attr}><div class="stylos-tabs-list" role="tablist" aria-label="${esc(props["accessible name"] || "Tabs")}">${props["tabs slot"] || ["Tab item 1", "Tab item 2", "Tab item 3"].map((s,i) => tab(s, i === 0)).join("")}</div>${props["panels slot"] || ""}</div>`;
}

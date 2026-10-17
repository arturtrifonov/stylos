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
    const heading = `<button type="button" class="stylos-accordion-header" data-size="${esc(size)}" data-state="${esc(props.state ?? "default")}" data-expand-icon-position="${esc(props["expand icon position"] ?? "trailing")}" aria-expanded="${expanded}" aria-controls="${id}-body"${disabled}><span class="stylos-accordion-chevron" aria-hidden="true">${icon(expanded ? "expand_less" : "expand_more")}</span><span class="stylos-accordion-title">${esc(props["label text"] ?? "Accordion title")}</span></button>`;
    return entry.id === "Accordion Header" ? heading : `<section class="${cls}"${attr}>${heading}<div class="stylos-accordion-body" id="${id}-body"${expanded ? "" : " hidden"}>${props["content slot"] ?? ""}</div></section>`;
  }
  if (entry.id === "Progress Bar") {
    const numeric = Number(props.value);
    const value = Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : 0;
    const mark = { warning: "warning", danger: "error", success: "check_circle" }[props.type];
    return `<div class="${cls}"${attr}><progress max="100"${props.state === "skeleton" ? "" : ` value="${value}"`} aria-label="${esc(props["accessible name"] || "Progress")}"></progress>${props.state === "skeleton" ? "" : mark && props["has icon"] ? `<span class="stylos-progress-icon" aria-hidden="true">${icon(mark)}</span>` : props["has label"] ? `<span class="stylos-progress-label">${esc(props["label text"] || String(value))}</span>` : ""}</div>`;
  }
  if (entry.id.startsWith("Alert ")) {
    const timer = entry.id === "Alert Popup Timer";
    const inline = entry.id === "Alert Inline";
    const close = props["has close button"] ? `<span class="stylos-alert-close"><button class="stylos-button-inner" type="button" aria-label="${esc(props["close accessible name"] || "Close")}"><span class="stylos-button-inner-icon">${icon("close")}</span></button></span>` : "";
    const undo = props["has undo button"] ? button(props["undo button text"] || "Undo", "outline", "extra small") : "";
    const content = props["has content"] ? `<div class="stylos-alert-content">${props["content slot"] ?? ""}</div>` : "";
    const heading = props["has heading"] ? `<p class="stylos-alert-heading">${esc(props["heading text"] ?? "Heading Text")}</p>` : "";
    return `<section class="stylos-alert ${cls}"${attr} data-surface-layer="${inline ? 1 : 6}" data-surface-attachment="${inline ? "in-layout" : "free"}"${props["is open"] === false ? " hidden" : ""}><div class="stylos-alert-body"><div class="stylos-alert-heading-row">${timer && props["has timer counter"] ? `<span class="stylos-alert-timer-count">${esc(props["timer text"])}</span>` : ""}${heading}${undo}${timer ? close : ""}</div>${content}${props["has buttons"] && !timer ? `<div class="stylos-alert-actions">${button(props["primary button text"] || "Accept", "base", inline ? "small" : size)}${button(props["secondary button text"] || "Cancel", "outline", inline ? "small" : size)}</div>` : ""}</div>${timer ? `<div class="stylos-alert-timer-progress"><div class="stylos-progress-bar"><progress max="100" value="${esc(props["progress value"] ?? "30")}"></progress></div></div>` : close}</section>`;
  }
  const segment = (label, checked = false) => `<label class="stylos-switcher-item" data-size="${esc(size)}" data-tone="${esc(props.tone ?? "base")}" data-state="${esc(props.state ?? "default")}" data-is-selected="${checked}"><input type="radio" name="${id}" value="${esc(label)}"${checked ? " checked" : ""}${disabled}><span>${esc(label)}</span></label>`;
  if (entry.id === "Switcher Item") return segment(props["label text"] ?? "Option");
  if (entry.id === "Switcher") return `<fieldset class="${cls}"${attr} aria-label="${esc(props["accessible name"] || "Options")}"${disabled}>${props["content slot"] || ["Option 1", "Option 2", "Option 3", "Option 4"].map((s,i) => segment(s, i === 0)).join("")}</fieldset>`;
  const tab = (label, selected = false) => `<button type="button" role="tab" class="stylos-tab-item" data-size="${esc(size)}" data-state="${esc(props.state ?? "default")}" data-is-selected="${selected}" aria-selected="${selected}" tabindex="${selected ? 0 : -1}"${disabled}><span class="stylos-tab-label">${esc(label)}</span></button>`;
  if (entry.id === "Tab Item") return `<div role="tablist" aria-label="Tabs">${tab(props["label text"] || "Tab item", true)}</div>`;
  if (entry.id === "Tabs Horizontal") return `<div class="${cls}"${attr}><div class="stylos-tabs-list" role="tablist" aria-label="${esc(props["accessible name"] || "Tabs")}">${props["tabs slot"] || ["Tab item 1", "Tab item 2", "Tab item 3"].map((s,i) => tab(s, i === 0)).join("")}</div>${props["panels slot"] || ""}</div>`;
}

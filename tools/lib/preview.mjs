// Real previews for the component pages — SPEC 0003's promised second half,
// under SPEC 0011 §5's rule: a sample is real or it is absent.
//
// What renders here is the authored CSS of an implemented component plus the
// token sheet the package ships, and markup written to the public DOM
// contract (SPEC 0010 §2.3) — the same strings a consumer writes. A component
// that is not built keeps its placeholder slot; nothing on the site is a
// mockup.
//
// `sampleHtml` refuses any assignment the entry's contract does not carry —
// a property the api does not name, or a value outside a variant's list. On
// a curated composition that refusal fails the build; on a page rendering the
// registry's own examples the caller catches it and falls back to the
// placeholder, because an example is the contract's to state and the
// preview's only to draw.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { readIcons } from "../build-ui-icons.mjs";
import path from "node:path";

import { loadCanonical } from "./tokens.mjs";
import { loadEffectStyles } from "./effect-styles.mjs";
import { slugPath } from "./registry.mjs";
import { readNaming } from "../check-tokens.mjs";
import { buildCss } from "../build-css.mjs";
import { builtComponents } from "../build-ui-types.mjs";
import { componentCss } from "./component-css.mjs";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** "number text" → "number-text", the same kebab the Svelte wrappers write. */
const kebab = (name) => name.trim().replace(/\s+/g, "-");

/**
 * One sample, from an entry and an assignment, per the DOM contract:
 * `stylos-<slug>` as the class, each variant or boolean as `data-<kebab>`
 * with the value verbatim, text as content. Throws on any prop or value the
 * contract does not carry.
 */
/**
 * The committed icon set, read once. The repository root is derived from this
 * file's own location rather than passed in: sampleHtml is called from deep
 * inside the page renderer and threading a root through every caller would
 * buy nothing here, where the only reader is this repository's own tooling.
 */
let iconCache = null;
let inputPreviewCounter = 0;
function iconDrawings() {
  if (iconCache === null) {
    const root = fileURLToPath(new URL("../..", import.meta.url));
    iconCache = new Map(readIcons(root));
  }
  return iconCache;
}

export function sampleHtml(entry, props = {}) {
  if (["Input Text", "Select"].includes(entry.id) && props.state && props.state !== "default") {
    props = { ...props, validation: "off" };
  }
  const api = new Map((entry.api ?? []).map((property) => [property.name, property]));
  const attrs = [];
  const styles = [];
  let content = "";

  for (const [name, value] of Object.entries(props)) {
    const property = api.get(name);
    if (!property) {
      throw new Error(`preview: "${entry.id}" has no api property "${name}"`);
    }
    if (property.kind === "variant") {
      const allowed = (property.values ?? []).map((row) => row.value);
      if (!allowed.includes(value)) {
        throw new Error(
          `preview: "${entry.id}" property "${name}" has no value "${value}" — the contract lists: ${allowed.join(", ")}`
        );
      }
      attrs.push(`data-${kebab(name)}="${esc(value)}"`);
    } else if (property.kind === "boolean") {
      if (typeof value !== "boolean") {
        throw new Error(`preview: "${entry.id}" property "${name}" is a boolean; got "${value}"`);
      }
      attrs.push(`data-${kebab(name)}="${value}"`);
    } else if (property.kind === "string") {
      if (typeof value !== "string") {
        throw new Error(`preview: "${entry.id}" property "${name}" is a string; got "${value}"`);
      }
      // String properties need their own renderer; they are not text content.
      if (entry.id === "Tooltip" && name === "content width") {
        styles.push(`--_stylos-tooltip-width:${value}`);
      } else if (entry.id === "Dropdown" && name === "max height") {
        styles.push(`--_stylos-dropdown-height-limit:${value}`);
      } else if (["Dropdown", "Dropdown Item Default"].includes(entry.id) && ["id", "value"].includes(name)) {
        // Listbox and option identifiers are rendered by their branches below.
      } else if (entry.id === "Dropdown Item Parent" && ["id", "controls"].includes(name)) {
        // Native Parent attributes are rendered below.
      } else if (["Modal", "Drawer"].includes(entry.id) && ["id", "width"].includes(name)) {
        // Native window identifier and adjustable CSS width are rendered below.
      } else if (["Table Cell Heading", "Table Cell Text"].includes(entry.id) && ["id", "headers"].includes(name)) {
        // Native table associations are rendered below.
      } else if (["Dropdown Item Checkbox", "Dropdown Item Toggle"].includes(entry.id) && ["id", "name", "value", "form"].includes(name)) {
        // Native row-control attributes are rendered below.
      } else if (["Input Text", "Select"].includes(entry.id) && ["id", "value", "name", "form", "autocomplete", "label ids", "description ids", "max height"].includes(name)) {
        // Native text-field attributes are rendered below.
      } else if (entry.id === "Label" && ["html for", "additional text id"].includes(name)) {
        // Native label association is rendered below.
      } else if (["Checkbox Input", "Checkbox Label", "Checkbox Text", "Radio Input", "Radio Label", "Radio Text", "Toggle Input", "Toggle Label", "Toggle Text"].includes(entry.id) && ["id", "name", "value", "form", "description ids"].includes(name)) {
        // Form integration does not change a static visual surface.
      } else if (["Button", "Button Icon", "Tag Interactive"].includes(entry.id) && ["id", "name", "value", "form", "description ids"].includes(name)) {
        // Native attributes are written by the button branch below.
      } else if (entry.id === "Button Inner" && ["id", "description ids"].includes(name)) {
        // Native attributes are written by the local-action button below.
      } else if (entry.id === "Link" && name === "href") {
        // The native destination is written by the Link branch below.
      } else if (entry.id !== "Icon" || name !== "name") {
        throw new Error(`preview: "${entry.id}" has no renderer for string property "${name}"`);
      }
    } else if (property.kind === "event") {
      throw new Error(`preview: "${entry.id}" cannot render an event callback`);
    } else {
      // text and slot render as content, not as attributes.
      content += String(value);
    }
  }

  const baseClass = `stylos-${slugPath(entry.id).replace(/\//g, "-")}`;
  const treatment = ["Button", "Button Icon", "Tag", "Tag Interactive"].includes(entry.id)
    ? props.variant ?? entry.api.find(property => property.name === "variant")?.default : null;
  const treatmentClass = entry.id === "Button Icon" ? "stylos-button" : baseClass;
  const cls = treatment ? `${baseClass} ${treatmentClass}-${treatment}` : baseClass;
  if (["Button", "Button Icon"].includes(entry.id)) {
    attrs.push(`data-surface-layer="${treatment === "ghost" ? 0 : 1}"`, 'data-surface-attachment="in-layout"');
  } else if (["Dropdown", "Tooltip"].includes(entry.id)) {
    attrs.push(`data-surface-layer="${entry.id === "Dropdown" ? 3 : 2}"`, 'data-surface-attachment="control"');
  }
  if (styles.length) attrs.push(`style="${esc(styles.join(";"))}"`);
  const attr = attrs.length ? ` ${attrs.join(" ")}` : "";

  if (["Modal", "Drawer"].includes(entry.id)) return windowPanelHtml(entry, props, attr);

  if (["Table Cell Heading", "Table Cell Text"].includes(entry.id)) {
    return tableCellHtml(entry.id === "Table Cell Heading", props, attr);
  }
  if (["Table Row Head", "Table Row Body"].includes(entry.id)) {
    const heading = entry.id === "Table Row Head";
    const cells = props["cells slot"] || Array.from({ length: 4 }, () => tableCellHtml(heading,
      { size: props.size ?? "medium" }, ` data-size="${esc(props.size ?? "medium")}" data-alignment="start"`)).join("");
    return `<tr class="stylos-table-row ${cls}"${attr}>${cells}</tr>`;
  }

  if (entry.id === "Dropdown") {
    const band = (slot, className) => props[slot] ? `<div class="stylos-dropdown-${className}">${props[slot]}</div>` : "";
    const name = props["accessible name"] ? ` aria-label="${esc(props["accessible name"])}"` : "";
    const id = props.id ? ` id="${esc(props.id)}"` : "";
    return `<div class="${cls}"${attr}>${band("back slot", "back")}${band("search slot", "search")}<ul class="stylos-dropdown-options stylos-scrollbar" data-scrollbar-size="small" data-scrollbar-position="absolute" role="${esc(props["content role"] ?? "listbox")}"${id}${name}>${props["content slot"] ?? ""}</ul>${band("actions slot", "actions")}</div>`;
  }
  if (entry.id === "Dropdown Item Parent") {
    const id = props.id || `stylos-dropdown-parent-preview-${++inputPreviewCounter}`;
    const descriptionId = `${id}-description`;
    const icon = props["has icon"] && props.icon
      ? `<span class="stylos-dropdown-item-leading" aria-hidden="true">${sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name: props.icon })}</span>` : "";
    const arrow = sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name: "arrow_right" });
    return `<li role="presentation"><button type="button" class="stylos-dropdown-item ${cls}"${attr} id="${esc(id)}" aria-label="${esc(props["label text"] ?? "Option")}"${props.controls ? ` aria-controls="${esc(props.controls)}"` : ""}${props.state === "disabled" ? " disabled" : ""}${props["has additional text"] ? ` aria-describedby="${esc(descriptionId)}"` : ""}>${icon}<span class="stylos-dropdown-item-content"><span class="stylos-dropdown-item-label">${esc(props["label text"] ?? "Option")}</span>${props["has additional text"] ? `<span class="stylos-dropdown-item-additional" id="${esc(descriptionId)}">${esc(props["additional text"])}</span>` : ""}</span><span class="stylos-dropdown-item-parent-arrow" aria-hidden="true">${arrow}</span></button></li>`;
  }
  if (entry.id === "Dropdown Item Default") {
    const icon = props["has icon"] && typeof props.icon === "string" && iconDrawings().has(props.icon)
      ? `<span class="stylos-dropdown-item-leading" aria-hidden="true">${sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name: props.icon })}</span>` : "";
    const tick = sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name: "check" });
    if (props.interaction === "action") {
      const descriptionId = `stylos-dropdown-action-preview-${++inputPreviewCounter}-description`;
      return `<li role="presentation"><button type="button" class="stylos-dropdown-item ${cls}"${attr} data-value="${esc(props.value)}" aria-label="${esc(props["label text"] ?? "Option")}"${props.value ? ` aria-pressed="${props["is selected"] === "true"}"` : ""}${props.state === "disabled" ? " disabled" : ""}${props["has additional text"] ? ` aria-describedby="${esc(descriptionId)}"` : ""}>${icon}<span class="stylos-dropdown-item-content"><span class="stylos-dropdown-item-label">${esc(props["label text"] ?? "Option")}</span>${props["has additional text"] ? `<span class="stylos-dropdown-item-additional" id="${esc(descriptionId)}">${esc(props["additional text"])}</span>` : ""}</span><span class="stylos-dropdown-item-selected" aria-hidden="true">${tick}</span></button></li>`;
    }
    return `<li class="stylos-dropdown-item ${cls}" role="option"${attr} data-value="${esc(props.value)}" aria-selected="${props["is selected"] === "true"}"${props.state === "disabled" ? ' aria-disabled="true"' : ""}>${icon}<span class="stylos-dropdown-item-content"><span class="stylos-dropdown-item-label">${esc(props["label text"] ?? "Option")}</span>${props["has additional text"] ? `<span class="stylos-dropdown-item-additional">${esc(props["additional text"])}</span>` : ""}</span><span class="stylos-dropdown-item-selected" aria-hidden="true">${tick}</span></li>`;
  }

  if (["Dropdown Item Checkbox", "Dropdown Item Toggle"].includes(entry.id)) {
    const family = entry.id.endsWith("Toggle") ? "toggle" : "checkbox";
    const id = props.id || `stylos-dropdown-control-preview-${++inputPreviewCounter}`;
    const descriptionId = `${id}-description`;
    const selected = props["is selected"] === "true";
    const native = ["name", "value", "form"].filter(name => props[name])
      .map(name => ` ${name}="${esc(props[name])}"`).join("");
    const input = `<input type="checkbox"${family === "toggle" ? ' role="switch"' : ""} id="${esc(id)}"${native}${selected ? " checked" : ""}${props.state === "disabled" ? " disabled" : ""}${props["has additional text"] ? ` aria-describedby="${esc(descriptionId)}"` : ""} aria-label="${esc(props["label text"] ?? "Option")}">`;
    const control = `<span class="stylos-${family}-input" data-size="${esc(props.size ?? "medium")}" data-state="${esc(props.state ?? "default")}" data-is-checked="${selected}">${input}<span class="stylos-${family}-input-surface"></span></span>`;
    return `<li role="presentation"><label class="stylos-dropdown-item ${cls}"${attr} for="${esc(id)}"><span class="stylos-dropdown-item-control">${control}</span><span class="stylos-dropdown-item-content"><span class="stylos-dropdown-item-label">${esc(props["label text"] ?? "Option")}</span>${props["has additional text"] ? `<span class="stylos-dropdown-item-additional" id="${esc(descriptionId)}">${esc(props["additional text"] ?? "Additional")}</span>` : ""}</span></label></li>`;
  }

  // Label is the one structural case: the required marker and the supporting
  // line are child spans, per the entry's `html` field. The marker span is
  // aria-hidden because the requiredness lives on the control it names.
  // Icon is the second structural case: the mark is a <path>, not content, so
  // the generic text-content branch would
  // put the name inside the <svg> and draw nothing. The drawing comes from
  // the committed set, the same files the component renders.
  if (entry.id === "Icon") {
    const drawing = props.name ? iconDrawings().get(props.name) : undefined;
    if (!drawing) return `<svg class="${cls}"${attr} aria-hidden="true" focusable="false"></svg>`;
    const paths = drawing.paths
      .map((one) => `<path d="${esc(one.d)}"${one.fillRule ? ` fill-rule="${esc(one.fillRule)}"` : ""}/>`)
      .join("");
    return (
      `<svg class="${cls}" viewBox="${esc(drawing.viewBox)}" aria-hidden="true" focusable="false" ` +
      `data-name="${esc(String(props.name))}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`
    );
  }

  if (entry.id === "Label") {
    const marker = props["is required"] ? '<span aria-hidden="true"> *</span>' : "";
    const showsAdditional = (props.validation && props.validation !== "off") || props["has additional text"];
    const additionalId = props["additional text id"] ? ` id="${esc(props["additional text id"])}"` : "";
    const additional = showsAdditional ? `<span${additionalId}>${esc(props["additional text"] ?? "Additional text")}</span>` : "";
    const htmlFor = props["html for"] ? ` for="${esc(props["html for"])}"` : "";
    return `<label class="${cls}"${attr}${htmlFor}>${esc(props["label text"] ?? "Label")}${marker}${additional}</label>`;
  }

  if (["Input Text", "Select"].includes(entry.id)) {
    const id = props.id ?? `input-text-preview-${++inputPreviewCounter}`;
    const size = props.size ?? "medium";
    const state = props.state ?? "default";
    const outcome = state === "default" ? props.validation ?? "off" : "off";
    const labelOutcome = ["error", "warning"].includes(outcome) ? outcome : "off";
    const hasLabel = props["has label"] ?? true;
    const showsMessage = labelOutcome !== "off" || props["has additional text"];
    const messageId = `${id}-message`;
    const suffixId = `${id}-suffix`;
    const message = props["additional text"] ?? "Additional text";
    const labelProps = {
      size, state: state === "disabled" ? "disabled" : "default", validation: labelOutcome,
      "label text": props["label text"] ?? "Label", "is required": props["is required"] ?? false,
      "has additional text": props["has additional text"] ?? false, "additional text": message,
      "html for": id, "additional text id": messageId,
    };
    const label = hasLabel ? sampleHtml({ id: "Label", api: [...Object.keys(labelProps).map(name => ({
      name, kind: ["size", "state", "validation"].includes(name) ? "variant"
        : ["is required", "has additional text"].includes(name) ? "boolean"
        : ["html for", "additional text id"].includes(name) ? "string" : "text",
      values: [{ value: labelProps[name] }],
    }))] }, labelProps) : showsMessage ? `<span id="${esc(messageId)}" hidden>${esc(message)}</span>` : "";
    const descriptions = [props["description ids"], showsMessage ? messageId : "",
      props["has suffix text"] && props["suffix text"] ? suffixId : ""].filter(Boolean).join(" ");
    const native = ["name", "form", "autocomplete"].filter(name => props[name])
      .map(name => ` ${name}="${esc(props[name])}"`).join("");
    const accessibleName = hasLabel ? props["label text"] ?? "Label" : props["accessible name"];
    const semantics = (accessibleName ? ` aria-label="${esc(accessibleName)}"` : "")
      + (!hasLabel && props["label ids"] ? ` aria-labelledby="${esc(props["label ids"])}"` : "")
      + (descriptions ? ` aria-describedby="${esc(descriptions)}"` : "")
      + (outcome === "error" ? ' aria-invalid="true"' : "")
      + (state === "disabled" ? " disabled" : state === "read only" ? " readonly" : "")
      + (props["is required"] ? " required" : "");
    const icon = position => {
      const name = props[`${position} icon`];
      return props[`has ${position} icon`] && typeof name === "string" && iconDrawings().has(name)
        ? `<span class="stylos-input-text-icon" data-position="${position}" aria-hidden="true">${sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name })}</span>` : "";
    };
    const validation = outcome !== "off" ? `<span class="stylos-input-text-validation" aria-hidden="true">${sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name: { error: "error", warning: "warning", success: "check_circle" }[outcome] })}</span>` : "";
    const suffix = props["has suffix text"] ? `<span class="stylos-input-text-suffix" id="${esc(suffixId)}">${esc(props["suffix text"] ?? "Suffix")}</span>` : "";
    const placeholder = props["has placeholder"] ? ` placeholder="${esc(props["placeholder text"] ?? "Placeholder text")}"` : "";
    if (entry.id === "Select") {
      const filled = !!props.value;
      const display = filled ? props["input text"] || props.value : (props["has placeholder"] ?? true) ? props["placeholder text"] ?? "Select the option" : "";
      const triggerSemantics = semantics.replace(/ readonly/g, ' aria-readonly="true"').replace(/ required/g, ' aria-required="true"');
      const svg = name => sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name });
      const clear = props["has clear button"] && filled && state === "default"
        ? `<span class="stylos-select-clear"><button class="stylos-button-inner" data-state="default" type="button" aria-label="${esc(props["clear accessible name"] || `Clear ${accessibleName || ""}`)}"><span class="stylos-button-inner-icon" aria-hidden="true">${svg("close")}</span></button></span>` : "";
      const chevron = state === "default" ? `<span class="stylos-select-icon" data-position="trailing" aria-hidden="true">${svg("arrow_drop_down")}</span>` : "";
      const formSemantics = (state === "disabled" ? " disabled" : "") + (props["is required"] && state === "default" ? " required" : "");
      const nativeSelect = `<select data-select-native id="${esc(id)}-native"${native}${formSemantics} aria-hidden="true" tabindex="-1"><option value=""${filled ? "" : " selected"}></option>${filled ? `<option value="${esc(props.value)}" selected>${esc(display)}</option>` : ""}</select>`;
      return `<div class="${cls}"${attr} data-is-filled="${filled}">${label}<div class="stylos-select-field" data-surface-layer="1" data-surface-attachment="in-layout"><button type="button" class="stylos-select-trigger" id="${esc(id)}" role="combobox" aria-haspopup="listbox" aria-expanded="false"${triggerSemantics}><span class="stylos-select-value"><span>${esc(display)}</span></span></button>${nativeSelect}<div class="stylos-select-adornments"><span class="stylos-select-leading">${icon("leading").replaceAll("stylos-input-text", "stylos-select")}</span><span class="stylos-select-trailing">${suffix.replaceAll("stylos-input-text", "stylos-select")}${clear}${validation.replaceAll("stylos-input-text", "stylos-select")}${chevron}</span></div></div></div>`;
    }
    return `<div class="${cls}"${attr} data-is-filled="${!!props.value}">${label}<div class="stylos-input-text-field" data-surface-layer="1" data-surface-attachment="in-layout"><input type="text" id="${esc(id)}" value="${esc(props.value ?? "")}"${native}${semantics}${placeholder}><div class="stylos-input-text-adornments"><span class="stylos-input-text-leading">${icon("leading")}</span><span class="stylos-input-text-trailing">${suffix}${validation}${icon("trailing")}</span></div></div></div>`;
  }

  if (["Tag", "Tag Interactive"].includes(entry.id)) {
    const icon = position => {
      const name = props[`${position} icon`];
      return props[`has ${position} icon`] && typeof name === "string" && iconDrawings().has(name)
        ? `<span class="stylos-tag-icon" data-position="${position}" aria-hidden="true">${sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name })}</span>` : "";
    };
    const content = `${icon("leading")}<span class="stylos-tag-label">${esc(props["label text"] ?? "Tag")}</span>${icon("trailing")}`;
    if (entry.id === "Tag Interactive") {
      const native = ["id", "name", "value", "form"].filter(name => props[name])
        .map(name => ` ${name}="${esc(props[name])}"`).join("");
      const description = props["description ids"] ? ` aria-describedby="${esc(props["description ids"])}"` : "";
      const disabled = props.state === "disabled" ? " disabled" : "";
      return `<button type="${esc(props.type ?? "button")}" class="${cls}"${attr}${native}${description}${disabled}>${content}</button>`;
    }
    return `<span class="${cls}"${attr}>${content}</span>`;
  }

  if (entry.id === "Button Icon") {
    const native = ["id", "name", "value", "form"].filter(name => props[name])
      .map(name => ` ${name}="${esc(props[name])}"`).join("");
    const name = props["accessible name"] ? ` aria-label="${esc(props["accessible name"])}"` : "";
    const description = props["description ids"] ? ` aria-describedby="${esc(props["description ids"])}"` : "";
    const disabled = props.state === "disabled" ? " disabled" : "";
    const icon = typeof props.icon === "string" && iconDrawings().has(props.icon)
      ? `<span class="stylos-button-icon-mark" aria-hidden="true">${sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name: props.icon })}</span>` : "";
    return `<button type="${esc(props.type ?? "button")}" class="${cls}"${attr}${native}${name}${description}${disabled}>${icon}</button>`;
  }

  if (entry.id === "Button Inner") {
    const disabled = props.state === "disabled" ? " disabled" : "";
    const id = props.id ? ` id="${esc(props.id)}"` : "";
    const name = props["accessible name"] ? ` aria-label="${esc(props["accessible name"])}"` : "";
    const description = props["description ids"] ? ` aria-describedby="${esc(props["description ids"])}"` : "";
    const icon = typeof props.icon === "string" && iconDrawings().has(props.icon)
      ? `<span class="stylos-button-inner-icon" aria-hidden="true">${sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name: props.icon })}</span>` : "";
    return `<button type="button" class="${cls}"${attr}${id}${name}${description}${disabled}>${icon}</button>`;
  }

  if (entry.id === "Link") {
    const disabled = props.state === "disabled";
    const href = disabled ? "" : ` href="${esc(props.href ?? "#")}"`;
    const semantics = disabled ? ' role="link" aria-disabled="true" tabindex="-1"' : "";
    return `<a class="${cls}"${attr}${href}${semantics}><span class="stylos-link-label">${esc(props["label text"] ?? "Link")}</span></a>`;
  }

  if (entry.id === "Button") {
    const disabled = props.state === "disabled" ? " disabled" : "";
    const native = ["id", "name", "value", "form"].filter(name => props[name])
      .map(name => ` ${name}="${esc(props[name])}"`).join("");
    const description = props["description ids"] ? ` aria-describedby="${esc(props["description ids"])}"` : "";
    return `<button type="${esc(props.type ?? "button")}" class="${cls}"${attr}${native}${description}${disabled}><span>${esc(props["label text"] ?? "Button")}</span></button>`;
  }

  if (["Checkbox Input", "Radio Input", "Toggle Input"].includes(entry.id)) {
    return `<span class="${cls}"${attr} aria-hidden="true"><span class="${cls}-surface"></span></span>`;
  }

  if (["Checkbox Label", "Checkbox Text", "Radio Label", "Radio Text", "Toggle Label", "Toggle Text"].includes(entry.id)) {
    const family = entry.family.toLowerCase();
    const size = esc(props.size ?? (family === "checkbox" ? "medium" : "extra small"));
    const state = esc(props.state ?? "default");
    const selection = esc(props["is checked"] ?? "false");
    return `<span class="${cls}"${attr}><span class="stylos-${family}-input" data-size="${size}" data-state="${state}" data-is-checked="${selection}" aria-hidden="true"><span class="stylos-${family}-input-surface"></span></span><span class="stylos-${family}-copy">${esc(props["label text"] ?? entry.family)}</span></span>`;
  }

  return `<span class="${cls}"${attr}>${esc(content)}</span>`;
}

function windowPanelHtml(entry, props, attr) {
  const modal = entry.id === "Modal";
  const id = props.id ?? `window-preview-${++inputPreviewCounter}`;
  const heading = props["heading text"] ?? `${entry.id} heading`;
  const previewStyle = [props.width ? `--stylos-window-width:${props.width}` : "", modal ? "" : "height:500px"].filter(Boolean).join(";");
  const icon = sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name: "close" });
  const action = (kind, variant, tone, fallback) => {
    if (!(props[`has ${kind} button`] ?? kind !== "tertiary")) return "";
    const values = { size: props.size ?? "medium", variant, tone, state: "default", "label text": props[`${kind} button text`] ?? fallback };
    return sampleHtml({ id: "Button", api: Object.keys(values).map(name => ({ name, kind: name === "label text" ? "text" : "variant", values: [{ value: values[name] }] })) }, values);
  };
  const hasActions = (props["has primary button"] ?? true) || (props["has secondary button"] ?? true) || (props["has tertiary button"] ?? false);
  return `<section class="stylos-window stylos-${entry.id.toLowerCase()}"${attr} id="${esc(id)}" aria-labelledby="${esc(id)}-heading" data-surface-layer="${modal ? 6 : 5}" data-surface-attachment="${modal ? "free" : "window-edge"}" data-surface-edge="${esc(props.position ?? "right")}"${previewStyle ? ` style="${esc(previewStyle)}"` : ""}><div class="stylos-window-header"><h2 class="stylos-window-heading" id="${esc(id)}-heading">${esc(heading)}</h2><span class="stylos-window-close"><button type="button" class="stylos-button-inner" data-state="default" aria-label="${esc(props["close accessible name"] ?? "Close")}"><span class="stylos-button-inner-icon" aria-hidden="true">${icon}</span></button></span></div><div class="stylos-window-content stylos-scrollbar" data-scrollbar-size="medium" data-scrollbar-position="absolute">${props["content slot"] ?? ""}</div>${hasActions ? `<div class="stylos-window-footer">${action("tertiary", "ghost", "base", "Alternative")}<div class="stylos-window-actions">${action("secondary", "outline", "base", "Cancel")}${action("primary", "base", "primary", "Confirm")}</div></div>` : ""}</section>`;
}

function tableCellHtml(heading, props, attr) {
  const iconHtml = name => sampleHtml({ id: "Icon", api: [{ name: "name", kind: "string" }] }, { name });
  const icon = props["has icon"] && props.icon ? `<span class="stylos-table-cell-icon" aria-hidden="true">${iconHtml(props.icon)}</span>` : "";
  const text = props["cell text"] ?? "Cell text";
  const copy = `<span class="stylos-table-cell-copy"><span class="stylos-table-cell-label" title="${esc(text)}">${esc(text)}</span>${props["has additional text"] ? `<span class="stylos-table-cell-additional" title="${esc(props["additional text"])}">${esc(props["additional text"])}</span>` : ""}</span>`;
  const action = (kind, name) => `<span class="stylos-table-cell-action" data-table-action="${kind}"><button type="button" class="stylos-button-inner" data-state="default" aria-label="${esc(props[`${kind} accessible name`] || `${kind === "sort" ? "Sort" : "Filter"} by ${text}`)}"><span class="stylos-button-inner-icon" aria-hidden="true">${iconHtml(name)}</span></button></span>`;
  const controls = heading ? `${props["is sorted"] ? action("sort", props["sort direction"] === "descending" ? "arrow_upward" : "arrow_downward") : ""}${props["is filtered"] ? action("filter", "filter_list") : ""}` : "";
  const associations = `${props.id ? ` id="${esc(props.id)}"` : ""}${props.headers ? ` headers="${esc(props.headers)}"` : ""}`;
  const tag = heading ? "th" : "td";
  return `<${tag} class="stylos-table-cell stylos-table-cell-${heading ? "heading" : "text"}"${attr}${associations}${heading ? ` scope="col" data-constrained="${!!(props["is sorted"] || props["is filtered"])}"${props["is sorted"] ? ` aria-sort="${esc(props["sort direction"] ?? "ascending")}"` : ""}` : ""}><div class="stylos-table-cell-frame">${icon}${copy}${controls}</div></${tag}>`;
}

/** Native cells and rows require table scaffolding on standalone preview pages. */
export function wrapTablePreview(entry, html) {
  if (!["Table Cell Heading", "Table Cell Text", "Table Row Head", "Table Row Body"].includes(entry.id)) return html;
  const heading = entry.id === "Table Cell Heading" || entry.id === "Table Row Head";
  const band = heading ? "thead" : "tbody";
  const row = entry.id.startsWith("Table Cell") ? `<tr>${html}</tr>` : html;
  return `<table class="stylos-table" aria-label="${esc(entry.name ?? entry.id)}"><${band}>${row}</${band}></table>`;
}

/**
 * The entry's every-property-at-its-default assignment — what the page's top
 * preview shows. Text and boolean defaults included, so Label renders its
 * default name rather than an empty tag.
 */
export function defaultAssignment(entry) {
  const assignment = {};
  for (const property of entry.api ?? []) {
    // A property with no default but with documented values starts from the
    // first of them. A sample has to show something, and a contract that
    // declines to name a default (Icon: a forgotten name must draw nothing)
    // still documents what a value looks like. This is the sample's fallback,
    // never the component's — nothing here reaches the built component.
    const value = property?.default ?? (property?.values ?? [])[0]?.value;
    if (value === undefined) continue;
    assignment[property.name] = value;
  }
  return assignment;
}

/**
 * Everything the component pages need to render real previews: the token
 * sheet (the same projection `tokens:css` ships) and each implemented
 * component's authored CSS, keyed by entry id. Null when nothing is built —
 * every page then keeps its placeholders, and rightly.
 */
export function buildPreviewAssets(root, entries) {
  const built = builtComponents(root, entries);
  if (built.length === 0) return null;

  const { css: tokensCss, errors } = buildCss({
    collections: loadCanonical(root),
    naming: readNaming(root),
    effectStyles: loadEffectStyles(root),
  });
  if (errors.length > 0) {
    throw new Error(`preview: the token sheet did not build:\n${errors.join("\n")}`);
  }

  const byId = new Map(
    built.map((entry) => {
      const slug = slugPath(entry.id);
      return [
        entry.id,
        componentCss(root, slug),
      ];
    })
  );

  return { tokensCss, byId };
}

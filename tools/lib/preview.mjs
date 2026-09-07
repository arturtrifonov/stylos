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
import { slugPath } from "./registry.mjs";
import { readNaming } from "../check-tokens.mjs";
import { buildCss } from "../build-css.mjs";
import { builtComponents } from "../build-ui-types.mjs";

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
function iconDrawings() {
  if (iconCache === null) {
    const root = fileURLToPath(new URL("../..", import.meta.url));
    iconCache = new Map(readIcons(root));
  }
  return iconCache;
}

export function sampleHtml(entry, props = {}) {
  const api = new Map((entry.api ?? []).map((property) => [property.name, property]));
  const attrs = [];
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
    } else {
      // text and slot render as content, not as attributes.
      content += String(value);
    }
  }

  const cls = `stylos-${slugPath(entry.id).replace(/\//g, "-")}`;
  const attr = attrs.length ? ` ${attrs.join(" ")}` : "";

  // Label is the one structural case: the required marker and the supporting
  // line are child spans, per the entry's `html` field. The marker span is
  // aria-hidden because the requiredness lives on the control it names.
  // Icon is the second structural case: the mark is a <path>, not content, so
  // the generic branch below (which renders a text property as text) would
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
    const additional = showsAdditional ? `<span>${esc(props["additional text"] ?? "Additional text")}</span>` : "";
    return `<label class="${cls}"${attr}>${esc(props["label text"] ?? "Label")}${marker}${additional}</label>`;
  }

  return `<span class="${cls}"${attr}>${esc(content)}</span>`;
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
  });
  if (errors.length > 0) {
    throw new Error(`preview: the token sheet did not build:\n${errors.join("\n")}`);
  }

  const byId = new Map(
    built.map((entry) => {
      const slug = slugPath(entry.id);
      return [
        entry.id,
        readFileSync(path.join(root, "packages/ui/src/components", slug, `${path.basename(slug)}.css`), "utf8"),
      ];
    })
  );

  return { tokensCss, byId };
}

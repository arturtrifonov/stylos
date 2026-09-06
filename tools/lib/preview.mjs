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
    if (property?.default === undefined) continue;
    assignment[property.name] = property.default;
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

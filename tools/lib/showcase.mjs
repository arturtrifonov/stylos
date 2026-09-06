// The front page's live sample — SPEC 0011 §5.
//
// The rule: the sample is real or it is absent. What renders here is the
// authored CSS of the implemented components plus the token sheet the package
// ships, and markup written to the public DOM contract (SPEC 0010 §2.3) —
// the same strings a consumer writes. A component that is not built does not
// appear; the counts and the charts carry the future, the sample never does.
//
// Every assignment below is validated against the entry's contract at build
// time: a property the contract does not carry, or a value outside a
// variant's list, fails the build rather than shipping a claim the registry
// does not make. The composition is curated by hand — which tones, which
// counts — but nothing about a component can be said here that its entry
// does not say.

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
 * contract does not carry — the build refuses to claim what the registry
 * does not say.
 */
export function sampleHtml(entry, props = {}) {
  const api = new Map((entry.api ?? []).map((property) => [property.name, property]));
  const attrs = [];
  let content = "";

  for (const [name, value] of Object.entries(props)) {
    const property = api.get(name);
    if (!property) {
      throw new Error(`showcase: "${entry.id}" has no api property "${name}"`);
    }
    if (property.kind === "variant") {
      const allowed = (property.values ?? []).map((row) => row.value);
      if (!allowed.includes(value)) {
        throw new Error(
          `showcase: "${entry.id}" property "${name}" has no value "${value}" — the contract lists: ${allowed.join(", ")}`
        );
      }
      attrs.push(`data-${kebab(name)}="${esc(value)}"`);
    } else if (property.kind === "boolean") {
      if (typeof value !== "boolean") {
        throw new Error(`showcase: "${entry.id}" property "${name}" is a boolean; got "${value}"`);
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
 * What the sample shows, per built component, in registry vocabulary. A group
 * whose component is not built is silently absent — the filter below, not
 * this table, decides what appears.
 */
const GROUPS = [
  {
    id: "Badge",
    note: "Every tone is a text colour role; the surface is the role and the label is its opposite.",
    samples: (entry) => [
      { html: sampleHtml(entry, { "number text": "3", tone: "base", size: "medium" }), label: "base" },
      { html: sampleHtml(entry, { "number text": "12", tone: "primary", size: "medium" }), label: "primary" },
      { html: sampleHtml(entry, { "number text": "8", tone: "success", size: "medium" }), label: "success" },
      { html: sampleHtml(entry, { "number text": "2", tone: "warning", size: "medium" }), label: "warning" },
      { html: sampleHtml(entry, { "number text": "99+", tone: "danger", size: "medium" }), label: "danger" },
      { html: sampleHtml(entry, { "number text": "4", tone: "inverted", size: "medium" }), label: "inverted" },
    ],
  },
  {
    id: "Indicator Status",
    note: "The semantic dot — one tone per semantic text role.",
    samples: (entry) =>
      ["success", "warning", "danger", "primary", "secondary", "base"].map((tone) => ({
        html: sampleHtml(entry, { tone, size: "medium" }),
        label: tone,
      })),
  },
  {
    id: "Indicator Special",
    note: "The categorical dot — the full special palette, flat to within a point of contrast.",
    samples: (entry) =>
      ["amber", "blue", "cyan", "emerald", "fuchsia", "indigo", "lime", "orange", "rose", "teal", "violet", "slate"].map(
        (tone) => ({
          html: sampleHtml(entry, { tone, size: "medium" }),
          label: tone,
        })
      ),
  },
  {
    id: "Label",
    note: "A name for a control: the marker rides the name, the supporting line rides validation.",
    samples: (entry) => [
      { html: sampleHtml(entry, { "label text": "Delivery address", "is required": true, size: "medium" }), label: "required" },
      {
        html: sampleHtml(entry, {
          "label text": "Display name",
          "has additional text": true,
          "additional text": "Shown wherever you appear",
          size: "medium",
        }),
        label: "with a supporting line",
      },
      {
        html: sampleHtml(entry, {
          "label text": "Email",
          validation: "error",
          "additional text": "This does not look like an address",
          size: "medium",
        }),
        label: "validation: error",
      },
    ],
  },
  {
    id: "Loader",
    note: "Always in motion — a stopped loader is the one thing the contract forbids.",
    samples: (entry) => [{ html: sampleHtml(entry, {}), label: "" }],
  },
];

/**
 * The whole payload: the token sheet plus the authored CSS of every built
 * component, and the curated groups for those of them the composition names.
 * Null when nothing is built — the section is then absent, not empty.
 */
export function buildShowcase(root, entries) {
  const built = builtComponents(root, entries);
  if (built.length === 0) return null;

  const { css: tokensCss, errors } = buildCss({
    collections: loadCanonical(root),
    naming: readNaming(root),
  });
  if (errors.length > 0) {
    throw new Error(`showcase: the token sheet did not build:\n${errors.join("\n")}`);
  }

  const componentCss = built
    .map((entry) => {
      const slug = slugPath(entry.id);
      return readFileSync(path.join(root, "packages/ui/src/components", slug, `${path.basename(slug)}.css`), "utf8");
    })
    .join("\n");

  const byId = new Map(built.map((entry) => [entry.id, entry]));
  const groups = GROUPS.filter((group) => byId.has(group.id)).map((group) => {
    const entry = byId.get(group.id);
    return { id: group.id, name: entry.name, note: group.note, samples: group.samples(entry) };
  });

  return { css: `${tokensCss}\n${componentCss}`, built: built.length, groups };
}

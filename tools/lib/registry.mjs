// Reads docs/components/registry/**/*.yaml into one shape, for everything that
// needs the component data: the linter and the view builder both load through
// here so they cannot disagree about what an entry is.
//
// The files are in the restricted subset of ./yaml.mjs, which has no
// flow-collection syntax — so an entry with no children omits the key rather
// than writing `children: []`. Absent and empty mean the same thing here, and
// the accessors below flatten that distinction away.
//
// Unknown fields are kept. The registry is the seed of the component contract
// (docs/components/README.md) and will grow fields this file has never heard
// of; anything not listed in KNOWN_FIELDS survives in `extra` so the view can
// render it rather than silently drop it.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

import { parse } from "./yaml.mjs";

export const LEVELS = ["primitive", "element", "object", "widget", "layout"];
export const ROLES = ["content", "trigger", "input", "toolbar", "output", "container"];

// The two Figma files that hold components, from figma/README.md. A node id
// recorded against any other file is a mistake — Styles and Playground hold no
// components, and the icon kit is external.
export const COMPONENT_FILE_KEYS = new Map([
  ["WUc07ZBtjRvypXtsOlbVut", "Stylos / Components"],
  ["vmR8eiLdeZQuEVXokZK57c", "Stylos / GUI components"],
]);

export const FIGMA_TYPES = ["component", "component_set"];

const KNOWN_FIELDS = new Set([
  "id",
  "name",
  "level",
  "role",
  "flow_behavior",
  "children",
  "parents",
  "notes",
  "figma",
  "import",
]);

/** `Table / TD Text` → `table/td-text`. The same rule the 2026-08-20 import used. */
export function slugPath(id) {
  return id
    .split(" / ")
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .join("/");
}

/** Where this component's registry entry must live, relative to the repository root. */
export function registryPathFor(id) {
  return `docs/components/registry/${slugPath(id)}.yaml`;
}

/**
 * Where this component's document lives, relative to the repository root. The
 * path mirrors the registry path — see docs/components/README.md; the two
 * directories used to disagree for any name containing a slash.
 */
export function documentPathFor(id) {
  return `docs/components/${slugPath(id)}.md`;
}

/**
 * Figma addresses a node with a dash in a URL and a colon everywhere else. The
 * registry stores the colon form and this builds the link, so no stored URL
 * can rot out of step with the parts it was built from.
 */
export function figmaUrl(figma) {
  if (!figma?.file_key || !figma?.node_id) return null;
  return `https://www.figma.com/design/${figma.file_key}/?node-id=${figma.node_id.replace(/:/g, "-")}`;
}

/** Rank in the composition order primitive → layout, or -1 for an unknown level. */
export function levelRank(level) {
  return LEVELS.indexOf(level);
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // The Airtable CSV that bootstrapped the registry, kept as history.
    if (entry.name === "import-source") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".yaml")) files.push(full);
  }
  return files;
}

function list(map, key) {
  const value = map.get(key);
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function plain(value) {
  if (value instanceof Map) return Object.fromEntries([...value].map(([k, v]) => [k, plain(v)]));
  if (Array.isArray(value)) return value.map(plain);
  return value;
}

function toEntry(root, file) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const parsed = parse(readFileSync(file, "utf8"), { filename: relative });
  if (!(parsed instanceof Map)) {
    throw new Error(`${relative}: expected a mapping at the top level`);
  }

  const extra = new Map();
  for (const [key, value] of parsed) {
    if (!KNOWN_FIELDS.has(key)) extra.set(key, plain(value));
  }

  const figma = parsed.get("figma");
  const imported = parsed.get("import");

  return {
    file: relative,
    id: parsed.get("id") ?? null,
    name: parsed.get("name") ?? parsed.get("id") ?? null,
    level: parsed.get("level") ?? null,
    role: parsed.get("role") ?? null,
    flowBehavior: list(parsed, "flow_behavior"),
    children: list(parsed, "children"),
    parents: list(parsed, "parents"),
    notes: parsed.get("notes") ?? "",
    figma: figma instanceof Map ? plain(figma) : null,
    import: imported instanceof Map ? plain(imported) : null,
    extra: Object.fromEntries(extra),
  };
}

/**
 * Every registry entry, sorted by id so output does not depend on the order a
 * filesystem happens to return directory entries in. Ties break on the path,
 * which only two files claiming one id can produce — and that is a failure the
 * linter names, so it should name the same file every run.
 */
export function loadRegistry(root) {
  const dir = path.join(root, "docs/components/registry");
  return walk(dir)
    .map((file) => toEntry(root, file))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)) || a.file.localeCompare(b.file));
}

/**
 * The two derived flags. Neither is authored: `documented` is whether the
 * component's Markdown document exists on disk, `linked` is whether a Figma
 * node has been recorded. See docs/specs/0002-registry-viewer.md §3.2 for why
 * there is no status field to update by hand.
 */
export function derive(root, entry) {
  return {
    documented: entry.id !== null && existsSync(path.join(root, documentPathFor(entry.id))),
    linked: Boolean(entry.figma?.node_id),
  };
}

// Reads docs/components/registry/**/*.yaml into one shape, for everything that
// needs the component data: the linter and the view builder both load through
// here so they cannot disagree about what an entry is.
//
// The files are in the restricted subset of ./yaml.mjs, which has no
// flow-collection syntax — so an entry with no children omits the key rather
// than writing `children: []`. Absent and empty mean the same thing here, and
// the accessors below flatten that distinction away.
//
// Unknown fields are kept. The registry holds the whole component contract
// (docs/components/registry/README.md) and will grow fields this file has never
// heard of; anything not listed in KNOWN_FIELDS survives in `extra` so the view
// can render it rather than silently drop it.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { parse } from "./yaml.mjs";

export const LEVELS = ["primitive", "element", "object", "widget", "layout"];
export const ROLES = ["content", "trigger", "input", "toolbar", "output", "container"];

// The closed vocabularies of the contract, from docs/components/registry/README.md.
// They live here rather than in the linter because the page generator reads
// them too — a glyph per kind, a colour per a11y status — and a second copy
// would be a second thing to update when one of them grows.
export const STATUSES = ["draft", "published", "deprecated"];
export const PROPERTY_KINDS = ["variant", "text", "boolean", "instance"];
export const A11Y_STATUSES = ["warning", "fail", "open", "requires"];
export const SIZING_AXES = ["hug", "fixed", "fill", "absolute"];
export const LINE_HEIGHT_FAMILIES = ["text", "string", "heading", "code"];

// The two Figma files that hold components, from figma/README.md. A node id
// recorded against any other file is a mistake — Styles and Playground hold no
// components, and the icon kit is external.
export const COMPONENT_FILE_KEYS = new Map([
  ["WUc07ZBtjRvypXtsOlbVut", "Stylos / Components"],
  ["vmR8eiLdeZQuEVXokZK57c", "Stylos / GUI components"],
]);

const KNOWN_FIELDS = new Set([
  "id",
  "name",
  "family",
  "level",
  "role",
  "status",
  "version",
  "summary",
  "purpose",
  "use_when",
  "do_not_use_when",
  "children",
  "parents",
  "uses",
  "used_by",
  "flow_behavior",
  "a11y",
  "sizing_model",
  "variants",
  "api",
  "limitations",
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
 * Where this component's generated page lands, relative to build/components/.
 * The path mirrors the registry path, so `Table / TD Text` is one directory
 * deep in both places and a link between two pages is a relative path either
 * side of the same tree.
 *
 * There is no hand-written document to point at any more: the readable page is
 * generated from the entry (docs/components/STANDARD.md).
 */
export function pagePathFor(id) {
  return `${slugPath(id)}.html`;
}

/**
 * Both parts are stored exactly as the address bar gives them, so the link is
 * a concatenation and nothing here converts anything. The URL itself is never
 * stored: it is derivable, and a stored URL rots in a way the parts do not.
 */
export function figmaUrl(figma) {
  if (!figma?.file_key || !figma?.node_id) return null;
  return `https://www.figma.com/design/${figma.file_key}/?node-id=${figma.node_id}`;
}

/** Rank in the composition order primitive → layout, or -1 for an unknown level. */
export function levelRank(level) {
  return LEVELS.indexOf(level);
}

/**
 * The alternatives a `do_not_use_when` entry names, always as a list.
 *
 * `instead` is one id where one component is right and a sequence where a
 * family is — the three Button treatments answer "the control performs an
 * action" together, and picking one of them arbitrarily would make the
 * sentence narrower than the judgement behind it. Absent and null both mean
 * the recorded judgement that nothing else is right, and both give [].
 */
export function insteadIds(avoid) {
  const instead = avoid?.instead;
  if (instead === undefined || instead === null) return [];
  return Array.isArray(instead) ? instead : [instead];
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
  const sizingModel = parsed.get("sizing_model");
  const variants = parsed.get("variants");

  return {
    file: relative,
    id: parsed.get("id") ?? null,
    name: parsed.get("name") ?? parsed.get("id") ?? null,
    family: parsed.get("family") ?? null,
    level: parsed.get("level") ?? null,
    role: parsed.get("role") ?? null,
    status: parsed.get("status") ?? null,
    version: parsed.get("version") ?? null,
    summary: parsed.get("summary") ?? null,
    purpose: parsed.get("purpose") ?? null,
    useWhen: list(parsed, "use_when").map(plain),
    doNotUseWhen: list(parsed, "do_not_use_when").map(plain),
    flowBehavior: list(parsed, "flow_behavior"),
    children: list(parsed, "children"),
    parents: list(parsed, "parents"),
    uses: list(parsed, "uses"),
    usedBy: list(parsed, "used_by"),
    a11y: list(parsed, "a11y").map(plain),
    sizingModel: sizingModel instanceof Map ? plain(sizingModel) : null,
    variants: variants instanceof Map ? plain(variants) : null,
    api: list(parsed, "api").map(plain),
    limitations: list(parsed, "limitations"),
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
 * The two derived flags, neither of them authored — see
 * docs/components/registry/README.md, "Computed, never authored".
 *
 * `documented` used to be whether a Markdown document existed on disk. That
 * model was withdrawn on 2026-08-26: the contract is the entry, so whether it
 * is written is a question about the entry's own fields.
 */
export function derive(entry) {
  const properties = Array.isArray(entry.api) ? entry.api : [];
  return {
    documented: Boolean(
      entry.summary &&
        entry.purpose &&
        entry.useWhen.length > 0 &&
        properties.every((property) => property?.description)
    ),
    linked: Boolean(entry.figma?.node_id),
  };
}

// The two flags above, read as one word — how far the *record* has been taken,
// not where the component is in its life. Lifecycle is the authored `status`
// field (draft / published / deprecated) and stays separate: an entry can be a
// complete record of a draft component.
//
// Most complete first, so a sort on the index puts what is ready at the top.
export const READINESS = ["ready", "in progress", "not started"];

export function readiness(entry) {
  const { documented, linked } = derive(entry);
  if (documented && linked) return "ready";
  if (documented || linked) return "in progress";
  return "not started";
}

function orList(names) {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/**
 * The three lines that go into the component's Figma `descriptionMarkdown`,
 * composed from fields that already exist rather than read from a field of
 * their own — see docs/components/registry/README.md, "The Figma description is
 * derived, never authored". Returns null where any of the three is missing:
 * two lines of a three-line description is worse than none.
 *
 * Nothing writes this to Figma yet. It is composed here so that whatever does
 * write it takes the text from one place.
 */
export function composeFigmaDescription(entry) {
  const summary = entry.summary;
  const first = entry.useWhen[0];
  const avoid = entry.doNotUseWhen[0];
  if (!summary || !first || !avoid?.text) return null;

  const alternatives = insteadIds(avoid);
  const instead = alternatives.length > 0 ? ` Use ${orList(alternatives)} instead.` : "";
  return [`${summary}`, `Use when: ${first}`, `Do not use when: ${avoid.text}${instead}`].join("\n");
}

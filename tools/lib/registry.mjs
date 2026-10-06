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
export const STATUSES = ["draft", "ready", "deprecated"];
export const PROPERTY_KINDS = ["variant", "text", "string", "boolean", "instance", "slot"];
export const A11Y_STATUSES = ["warning", "fail", "open", "requires"];
export const SIZING_AXES = ["hug", "fixed", "fill"];
export const LINE_HEIGHT_FAMILIES = ["text", "string", "heading", "code"];

// The whole key set of the `motion` block, and it is closed on purpose.
// Shared duration/easing parameters belong to the system's canonical record.
// This block still describes intrinsic animation only: that it loops, which
// property carries it, and its intent. A structured transition/profile record
// remains an open decision in docs/components/registry/README.md; no keys are added here.
export const MOTION_FIELDS = ["drives", "loop", "intent"];

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
  "html",
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
  "motion",
  "api",
  "limitations",
  "figma_notes",
  "notes",
  "figma",
  "import",
]);

/**
 * `Table Cell Text` → `table-cell-text`, and `Foo / Bar` → `foo/bar`. The same
 * rule the 2026-08-20 import used. No entry carries a `/` since 2026-09-02 —
 * the split survives because the path has to follow whatever Figma's name is,
 * not because a nested path is wanted (figma/naming.md).
 */
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
 * The path mirrors the registry path, so an id that puts its entry a directory
 * deep puts its page a directory deep too, and a link between two pages is a
 * relative path either side of the same tree.
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
  const motion = parsed.get("motion");

  return {
    file: relative,
    id: parsed.get("id") ?? null,
    name: parsed.get("name") ?? parsed.get("id") ?? null,
    family: parsed.get("family") ?? null,
    level: parsed.get("level") ?? null,
    role: parsed.get("role") ?? null,
    html: parsed.get("html") ?? null,
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
    motion: motion instanceof Map ? plain(motion) : null,
    api: list(parsed, "api").map(plain),
    limitations: list(parsed, "limitations"),
    figmaNotes: list(parsed, "figma_notes").map(plain),
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

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

/** Missing required contract data under STD-04, independent of representations. */
export function contractGaps(entry) {
  const gaps = [];
  for (const [field, value] of [["level", entry.level], ["role", entry.role],
    ["summary", entry.summary], ["purpose", entry.purpose]]) {
    if (!hasText(value)) gaps.push(field);
  }
  if (!Array.isArray(entry.useWhen) || entry.useWhen.length === 0 || !entry.useWhen.every(hasText)) {
    gaps.push("use_when");
  }
  if (!Array.isArray(entry.doNotUseWhen) || entry.doNotUseWhen.length === 0 ||
      !entry.doNotUseWhen.every((item) => hasText(item?.text))) {
    gaps.push("do_not_use_when");
  }

  const properties = Array.isArray(entry.api) ? entry.api : [];
  for (const [index, property] of properties.entries()) {
    const where = `api "${property?.name ?? index}"`;
    if (!hasText(property?.name)) gaps.push(`${where}.name`);
    if (!PROPERTY_KINDS.includes(property?.kind)) gaps.push(`${where}.kind`);
    if (!hasText(property?.description)) gaps.push(`${where}.description`);
    if (property?.kind === "variant" && (!Array.isArray(property.values) ||
        property.values.length === 0 || !property.values.every((item) => hasText(item?.value)))) {
      gaps.push(`${where}.values`);
    }
    for (const value of Array.isArray(property?.values) ? property.values : []) {
      if (value?.a11y && !hasText(value.rationale)) {
        gaps.push(`${where} value "${value.value}".rationale`);
      }
    }
  }

  const sizing = entry.sizingModel;
  if (!sizing) {
    gaps.push("sizing_model");
  } else {
    for (const axis of ["horizontal", "vertical"]) {
      if (!SIZING_AXES.includes(sizing[axis])) gaps.push(`sizing_model.${axis}`);
      if (typeof sizing.adjustable?.[axis] !== "boolean") gaps.push(`sizing_model.adjustable.${axis}`);
    }
    if (!hasText(sizing.intent)) gaps.push("sizing_model.intent");
    const sizeProperty = properties.find((property) => property?.name === "size" && property.kind === "variant");
    if (sizeProperty) {
      const declared = Array.isArray(sizeProperty.values) ? sizeProperty.values.map((value) => value?.value) : [];
      const rows = Array.isArray(sizing.sizes) ? sizing.sizes.map((row) => row?.size) : [];
      if (declared.length === 0 || declared.length !== rows.length ||
          declared.some((value, index) => value !== rows[index])) {
        gaps.push("sizing_model.sizes");
      }
    }
  }
  return gaps;
}

/** Prose coverage and the Figma link are separate evidence, not completeness. */
export function derive(entry) {
  const properties = Array.isArray(entry.api) ? entry.api : [];
  return {
    documented: Boolean(hasText(entry.summary) && hasText(entry.purpose) &&
      Array.isArray(entry.useWhen) && entry.useWhen.length > 0 && entry.useWhen.every(hasText) &&
      properties.every((property) => hasText(property?.description))),
    linked: Boolean(entry.figma?.file_key && entry.figma?.node_id),
  };
}

export const READINESS = ["complete", "in progress", "not started"];

/** Required contract data only; verification of representations belongs to ready. */
export function readiness(entry) {
  if (contractGaps(entry).length === 0) return "complete";
  if (entry.summary || entry.purpose || entry.useWhen?.length || entry.doNotUseWhen?.length ||
      entry.api?.length || entry.sizingModel) return "in progress";
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

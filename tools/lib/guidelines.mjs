// The guideline set as data, for the site to render.
//
// It reads through tools/validate-rules.mjs rather than beside it: that module
// already knows which files are guideline files, what a rule block is and how
// to take one apart, and a second reader of the same grammar is a second
// answer waiting to disagree with the first. What is added here is only what a
// page needs and a check does not — the document's title, the rule body split
// into the parts RUL-03 names, and a readiness tally per file.
//
// `Yet to fill` is rendered, not hidden. Fifty of the sixty-one files are a
// scope line and nothing else, and that is the true picture of the system
// before alpha: a file with a scope and no rules says a decision belongs there
// and has not been made. A site that showed only the finished files would
// answer "what is decided" and lose "what is left", which is the question this
// set is mostly made of.

import { AREAS, SINGLETONS, loadDocuments, parseDocument } from "../validate-rules.mjs";

/** The directory each area's files live in, for grouping the index. */
export const AREA_LABELS = new Map([
  ["PRN", { label: "Principles", blurb: "What the system values when two options both look defensible" }],
  ["RUL", { label: "Rules of rules", blurb: "How a rule is written, identified, cited, narrowed and retired" }],
  ["FND", { label: "Foundations", blurb: "The visual language — what a surface is made of" }],
  ["BEH", { label: "Behavior", blurb: "The laws components inherit — how anything responds to a person" }],
  ["PAT", { label: "Patterns", blurb: "One decided answer per recurring task" }],
  ["CNT", { label: "Content", blurb: "The words" }],
  ["STD", { label: "Component standard", blurb: "What a contract contains, and when a component is ready" }],
]);

// The order the index presents them in: the two that govern the rest, then the
// four guideline directories, then the standard.
export const AREA_ORDER = ["PRN", "RUL", "FND", "BEH", "PAT", "CNT", "STD"];

const LABELLED = /^(Why|Exception|Checked by|Serves):\s*(.*)$/;

/** `docs/foundations/color.md` → `foundations/color`. Its URL, minus the suffix. */
export function slugOf(file) {
  return file.replace(/^docs\//, "").replace(/\.md$/, "");
}

/** The document's `# ` title, or its filename when it has none. */
export function titleOf(text, file) {
  const heading = text.split("\n").find((line) => /^#\s+\S/.test(line));
  return heading ? heading.replace(/^#\s+/, "").trim() : slugOf(file);
}

/**
 * A rule body split into the parts RUL-03 names.
 *
 * Everything that is not the statement or a labelled line is `body` — the
 * explanation, table or list a rule is allowed to carry — and it keeps its
 * order, because a table under a rule is usually what the rule *is*.
 */
export function splitRule(rule) {
  const parts = { statement: rule.statement ?? "", why: "", exceptions: [], checkedBy: "", serves: "", body: [] };
  let seenStatement = false;
  let fenced = false;

  for (const line of rule.body) {
    if (/^\s*```/.test(line)) fenced = !fenced;

    if (!seenStatement) {
      if (line.trim() === "") continue;
      seenStatement = true;
      continue;
    }

    const labelled = fenced ? null : LABELLED.exec(line.trim());
    if (labelled) {
      const [, label, rest] = labelled;
      if (label === "Why") parts.why = rest;
      else if (label === "Exception") parts.exceptions.push(rest);
      else if (label === "Checked by") parts.checkedBy = rest;
      else parts.serves = rest;
      continue;
    }

    parts.body.push(line);
  }

  // A `Why:` that wraps onto the next line is one paragraph, and the wrapped
  // half would otherwise open the body with an orphan.
  while (parts.body.length > 0 && parts.body[0].trim() === "") parts.body.shift();
  while (parts.body.length > 0 && parts.body[parts.body.length - 1].trim() === "") parts.body.pop();

  return parts;
}

/**
 * Every guideline document, with its rules and its readiness.
 *
 * @returns {{areas: {area: string, label: string, blurb: string, files: object[]}[],
 *            files: object[], totals: object}}
 */
export function loadGuidelines(root) {
  const { documents } = loadDocuments(root);

  const files = documents.map((document) => {
    const parsed = parseDocument(document.text);
    const rules = parsed.rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      level: rule.level,
      // Where the block sits in the source, so a renderer can walk the
      // document and put the prose back between the rules.
      line: rule.line,
      span: rule.body.length,
      ...splitRule(rule),
    }));

    return {
      file: document.file,
      area: document.area,
      topic: document.topic,
      slug: slugOf(document.file),
      title: titleOf(document.text, document.file),
      // STANDARD.md carries rules without carrying a header (RUL-15), so it
      // has no status of its own to state and is not counted as unfilled.
      status: document.header ? (parsed.status ?? null) : null,
      scope: parsed.scope ?? null,
      rules,
    };
  });

  const areas = AREA_ORDER.filter((area) => files.some((file) => file.area === area)).map((area) => ({
    area,
    label: AREA_LABELS.get(area)?.label ?? area,
    blurb: AREA_LABELS.get(area)?.blurb ?? "",
    files: files.filter((file) => file.area === area),
  }));

  const rules = files.flatMap((file) => file.rules);
  const totals = {
    files: files.length,
    written: files.filter((file) => file.rules.length > 0).length,
    empty: files.filter((file) => file.rules.length === 0).length,
    rules: rules.length,
    checked: rules.filter((rule) => rule.checkedBy !== "").length,
    byLevel: Object.fromEntries(
      ["MUST", "SHOULD", "MAY", "RETIRED"].map((level) => [level, rules.filter((r) => r.level === level).length])
    ),
  };

  return { areas, files, totals };
}

/** Where a guideline directory's own README lives, for the index's area links. */
export const AREA_DIRECTORIES = new Map([
  ...AREAS.map(([dir, area]) => [area, dir]),
  ...SINGLETONS.map(([file, area]) => [area, file]),
]);

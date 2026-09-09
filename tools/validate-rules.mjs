#!/usr/bin/env node
// Validates the guideline documents — docs/RULES.md, the four guideline
// directories, docs/principles.md and docs/components/STANDARD.md.
//
//   npm run validate:rules
//
// Two kinds of finding, on the model of lint-registry.mjs:
//
//   FAIL   the rulebook contradicts itself — an ID that does not follow its
//          file, one ID on two rules, a citation pointing at no rule, a block
//          with no level or no reasoning, an index disagreeing with a file.
//          Exit 1.
//   REPORT something a human has to judge — a file claiming Confirmed with no
//          rules in it, a rule with no mechanical check. Exit 0.
//
// What makes this checkable at all is the rule block: a rule is a level-3
// heading beginning with an ID, and the ID is derived from the file's path
// (docs/RULES.md RUL-02). Prose cannot be checked; a grammar can.
//
// A citation is an ID written outside a rule's own heading. Both are found by
// the same regular expression, and the difference between a citation and an
// example is where it sits: text inside a fenced block or a `code span` is a
// specimen, not a reference, and is skipped. Without that, RULES.md would fail
// on the example rule block it is obliged to show.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STATUSES = ["Yet to fill", "Partial", "Confirmed"];
export const LEVELS = ["MUST", "SHOULD", "MAY"];

// docs/RULES.md RUL-02. Two shapes: the three single-file areas carry no topic
// segment, because the file is the topic.
export const ID = /^(?:(?:PRN|RUL|STD)-\d{2}|(?:FND|BEH|PAT|CNT)-[A-Z]+(?:-[A-Z]+)*-\d{2})$/;
const ID_ANYWHERE = /\b(?:PRN|RUL|STD)-\d{2}\b|\b(?:FND|BEH|PAT|CNT)-[A-Z]+(?:-[A-Z]+)*-\d{2}\b/g;

// A token shaped like an ID, so that a heading which meant to be a rule and
// got the ID wrong fails instead of being read as ordinary prose.
const ID_CANDIDATE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;

// Directory, area prefix. Every .md in one of these but README.md is a
// guideline file: it carries the header of RUL-15 and its README indexes it.
export const AREAS = [
  ["docs/foundations", "FND"],
  ["docs/behavior", "BEH"],
  ["docs/patterns", "PAT"],
  ["docs/content", "CNT"],
];

// Rule-carrying files that are not in a guideline directory. RULES.md and
// principles.md are guideline files with no directory to be indexed by;
// STANDARD.md carries rules without being one — a documentation standard has
// its own shape and no per-file status to state.
//
// docs/charter.md is deliberately absent. It is prose, it carries no rule, and
// giving it an area would give the PRN rules two possible homes.
export const SINGLETONS = [
  ["docs/RULES.md", "RUL", { header: true }],
  ["docs/principles.md", "PRN", { header: true }],
  ["docs/components/STANDARD.md", "STD", { header: false }],
];

// Where a citation is looked for. Fixtures are excepted — those under
// tools/tests/ and those written inline in a *.test.mjs — because a fixture
// exists to carry a broken rule, and a fixture citing nothing is the point of
// it rather than a fault in it.
const CITED_IN = ["docs", "skills/src", "packages/ui/src", "tools"];
const CITATION_SKIP = ["tools/tests", "node_modules"];
const isFixture = (file) => file.endsWith(".test.mjs");
const CITATION_TEXT = new Set([".md", ".mjs", ".js", ".ts", ".svelte", ".yaml", ".yml", ".json", ".css"]);

/** `focus.md` → `FOCUS`, `text-input.md` → `TEXT-INPUT`. */
export function topicOf(file) {
  return path.basename(file, ".md").toUpperCase();
}

/**
 * The rule blocks and the header of one document.
 *
 * Fences are tracked while scanning for headings, not only while reading a
 * body: RULES.md shows a rule block inside a fence, and a parser that did not
 * know the difference would read the specimen as a seventeenth rule.
 */
export function parseDocument(text) {
  const lines = text.split("\n");
  const rules = [];
  let fenced = false;
  let sectioned = false;
  let current = null;

  const header = { status: null, scope: null };

  for (const [index, line] of lines.entries()) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      if (current) current.body.push(line);
      continue;
    }
    if (fenced) {
      if (current) current.body.push(line);
      continue;
    }

    // The header is the top of the file, above everything else (RUL-15). A
    // "Status:" line further down is a document talking about status, not the
    // file's own — reading it as the header would let a file with none pass.
    if (!sectioned) {
      if (header.status === null && line.startsWith("Status:")) {
        header.status = line.slice("Status:".length).trim();
      }
      if (header.scope === null && line.startsWith("Scope:")) {
        header.scope = line.slice("Scope:".length).trim();
      }
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const [, hashes, title] = heading;
      if (hashes.length > 1) sectioned = true;
      // A rule block ends at the next heading of level 3 or higher.
      if (hashes.length <= 3) current = null;
      if (hashes.length === 3) {
        const candidate = title.trim().split(/\s+/)[0] ?? "";
        if (ID_CANDIDATE.test(candidate)) {
          current = {
            id: candidate,
            title: title.trim().slice(candidate.length).replace(/^\s*[—-]\s*/, ""),
            line: index + 1,
            body: [],
          };
          rules.push(current);
        }
      }
      continue;
    }

    if (current) current.body.push(line);
  }

  for (const rule of rules) {
    const body = rule.body;
    const first = body.find((line) => line.trim() !== "") ?? "";
    const level = /^\*\*(MUST|SHOULD|MAY)\.?\*\*/.exec(first.trim());
    rule.statement = first.trim();
    rule.level = level ? level[1] : null;
    rule.why = body.some((line) => line.startsWith("Why:"));
    rule.checkedBy = body.some((line) => line.startsWith("Checked by:"));
  }

  return { status: header.status, scope: header.scope, rules };
}

/**
 * Every ID referenced as a reference. Headings are excluded — a rule declaring
 * itself is not a citation of itself — and so is anything inside a fenced
 * block or a code span, which is a specimen rather than a reference.
 */
export function citations(text, { markdown = true } = {}) {
  const found = [];
  const lines = text.split("\n");
  let fenced = false;

  for (const [index, line] of lines.entries()) {
    if (markdown && /^\s*```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (markdown && /^#{1,6}\s/.test(line)) continue;

    const scanned = markdown ? line.replace(/`[^`]*`/g, "") : line;
    for (const match of scanned.matchAll(ID_ANYWHERE)) {
      found.push({ id: match[0], line: index + 1 });
    }
  }
  return found;
}

/** The rows of the first `| File | Status |` table in a directory README. */
export function parseIndex(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const row = /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+?)\s*\|/.exec(line);
    if (row) rows.push({ file: row[2].trim(), status: row[3].trim() });
  }
  return rows;
}

/**
 * @param documents  { file, area, topic, header, text } — every rule-carrying file
 * @param indexes    { file, dir, text } — one per guideline directory
 * @param sources    { file, text } — everything a citation may appear in
 */
export function checkRules({ documents, indexes = [], sources = [] }) {
  const errors = [];
  const reports = [];
  // Counted per document, not listed per rule. One line per rule buried the
  // per-directory summary once the rulebook passed a hundred rules, and which
  // rules they are is a question for the file rather than for a run.
  const unchecked = [];
  const byId = new Map();

  for (const doc of documents) {
    const parsed = parseDocument(doc.text);
    doc.parsed = parsed;

    if (doc.header) {
      if (parsed.status === null) {
        errors.push(`${doc.file}: no "Status:" line — every guideline file opens with one (RUL-15)`);
      } else if (!STATUSES.includes(parsed.status)) {
        errors.push(
          `${doc.file}: status "${parsed.status}" is not one of ${STATUSES.join(", ")} (RUL-15)`
        );
      }
      if (!parsed.scope) {
        errors.push(
          `${doc.file}: no "Scope:" line — a file with no stated scope is where the next rule ` +
            `gets written by mistake (RUL-15)`
        );
      }
    }

    for (const rule of parsed.rules) {
      const where = `${doc.file}:${rule.line}`;

      if (!ID.test(rule.id)) {
        errors.push(`${where}: "${rule.id}" is not a rule ID — see docs/RULES.md RUL-02`);
        continue;
      }

      const [area, ...rest] = rule.id.split("-");
      if (area !== doc.area) {
        errors.push(
          `${where}: "${rule.id}" is a ${area} rule in a ${doc.area} file — the area follows the ` +
            `file the rule lives in (RUL-02)`
        );
        continue;
      }
      // Only the four directory areas have a topic to compare: the grammar
      // already refuses a topic segment on PRN, RUL and STD, whose file is
      // the topic.
      if (doc.topic !== null) {
        const topic = rest.slice(0, -1).join("-");
        if (topic !== doc.topic) {
          errors.push(
            `${where}: "${rule.id}" claims topic ${topic}, but this file is ${doc.topic} (RUL-02)`
          );
          continue;
        }
      }

      // One ID on two rules makes every citation of it ambiguous, and nothing
      // downstream can tell which of the two it was reviewed against.
      const first = byId.get(rule.id);
      if (first) {
        errors.push(`${where}: duplicate id "${rule.id}", already declared by ${first.where}`);
        continue;
      }
      byId.set(rule.id, { where, rule, doc });

      if (!rule.level) {
        errors.push(
          `${where}: "${rule.id}" does not open with a level — the statement begins with ` +
            `**MUST**, **SHOULD** or **MAY** (RUL-04)`
        );
      }
      if (!rule.why) {
        errors.push(`${where}: "${rule.id}" has no "Why:" paragraph (RUL-03)`);
      }
      if (!rule.checkedBy) doc.unchecked = (doc.unchecked ?? 0) + 1;
    }
  }

  for (const source of sources) {
    for (const citation of citations(source.text, { markdown: source.file.endsWith(".md") })) {
      if (!byId.has(citation.id)) {
        errors.push(
          `${source.file}:${citation.line}: cites "${citation.id}", which no rule carries`
        );
      }
    }
  }

  for (const index of indexes) {
    const rows = parseIndex(index.text);
    const listed = new Map(rows.map((row) => [row.file, row.status]));
    const files = documents.filter((doc) => path.dirname(doc.file) === index.dir);

    for (const doc of files) {
      const name = path.basename(doc.file);
      if (!listed.has(name)) {
        errors.push(`${index.file}: does not list ${name} (RUL-16)`);
        continue;
      }
      if (listed.get(name) !== doc.parsed.status) {
        errors.push(
          `${index.file}: lists ${name} as "${listed.get(name)}", the file says ` +
            `"${doc.parsed.status}" (RUL-16)`
        );
      }
    }
    for (const row of rows) {
      if (!files.some((doc) => path.basename(doc.file) === row.file)) {
        errors.push(`${index.file}: lists ${row.file}, which is not a file in this directory (RUL-16)`);
      }
    }

    const byStatus = new Map();
    for (const doc of files) {
      byStatus.set(doc.parsed.status, (byStatus.get(doc.parsed.status) ?? 0) + 1);
    }
    const rules = files.reduce((total, doc) => total + doc.parsed.rules.length, 0);
    reports.push(
      `${index.dir}: ${files.length} files (${[...byStatus]
        .map(([status, count]) => `${count} ${String(status).toLowerCase()}`)
        .join(", ")}), ${rules} rule(s)`
    );
  }

  // A file claiming its rules are settled and carrying none is either a file
  // that has not been migrated yet or one whose status is wrong. Both are
  // worth seeing; neither is a contradiction the tool can resolve.
  for (const doc of documents) {
    if (doc.parsed.status === "Confirmed" && doc.parsed.rules.length === 0) {
      reports.push(`${doc.file} is Confirmed and carries no rule block`);
    }
  }

  for (const doc of documents) {
    if (!doc.unchecked) continue;
    unchecked.push(
      `${doc.file}: ${doc.unchecked} of ${doc.parsed.rules.length} rules name no check — ` +
        `review is one, and absence is not a fault`
    );
  }
  reports.push(...unchecked);

  return { ok: errors.length === 0, errors, reports };
}

// --- reading the tree ------------------------------------------------------

function read(root, file) {
  return { file, text: readFileSync(path.join(root, file), "utf8") };
}

export function loadDocuments(root) {
  const documents = [];
  const indexes = [];

  for (const [dir, area] of AREAS) {
    const full = path.join(root, dir);
    if (!existsSync(full)) continue;
    for (const name of readdirSync(full).sort()) {
      if (!name.endsWith(".md")) continue;
      const file = `${dir}/${name}`;
      if (name === "README.md") {
        indexes.push({ ...read(root, file), dir });
        continue;
      }
      documents.push({ ...read(root, file), area, topic: topicOf(name), header: true });
    }
  }

  for (const [file, area, { header }] of SINGLETONS) {
    if (!existsSync(path.join(root, file))) continue;
    documents.push({ ...read(root, file), area, topic: null, header });
  }

  return { documents, indexes };
}

export function loadSources(root) {
  const sources = [];
  const walk = (dir) => {
    const full = path.join(root, dir);
    if (!existsSync(full)) return;
    for (const name of readdirSync(full).sort()) {
      const file = `${dir}/${name}`;
      if (CITATION_SKIP.some((skipped) => file.startsWith(skipped))) continue;
      const stats = statSync(path.join(root, file));
      if (stats.isDirectory()) {
        walk(file);
        continue;
      }
      if (!CITATION_TEXT.has(path.extname(name))) continue;
      if (isFixture(file)) continue;
      sources.push(read(root, file));
    }
  };
  for (const dir of CITED_IN) walk(dir);
  return sources;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const { documents, indexes } = loadDocuments(root);
  const { ok, errors, reports } = checkRules({ documents, indexes, sources: loadSources(root) });

  for (const report of reports) console.error(`REPORT  ${report}`);
  for (const error of errors) console.error(`FAIL    ${error}`);

  if (!ok) {
    console.error(`\nFAIL: ${errors.length} rule issue(s).`);
    process.exit(1);
  }

  const rules = documents.reduce((total, doc) => total + doc.parsed.rules.length, 0);
  console.log(`OK: ${documents.length} guideline documents, ${rules} rules, every citation resolves.`);
}

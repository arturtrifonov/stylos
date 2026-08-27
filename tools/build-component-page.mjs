#!/usr/bin/env node
// Builds the readable page for every component contract.
//
//   npm run components:view     # writes build/components/ and prints the count
//
// One self-contained HTML file per entry, plus an index. Same constraints as
// the registry viewer (docs/specs/0002-registry-viewer.md): everything inlined,
// nothing fetched at build time or at open time, output gitignored and rebuilt
// rather than committed, opened from disk over file://. Links between pages are
// relative, so the whole tree can be copied or zipped and still work.
//
// This renders; it does not edit. The YAML is edited in an editor.
//
// The one thing here that is deliberately unfinished is the preview slot: every
// place a rendered sample belongs gets a placeholder of the size and position
// the real render will take. Filling them means exporting from Figma, which is
// a separate piece of work — see docs/specs/0003-component-page.md §2. When it
// happens, `previewSlot` below is the only function that changes.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadRegistry,
  derive,
  pagePathFor,
  figmaUrl,
  slugPath,
  LEVELS,
} from "./lib/registry.mjs";

// Dense, quiet and legible at a glance. One accent, a system stack, monospace
// for anything that is a name in the API rather than prose, and a measure limit
// so paragraphs do not run the width of a monitor. It prints: the colours have
// print overrides and nothing is hidden behind an interaction.
const CSS = `
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --bg-sunken: #f6f6f7;
  --fg: #18181b;
  --fg-muted: #71717a;
  --line: #e4e4e7;
  --accent: #4338ca;
  --do: #15803d;
  --dont: #b91c1c;
  --warn-fg: #92400e;
  --warn-bg: #fef3c7;
  --warn-line: #fcd34d;
  --fail-fg: #991b1b;
  --fail-bg: #fee2e2;
  --fail-line: #fca5a5;
  --open-fg: #3730a3;
  --open-bg: #e0e7ff;
  --open-line: #a5b4fc;
  --requires-fg: #155e75;
  --requires-bg: #cffafe;
  --requires-line: #67e8f9;
  --measure: 68ch;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #18181b;
    --bg-sunken: #202023;
    --fg: #f4f4f5;
    --fg-muted: #a1a1aa;
    --line: #34343a;
    --accent: #a5b4fc;
    --do: #4ade80;
    --dont: #f87171;
    --warn-fg: #fde68a;
    --warn-bg: #3b2f0b;
    --warn-line: #78621a;
    --fail-fg: #fecaca;
    --fail-bg: #3f1415;
    --fail-line: #7f2426;
    --open-fg: #c7d2fe;
    --open-bg: #1e1b4b;
    --open-line: #4338ca;
    --requires-fg: #a5f3fc;
    --requires-bg: #082f36;
    --requires-line: #155e75;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0 auto;
  padding: 24px 28px 64px;
  max-width: 1000px;
  font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--fg);
}
p, li { max-width: var(--measure); }
.crumbs { font-size: 12px; color: var(--fg-muted); margin: 0 0 20px; }
.crumbs a { color: var(--fg-muted); }
a { color: var(--accent); text-underline-offset: 2px; }
h1 { font-size: 30px; line-height: 1.15; margin: 0 0 6px; letter-spacing: -0.01em; }
h2 { font-size: 20px; margin: 34px 0 10px; letter-spacing: -0.01em; }
h3 { font-size: 13px; margin: 20px 0 6px; }
header { border-bottom: 1px solid var(--line); padding-bottom: 16px; }
.summary { color: var(--fg-muted); margin: 0 0 12px; font-size: 15px; }
.badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
.badge {
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: 2px 7px;
  border: 1px solid var(--line);
  border-radius: 3px;
  color: var(--fg-muted);
  white-space: nowrap;
}
.family { font-size: 13px; color: var(--fg-muted); margin: 12px 0 0; }
.mono, code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.muted { color: var(--fg-muted); }
.verdicts { list-style: none; padding: 0; margin: 0; max-width: none; }
.verdicts li {
  display: grid;
  grid-template-columns: 18px minmax(0, var(--measure));
  gap: 8px;
  margin-bottom: 8px;
}
.verdicts .mark { font-weight: 700; text-align: center; }
.verdicts .do .mark { color: var(--do); }
.verdicts .dont .mark { color: var(--dont); }
.verdicts .lead { font-weight: 600; }
.verdicts .do .lead { color: var(--do); }
.verdicts .dont .lead { color: var(--dont); }
.finding {
  border-left: 2px solid var(--line);
  padding: 2px 0 2px 12px;
  margin: 0 0 10px;
  max-width: var(--measure);
}
.finding .status {
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  font-weight: 600;
}
.finding p { margin: 2px 0 0; }
.a11y-warning { --tag-fg: var(--warn-fg); --tag-bg: var(--warn-bg); --tag-line: var(--warn-line); }
.a11y-fail { --tag-fg: var(--fail-fg); --tag-bg: var(--fail-bg); --tag-line: var(--fail-line); }
.a11y-open { --tag-fg: var(--open-fg); --tag-bg: var(--open-bg); --tag-line: var(--open-line); }
.a11y-requires { --tag-fg: var(--requires-fg); --tag-bg: var(--requires-bg); --tag-line: var(--requires-line); }
.finding .status { color: var(--tag-fg); }
.finding { border-left-color: var(--tag-line); }
.tag {
  font-size: 9px;
  letter-spacing: .08em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  color: var(--tag-fg);
  background: var(--tag-bg);
  border: 1px solid var(--tag-line);
}
.card {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  border: 1px solid var(--line);
  border-radius: 6px;
  margin-bottom: 14px;
  overflow: hidden;
  break-inside: avoid;
}
@media (max-width: 720px) { .card { grid-template-columns: minmax(0, 1fr); } }
.card > .about {
  background: var(--bg-sunken);
  border-right: 1px solid var(--line);
  padding: 14px 16px;
}
@media (max-width: 720px) { .card > .about { border-right: 0; border-bottom: 1px solid var(--line); } }
.card > .values { padding: 14px 16px; }
.property-name { font-size: 15px; font-weight: 600; margin: 0; display: flex; gap: 7px; align-items: baseline; }
.property-name .glyph { color: var(--fg-muted); font-size: 12px; }
.about p { font-size: 12.5px; color: var(--fg-muted); margin: 8px 0 0; }
.about .default { font-size: 12px; margin-top: 8px; }
.about .finding { border-left-width: 2px; margin-top: 12px; margin-bottom: 0; }
.value-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 6px 0;
}
.value-row + .value-note { margin: -2px 0 8px; }
.value-note { font-size: 12.5px; color: var(--fg-muted); max-width: var(--measure); }
details.value-note { margin: -2px 0 10px; }
details.value-note summary {
  cursor: pointer;
  font-size: 11px;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--tag-fg, var(--fg-muted));
}
details.value-note dl { margin: 4px 0 0; }
.value-note .criterion { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
.value-note dt {
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--fg-muted);
  margin-top: 4px;
}
.value-note dd { margin: 0; }
.assignment { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.slot {
  display: flex;
  align-items: center;
  border: 1px dashed var(--line);
  border-radius: 2px;
  background: var(--bg-sunken);
  color: var(--fg-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  line-height: 1;
  padding: 0 3px;
  flex: none;
}
/* The assignment is the whole of what the slot says, and the slot is only as
   wide as the render will be — so it truncates deliberately rather than
   wrapping into a shape the real render will not have. The full text is the
   title, and is on the row beside it in any case. */
.slot span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.examples { border-top: 1px solid var(--line); margin-top: 12px; padding-top: 12px; }
.example-pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.example .verdict { font-weight: 600; font-size: 12px; margin: 0 0 6px; }
.example.do .verdict { color: var(--do); }
.example.dont .verdict { color: var(--dont); }
.example .caption { font-size: 12.5px; color: var(--fg-muted); margin: 6px 0 0; }
table { border-collapse: collapse; margin: 8px 0 0; font-size: 13px; }
th, td { text-align: left; padding: 4px 14px 4px 0; border-bottom: 1px solid var(--line); white-space: nowrap; }
th { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--fg-muted); font-weight: 600; }
td.num { text-align: right; font-variant-numeric: tabular-nums; padding-right: 24px; }
dl.facts { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 16px; margin: 8px 0 0; font-size: 13px; }
dl.facts dt { color: var(--fg-muted); }
dl.facts dd { margin: 0; }
footer { border-top: 1px solid var(--line); margin-top: 40px; padding-top: 16px; font-size: 13px; }
footer h2 { font-size: 15px; margin-top: 20px; }
ul.plain { list-style: none; padding: 0; margin: 0; }
ul.inline { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; }
.unwritten { color: var(--fg-muted); max-width: var(--measure); }
.index-group { margin-bottom: 24px; break-inside: avoid; }
.index-group h2 { margin-bottom: 6px; }
.index-list { list-style: none; padding: 0; margin: 0; }
.index-list li { display: grid; grid-template-columns: minmax(0, 300px) auto minmax(0, 1fr); gap: 12px; padding: 2px 0; max-width: none; }
@media print {
  :root { --bg: #ffffff; --bg-sunken: #f6f6f7; --fg: #000000; --fg-muted: #444444; --line: #cccccc; }
  body { max-width: none; padding: 0; font-size: 11pt; }
  a { color: inherit; text-decoration: none; }
  .card, .index-group, section { break-inside: avoid; }
  /* Nothing on a printed page can be unfolded, so everything is open. Two
     rules because two engines hide the closed part differently. */
  details > *:not(summary) { display: block !important; }
  details::details-content { content-visibility: visible !important; block-size: auto !important; }
}
`;

const KIND_GLYPHS = {
  variant: "◇",
  boolean: "◧",
  text: "T",
  instance: "▣",
};

// What a rendered sample takes up where the contract does not say. A checkbox
// is the smallest thing in the library and the widest element card is a text
// property, so these are chosen to look right rather than derived from
// anything; they are only ever used when `sizing_model.sizes` cannot answer.
const FALLBACK_SLOT = { width: 160, height: 24 };
const SLOT_WIDTH_WHEN_NOT_FIXED = 160;

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Every string out of the YAML goes through here. No field is trusted markup. */
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** A prose field is one line in the file by necessity; it is a paragraph here. */
function paragraph(text, className) {
  return `<p${className ? ` class="${className}"` : ""}>${esc(text)}</p>`;
}

/**
 * The placeholder that stands where a rendered sample belongs.
 *
 * It carries the assignment it would render, and takes the dimensions the real
 * render would take, so that swapping in an exported image changes nothing
 * structural. This is the only unfinished thing on the page and the only
 * function that has to change when it is finished.
 */
export function previewSlot(entry, assignment) {
  const { width, height } = slotSize(entry, assignment.size);
  const text = Object.entries(assignment)
    .map(([name, value]) => `${name}=${value}`)
    .join(", ");
  return (
    `<div class="slot" style="width:${width}px;height:${height}px" title="${esc(text)}">` +
    `<span>${esc(text)}</span></div>`
  );
}

/**
 * What one render measures. `sizing_model.sizes` is the authority where it has
 * a row for the size in play — that is what the run is authored for. An axis
 * that is not fixed has no width in the contract, because the layout sets it.
 */
function slotSize(entry, sizeValue) {
  const rows = Array.isArray(entry.sizingModel?.sizes) ? entry.sizingModel.sizes : [];
  const row = rows.find((candidate) => candidate?.size === sizeValue) ?? rows[0];
  if (!row) return { ...FALLBACK_SLOT };

  const height = row.height ?? row.box ?? FALLBACK_SLOT.height;
  const width =
    entry.sizingModel?.horizontal === "fixed"
      ? (row.box ?? row.height ?? FALLBACK_SLOT.width)
      : SLOT_WIDTH_WHEN_NOT_FIXED;
  return { width, height };
}

/** The assignment a value row stands for: every property at its default, bar one. */
function assignmentFor(entry, property, value) {
  const assignment = {};
  for (const other of entry.api) {
    if (other?.kind !== "variant") continue;
    if (other.name === property.name) assignment[other.name] = value;
    else if (other.default !== undefined) assignment[other.name] = other.default;
  }
  if (!(property.name in assignment)) assignment[property.name] = value;
  return assignment;
}

function findingBlock(finding, { heading = null } = {}) {
  const status = finding?.status ?? "open";
  const parts = [`<div class="finding a11y-${esc(status)}">`];
  parts.push(`<span class="status">${esc(heading ?? status)}</span>`);
  if (finding?.criterion) parts.push(` <span class="mono muted">${esc(finding.criterion)}</span>`);
  if (finding?.note) parts.push(paragraph(finding.note));
  parts.push("</div>");
  return parts.join("");
}

/** `Checkbox Input` → `../checkbox-input.html`, from a page one directory deep. */
function linkTo(fromId, toId) {
  const depth = slugPath(fromId).split("/").length - 1;
  return "../".repeat(depth) + pagePathFor(toId);
}

function componentLink(fromId, toId, known) {
  if (!known.has(toId)) return `<span class="muted">${esc(toId)}</span>`;
  return `<a href="${esc(linkTo(fromId, toId))}">${esc(toId)}</a>`;
}

function relationList(fromId, ids, known) {
  return `<ul class="inline">${ids
    .map((id) => `<li>${componentLink(fromId, id, known)}</li>`)
    .join("")}</ul>`;
}

// --- Sections --------------------------------------------------------------
//
// Each returns "" where the fields it is about are absent. A section with
// nothing in it is not a heading over a blank space; it is not there.

function renderHeader(entry, context) {
  const badges = [entry.level, entry.status, entry.version && `v ${entry.version}`]
    .filter(Boolean)
    .map((badge) => `<span class="badge">${esc(badge)}</span>`)
    .join("");

  const siblings = context.family.get(entry.family)?.filter((id) => id !== entry.id) ?? [];
  const family =
    siblings.length > 0
      ? `<p class="family">${esc(entry.family)} family: ${siblings
          .map((id) => componentLink(entry.id, id, context.known))
          .join(", ")}</p>`
      : "";

  return `<header>
<h1>${esc(entry.name)}</h1>
${entry.summary ? paragraph(entry.summary, "summary") : ""}
<p class="badges">${badges}</p>
${family}
</header>`;
}

function renderPurpose(entry) {
  if (!entry.purpose) return "";
  return `<section><h2>Purpose</h2>${paragraph(entry.purpose)}</section>`;
}

function renderUseWhen(entry, context) {
  if (entry.useWhen.length === 0 && entry.doNotUseWhen.length === 0) return "";

  const rows = [
    ...entry.useWhen.map(
      (text) =>
        `<li class="do"><span class="mark">✓</span><span><span class="lead">Use when</span> ${esc(
          text
        )}</span></li>`
    ),
    ...entry.doNotUseWhen.map((avoid) => {
      const instead = avoid?.instead
        ? ` <span class="muted">Instead:</span> ${componentLink(entry.id, avoid.instead, context.known)}`
        : "";
      return `<li class="dont"><span class="mark">✕</span><span><span class="lead">Do not use when</span> ${esc(
        avoid?.text
      )}${instead}</span></li>`;
    }),
  ];

  return `<section><h2>Use when / do not use when</h2><ul class="verdicts">${rows.join(
    ""
  )}</ul></section>`;
}

// Above the API rather than below it: a `requires` is an obligation on whoever
// embeds the component, and an obligation buried under the property list is one
// nobody read.
function renderRequirements(entry) {
  if (entry.a11y.length === 0) return "";
  return `<section><h2>Requirements</h2>${entry.a11y
    .map((finding) => findingBlock(finding))
    .join("")}</section>`;
}

function renderValueRow(entry, property, value) {
  const label = `<span class="assignment">${esc(property.name)}: ${esc(value.value)}</span>`;
  const badge = value.a11y
    ? `<span class="tag a11y-${esc(value.a11y.status)}">a11y ${esc(value.a11y.status)}</span>`
    : "<span></span>";

  const row =
    `<div class="value-row">${previewSlot(entry, assignmentFor(entry, property, value.value))}` +
    `${label}${badge}</div>`;

  // A note with no finding behind it is just what the value means: it belongs
  // under the row, in plain sight. A finding is three or four lines of
  // exception, and a reader scanning five sizes should not be shouted at by all
  // of them at once — so it folds, and unfolds without leaving the page.
  const note = value.note ? `<p class="value-note">${esc(value.note)}</p>` : "";
  if (!value.a11y) return row + note;

  const detail = [];
  if (value.a11y.criterion) {
    detail.push(`<dt>Criterion</dt><dd class="criterion">${esc(value.a11y.criterion)}</dd>`);
  }
  if (value.a11y.note) detail.push(`<dt>Finding</dt><dd>${esc(value.a11y.note)}</dd>`);
  if (value.rationale) detail.push(`<dt>Why it ships</dt><dd>${esc(value.rationale)}</dd>`);

  return (
    row +
    note +
    `<details class="value-note a11y-${esc(value.a11y.status)}"><summary>${esc(
      value.a11y.status
    )}${value.a11y.criterion ? ` · ${esc(value.a11y.criterion)}` : ""}</summary><dl>${detail.join(
      ""
    )}</dl></details>`
  );
}

function renderExamples(entry, property) {
  const examples = Array.isArray(property.examples) ? property.examples : [];
  if (examples.length === 0) return "";

  const blocks = examples.map((example) => {
    const props = example.props ?? {};
    // The example is an assignment against the component: every other property
    // at its default, and whatever the example itself sets.
    // What the example sets comes first: it is the point of the example, and
    // the slot is narrow enough that what comes last is what gets cut.
    const assignment = { ...props, ...assignmentFor(entry, property, property.default ?? "") };
    for (const name of Object.keys(props)) assignment[name] = props[name];
    const verdict = example.verdict === "dont" ? "Do not" : "Do";
    return `<div class="example ${example.verdict === "dont" ? "dont" : "do"}">
<p class="verdict">${example.verdict === "dont" ? "✕" : "✓"} ${verdict}</p>
${previewSlot(entry, assignment)}
${example.caption ? paragraph(example.caption, "caption") : ""}
</div>`;
  });

  return `<div class="examples"><div class="example-pair">${blocks.join("")}</div></div>`;
}

function renderPropertyCard(entry, property) {
  const glyph = KIND_GLYPHS[property.kind] ?? "·";
  const about = [
    `<p class="property-name"><span class="glyph" title="${esc(property.kind ?? "")}">${esc(
      glyph
    )}</span> <span class="mono">${esc(property.name)}</span></p>`,
  ];
  if (property.default !== undefined) {
    about.push(
      `<p class="default muted">Default <span class="mono">${esc(property.default)}</span></p>`
    );
  }
  if (property.description) about.push(paragraph(property.description));
  if (property.a11y) about.push(findingBlock(property.a11y));
  if (Array.isArray(property.controls) && property.controls.length > 0) {
    about.push(
      `<p class="default muted">Controls ${property.controls
        .map((name) => `<span class="mono">${esc(name)}</span>`)
        .join(", ")}</p>`
    );
  }

  const values = Array.isArray(property.values) ? property.values : [];
  const body =
    values.length > 0
      ? values.map((value) => renderValueRow(entry, property, value)).join("")
      : // text and instance properties have no values: what there is to show is
        // the default, and then whatever examples were chosen.
        (property.default !== undefined
          ? `<div class="value-row">${previewSlot(entry, {
              ...assignmentFor(entry, property, property.default),
              [property.name]: property.default,
            })}<span class="assignment">${esc(property.name)}: ${esc(
              property.default
            )}</span><span></span></div>`
          : "");

  return `<div class="card">
<div class="about">${about.join("")}</div>
<div class="values">${body}${renderExamples(entry, property)}</div>
</div>`;
}

function renderApi(entry) {
  if (entry.api.length === 0) return "";
  const cards = entry.api.map((property) => renderPropertyCard(entry, property)).join("");
  const count =
    entry.variants && typeof entry.variants.count === "number"
      ? `<p class="muted">${esc(entry.variants.count)} variants${
          entry.variants.complete_cross_product === true ? ", a complete cross product" : ""
        }.</p>`
      : "";
  return `<section><h2>Public API</h2>${count}${cards}</section>`;
}

const SIZE_COLUMNS = [
  ["size", "Size"],
  ["height", "Height"],
  ["box", "Box"],
  ["gap", "Gap"],
  ["measure", "Measure"],
  ["line_height_family", "Line height"],
];

function renderSizing(entry) {
  const sizing = entry.sizingModel;
  if (!sizing) return "";

  const axes = [
    ["Horizontal", sizing.horizontal],
    ["Vertical", sizing.vertical],
    ["Adjustable", sizing.adjustable === undefined ? undefined : String(sizing.adjustable)],
  ].filter(([, value]) => value !== undefined);

  const facts =
    axes.length > 0
      ? `<dl class="facts">${axes
          .map(([term, value]) => `<dt>${esc(term)}</dt><dd class="mono">${esc(value)}</dd>`)
          .join("")}</dl>`
      : "";

  const rows = Array.isArray(sizing.sizes) ? sizing.sizes : [];
  let table = "";
  if (rows.length > 0) {
    const columns = SIZE_COLUMNS.filter(([key]) => rows.some((row) => row?.[key] !== undefined));
    table = `<table>
<thead><tr>${columns.map(([, label]) => `<th>${esc(label)}</th>`).join("")}</tr></thead>
<tbody>${rows
      .map(
        (row) =>
          `<tr>${columns
            .map(([key]) => {
              const value = row?.[key];
              const numeric = typeof value === "number";
              return `<td class="${numeric ? "num" : "mono"}">${
                value === undefined ? "" : esc(value)
              }</td>`;
            })
            .join("")}</tr>`
      )
      .join("")}</tbody>
</table>`;
  }

  return `<section><h2>Sizing model</h2>${facts}${
    sizing.intent ? paragraph(sizing.intent) : ""
  }${table}</section>`;
}

function renderLimitations(entry) {
  if (entry.limitations.length === 0) return "";
  return `<section><h2>Limitations</h2><ul>${entry.limitations
    .map((text) => `<li>${esc(text)}</li>`)
    .join("")}</ul></section>`;
}

function renderFooter(entry, context) {
  const parts = [];

  const url = figmaUrl(entry.figma);
  if (url) {
    parts.push(`<h2>Figma</h2><p><a href="${esc(url)}" rel="noreferrer">node ${esc(
      entry.figma.node_id
    )}</a>${
      entry.figma.last_verified
        ? ` <span class="muted">· last verified ${esc(entry.figma.last_verified)}</span>`
        : ""
    }</p>`);
  }

  const relations = [
    ["Composed from", entry.children],
    ["Used inside", entry.parents],
    ["Uses, in Figma", entry.uses],
    ["Used by, in Figma", entry.usedBy],
  ].filter(([, ids]) => ids.length > 0);
  if (relations.length > 0) {
    parts.push(
      `<h2>Relations</h2><dl class="facts">${relations
        .map(
          ([term, ids]) => `<dt>${esc(term)}</dt><dd>${relationList(entry.id, ids, context.known)}</dd>`
        )
        .join("")}</dl>`
    );
  }

  const record = [
    ["Id", entry.id],
    ["Role", entry.role],
    ["Family", entry.family],
    ["Flow behaviour", entry.flowBehavior.join(", ") || null],
    ["Entry", entry.file],
  ].filter(([, value]) => value);
  parts.push(
    `<h2>Record</h2><dl class="facts">${record
      .map(([term, value]) => `<dt>${esc(term)}</dt><dd class="mono">${esc(value)}</dd>`)
      .join("")}</dl>`
  );

  if (entry.notes) parts.push(`<h2>Notes</h2>${paragraph(entry.notes)}`);

  if (entry.import) {
    parts.push(
      `<h2>Airtable import, ${esc(context.importDate)} — history, not status</h2><dl class="facts">${Object.entries(
        entry.import
      )
        .map(([key, value]) => `<dt>${esc(key)}</dt><dd class="mono">${esc(value)}</dd>`)
        .join("")}</dl>`
    );
  }

  return `<footer>${parts.join("")}</footer>`;
}

// 93 entries carry the inventory record and nothing else. The page says so
// once, plainly, and then renders what is there — it does not fill the sections
// with "not specified".
function renderUnwritten(entry) {
  if (entry.api.length > 0 || entry.summary || entry.purpose) return "";
  return `<section><p class="unwritten">No contract is written for this component. What follows is the inventory record it was imported with; the contract is authored in <span class="mono">${esc(
    entry.file
  )}</span> against the schema in <span class="mono">docs/components/registry/README.md</span>.</p></section>`;
}

export function renderComponentPage(entry, context) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(entry.name)} — Stylos component</title>
<style>${CSS}</style>
</head>
<body>
<p class="crumbs"><a href="${esc(
    "../".repeat(slugPath(entry.id).split("/").length - 1) + "index.html"
  )}">All components</a></p>
${renderHeader(entry, context)}
${renderUnwritten(entry)}
${renderPurpose(entry)}
${renderUseWhen(entry, context)}
${renderRequirements(entry)}
${renderApi(entry)}
${renderSizing(entry)}
${renderLimitations(entry)}
${renderFooter(entry, context)}
</body>
</html>
`;
}

export function renderIndex(entries, context) {
  const groups = [...LEVELS, null]
    .map((level) => ({
      level,
      rows: entries.filter((entry) =>
        level === null ? !LEVELS.includes(entry.level) : entry.level === level
      ),
    }))
    .filter((group) => group.rows.length > 0);

  const written = entries.filter((entry) => derive(entry).documented).length;

  const body = groups
    .map(
      (group) => `<div class="index-group">
<h2>${esc(group.level ?? "no level")} <span class="muted">${group.rows.length}</span></h2>
<ul class="index-list">${group.rows
        .map(
          (entry) => `<li>
<a href="${esc(pagePathFor(entry.id))}">${esc(entry.name)}</a>
<span class="muted">${esc(entry.role ?? "")}</span>
<span class="muted">${esc(entry.summary ?? "")}</span>
</li>`
        )
        .join("")}</ul>
</div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stylos components</title>
<style>${CSS}</style>
</head>
<body>
<header>
<h1>Stylos components</h1>
<p class="summary">${entries.length} entries, ${written} of them with a contract written, generated from <span class="mono">docs/components/registry/</span> on ${esc(
    context.generated
  )}.</p>
<p class="badges"><span class="badge">derived — edit the YAML, then rebuild with npm run components:view</span></p>
</header>
<p class="muted">The filterable index over the same data, with relations and Airtable history, is <a href="../registry.html">registry.html</a> — built by <span class="mono">npm run registry:view</span>.</p>
${body}
</body>
</html>
`;
}

/** What every page needs about the rest of the registry: who exists, who is kin. */
export function pageContext(entries, { generated = new Date().toISOString().slice(0, 10) } = {}) {
  const family = new Map();
  for (const entry of entries) {
    if (!entry.family) continue;
    if (!family.has(entry.family)) family.set(entry.family, []);
    family.get(entry.family).push(entry.id);
  }
  return {
    known: new Set(entries.map((entry) => entry.id)),
    family,
    generated,
    importDate: "2026-08-20",
  };
}

export function buildPages(entries, options = {}) {
  const context = pageContext(entries, options);
  const pages = new Map([["index.html", renderIndex(entries, context)]]);
  for (const entry of entries) {
    if (!entry.id) continue;
    pages.set(pagePathFor(entry.id), renderComponentPage(entry, context));
  }
  return pages;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const entries = loadRegistry(root);
  const pages = buildPages(entries);

  const out = path.join(root, "build/components");
  for (const [relative, html] of pages) {
    const file = path.join(out, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, html);
  }

  console.log(`${pages.size - 1} components → ${path.relative(root, out)}/`);
}

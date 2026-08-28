#!/usr/bin/env node
// Builds the readable page for every component contract.
//
//   npm run components:view     # writes build/components/ and prints the count
//   npm run build               # writes them into the publishable tree, with the fonts
//
// One self-contained HTML file per entry, plus an index. Same constraints as
// the registry viewer (docs/specs/0002-registry-viewer.md): everything inlined,
// nothing fetched at build time or at open time, output gitignored and rebuilt
// rather than committed, opened from disk over file://. Links between pages are
// relative — including the one shared copy of the fonts under build/assets/ —
// so the whole tree can be copied or zipped and still work.
//
// This renders; it does not edit. The YAML is edited in an editor.
//
// Two things are worth knowing before changing anything here.
//
// **Token names are resolved, not printed.** `sizing_model` carries addresses
// into tokens/ — `box: "size/s-2_000"` — and the page shows the value with the
// name beside it. A table of bare names is unreadable and a table of bare
// numbers loses the scale; the reader needs to see 16 · 20 · 24 · 28 · 32 as a
// run *and* see that it is s-2_000 through s-4_000. The join happens here, on
// every build; nothing is transcribed. See docs/specs/0003-component-page.md §4.3.
//
// **The preview slot is the one deliberately unfinished thing.** Every place a
// rendered sample belongs gets a placeholder at the size the real render will
// take, measured from the same resolved tokens. Filling them means exporting
// from Figma, which is separate work; `previewSlot` is the only function that
// changes when it happens, and nothing structural moves.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRegistry, derive, pagePathFor, figmaUrl, slugPath, LEVELS } from "./lib/registry.mjs";
import { SIZING_TOKEN_FIELDS, createTokenResolver } from "./lib/sizing.mjs";
import { loadTheme, themeCss } from "./lib/theme.mjs";

// The page is opened by one person, from disk, on a wide screen, to read one
// contract end to end. So: hierarchy carried by type rather than by boxes, a
// single rail down the left for whatever names the thing beside it, one accent,
// monospace wherever a string is an identifier rather than prose, and
// accessibility findings set in the outer column where they can be seen while
// scanning and stepped over while reading. Every colour is declared for both
// schemes and again for print. Nothing is behind an interaction, because it
// will be printed. See docs/specs/0003-component-page.md §4.5.
const CSS = `
/* The palette, the radii, the type scale and the two families are resolved
   from tokens/ by tools/lib/theme.mjs and emitted above this block. What is
   left here is the page's own vocabulary — a verdict, a finding, a rail — said
   in terms of those, so that one name changes in one place. */
:root {
  --do: var(--ok);
  --dont: var(--bad);
  --warning: var(--warn);
  --fail: var(--bad);
  --open: var(--accent);
  --requires: var(--info);
  --rail: 15rem;
  --measure: 68ch;
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0 auto;
  padding: 2.75rem 3rem 7rem;
  max-width: 80rem;
  background: var(--bg);
  color: var(--fg);
  font: 400 var(--text-body)/1.6 var(--font-sans);
  font-feature-settings: "kern", "liga";
  -webkit-font-smoothing: antialiased;
}
p { margin: 0 0 .7em; max-width: var(--measure); }
p:last-child { margin-bottom: 0; }
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: .18em; }
ul { margin: 0; padding-left: 1.1em; max-width: var(--measure); }
li { margin-bottom: .3em; }

.mono, code {
  font-family: var(--font-mono);
  font-size: .88em;
  font-variant-ligatures: none;
}
.quiet { color: var(--fg-quiet); }
.faint { color: var(--fg-faint); }
.caps {
  font-size: var(--text-micro);
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
}

/* One rail down the left names whatever sits beside it — a section, a
   property. Everything on the page hangs off the same two columns. */
.band {
  display: grid;
  grid-template-columns: var(--rail) minmax(0, 1fr);
  column-gap: 2.5rem;
  padding-top: 1.6rem;
  margin-top: 1.6rem;
  border-top: 1px solid var(--rule);
}
.band > .label { margin: 0; }
.band > .label .name { display: block; }

.back { display: inline-flex; align-items: center; gap: .5rem; margin-bottom: 2.4rem; font-size: var(--text-meta); color: var(--fg-quiet); text-decoration: none; }
.back:hover { color: var(--accent); }
.back .logo { display: block; width: 62px; height: auto; color: var(--brand); }

.masthead { margin-bottom: .5rem; }
h1 {
  margin: 0 0 .3rem;
  font-size: var(--text-title);
  font-weight: 650;
  line-height: 1.08;
  letter-spacing: -.022em;
}
.summary {
  font-size: var(--text-section);
  line-height: 1.35;
  color: var(--fg-quiet);
  max-width: 34ch;
  margin-bottom: 1.1rem;
  letter-spacing: -.01em;
}
.badges { display: flex; flex-wrap: wrap; align-items: baseline; gap: .6rem; color: var(--fg-faint); }
.badges .sep { color: var(--rule-strong); }
.family { font-size: var(--text-meta); color: var(--fg-quiet); margin-top: .9rem; }

h2 { margin: 0; font-size: var(--text-small); font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--fg-faint); }

/* Use when / do not use when. The mark is the scannable part; the verdict word
   carries the colour so the list reads as two kinds of statement. */
.verdicts { list-style: none; padding: 0; max-width: none; }
.verdicts li { display: grid; grid-template-columns: 1.4em minmax(0, var(--measure)); margin-bottom: .55em; }
.verdicts .mark { font-weight: 700; }
.verdicts .lead { font-weight: 600; }
.verdicts .do .mark, .verdicts .do .lead { color: var(--do); }
.verdicts .dont .mark, .verdicts .dont .lead { color: var(--dont); }

/* A finding is set quietly: a coloured status word, a criterion in monospace,
   the note as ordinary text. No fill, no border, no shouting. */
.finding { margin-bottom: 1rem; max-width: var(--measure); }
.finding:last-child { margin-bottom: 0; }
.finding .status { color: var(--tone, var(--fg-quiet)); margin-right: .5rem; }
.finding .criterion { color: var(--fg-faint); }
.finding p { margin: .15em 0 0; }
.t-warning { --tone: var(--warning); }
.t-fail { --tone: var(--fail); }
.t-open { --tone: var(--open); }
.t-requires { --tone: var(--requires); }

/* One property. Identity in the rail, values beside it, and each value's
   finding in a third column that a reader going straight down the value list
   never has to cross. */
.property { border-top: 1px solid var(--rule); padding-top: 1.3rem; margin-top: 1.3rem; }
.property.first { border-top: 0; }
.property > .label .name { font-size: var(--text-lead); font-weight: 600; letter-spacing: -.01em; }
.property > .label .kind { color: var(--fg-faint); margin-top: .15rem; }
.property > .label .default { font-size: var(--text-meta); color: var(--fg-quiet); margin-top: .5rem; }
.property > .label .controls { font-size: var(--text-meta); color: var(--fg-quiet); margin-top: .5rem; }
.property > .label .desc { font-size: var(--text-meta); line-height: 1.55; color: var(--fg-quiet); margin-top: .7rem; }
.property > .label .finding { margin-top: .9rem; font-size: var(--text-meta); }

.value {
  display: grid;
  grid-template-columns: auto minmax(0, 20ch) minmax(0, 1fr);
  column-gap: 1.5rem;
  align-items: center;
  padding: .42rem 0;
  border-bottom: 1px solid var(--rule);
}
.value:last-of-type { border-bottom: 0; }
.value .assign { font-family: var(--font-mono); font-size: var(--text-meta); }
.value .assign .val { font-weight: 600; }
.value .aside { font-size: var(--text-meta); line-height: 1.45; color: var(--fg-quiet); padding: .15rem 0; }
.value .aside .status { color: var(--tone, var(--fg-quiet)); margin-right: .4rem; }
.value .aside .criterion { color: var(--fg-faint); }
.value .aside dl { margin: .2em 0 0; }
.value .aside dt { display: none; }
.value .aside dd { margin: .25em 0 0; }
.value .aside dd::before { content: attr(data-label); color: var(--fg-faint); margin-right: .35em; }

/* The placeholder a rendered sample will replace. Dimensions come from the
   contract's own tokens, so nothing about the layout moves when it does. */
.slot {
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 0 2px;
  border: 1px dashed var(--rule-strong);
  border-radius: var(--radius-xs);
  color: var(--fg-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  line-height: 1;
  flex: none;
}
.slot span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.examples { margin-top: 1.2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr)); gap: 1.2rem; }
.example .verdict { font-weight: 600; font-size: var(--text-meta); margin-bottom: .45rem; }
.example.do .verdict { color: var(--do); }
.example.dont .verdict { color: var(--dont); }
.example .caption { font-size: var(--text-meta); line-height: 1.5; color: var(--fg-quiet); margin-top: .45rem; }

/* The sizing run. The resolved value leads and the token name sits under it:
   the numbers make the run legible as a run, the names say where they came
   from. Neither reads on its own. */
.axes { display: flex; flex-wrap: wrap; gap: 0 2rem; margin-bottom: .9rem; }
.axes div { font-size: var(--text-meta); }
.axes .k { color: var(--fg-faint); margin-right: .4em; }
.axes .v { font-family: var(--font-mono); font-size: var(--text-meta); }
.scroll { overflow-x: auto; margin-top: 1.1rem; }
table.run { border-collapse: collapse; }
table.run th, table.run td { text-align: left; padding: .5rem 2rem .5rem 0; vertical-align: baseline; white-space: nowrap; }
table.run thead th { border-bottom: 1px solid var(--rule-strong); padding-bottom: .35rem; }
table.run thead .col { display: block; font-size: var(--text-small); font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--fg-quiet); }
table.run thead .from { display: block; font-size: var(--text-micro); letter-spacing: .02em; color: var(--fg-faint); font-weight: 400; text-transform: none; }
table.run tbody td { border-bottom: 1px solid var(--rule); }
table.run tbody tr:last-child td { border-bottom: 0; }
table.run .size { font-family: var(--font-mono); font-size: var(--text-meta); }
table.run .value-px { display: block; font-size: var(--text-body); font-variant-numeric: tabular-nums; }
table.run .token { display: block; font-family: var(--font-mono); font-size: var(--text-micro); color: var(--fg-faint); margin-top: .1rem; }

dl.facts { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .3rem 1.5rem; margin: 0; font-size: var(--text-meta); }
dl.facts dt { color: var(--fg-faint); }
dl.facts dd { margin: 0; }
ul.inline { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: .1rem 1rem; }
ul.inline li { margin: 0; }
.unwritten { color: var(--fg-quiet); }
.notes { margin-top: 1rem; font-size: var(--text-meta); color: var(--fg-quiet); }

.index-list { list-style: none; padding: 0; max-width: none; }
.index-list li { display: grid; grid-template-columns: minmax(0, 18rem) 6rem minmax(0, 1fr); column-gap: 1.5rem; padding: .3rem 0; border-bottom: 1px solid var(--rule); }
.index-list li:last-child { border-bottom: 0; }
.index-list a { text-decoration: none; font-weight: 500; }
.index-list a:hover { text-decoration: underline; }
.index-list .role { font-size: var(--text-meta); color: var(--fg-faint); }
.index-list .blurb { font-size: var(--text-meta); color: var(--fg-quiet); }

/* One breakpoint, and only so a narrow window does not break: the rail becomes
   a heading above what it named. */
@media (max-width: 60rem) {
  body { padding: 1.5rem 1.25rem 4rem; }
  :root { --measure: none; }
  .band { grid-template-columns: minmax(0, 1fr); }
  .band > .label { margin-bottom: .8rem; }
  .value { grid-template-columns: auto minmax(0, 1fr); row-gap: .3rem; }
  .value .aside { grid-column: 1 / -1; }
  h1 { font-size: var(--text-section); }
}

@media print {
  :root {
    --bg: #ffffff; --fg: #000000; --fg-quiet: #333333; --fg-faint: #555555;
    --rule: #d0d0d0; --rule-strong: #909090; --accent: #000000; --brand: #000000;
    --ok: #14532d; --bad: #7f1d1d; --warn: #713f12; --info: #164e63;
    --open: #1e1b4b;
  }
  body { max-width: none; padding: 0; font-size: 10.5pt; }
  a { text-decoration: none; }
  .back { display: none; }
  /* A band can be a page long, so only the things that must not be split are
     kept whole: one property, one example, one row of the run. */
  .property, .example, table.run tr, .value { break-inside: avoid; }
  h1, h2 { break-after: avoid; }
}
`;

const KIND_GLYPHS = {
  variant: "◇",
  boolean: "◧",
  text: "T",
  instance: "▣",
};

// What a rendered sample takes where the contract cannot say: a property that
// is not `size` has no run behind it, and neither does an entry with no
// sizing model. Only ever used when the tokens cannot answer.
const FALLBACK_SLOT = { width: 168, height: 22 };
const SLOT_WIDTH_WHEN_NOT_FIXED = 168;

// A column per key the rows carry, in the order a reader compares them: the
// box first because it is the component, then the gap, then the type. The
// second line names the collection each is resolved against — `size/s-2_000`
// is a dimension and `size/0_750` is a font measure, and the field is the only
// thing that says which.
const RUN_COLUMNS = [
  ["size", "Size"],
  ["box", "Box"],
  ["gap", "Gap"],
  ["font_size", "Font size"],
  ["line_height", "Line height"],
];

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
 * It carries the assignment it would render and takes the dimensions the real
 * render would take, so that swapping in an exported image changes nothing
 * structural. This is the only unfinished thing on the page and the only
 * function that has to change when it is finished.
 */
export function previewSlot(entry, assignment, resolveToken) {
  const { width, height } = slotSize(entry, assignment.size, resolveToken);
  const text = Object.entries(assignment)
    .map(([name, value]) => `${name}=${value}`)
    .join(", ");
  return (
    `<div class="slot" style="width:${width}px;height:${height}px" title="${esc(text)}">` +
    `<span>${esc(text)}</span></div>`
  );
}

/**
 * What one render measures, from the contract's own tokens.
 *
 * Height is the taller of the box and the line box — which is what the
 * contracts' `intent` fields say, and why no height is recorded: `Checkbox
 * Text` at extra small is 18 because its line box is, while `Checkbox Label`
 * at extra small is 16 because its box is. Width is the box only where the
 * horizontal axis is fixed; anything hugging or filling is sized by its
 * content or its parent, and the contract does not know either.
 */
function slotSize(entry, sizeValue, resolveToken) {
  const rows = Array.isArray(entry.sizingModel?.sizes) ? entry.sizingModel.sizes : [];
  const row = rows.find((candidate) => candidate?.size === sizeValue) ?? rows[0];
  if (!row) return { ...FALLBACK_SLOT };

  const box = number(resolveToken("box", row.box));
  const lineBox = number(resolveToken("line_height", row.line_height));
  const height = Math.max(box ?? 0, lineBox ?? 0) || FALLBACK_SLOT.height;
  const width =
    entry.sizingModel?.horizontal === "fixed" ? (box ?? FALLBACK_SLOT.width) : SLOT_WIDTH_WHEN_NOT_FIXED;
  return { width, height };
}

function number(value) {
  return typeof value === "number" ? value : null;
}

/**
 * The assignment a value row stands for: this property at this value, and
 * every other at its default. The varied property comes first because it is
 * what the row is about, and the slot is narrow enough that whatever comes
 * last is what gets cut.
 */
function assignmentFor(entry, property, value) {
  const assignment = { [property.name]: value };
  for (const other of entry.api) {
    if (other?.kind !== "variant" || other.name === property.name) continue;
    if (other.default !== undefined) assignment[other.name] = other.default;
  }
  return assignment;
}

function findingBlock(finding, className = "finding") {
  const status = finding?.status ?? "open";
  const parts = [`<div class="${className} t-${esc(status)}">`];
  parts.push(`<span class="status caps">${esc(status)}</span>`);
  if (finding?.criterion) parts.push(`<span class="criterion mono">${esc(finding.criterion)}</span>`);
  if (finding?.note) parts.push(paragraph(finding.note));
  parts.push("</div>");
  return parts.join("");
}

/** `Checkbox Input` → `../checkbox-input.html`, from a page one directory deep. */
function linkTo(fromId, toId) {
  return "../".repeat(slugPath(fromId).split("/").length - 1) + pagePathFor(toId);
}

function componentLink(fromId, toId, known) {
  if (!known.has(toId)) return `<span class="faint">${esc(toId)}</span>`;
  return `<a href="${esc(linkTo(fromId, toId))}">${esc(toId)}</a>`;
}

/** One row of the page's two columns: what it is, and the thing itself. */
function band(label, body, className = "") {
  return `<section class="band ${className}">
<div class="label"><h2>${esc(label)}</h2></div>
<div class="body">${body}</div>
</section>`;
}

// --- Sections --------------------------------------------------------------
//
// Each returns "" where the fields it is about are absent. A section with
// nothing in it is not a heading over a blank space; it is not there.

function renderHeader(entry, context) {
  const badges = [entry.level, entry.status, entry.version && `v ${entry.version}`].filter(Boolean);
  const row = badges
    .map((badge) => `<span class="caps">${esc(badge)}</span>`)
    .join('<span class="sep">·</span>');

  const siblings = context.family.get(entry.family)?.filter((id) => id !== entry.id) ?? [];
  const family =
    siblings.length > 0
      ? `<p class="family">${esc(entry.family)} family: ${siblings
          .map((id) => componentLink(entry.id, id, context.known))
          .join(", ")}</p>`
      : "";

  return `<header class="masthead">
<h1>${esc(entry.name)}</h1>
${entry.summary ? paragraph(entry.summary, "summary") : ""}
<div class="badges">${row}</div>
${family}
</header>`;
}

function renderPurpose(entry) {
  if (!entry.purpose) return "";
  return band("Purpose", paragraph(entry.purpose));
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
        ? ` <span class="faint">Instead:</span> ${componentLink(entry.id, avoid.instead, context.known)}`
        : "";
      return `<li class="dont"><span class="mark">✕</span><span><span class="lead">Do not use when</span> ${esc(
        avoid?.text
      )}${instead}</span></li>`;
    }),
  ];

  return band("Use when / do not use when", `<ul class="verdicts">${rows.join("")}</ul>`);
}

// Above the API rather than below it: a `requires` is an obligation on whoever
// embeds the component, and an obligation buried under the property list is one
// nobody read.
function renderRequirements(entry) {
  if (entry.a11y.length === 0) return "";
  return band("Requirements", entry.a11y.map((finding) => findingBlock(finding)).join(""));
}

function renderValueRow(entry, property, value, resolveToken) {
  const slot = previewSlot(entry, assignmentFor(entry, property, value.value), resolveToken);
  const label =
    `<span class="assign"><span class="faint">${esc(property.name)}:</span> ` +
    `<span class="val">${esc(value.value)}</span></span>`;

  // Set in the outer column: a reader scanning the value list sees at a glance
  // which values carry a finding, and a reader going down the list never has to
  // read through one.
  const aside = [];
  if (value.a11y) {
    aside.push(`<span class="status caps">a11y ${esc(value.a11y.status)}</span>`);
    if (value.a11y.criterion) aside.push(`<span class="criterion mono">${esc(value.a11y.criterion)}</span>`);
  }
  const detail = [];
  if (value.note) detail.push(["", value.note]);
  if (value.a11y?.note) detail.push(["", value.a11y.note]);
  if (value.rationale) detail.push(["Why it ships", value.rationale]);
  if (detail.length > 0) {
    aside.push(
      `<dl>${detail
        .map(
          ([label_, text]) =>
            `<dt>${esc(label_ || "Note")}</dt><dd${
              label_ ? ` data-label="${esc(label_)} —"` : ""
            }>${esc(text)}</dd>`
        )
        .join("")}</dl>`
    );
  }

  const tone = value.a11y ? ` t-${esc(value.a11y.status)}` : "";
  return `<div class="value${tone}">${slot}${label}<div class="aside">${aside.join(" ")}</div></div>`;
}

function renderExamples(entry, property, resolveToken) {
  const examples = Array.isArray(property.examples) ? property.examples : [];
  if (examples.length === 0) return "";

  const blocks = examples.map((example) => {
    const props = example.props ?? {};
    // What the example sets comes first: it is the point of the example, and
    // the slot is narrow enough that what comes last is what gets cut.
    const assignment = { ...props, ...assignmentFor(entry, property, property.default ?? "") };
    for (const name of Object.keys(props)) assignment[name] = props[name];

    const dont = example.verdict === "dont";
    return `<div class="example ${dont ? "dont" : "do"}">
<p class="verdict">${dont ? "✕ Do not" : "✓ Do"}</p>
${previewSlot(entry, assignment, resolveToken)}
${example.caption ? paragraph(example.caption, "caption") : ""}
</div>`;
  });

  return `<div class="examples">${blocks.join("")}</div>`;
}

function renderProperty(entry, property, resolveToken, first = false) {
  const label = [
    `<span class="name mono">${esc(property.name)}</span>`,
    `<div class="kind caps">${esc(KIND_GLYPHS[property.kind] ?? "·")} ${esc(property.kind ?? "")}</div>`,
  ];
  if (property.default !== undefined) {
    label.push(`<div class="default">Default <span class="mono">${esc(property.default)}</span></div>`);
  }
  if (Array.isArray(property.controls) && property.controls.length > 0) {
    label.push(
      `<div class="controls">Controls ${property.controls
        .map((name) => `<span class="mono">${esc(name)}</span>`)
        .join(", ")}</div>`
    );
  }
  if (property.description) label.push(`<div class="desc">${esc(property.description)}</div>`);
  if (property.a11y) label.push(findingBlock(property.a11y));

  const values = Array.isArray(property.values) ? property.values : [];
  const body =
    values.length > 0
      ? values.map((value) => renderValueRow(entry, property, value, resolveToken)).join("")
      : // text and instance properties have no values: what there is to show is
        // the default, and then whatever examples were chosen.
        (property.default !== undefined
          ? renderValueRow(entry, property, { value: property.default }, resolveToken)
          : "");

  return `<div class="band property${first ? " first" : ""}">
<div class="label">${label.join("")}</div>
<div class="body">${body}${renderExamples(entry, property, resolveToken)}</div>
</div>`;
}

function renderApi(entry, resolveToken) {
  if (entry.api.length === 0) return "";

  const count =
    entry.variants && typeof entry.variants.count === "number"
      ? `<p class="quiet">${esc(entry.variants.count)} variants${
          entry.variants.complete_cross_product === true ? ", a complete cross product" : ""
        } across ${entry.api.length} propert${entry.api.length === 1 ? "y" : "ies"}.</p>`
      : `<p class="quiet">${entry.api.length} propert${
          entry.api.length === 1 ? "y" : "ies"
        }, in the order the component exposes them.</p>`;

  return (
    band("Public API", count) +
    entry.api
      .map((property, index) => renderProperty(entry, property, resolveToken, index === 0))
      .join("")
  );
}

/**
 * `sizes[]` as a run. The resolved value is the primary reading and the token
 * name is the address beneath it — bare names are unreadable and bare numbers
 * lose the scale (docs/specs/0003-component-page.md §4.3).
 */
function renderRun(rows, resolveToken) {
  const present = new Set(rows.flatMap((row) => Object.keys(row ?? {})));
  const columns = [
    ...RUN_COLUMNS.filter(([key]) => present.has(key)),
    // A key the schema has grown since this file was written still gets a
    // column rather than being dropped silently.
    ...[...present]
      .filter((key) => !RUN_COLUMNS.some(([known]) => known === key))
      .map((key) => [key, key.replace(/_/g, " ")]),
  ];

  const head = columns
    .map(([key, label]) => {
      const from = SIZING_TOKEN_FIELDS.get(key);
      return `<th scope="col"><span class="col">${esc(label)}</span>${
        from ? `<span class="from">${esc(from)}</span>` : ""
      }</th>`;
    })
    .join("");

  const body = rows
    .map((row) => {
      const cells = columns
        .map(([key]) => {
          const raw = row?.[key];
          if (raw === undefined) return "<td></td>";
          if (key === "size") return `<td class="size">${esc(raw)}</td>`;
          if (!SIZING_TOKEN_FIELDS.has(key)) return `<td class="mono">${esc(raw)}</td>`;

          const value = resolveToken(key, raw);
          return `<td><span class="value-px">${
            value === undefined ? "—" : `${esc(value)}<span class="faint"> px</span>`
          }</span><span class="token">${esc(raw)}</span></td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<div class="scroll"><table class="run">
<thead><tr>${head}</tr></thead>
<tbody>${body}</tbody>
</table></div>`;
}

function renderSizing(entry, resolveToken) {
  const sizing = entry.sizingModel;
  if (!sizing) return "";

  const axes = [
    ["Horizontal", sizing.horizontal],
    ["Vertical", sizing.vertical],
    ["Adjustable", sizing.adjustable === undefined ? undefined : String(sizing.adjustable)],
  ].filter(([, value]) => value !== undefined);

  const parts = [];
  if (axes.length > 0) {
    parts.push(
      `<div class="axes">${axes
        .map(([term, value]) => `<div><span class="k">${esc(term)}</span><span class="v">${esc(value)}</span></div>`)
        .join("")}</div>`
    );
  }
  if (sizing.intent) parts.push(paragraph(sizing.intent));

  const rows = Array.isArray(sizing.sizes) ? sizing.sizes : [];
  if (rows.length > 0) parts.push(renderRun(rows, resolveToken));

  return band("Sizing and type", parts.join(""));
}

function renderLimitations(entry) {
  if (entry.limitations.length === 0) return "";
  return band("Limitations", `<ul>${entry.limitations.map((text) => `<li>${esc(text)}</li>`).join("")}</ul>`);
}

function renderRelations(entry, context) {
  const relations = [
    ["Composed from", entry.children],
    ["Used inside", entry.parents],
    ["Uses, in Figma", entry.uses],
    ["Used by, in Figma", entry.usedBy],
  ].filter(([, ids]) => ids.length > 0);
  if (relations.length === 0) return "";

  return band(
    "Relations",
    `<dl class="facts">${relations
      .map(
        ([term, ids]) =>
          `<dt>${esc(term)}</dt><dd><ul class="inline">${ids
            .map((id) => `<li>${componentLink(entry.id, id, context.known)}</li>`)
            .join("")}</ul></dd>`
      )
      .join("")}</dl>`
  );
}

function renderRecord(entry, context) {
  const url = figmaUrl(entry.figma);
  const facts = [
    [
      "Figma",
      url
        ? `<a href="${esc(url)}" rel="noreferrer">node ${esc(entry.figma.node_id)}</a>${
            entry.figma.last_verified
              ? ` <span class="faint">· last verified ${esc(entry.figma.last_verified)}</span>`
              : ""
          }`
        : null,
    ],
    ["Id", entry.id && `<span class="mono">${esc(entry.id)}</span>`],
    ["Role", entry.role && `<span class="mono">${esc(entry.role)}</span>`],
    ["Family", entry.family && `<span class="mono">${esc(entry.family)}</span>`],
    [
      "Flow behaviour",
      entry.flowBehavior.length > 0 ? `<span class="mono">${esc(entry.flowBehavior.join(", "))}</span>` : null,
    ],
    ["Entry", `<span class="mono">${esc(entry.file)}</span>`],
  ].filter(([, value]) => value);

  const parts = [`<dl class="facts">${facts.map(([term, value]) => `<dt>${esc(term)}</dt><dd>${value}</dd>`).join("")}</dl>`];

  if (entry.notes) parts.push(`<p class="notes">${esc(entry.notes)}</p>`);

  if (entry.import) {
    parts.push(
      `<p class="faint" style="margin-top:1rem">Airtable import, ${esc(
        context.importDate
      )} — history, not status</p><dl class="facts">${Object.entries(entry.import)
        .map(([key, value]) => `<dt>${esc(key)}</dt><dd class="mono">${esc(value)}</dd>`)
        .join("")}</dl>`
    );
  }

  return band("Record", parts.join(""));
}

// 93 entries carry the inventory record and nothing else. The page says so
// once, plainly, and then renders what is there — it does not fill the sections
// with "not specified".
function renderUnwritten(entry) {
  if (entry.api.length > 0 || entry.summary || entry.purpose) return "";
  return band(
    "Contract",
    `<p class="unwritten">No contract is written for this component. What follows is the inventory record it was imported with; the contract is authored in <span class="mono">${esc(
      entry.file
    )}</span> against the schema in <span class="mono">docs/components/registry/README.md</span>.</p>`
  );
}

/**
 * The theme, resolved for a page at this depth.
 *
 * The fonts are one shared copy under build/assets/, so a page two directories
 * down has to say so; everything else in the theme is depth-independent. A
 * context with no theme — a fixture, a test — gets nothing, and the page falls
 * back to the browser's own colours rather than failing to build.
 */
function chromeFor(context, up) {
  return context.theme ? themeCss(context.theme, { prefix: `${up}../` }) : "";
}

export function renderComponentPage(entry, context) {
  const up = "../".repeat(slugPath(entry.id).split("/").length - 1);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(entry.name)} — Stylos component</title>
<style>${chromeFor(context, up)}${CSS}</style>
</head>
<body>
<a class="back" href="${esc(`${up}index.html`)}">${context.logo}<span>← All components</span></a>
${renderHeader(entry, context)}
${renderUnwritten(entry)}
${renderPurpose(entry)}
${renderUseWhen(entry, context)}
${renderRequirements(entry)}
${renderApi(entry, context.resolveToken)}
${renderSizing(entry, context.resolveToken)}
${renderLimitations(entry)}
${renderRelations(entry, context)}
${renderRecord(entry, context)}
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
    .map((group) =>
      band(
        `${group.level ?? "no level"} · ${group.rows.length}`,
        `<ul class="index-list">${group.rows
          .map(
            (entry) => `<li>
<a href="${esc(pagePathFor(entry.id))}">${esc(entry.name)}</a>
<span class="role">${esc(entry.role ?? "")}</span>
<span class="blurb">${esc(entry.summary ?? "")}</span>
</li>`
          )
          .join("")}</ul>`
      )
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Components — Stylos</title>
<style>${chromeFor(context, "")}${CSS}</style>
</head>
<body>
<a class="back" href="../index.html">${context.logo}<span>← Home</span></a>
<header class="masthead">
<h1>Components</h1>
<p class="summary">${entries.length} entries, ${written} of them with a contract written.</p>
<div class="badges"><span class="caps">generated ${esc(context.generated)}</span><span class="sep">·</span><span class="mono">npm run build</span></div>
<p class="family">The filterable index over the same data — relations, Figma links and the Airtable history — is <a href="../registry.html">the registry</a>.</p>
</header>
${body}
</body>
</html>
`;
}

/** What every page needs about the rest of the registry: who exists, who is kin. */
export function pageContext(
  entries,
  {
    generated = new Date().toISOString().slice(0, 10),
    resolveToken = () => undefined,
    theme = null,
    logo = "",
  } = {}
) {
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
    resolveToken,
    theme,
    logo,
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

/** The wordmark, inlined so it takes `--brand` and turns over with the theme. */
export function readLogo(root) {
  try {
    return readFileSync(path.join(root, "assets/logo.svg"), "utf8")
      .trim()
      .replace(/^<\?xml[^>]*>\s*/, "")
      .replace("<svg ", '<svg class="logo" ');
  } catch {
    // The wordmark is decoration. A build without it is a build without it.
    return "";
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const entries = loadRegistry(root);
  const theme = loadTheme(root);
  if (theme.missing.length > 0) {
    console.warn(`theme: ${theme.missing.length} token(s) did not resolve: ${theme.missing.join(", ")}`);
  }
  const pages = buildPages(entries, {
    resolveToken: createTokenResolver(root),
    theme,
    logo: readLogo(root),
  });

  const out = path.join(root, "build/components");
  for (const [relative, html] of pages) {
    const file = path.join(out, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, html);
  }

  console.log(`${pages.size - 1} components → ${path.relative(root, out)}/`);
}

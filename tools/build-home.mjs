#!/usr/bin/env node
// The site's front door.
//
// Deliberately a placeholder. The registry viewer and the component pages are
// working views over real data; this is neither, and it exists so that the
// published tree opens on something that says what Stylos is instead of on the
// registry table. When there is a documentation surface (PLAN.md Stage 6) this
// page is the first thing it replaces.
//
// So: no data of its own beyond three counts derived from the registry, no
// script, nothing to keep in sync by hand. Same constraints as the other two
// builders — everything inlined, nothing fetched, opened from disk or served.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { derive, loadRegistry, readiness } from "./lib/registry.mjs";
import { milestoneProgress, readPlan, waveProgress, whereWeAre } from "./lib/plan.mjs";
import { loadTheme, themeCss } from "./lib/theme.mjs";
import { readLogo } from "./build-component-page.mjs";

const CSS = `
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font: 400 var(--text-body)/1.6 var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
.page {
  max-width: 72rem;
  margin: 0 auto;
  padding: 4rem 3rem 5rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
a { color: var(--accent); }
.mono { font-family: var(--font-mono); font-size: .88em; }

.logo { display: block; width: 208px; height: auto; color: var(--brand); }

/* The capital sits beside the text at the width it can afford and behind it
   when there is no room. It is decoration and carries no information, so it is
   the first thing the layout is allowed to lose. */
.top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 20rem); gap: 3rem; align-items: center; }
.column-figure { margin: 0; justify-self: end; }
.column-figure img { display: block; width: 100%; height: auto; }
/* Pale marble on black already reads; inverting it would sink it into the page. */

.lede {
  font-size: var(--text-section);
  line-height: 1.35;
  letter-spacing: -.015em;
  max-width: 30ch;
  margin: 2.5rem 0 1.25rem;
  font-weight: 500;
}
.state { color: var(--fg-quiet); max-width: 46ch; margin: 0; }
.state .flag {
  display: inline-block;
  font-size: var(--text-micro);
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--brand);
  border: 1px solid currentColor;
  border-radius: var(--radius-round);
  padding: 3px 9px;
  margin-right: .6rem;
  vertical-align: 2px;
}

.doors { display: grid; grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr)); gap: 1px; margin: 3.5rem 0 0; background: var(--rule); border: 1px solid var(--rule); }
.door { display: block; padding: 1.5rem 1.6rem; background: var(--bg); text-decoration: none; color: inherit; }
.door:hover { background: var(--bg-sunken); }
.door h2 { margin: 0 0 .35rem; font-size: var(--text-lead); font-weight: 600; letter-spacing: -.01em; color: var(--accent); }
.door p { margin: 0; font-size: var(--text-meta); color: var(--fg-quiet); }
.door .count { display: block; margin-top: .9rem; font-family: var(--font-mono); font-size: var(--text-small); color: var(--fg-faint); font-variant-numeric: tabular-nums; }

/* Three numbers, because a front page that says nothing about the state of the
   work is a poster. Each is the same derivation the registry viewer makes. */
.tally { display: flex; flex-wrap: wrap; gap: 0 3rem; margin: 3.5rem 0 0; }
.tally div { padding-top: .8rem; border-top: 2px solid var(--rule-strong); min-width: 9rem; }
.tally .n { display: block; font-size: var(--text-title); line-height: 1.05; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.tally .k { font-size: var(--text-small); text-transform: uppercase; letter-spacing: .09em; color: var(--fg-faint); font-weight: 600; }

/* The queue. One row per wave, the track proportional to how many components
   are in it and the filled part to how many are ready — the shape of the work
   and the progress through it are the same picture. The count and the percent
   are written out beside every bar: the bar is the second cue, never the only
   one, which is how readiness is shown everywhere else in these pages. */
/* Where the work is, in one sentence. First on the page because it is the
   question the page exists to answer; the two charts below are the detail
   behind it. */
.here { margin: 2.5rem 0 0; font-size: var(--text-lead); line-height: 1.4; letter-spacing: -.01em; }
.here .to { font-weight: 600; }
.here .rest { color: var(--fg-quiet); }

.queue { margin: 3.5rem 0 0; }
.queue h2 {
  font-size: var(--text-small);
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: var(--fg-faint);
  margin: 0 0 .3rem;
}
.queue .caveat { margin: 0 0 1.2rem; font-size: var(--text-meta); color: var(--fg-quiet); max-width: 58ch; }
.queue ol { list-style: none; margin: 0; padding: 0; }
.queue li {
  display: grid;
  grid-template-columns: 17rem minmax(0, 1fr) 4.5rem 3rem;
  align-items: center;
  gap: 0 1rem;
  padding: .3rem 0;
}
.queue .label { font-size: var(--text-meta); color: var(--fg-quiet); }
.queue .label .num { color: var(--fg-faint); font-variant-numeric: tabular-nums; margin-right: .5rem; }
.queue .track {
  height: 10px;
  background: var(--bg-raised);
  border-radius: var(--radius-xs);
  overflow: hidden;
  display: flex;
}
.queue .fill { background: var(--ok); }
.queue .fill.progress { background: var(--warn); }
.queue .of { font-size: var(--text-small); font-family: var(--font-mono); color: var(--fg-faint); font-variant-numeric: tabular-nums; text-align: right; }
.queue .pct { font-size: var(--text-meta); font-variant-numeric: tabular-nums; text-align: right; font-weight: 600; }
.queue li[data-done="0"] .pct { color: var(--fg-faint); font-weight: 400; }

/* A milestone is a checklist, not a quantity of work, so every track is full
   width and only the fill differs. The wave chart above scales its tracks
   because waves are comparable units; these are not, and 43 against 8 says
   nothing worth reading. The difference is deliberate — see
   docs/specs/0005-queue-in-the-views.md §5. */
.queue.milestones ol { margin-top: .4rem; }
.queue.milestones li {
  grid-template-columns: minmax(0, 1fr) 4.5rem 3rem;
  row-gap: .4rem;
  padding: .9rem 0;
  border-top: 1px solid var(--rule);
}
.queue.milestones li:first-child { border-top: 0; }
.queue.milestones .label .num { color: var(--fg); font-weight: 600; margin-right: 0; font-size: var(--text-body); }
/* The track and the decision both span the row: the name and the numbers are
   the line you scan, and the sentence is what you stop on. */
.queue.milestones .track { grid-column: 1 / -1; }
.queue.milestones .opens {
  grid-column: 1 / -1;
  color: var(--fg-quiet);
  font-size: var(--text-meta);
  line-height: 1.5;
  max-width: 68ch;
}

@media (max-width: 52rem) {
  .queue li { grid-template-columns: minmax(0, 1fr) 4.5rem 3rem; }
  .queue .track { grid-column: 1 / -1; }
}
@media (max-width: 40rem) {
  .queue li { grid-template-columns: minmax(0, 1fr) 3rem; }
  .queue .of { display: none; }
}

footer { margin-top: auto; padding-top: 3.5rem; color: var(--fg-faint); font-size: var(--text-small); }
footer p { margin: .2rem 0; }

@media (max-width: 56rem) {
  .page { padding: 2.5rem 1.5rem 3rem; }
  .top { grid-template-columns: minmax(0, 1fr); }
  .column-figure { display: none; }
  .logo { width: 160px; }
}
`;

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

/**
 * The little Markdown a PLAN.md table cell actually uses — bold and code, and
 * nothing else. Escaped first, so the emphasis is the only markup that can come
 * out of the plan; anything richer than these two belongs in the document
 * rather than in a chart label.
 */
const inline = (value) =>
  esc(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<span class="mono">$1</span>');

/**
 * @param {object} options
 * @param {import("./lib/registry.mjs").Entry[]} options.entries
 * @param {object|null} options.theme   from loadTheme; omitted in a fixture
 * @param {string} options.logo         inline SVG, or ""
 * @param {boolean} options.column      whether assets/column.png was found
 * @param {string|null} options.plan    PLAN.md, for the wave table; omitted in a fixture
 */
/** `0` only when nothing is ready — a rounded-away fraction says so instead. */
function percentLabel({ done, percent }) {
  if (done > 0 && percent === 0) return "&lt;1%";
  return `${percent}%`;
}

export function renderHome({ entries, theme = null, logo = "", generated, column = false, plan = null }) {
  const total = entries.length;
  const ready = entries.filter((entry) => readiness(entry) === "ready").length;
  const documented = entries.filter((entry) => derive(entry).documented).length;

  const queue = plan ? waveProgress(plan, entries) : [];
  const widest = Math.max(...queue.map((row) => row.total), 1);
  const rows = queue
    .map((row) => {
      const share = (row.total / widest) * 100;
      const segment = (count, className) =>
        count > 0 ? `<span class="fill ${className}" style="width:${(count / row.total) * 100}%"></span>` : "";
      return `<li data-done="${row.done}">
<span class="label"><span class="num">Wave ${row.number}</span>${esc(row.name)}</span>
<span class="track" style="width:${Math.round(share * 100) / 100}%" role="img" aria-label="${row.done} of ${row.total} ready">${segment(
        row.done,
        "done"
      )}${segment(row.started, "progress")}</span>
<span class="of">${row.done} / ${row.total}</span>
<span class="pct">${percentLabel(row)}</span>
</li>`;
    })
    .join("");

  // No plan to read from means no section, rather than an empty chart or a
  // hardcoded fallback order that would outlive the file it came from.
  const queueSection = queue.length === 0 ? "" : `<section class="queue">
    <h2>The core set, wave by wave</h2>
    <p class="caveat">
      Stage 4 of the plan, read from <span class="mono">PLAN.md</span> rather than copied — a wave is
      defined by what it lets you build, and it ends in something that renders. A component counts as
      ready when its contract is written and it is linked to Figma. This is the order the work is
      done in; it is not a schedule, and nothing here reports a date.
    </p>
    <ol>${rows}</ol>
  </section>`;

  // One bar per milestone, in the plan's order. Parked is not charted: nothing
  // waits on it, and a progress bar would imply something does.
  const charted = (plan ? milestoneProgress(plan, entries) : []).filter((row) => row.name !== "Parked");
  const milestoneRows = charted
    .map((row) => {
      const segment = (count, className) =>
        count > 0 ? `<span class="fill ${className}" style="width:${(count / row.total) * 100}%"></span>` : "";
      return `<li data-done="${row.done}">
<span class="label"><span class="num">${esc(row.name)}</span></span>
<span class="of">${row.done} / ${row.total}</span>
<span class="pct">${percentLabel(row)}</span>
<span class="track" role="img" aria-label="${row.done} of ${row.total} ready">${segment(
        row.done,
        "done"
      )}${segment(row.started, "progress")}</span>${
        row.opens ? `\n<span class="opens">${inline(row.opens)}</span>` : ""
      }
</li>`;
    })
    .join("");

  const milestoneSection = charted.length === 0 ? "" : `<section class="queue milestones">
    <h2>The road, milestone by milestone</h2>
    <p class="caveat">
      §9 of the plan. A milestone is a decision about distribution, and the list under it is the
      checklist that decision waits on — not a size budget and not a date. Every track is full width
      because a milestone is a checklist rather than a quantity of work; only the fill compares.
      <span class="mono">Parked</span> is not charted: no decision waits on it.
    </p>
    <ol>${milestoneRows}</ol>
  </section>`;

  const here = plan ? whereWeAre(plan, entries) : null;
  const hereLine = !here?.milestone
    ? ""
    : `<p class="here"><span class="to">Working towards ${esc(here.milestone.name)}</span><span class="rest"> — ${
        here.wave
          ? `wave ${here.wave.number} of ${here.waves}, `
          : "no wave open, "
      }${here.milestone.done} of ${here.milestone.total} components ready.</span></p>`;

  const figure = column
    ? `<figure class="column-figure"><img src="assets/column.png" alt="" width="510" height="510" loading="lazy"></figure>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stylos</title>
<meta name="description" content="A design system for dense, desktop-oriented web product interfaces.">
<style>${theme ? themeCss(theme, { prefix: "" }) : ""}${CSS}</style>
</head>
<body>
<div class="page">
  <div class="top">
    <div>
      ${logo}
      <p class="lede">A design system for dense, desktop-oriented web product interfaces.</p>
      <p class="state">
        <span class="flag">Pre-alpha</span>
        Its visual language draws on antiquity, classical architecture and constructed
        proportion — strict and structural rather than decorative. Private and owner-led;
        nothing here is released, and none of it is stable.
      </p>
    </div>
    ${figure}
  </div>

  ${hereLine}

  <div class="tally">
    <div><span class="n">${total}</span><span class="k">components</span></div>
    <div><span class="n">${documented}</span><span class="k">with a contract</span></div>
    <div><span class="n">${ready}</span><span class="k">ready</span></div>
  </div>

  <nav class="doors">
    <a class="door" href="registry.html">
      <h2>Component registry →</h2>
      <p>Every entry, filterable by level, role, readiness, milestone and wave, with what each one is composed from and used inside.</p>
      <span class="count">${total} entries</span>
    </a>
    <a class="door" href="components/index.html">
      <h2>Component pages →</h2>
      <p>One page per component: purpose, when to use it and when not to, its properties, and the sizes it comes in.</p>
      <span class="count">${documented} contracts written</span>
    </a>
  </nav>

  ${queueSection}

  ${milestoneSection}

  <footer>
    <p>Generated ${esc(generated)} from <span class="mono">docs/components/registry/</span> and <span class="mono">tokens/</span>.</p>
    <p>Colour, radius, type scale and both families are resolved from the token set on every build. The pages are hand-written HTML — no Stylos component is used in them.</p>
  </footer>
</div>
</body>
</html>
`;
}

/** Whether the optional capital is in the repository. Absent is not an error. */
export function hasColumn(root) {
  return existsSync(path.join(root, "assets/column.png"));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

// The front door on its own, the way registry:view and components:view render
// theirs. It writes into the same build/ and shares its assets, so a tree built
// only this way has the page and not the fonts — npm run build is the
// publishable one.
if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const entries = loadRegistry(root);
  const html = renderHome({
    entries,
    theme: loadTheme(root),
    logo: readLogo(root),
    generated: new Date().toISOString().slice(0, 10),
    column: hasColumn(root),
    plan: readPlan(root),
  });

  const out = path.join(root, "build/index.html");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, html);

  console.log(`${entries.length} components → ${path.relative(root, out)}`);
}

#!/usr/bin/env node
// The site's front door — SPEC 0011.
//
// No longer a placeholder: this is the designer's first page of the published
// site. It presents the system as designed and derives every mark of what
// exists — the version pill, the Planned badges, the counts, the charts, the
// sample, the Storybook link — from the repository at build time
// (tools/lib/site.mjs), so a project step flips a
// badge at the next `npm run build` and the page is never edited to match
// reality.
//
// Same constraints as the other builders — everything inlined, nothing
// fetched to render, no Stylos value transcribed into a stylesheet. The links
// out (Figma, GitHub) are navigation, allowlisted by origin in the tests.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { derive, loadRegistry, readiness } from "./lib/registry.mjs";
import { milestoneProgress, readPlan, waveProgress, whereWeAre } from "./lib/plan.mjs";
import { loadTheme, themeCss } from "./lib/theme.mjs";
import { CHROME_CSS, renderSiteHeader, renderSiteFooter } from "./lib/chrome.mjs";
import { siteFacts } from "./lib/site.mjs";
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
  max-width: 76rem;
  margin: 0 auto;
  padding: 0 3rem 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
a { color: var(--accent); }
.mono { font-family: var(--font-mono); font-size: .88em; }

/* The section label is the page's structural grammar: a quiet uppercase line
   over a hairline, repeated for every section, the way an inscription band
   repeats on a facade. */
section { margin: 4.5rem 0 0; }
.section-label {
  font-size: var(--text-small);
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: var(--fg-faint);
  margin: 0 0 1.4rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--rule-strong);
}

/* --- The cover ------------------------------------------------------------ */

/* The front page opens the way the Figma files do — on a cover: the brand
   surface edge to edge of the measure, the wordmark at full size, the capital
   standing on the panel's bottom edge and cropped by it, the way a column is
   cropped by a pediment. One logo per page: the header's brand slot is off
   here because the cover is the brand. */
.cover {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 21rem);
  gap: 2rem 3.5rem;
  align-items: end;
  margin-top: 2rem;
  padding: 3.4rem 3.4rem 0;
  background: var(--brand);
  color: var(--fg-on-brand);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.cover-copy { padding-bottom: 3.4rem; }
.cover .logo { display: block; width: 300px; max-width: 100%; height: auto; color: currentColor; }
.column-figure { margin: 0; justify-self: end; align-self: end; }
.column-figure img { display: block; width: 100%; height: auto; margin-bottom: -12%; }

.lede {
  font-size: var(--text-display);
  font-stretch: 110%;
  line-height: 1.16;
  letter-spacing: -.022em;
  max-width: 22ch;
  margin: 2.4rem 0 1.4rem;
  font-weight: 560;
}
.state { max-width: 52ch; margin: 0; opacity: .88; }
.state .flag {
  display: inline-block;
  font-size: var(--text-micro);
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  border: 1px solid currentColor;
  border-radius: var(--radius-round);
  padding: 3px 9px;
  margin-right: .6rem;
  vertical-align: 2px;
  font-variant-numeric: tabular-nums;
}
.cta { display: flex; gap: .8rem; flex-wrap: wrap; margin: 2.2rem 0 0; }
.cta a {
  display: inline-block;
  padding: .62rem 1.25rem;
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
  font-weight: 550;
  font-size: var(--text-meta);
  letter-spacing: .01em;
}
.cta a:hover { opacity: .85; }
.cta a.primary { background: var(--fg-on-brand); border-color: var(--fg-on-brand); color: var(--brand); }
.cover .planned { color: inherit; border-color: currentColor; }

/* The Planned mark. One shape for every fact that is designed but not built —
   derived, never authored per badge (SPEC 0011 §2). */
.planned {
  display: inline-block;
  font-size: var(--text-micro);
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--fg-faint);
  border: 1px dashed var(--rule-strong);
  border-radius: var(--radius-round);
  padding: 2px 9px;
  vertical-align: 2px;
}

/* --- Character ------------------------------------------------------------ */

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1px; background: var(--rule); border: 1px solid var(--rule); }
.card { background: var(--bg); padding: 1.5rem 1.6rem; }
.card h3 { margin: 0 0 .45rem; font-size: var(--text-lead); font-weight: 600; letter-spacing: -.01em; }
.card p { margin: 0; font-size: var(--text-meta); color: var(--fg-quiet); }

/* --- Quick start ---------------------------------------------------------- */

.quickstart .qs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(21rem, 1fr)); gap: 1px; background: var(--rule); border: 1px solid var(--rule); }
.qs { background: var(--bg); padding: 1.5rem 1.6rem; }
.qs h3 { margin: 0 0 .9rem; font-size: var(--text-lead); font-weight: 600; letter-spacing: -.01em; display: flex; align-items: center; gap: .7rem; flex-wrap: wrap; }
.qs pre {
  margin: 0 0 .9rem;
  padding: 1rem 1.1rem;
  background: var(--bg-sunken);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-small);
  line-height: 1.7;
  overflow-x: auto;
}
.qs p { margin: 0; font-size: var(--text-meta); color: var(--fg-quiet); }

/* --- State of the system -------------------------------------------------- */

.here { margin: 0 0 .5rem; font-size: var(--text-lead); line-height: 1.4; letter-spacing: -.01em; }
.here .to { font-weight: 600; }
.here .rest { color: var(--fg-quiet); }

.tally { display: flex; flex-wrap: wrap; gap: 0 3rem; margin: 2rem 0 0; }
.tally div { padding-top: .8rem; border-top: 2px solid var(--rule-strong); min-width: 9rem; }
.tally .n { display: block; font-size: var(--text-title); line-height: 1.05; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.tally .k { font-size: var(--text-small); text-transform: uppercase; letter-spacing: .09em; color: var(--fg-faint); font-weight: 600; }

/* The queue. One row per wave, the track proportional to how many components
   are in it and the filled part to how many are ready — the shape of the work
   and the progress through it are the same picture. The count and the percent
   are written out beside every bar: the bar is the second cue, never the only
   one, which is how readiness is shown everywhere else in these pages. */
.queue { margin: 3rem 0 0; }
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

/* --- Resources ------------------------------------------------------------ */

.doors { display: grid; grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr)); gap: 1px; margin: 0; background: var(--rule); border: 1px solid var(--rule); }
.door { display: block; padding: 1.5rem 1.6rem; background: var(--bg); text-decoration: none; color: inherit; }
a.door:hover { background: var(--bg-sunken); }
.door h2 { margin: 0 0 .35rem; font-size: var(--text-lead); font-weight: 600; letter-spacing: -.01em; color: var(--accent); display: flex; align-items: center; gap: .7rem; flex-wrap: wrap; }
.door.flat h2 { color: var(--fg); }
.door p { margin: 0; font-size: var(--text-meta); color: var(--fg-quiet); }
.door .count { display: block; margin-top: .9rem; font-family: var(--font-mono); font-size: var(--text-small); color: var(--fg-faint); font-variant-numeric: tabular-nums; }
.door ul { list-style: none; margin: .9rem 0 0; padding: 0; font-size: var(--text-meta); }
.door li { margin: .25rem 0; }
.door li .what { color: var(--fg-faint); }

.page > .site-footer { margin-top: 4.5rem; }

@media (max-width: 56rem) {
  .page { padding: 0 1.5rem; }
  .cover { grid-template-columns: minmax(0, 1fr); margin-top: 1.5rem; padding: 2.2rem 1.8rem 0; }
  .cover-copy { padding-bottom: 2.2rem; }
  .cover .logo { width: 200px; }
  .column-figure { display: none; }
  .lede { font-size: var(--text-title); }
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

/** `0` only when nothing is ready — a rounded-away fraction says so instead. */
function percentLabel({ done, percent }) {
  if (done > 0 && percent === 0) return "&lt;1%";
  return `${percent}%`;
}

/** The four character cards — the one hand-authored copy on the site, from docs/charter.md. */
const CHARACTER = [
  [
    "Classical, not fashionable",
    "The visual language draws on antiquity, classical architecture and constructed proportion — strict and structural rather than decorative. A system that can be configured into anything has no character to preserve, and preserving a character is the point.",
  ],
  [
    "Contracts before implementations",
    "Every component is a public API: one authored contract in the registry, implemented twice — by the Figma library and by the code. Values are authored where they are judged by eye; contracts are authored where they can bind more than one implementation.",
  ],
  [
    "Variables before raw values",
    "Anything the system has a token for resolves to a variable or a style. Exceptions are named and stay the size of the case they cover — explicit exceptions over hidden inconsistency.",
  ],
  [
    "Dense by design",
    "Built for complex, tool-like products — data tables, toolbars, crowded forms — rather than marketing pages. Desktop-oriented, measured rather than arbitrary, reusable but recognizably authored.",
  ],
];

function coverSection({ logo, column, site }) {
  const figure = column
    ? `<figure class="column-figure"><img src="assets/column.png" alt="" width="510" height="510"></figure>`
    : "";
  const flag = site?.version ? `v${esc(site.version)}` : "Pre-alpha";
  const workshopDoor = site?.storybook ? `<a href="storybook/">Open the workshop</a>` : "";

  return `<section class="cover">
    <div class="cover-copy">
      ${logo}
      <h1 class="lede">A design system for dense, desktop&#8209;oriented web product interfaces.</h1>
      <p class="state">
        <span class="flag">${flag}</span>
        Its visual language draws on antiquity, classical architecture and constructed
        proportion — strict and structural rather than decorative. Pre-alpha and owner-led:
        the contracts are fixed ahead of the code, and what is designed but not built yet
        is marked <span class="planned">Planned</span> rather than pretended.
      </p>
      <div class="cta">
        <a class="primary" href="components/index.html">Browse the components</a>
        ${workshopDoor}
      </div>
    </div>
    ${figure}
  </section>`;
}

function characterSection() {
  const cards = CHARACTER.map(([title, body]) => `<div class="card"><h3>${title}</h3><p>${body}</p></div>`).join("\n");
  return `<section class="character">
    <h2 class="section-label">Character</h2>
    <div class="cards">${cards}</div>
  </section>`;
}

function quickstartSection(site) {
  if (!site?.npm) return "";
  const name = esc(site.npm.name);
  const install = site.npm.private
    ? `<h3>The package <span class="planned">Planned</span></h3>
<pre>npm install ${name}</pre>
<p>The channel is decided with the licence, at alpha. Until then the package is private,
consumed as a git dependency, and versioned in lockstep with the system — one number
covers the contracts, the tokens, the Figma library and the code.</p>`
    : `<h3>The package</h3>
<pre>npm install ${name}</pre>
<p>One number covers the contracts, the tokens, the Figma library and the code.</p>`;

  const agents =
    site.distribution === "planned"
      ? `<p><span class="planned">Planned</span> <span class="mono">registry.json</span> and the consumer
skill — the contracts, machine-readable, for an agent building on Stylos without this repository — land with <span class="mono">0.3.0</span>.</p>`
      : `<p><span class="mono">registry.json</span> and the consumer skill ship with the package — the
contracts, machine-readable, for an agent building on Stylos without this repository.</p>`;

  return `<section class="quickstart">
    <h2 class="section-label">Quick start</h2>
    <div class="qs-grid">
      <div class="qs">
        <h3>The CSS surface</h3>
<pre>@import "${name}/tokens.css";
@import "${name}/fonts.css";
@import "${name}/css";

&lt;span class="stylos-badge"
      data-tone="primary"
      data-size="medium"&gt;3&lt;/span&gt;</pre>
        <p>Every component is plain CSS on a public DOM contract — a class, data attributes
        carrying the contract's values verbatim, text as content. Hand-written HTML and the
        Svelte wrapper's output are the same string.</p>
      </div>
      <div class="qs">
        ${install}
        ${agents}
      </div>
    </div>
  </section>`;
}

function resourcesSection({ site, total, documented }) {
  const doors = [
    `<a class="door" href="registry.html">
      <h2>Component registry →</h2>
      <p>Every entry, filterable by level, role, readiness, milestone and wave, with what each one is composed from and used inside.</p>
      <span class="count">${total} entries</span>
    </a>`,
    `<a class="door" href="components/index.html">
      <h2>Component pages →</h2>
      <p>One page per component: purpose, when to use it and when not to, its properties, and the sizes it comes in.</p>
      <span class="count">${documented} contracts written</span>
    </a>`,
  ];

  if (site?.storybook) {
    doors.push(`<a class="door" href="storybook/">
      <h2>Storybook →</h2>
      <p>The workshop: every built component with a story per documented variant, generated from the registry rather than authored.</p>
    </a>`);
  }

  if (site?.figma?.length) {
    doors.push(`<div class="door flat">
      <h2>Figma libraries</h2>
      <p>The design half of the system — the same contracts, implemented in Figma.</p>
      <ul>${site.figma
        .map(
          (library) =>
            `<li><a href="${esc(library.url)}">${esc(library.name)} ↗</a><br><span class="what">${inline(library.contents)}</span></li>`
        )
        .join("")}</ul>
    </div>`);
  }

  if (site?.repo) {
    doors.push(`<a class="door" href="${esc(site.repo)}">
      <h2>GitHub ↗</h2>
      <p>The repository: the contracts, the tokens, the foundations, the tools — and every page of this site, generated from them.</p>
    </a>`);
  }

  return `<section class="resources">
    <h2 class="section-label">Resources</h2>
    <nav class="doors">${doors.join("\n")}</nav>
  </section>`;
}

/**
 * @param {object} options
 * @param {import("./lib/registry.mjs").Entry[]} options.entries
 * @param {object|null} options.theme    from loadTheme; omitted in a fixture
 * @param {string} options.logo          inline SVG, or ""
 * @param {boolean} options.column       whether assets/column.png was found
 * @param {string|null} options.plan     PLAN.md, for the wave table; omitted in a fixture
 * @param {object|null} options.site     the derived facts (lib/site.mjs); omitted in a fixture
 */
export function renderHome({
  entries,
  theme = null,
  logo = "",
  generated,
  column = false,
  plan = null,
  site = null,
}) {
  const total = entries.length;
  const ready = entries.filter((entry) => readiness(entry) === "complete").length;
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
  const queueSection = queue.length === 0 ? "" : `<div class="queue">
    <h2>The core set, wave by wave</h2>
    <p class="caveat">
      Stage 4 of the plan, read from <span class="mono">PLAN.md</span> rather than copied — a wave is
      defined by what it lets you build, and it ends in something that renders. A component counts as
      ready when its contract is written and it is linked to Figma. This is the order the work is
      done in; it is not a schedule, and nothing here reports a date.
    </p>
    <ol>${rows}</ol>
  </div>`;

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

  const milestoneSection = charted.length === 0 ? "" : `<div class="queue milestones">
    <h2>The road, milestone by milestone</h2>
    <p class="caveat">
      §9 of the plan. A milestone is a decision about distribution, and the list under it is the
      checklist that decision waits on — not a size budget and not a date. Every track is full width
      because a milestone is a checklist rather than a quantity of work; only the fill compares.
      <span class="mono">Parked</span> is not charted: no decision waits on it.
    </p>
    <ol>${milestoneRows}</ol>
  </div>`;

  const here = plan ? whereWeAre(plan, entries) : null;
  const hereLine = !here?.milestone
    ? ""
    : `<p class="here"><span class="to">Working towards ${esc(here.milestone.name)}</span><span class="rest"> — ${
        here.wave
          ? `wave ${here.wave.number} of ${here.waves}, `
          : "no wave open, "
      }${here.milestone.done} of ${here.milestone.total} components ready.</span></p>`;

  const inCode =
    site?.inCode == null ? "" : `<div><span class="n">${site.inCode}</span><span class="k">in code</span></div>`;

  // The cover carries the wordmark, so the header does not — one logo per page.
  const header = renderSiteHeader({
    prefix: "",
    active: "home",
    brand: false,
    storybook: site?.storybook ?? false,
    figmaUrl: site?.figmaMain ?? site?.figma?.[0]?.url ?? null,
    repoUrl: site?.repo ?? null,
  });
  const footer = renderSiteFooter({ generated, version: site?.version ?? null, repoUrl: site?.repo ?? null });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stylos</title>
<meta name="description" content="A design system for dense, desktop-oriented web product interfaces.">
<style>${theme ? themeCss(theme, { prefix: "" }) : ""}${CHROME_CSS}${CSS}</style>
</head>
<body>
<div class="page">
  ${header}

  ${coverSection({ logo, column, site })}

  ${characterSection()}

  ${quickstartSection(site)}

  <section class="system">
    <h2 class="section-label">State of the system</h2>
    ${hereLine}
    <div class="tally">
      <div><span class="n">${total}</span><span class="k">components</span></div>
      <div><span class="n">${documented}</span><span class="k">with a contract</span></div>
      <div><span class="n">${ready}</span><span class="k">ready</span></div>
      ${inCode}
    </div>
    ${queueSection}
    ${milestoneSection}
  </section>

  ${resourcesSection({ site, total, documented })}

  ${footer}
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
    site: siteFacts(root, entries),
  });

  const out = path.join(root, "build/index.html");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, html);

  console.log(`${entries.length} components → ${path.relative(root, out)}`);
}

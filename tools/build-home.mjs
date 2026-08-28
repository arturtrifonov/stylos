#!/usr/bin/env node
// The site's front door.
//
// Deliberately a placeholder. The registry viewer and the component pages are
// working views over real data; this is neither, and it exists so that the
// published tree opens on something that says what Stylos is instead of on a
// 101-row table. When there is a documentation surface (PLAN.md Stage 6) this
// page is the first thing it replaces.
//
// So: no data of its own beyond three counts derived from the registry, no
// script, nothing to keep in sync by hand. Same constraints as the other two
// builders — everything inlined, nothing fetched, opened from disk or served.

import { existsSync } from "node:fs";
import path from "node:path";

import { derive, readiness } from "./lib/registry.mjs";
import { themeCss } from "./lib/theme.mjs";

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
 * @param {object} options
 * @param {import("./lib/registry.mjs").Entry[]} options.entries
 * @param {object|null} options.theme   from loadTheme; omitted in a fixture
 * @param {string} options.logo         inline SVG, or ""
 * @param {boolean} options.column      whether assets/column.png was found
 */
export function renderHome({ entries, theme = null, logo = "", generated, column = false }) {
  const total = entries.length;
  const ready = entries.filter((entry) => readiness(entry) === "ready").length;
  const documented = entries.filter((entry) => derive(entry).documented).length;

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

  <div class="tally">
    <div><span class="n">${total}</span><span class="k">components</span></div>
    <div><span class="n">${documented}</span><span class="k">with a contract</span></div>
    <div><span class="n">${ready}</span><span class="k">ready</span></div>
  </div>

  <nav class="doors">
    <a class="door" href="registry.html">
      <h2>Component registry →</h2>
      <p>Every entry, filterable by level, role and readiness, with what each one is composed from and used inside.</p>
      <span class="count">${total} entries</span>
    </a>
    <a class="door" href="components/index.html">
      <h2>Component pages →</h2>
      <p>One page per component: purpose, when to use it and when not to, its properties, and the sizes it comes in.</p>
      <span class="count">${documented} contracts written</span>
    </a>
  </nav>

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

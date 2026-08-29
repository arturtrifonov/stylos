#!/usr/bin/env node
// Builds a readable view of the component registry.
//
//   npm run registry:view     # writes build/registry.html and prints its path
//   npm run build             # writes it into the publishable tree, with the fonts
//
// One self-contained HTML file: CSS, JavaScript and data inlined. It is opened
// over file://, where fetching a sibling JSON is blocked — a two-file design
// would fail silently in exactly the situation this is built for. No CDN, no
// remote font, no dependency; tools/ stays dependency-free and offline.
//
// The one thing not inlined is the two font files, which are one shared copy
// under build/assets/ that npm run build puts there. They are local, so the
// offline promise holds; a page opened without them falls back to the system
// stack and loses nothing but the family.
//
// The output is derived and cheap to rebuild, so build/ is gitignored rather
// than committed: committing it would put a diff the size of the whole registry
// into every registry change. See docs/specs/0002-registry-viewer.md §4.
//
// This renders; it does not edit. The YAML is edited in an editor.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadRegistry,
  derive,
  readiness,
  pagePathFor,
  figmaUrl,
  LEVELS,
  ROLES,
  READINESS,
} from "./lib/registry.mjs";
import { readPlan, waveById } from "./lib/plan.mjs";
import { loadTheme, themeCss } from "./lib/theme.mjs";

// Plain, but no longer anonymous. The layout is a tool's — a table, a filter
// bar and a panel — and everything that gives it a colour, a radius, a family
// or a step of type is resolved from tokens/ at build time by
// tools/lib/theme.mjs. SPEC 0002 §4.3 asked for no hand-coded Stylos colours
// here and there are none: the rule it was written for is that a copied value
// rots, and a resolved one cannot.
//
// It was also too small to read. Every size below is a step on the system's own
// type scale rather than a number chosen by eye, and rows are given room:
// 101 rows at 13px with 4px of padding is a spreadsheet, not a document.
const CSS = String.raw`
* { box-sizing: border-box; }
body {
  margin: 0;
  font: 400 var(--text-meta)/1.5 var(--font-sans);
  background: var(--bg);
  color: var(--fg);
  -webkit-font-smoothing: antialiased;
}

/* --- Header ------------------------------------------------------------- */

header {
  padding: 24px 28px 18px;
  border-bottom: 1px solid var(--rule-strong);
  background: var(--bg-sunken);
}
.masthead { display: flex; align-items: flex-start; gap: 20px; justify-content: space-between; flex-wrap: wrap; }
.identity { display: flex; align-items: center; gap: 14px; }
.identity .logo-link { display: flex; }
.identity .logo { display: block; width: 104px; height: auto; color: var(--brand); flex: none; }
.identity .divider { width: 1px; min-height: 38px; align-self: stretch; background: var(--rule-strong); }
h1 { font-size: var(--text-lead); margin: 0; font-weight: 600; letter-spacing: -.01em; }
.meta { color: var(--fg-quiet); font-size: var(--text-small); margin: 2px 0 0; }
.meta a { color: var(--accent); }

/* Filters and actions are two different things and stop looking alike: the
   chips select and stay left, the two buttons act and sit out of the way on
   the right, where they cannot be mistaken for another facet to choose from. */
.controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 2rem;
  margin-top: 20px;
}
@media (max-width: 1000px) { .controls { grid-template-columns: minmax(0, 1fr); row-gap: 12px; } }
#filters { display: flex; flex-direction: column; gap: 12px; }
.group { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.group > .label {
  color: var(--fg-faint);
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: var(--text-micro);
  font-weight: 600;
  width: 74px;
  flex: none;
}
button.chip {
  font: inherit;
  font-size: var(--text-small);
  line-height: 1;
  padding: 6px 10px;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-round);
  background: var(--bg);
  color: var(--fg-quiet);
  cursor: pointer;
}
button.chip:hover { border-color: var(--fg-faint); color: var(--fg); }
button.chip:focus-visible { outline: 2px solid var(--rule-accent); outline-offset: 2px; }
button.chip[aria-pressed="true"] {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--fg-on-brand);
  font-weight: 500;
}
button.chip .count { color: var(--fg-faint); margin-left: 6px; font-variant-numeric: tabular-nums; }
button.chip[aria-pressed="true"] .count { color: var(--fg-on-brand); opacity: .72; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: flex-end; }
#status { margin: 12px 0 0; font-size: var(--text-small); color: var(--fg-quiet); font-variant-numeric: tabular-nums; }
#status b { font-weight: 600; color: var(--fg); }
kbd {
  font: inherit;
  font-size: var(--text-micro);
  font-family: var(--font-mono);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-xs);
  padding: 1px 4px;
  color: var(--fg-faint);
}

/* --- Table -------------------------------------------------------------- */

main { display: grid; grid-template-columns: minmax(0, 1fr) 380px; align-items: start; }
@media (max-width: 1000px) { main { grid-template-columns: minmax(0, 1fr); } }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 9px 16px; border-bottom: 1px solid var(--rule); white-space: nowrap; }
/* The last column takes the slack, so every column before it stays next to the
   one beside it instead of being stretched apart by an empty window. */
th:last-child, td:last-child { width: 100%; }
thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg-sunken);
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  font-size: var(--text-micro);
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--fg-faint);
  padding-top: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--rule-strong);
}
thead th:hover { color: var(--fg); }
thead th[aria-sort]:not([aria-sort="none"]) { color: var(--fg); }
thead th .arrow { color: var(--brand); }
tbody tr { cursor: pointer; }
tbody tr:hover { background: var(--bg-sunken); }
tbody tr[aria-selected="true"] { background: var(--selected); }
tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 3px 0 0 var(--brand); }
td.name { font-weight: 500; }
td.flag { color: var(--fg-disabled); }
td.flag[data-on="true"] { color: var(--ok); }
/* Colour is the second cue, never the only one: the word is the answer and the
   dot only makes the column scannable. Two tones plus the muted foreground —
   the same three the generated component page uses for its verdicts. */
.status[data-status="ready"] { color: var(--ok); }
.status[data-status="in progress"] { color: var(--warn); }
.status[data-status="not started"] { color: var(--fg-faint); }
.status .dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-round);
  background: currentColor;
  margin-right: 8px;
  vertical-align: baseline;
}
td.wave { text-align: right; font-variant-numeric: tabular-nums; color: var(--fg-quiet); }
td.page a { color: var(--accent); text-decoration: none; }
td.page a:hover { text-decoration: underline; }
tbody tr.group-row { cursor: default; }
tbody tr.group-row:hover { background: none; }
tbody tr.group-row td {
  background: var(--bg-raised);
  font-size: var(--text-micro);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--fg-quiet);
  padding-top: 9px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--rule-strong);
  width: auto;
}
tbody tr.group-row td .count { margin-left: 8px; font-weight: 400; color: var(--fg-faint); }

/* --- Detail panel ------------------------------------------------------- */

aside {
  position: sticky;
  top: 0;
  padding: 22px 26px 40px;
  border-left: 1px solid var(--rule-strong);
  background: var(--bg-sunken);
  max-height: 100vh;
  overflow-y: auto;
}
@media (max-width: 1000px) { aside { position: static; border-left: 0; border-top: 1px solid var(--rule-strong); max-height: none; } }
aside h2 { font-size: var(--text-section); margin: 0 0 4px; font-weight: 600; letter-spacing: -.015em; line-height: 1.15; }
aside h3 {
  font-size: var(--text-micro);
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--fg-faint);
  margin: 22px 0 6px;
  font-weight: 700;
}
aside dl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 16px; margin: 0; }
aside dt { color: var(--fg-faint); }
aside dd { margin: 0; overflow-wrap: anywhere; }
aside ul { margin: 0; padding: 0; list-style: none; }
aside li { padding: 1px 0; }
button.link {
  font: inherit;
  background: none;
  border: 0;
  padding: 0;
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  text-align: left;
}
a { color: var(--accent); overflow-wrap: anywhere; }
code, .mono { font-family: var(--font-mono); font-size: var(--text-small); }
.empty { color: var(--fg-faint); }
.note { white-space: pre-wrap; color: var(--fg-quiet); }
`;

// Written without template literals so it can live inside one here in Node.
const APP = `
"use strict";
var DATA = window.__REGISTRY__;
var LEVELS = DATA.levels;
var ROLES = DATA.roles;
var READINESS = DATA.readiness;
var entries = DATA.entries;
var byId = new Map(entries.map(function (e) { return [e.id, e]; }));

var state = {
  levels: new Set(),
  roles: new Set(),
  readiness: new Set(),
  waves: new Set(),
  sort: "name",
  direction: 1,
  group: true,
  selected: entries.length > 0 ? entries[0].id : null,
};

function el(tag, props, children) {
  var node = document.createElement(tag);
  for (var key in props || {}) {
    if (key === "text") node.textContent = props[key];
    else if (key === "class") node.className = props[key];
    else if (key.slice(0, 2) === "on") node.addEventListener(key.slice(2), props[key]);
    else node.setAttribute(key, props[key]);
  }
  (children || []).forEach(function (child) { node.appendChild(child); });
  return node;
}

// Grouping is not a filter — it survives Clear, and following a relation into
// a filtered-out row does not turn it off.
function clearFilters() {
  state.levels.clear();
  state.roles.clear();
  state.readiness.clear();
  state.waves.clear();
}

function matches(entry) {
  if (state.levels.size > 0 && !state.levels.has(entry.level)) return false;
  if (state.roles.size > 0 && !state.roles.has(entry.role)) return false;
  if (state.readiness.size > 0 && !state.readiness.has(entry.readiness)) return false;
  if (state.waves.size > 0 && !state.waves.has(entry.wave)) return false;
  return true;
}

// One comparable string per row. Every column sorts through the same path,
// comparing strings, so a numeric column is padded rather than compared
// numerically; an entry outside the core set has no wave and sorts last.
function sortKey(entry) {
  if (state.sort === "level") return String(LEVELS.indexOf(entry.level));
  if (state.sort === "role") return entry.role || "";
  if (state.sort === "readiness") return String(READINESS.indexOf(entry.readiness));
  if (state.sort === "flow") return entry.flow_behavior.join(", ");
  if (state.sort === "wave") return entry.wave === null ? "zzz" : String(entry.wave).padStart(3, "0");
  if (state.sort === "documented") return entry.documented ? "1" : "0";
  if (state.sort === "linked") return entry.linked ? "1" : "0";
  return entry.name.toLowerCase();
}

function compare(a, b) {
  var ka = sortKey(a);
  var kb = sortKey(b);
  if (ka === kb) return a.name.localeCompare(b.name);
  return ka < kb ? -state.direction : state.direction;
}

// The rows as they are shown: one group when grouping is off, one per level in
// composition order when it is on. Everything that walks the table — rendering,
// the count, arrow-key movement — goes through this, so they cannot disagree
// about what order the reader is looking at.
function groups() {
  var rows = entries.filter(matches).sort(compare);
  if (!state.group) return [{ level: null, rows: rows }];

  var order = LEVELS.slice();
  // Sorting by level is the one case where the header arrow should turn the
  // groups over as well; every other sort orders rows inside them.
  if (state.sort === "level" && state.direction === -1) order.reverse();

  var out = order.map(function (level) {
    return { level: level, rows: rows.filter(function (e) { return e.level === level; }) };
  });
  var rest = rows.filter(function (e) { return LEVELS.indexOf(e.level) === -1; });
  if (rest.length > 0) out.push({ level: "no level", rows: rest });
  return out.filter(function (group) { return group.rows.length > 0; });
}

function visible() {
  return groups().reduce(function (all, group) { return all.concat(group.rows); }, []);
}

var COLUMNS = [
  { key: "name", label: "Component" },
  {
    key: "readiness",
    label: "Readiness",
    title: "Derived from the two columns on the right: ready = the contract is written and the entry is linked to Figma. Not the component's lifecycle — that is Status, in the panel",
  },
  {
    key: "wave",
    label: "Wave",
    title: "PLAN.md Stage 4 — the order the v0.1 core set is worked in, read from the plan on every build. Blank where the entry is not in that set",
  },
  { key: "level", label: "Level" },
  { key: "role", label: "Role" },
  { key: "flow", label: "Flow" },
  { key: "documented", label: "Contract", title: "The contract is written: summary, purpose, use_when and a description on every property" },
  { key: "linked", label: "Figma" },
  { key: "page", label: "Page", title: "The generated component page — npm run components:view" },
];

function renderFilters() {
  var host = document.getElementById("filters");
  host.textContent = "";

  function group(label, values, selection, countOf) {
    var chips = values.map(function (value) {
      var chip = el("button", {
        class: "chip",
        type: "button",
        "aria-pressed": selection.has(value) ? "true" : "false",
        onclick: function () {
          if (selection.has(value)) selection.delete(value);
          else selection.add(value);
          render();
        },
      });
      chip.appendChild(document.createTextNode(value));
      chip.appendChild(el("span", { class: "count", text: String(countOf(value)) }));
      return chip;
    });
    return el("div", { class: "group" }, [el("span", { class: "label", text: label })].concat(chips));
  }

  function countBy(key) {
    return function (value) {
      return entries.filter(function (e) { return e[key] === value; }).length;
    };
  }

  host.appendChild(group("Level", LEVELS, state.levels, countBy("level")));
  host.appendChild(group("Role", ROLES, state.roles, countBy("role")));
  host.appendChild(group("Readiness", READINESS, state.readiness, countBy("readiness")));
  // The waves are the queue, so the index offers them. They come from PLAN.md
  // on every build; a view built without a plan simply has no wave filter.
  if (DATA.waves.length > 0) {
    host.appendChild(group("Wave", DATA.waves, state.waves, countBy("wave")));
  }
}

// The toolbar acts rather than selects, so it is built once and only its
// pressed state is refreshed.
//
// There is no search field. SPEC 0002 §4.3 asked for one and it was built, but
// every row is in the document — nothing is virtualised — so the browser's own
// find already searches the names, and better: it searches every other column
// too. A second, worse search box beside it was one more control to look past.
function mountToolbar() {
  var host = document.getElementById("toolbar");

  host.appendChild(
    el("button", {
      class: "chip",
      type: "button",
      id: "group-toggle",
      text: "Group by level",
      onclick: function () {
        state.group = !state.group;
        render();
      },
    })
  );

  host.appendChild(
    el("button", {
      class: "chip",
      type: "button",
      text: "Clear filters",
      onclick: function () {
        clearFilters();
        render();
      },
    })
  );
}

function syncToolbar() {
  document.getElementById("group-toggle").setAttribute("aria-pressed", state.group ? "true" : "false");
}

function renderHead() {
  var row = document.getElementById("head-row");
  row.textContent = "";
  COLUMNS.forEach(function (column) {
    var th = el("th", {
      scope: "col",
      title: column.title || column.label,
      "aria-sort": state.sort === column.key ? (state.direction === 1 ? "ascending" : "descending") : "none",
      onclick: function () {
        if (state.sort === column.key) state.direction = -state.direction;
        else { state.sort = column.key; state.direction = 1; }
        renderHead();
        renderTable();
      },
    });
    th.appendChild(document.createTextNode(column.label));
    if (state.sort === column.key) {
      th.appendChild(el("span", { class: "arrow", text: state.direction === 1 ? " ↑" : " ↓" }));
    }
    row.appendChild(th);
  });
}

function renderTable() {
  var body = document.getElementById("rows");
  body.textContent = "";
  groups().forEach(function (group) {
    if (group.level !== null) {
      var heading = el("tr", { class: "group-row" });
      var cell = el("td", { colspan: String(COLUMNS.length) });
      cell.appendChild(document.createTextNode(group.level));
      cell.appendChild(el("span", { class: "count", text: String(group.rows.length) }));
      heading.appendChild(cell);
      body.appendChild(heading);
    }
    group.rows.forEach(function (entry) {
      var tr = el("tr", {
        "aria-selected": entry.id === state.selected ? "true" : "false",
        "data-id": entry.id,
        onclick: function () { select(entry.id); },
      });
      tr.appendChild(el("td", { class: "name", text: entry.name }));
      tr.appendChild(el("td", { class: "status", "data-status": entry.readiness }, [
        el("span", { class: "dot" }),
        el("span", { text: entry.readiness }),
      ]));
      tr.appendChild(el("td", { class: "wave", text: entry.wave === null ? "—" : String(entry.wave) }));
      tr.appendChild(el("td", { text: entry.level || "—" }));
      tr.appendChild(el("td", { text: entry.role || "—" }));
      tr.appendChild(el("td", { text: entry.flow_behavior.join(", ") || "—" }));
      tr.appendChild(el("td", { class: "flag", "data-on": String(entry.documented), text: entry.documented ? "yes" : "—" }));
      tr.appendChild(el("td", { class: "flag", "data-on": String(entry.linked), text: entry.linked ? "yes" : "—" }));
      // Linked whether or not a contract is written: the page renders a legacy
      // entry as what it is rather than 404ing on it.
      tr.appendChild(el("td", { class: "page" }, [el("a", { href: entry.page_path, text: "open \u2192" })]));
      body.appendChild(tr);
    });
  });
}

function renderStatus() {
  var shown = visible().length;
  var ready = entries.filter(function (e) { return e.readiness === "ready"; }).length;
  var documented = entries.filter(function (e) { return e.documented; }).length;
  var linked = entries.filter(function (e) { return e.linked; }).length;
  var host = document.getElementById("status");
  host.textContent = "";
  [
    [String(shown) + " of " + entries.length, "shown"],
    [String(ready), "ready"],
    [String(documented), "with a contract"],
    [String(linked), "linked to Figma"],
  ].forEach(function (pair, index) {
    if (index > 0) host.appendChild(document.createTextNode(" \u00b7 "));
    host.appendChild(el("b", { text: pair[0] }));
    host.appendChild(document.createTextNode(" " + pair[1]));
  });
  host.appendChild(document.createTextNode(" \u00b7 "));
  host.appendChild(el("kbd", { text: "\u2191" }));
  host.appendChild(document.createTextNode(" "));
  host.appendChild(el("kbd", { text: "\u2193" }));
  host.appendChild(document.createTextNode(" moves the selection"));
}

// The same word and colour the row carries, so the panel cannot read as a
// second opinion about the same entry.
function readinessTag(value) {
  return el("span", { class: "status", "data-status": value }, [
    el("span", { class: "dot" }),
    el("span", { text: value }),
  ]);
}

function relationList(ids) {
  if (ids.length === 0) return el("p", { class: "empty", text: "none" });
  return el(
    "ul",
    {},
    ids.map(function (id) {
      var known = byId.has(id);
      return el("li", {}, [
        known
          ? el("button", { class: "link", type: "button", text: id, onclick: function () { follow(id); } })
          : el("span", { class: "empty", text: id + " (unknown)" }),
      ]);
    })
  );
}

function describe(value) {
  if (value === null || value === undefined) return el("span", { class: "empty", text: "—" });
  if (Array.isArray(value)) {
    if (value.length === 0) return el("span", { class: "empty", text: "—" });
    return el("ul", {}, value.map(function (item) { return el("li", {}, [describe(item)]); }));
  }
  if (typeof value === "object") {
    var dl = el("dl", {});
    Object.keys(value).forEach(function (key) {
      dl.appendChild(el("dt", { text: key }));
      dl.appendChild(el("dd", {}, [describe(value[key])]));
    });
    return dl;
  }
  if (value === "") return el("span", { class: "empty", text: "empty" });
  return el("span", { text: String(value) });
}

function renderDetail() {
  var host = document.getElementById("detail");
  host.textContent = "";
  var entry = byId.get(state.selected);
  if (!entry) {
    host.appendChild(el("p", { class: "empty", text: "Select a component." }));
    return;
  }

  host.appendChild(el("h2", { text: entry.name }));
  if (entry.id !== entry.name) host.appendChild(el("p", { class: "meta mono", text: entry.id }));
  host.appendChild(el("p", { class: "meta mono", text: entry.file }));

  var facts = el("dl", {});
  [
    ["Level", entry.level || "—"],
    ["Role", entry.role || "—"],
    ["Flow", entry.flow_behavior.join(", ") || "—"],
    // Authored lifecycle, not the derived readiness above it in the table.
    ["Status", entry.status || "—"],
  ].forEach(function (pair) {
    facts.appendChild(el("dt", { text: pair[0] }));
    facts.appendChild(el("dd", { text: pair[1] }));
  });
  host.appendChild(facts);

  host.appendChild(el("h3", { text: "Derived" }));
  var derived = el("dl", {});
  derived.appendChild(el("dt", { text: "Readiness" }));
  derived.appendChild(el("dd", {}, [readinessTag(entry.readiness)]));
  // Where the plan puts it, not a field on the entry — see lib/plan.mjs.
  derived.appendChild(el("dt", { text: "Wave" }));
  derived.appendChild(
    el("dd", {}, [
      entry.wave === null
        ? el("span", { class: "empty", text: "not in the v0.1 core set" })
        : el("span", { text: "PLAN.md Stage 4, wave " + entry.wave }),
    ])
  );
  derived.appendChild(el("dt", { text: "Contract" }));
  derived.appendChild(
    el("dd", {}, [
      entry.documented
        ? el("span", { text: "written" })
        : el("span", { class: "empty", text: "not written" }),
    ])
  );
  derived.appendChild(el("dt", { text: "Page" }));
  // The extension is how the file is stored, not what the page is called.
  derived.appendChild(
    el("dd", {}, [el("a", { href: entry.page_path, text: entry.page_path.replace(/\.html$/, "") })])
  );
  derived.appendChild(el("dt", { text: "Figma" }));
  derived.appendChild(
    el("dd", {}, [
      entry.figma_url
        ? el("a", { href: entry.figma_url, target: "_blank", rel: "noreferrer", text: "open node " + entry.figma.node_id })
        : el("span", { class: "empty", text: "not linked" }),
    ])
  );
  host.appendChild(derived);

  host.appendChild(el("h3", { text: "Composed from (" + entry.children.length + ")" }));
  host.appendChild(relationList(entry.children));
  host.appendChild(el("h3", { text: "Used inside (" + entry.parents.length + ")" }));
  host.appendChild(relationList(entry.parents));

  if (entry.notes) {
    host.appendChild(el("h3", { text: "Notes" }));
    host.appendChild(el("p", { class: "note", text: entry.notes }));
  }

  if (entry.figma) {
    host.appendChild(el("h3", { text: "Figma record" }));
    host.appendChild(describe(entry.figma));
  }

  var extraKeys = Object.keys(entry.extra);
  if (extraKeys.length > 0) {
    host.appendChild(el("h3", { text: "Other fields" }));
    host.appendChild(describe(entry.extra));
  }

  if (entry.import) {
    host.appendChild(el("h3", { text: "Airtable import, " + DATA.import_date + " — history, not status" }));
    host.appendChild(describe(entry.import));
  }
}

function select(id) {
  state.selected = id;
  document.querySelectorAll("#rows tr").forEach(function (tr) {
    tr.setAttribute("aria-selected", tr.getAttribute("data-id") === id ? "true" : "false");
  });
  renderDetail();
}

// Component ids carry spaces and slashes, so they are compared rather than
// interpolated into a selector.
function rowFor(id) {
  var found = null;
  document.querySelectorAll("#rows tr").forEach(function (tr) {
    if (tr.getAttribute("data-id") === id) found = tr;
  });
  return found;
}

// Following a relation beats the current filter: if the target is filtered out
// the filter is cleared, because the alternative is a link that looks broken.
function follow(id) {
  var entry = byId.get(id);
  if (!entry) return;
  if (!matches(entry)) {
    clearFilters();
    state.selected = id;
    render();
  } else {
    select(id);
  }
  var row = rowFor(id);
  if (row) row.scrollIntoView({ block: "nearest" });
}

function move(step) {
  var rows = visible();
  if (rows.length === 0) return;
  var index = rows.findIndex(function (e) { return e.id === state.selected; });
  var next = rows[Math.min(rows.length - 1, Math.max(0, (index === -1 ? 0 : index + step)))];
  select(next.id);
  var row = rowFor(next.id);
  if (row) row.scrollIntoView({ block: "nearest" });
}

function render() {
  renderFilters();
  syncToolbar();
  renderHead();
  renderTable();
  renderStatus();
  renderDetail();
}

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
  if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
});

mountToolbar();
render();
`;

/**
 * Inline JSON safely. A literal `</script>` inside a string would close the
 * tag early, and U+2028/U+2029 are line terminators to a JavaScript parser but
 * not to JSON.stringify — both are escaped here rather than emitted raw.
 */
function inlineJson(value) {
  return JSON.stringify(value).replace(
    /[<\u2028\u2029]/g,
    (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")
  );
}

export function buildViewData(root, entries) {
  // PLAN.md Stage 4, read rather than copied — see lib/plan.mjs. Absent, the
  // rows carry no wave and the facet and column are not offered.
  const plan = readPlan(root);
  const waveOf = plan ? waveById(plan, entries) : new Map();
  const waves = [...new Set(waveOf.values())].sort((a, b) => a - b);

  return {
    generated: new Date().toISOString().slice(0, 10),
    import_date: "2026-08-20",
    levels: LEVELS,
    roles: ROLES,
    readiness: READINESS,
    waves,
    entries: entries.map((entry) => {
      const { documented, linked } = derive(entry);
      return {
        id: entry.id,
        name: entry.name,
        file: entry.file,
        level: entry.level,
        role: entry.role,
        wave: waveOf.get(entry.id) ?? null,
        flow_behavior: entry.flowBehavior,
        children: entry.children,
        parents: entry.parents,
        notes: entry.notes,
        figma: entry.figma,
        figma_url: figmaUrl(entry.figma),
        import: entry.import,
        extra: entry.extra,
        status: entry.status,
        readiness: readiness(entry),
        page_path: entry.id ? `components/${pagePathFor(entry.id)}` : null,
        documented,
        linked,
      };
    }),
  };
}

/**
 * The page.
 *
 * `chrome` is what the repository dresses it in — the theme resolved from
 * tokens/ and the wordmark — and it is a second argument rather than a field on
 * `data` because `data` is inlined into the page as JSON and a stylesheet has
 * no business being in it. Both default to empty: a fixture with no tokens/
 * still renders, in the browser's own colours, which is what a test wants.
 */
export function renderView(data, chrome = {}) {
  const theme = chrome.themeCss ?? "";
  const logo = chrome.logo ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Component registry — Stylos</title>
<style>${theme}${CSS}</style>
</head>
<body>
<header>
  <div class="masthead">
    <div class="identity">
      ${logo ? `<a href="index.html" class="logo-link">${logo}</a>` : ""}
      <span class="divider"></span>
      <div>
        <h1>Component registry</h1>
        <p class="meta">
          ${data.entries.length} entries, generated from <span class="mono">docs/components/registry/</span>
          on ${data.generated}
        </p>
      </div>
    </div>
    <p class="meta">
      A derived view — edit the YAML, then rebuild with <span class="mono">npm run build</span>.
      <br>Every component also has <a href="components/index.html">a page of its own</a>.
    </p>
  </div>
  <div class="controls">
    <div id="filters"></div>
    <div class="toolbar" id="toolbar"></div>
  </div>
  <p class="meta" id="status"></p>
</header>
<main>
  <div class="table-wrap">
    <table>
      <thead><tr id="head-row"></tr></thead>
      <tbody id="rows"></tbody>
    </table>
  </div>
  <aside id="detail"></aside>
</main>
<script>window.__REGISTRY__ = ${inlineJson(data)};</script>
<script>${APP}</script>
</body>
</html>
`;
}

/** The theme and the wordmark, read from the repository at build time. */
export function loadChrome(root, { prefix = "" } = {}) {
  const theme = loadTheme(root);
  if (theme.missing.length > 0) {
    console.warn(`theme: ${theme.missing.length} token(s) did not resolve: ${theme.missing.join(", ")}`);
  }
  let logo = "";
  try {
    logo = readFileSync(path.join(root, "assets/logo.svg"), "utf8").trim().replace(/^<\?xml[^>]*>\s*/, "");
    logo = logo.replace("<svg ", '<svg class="logo" ');
  } catch {
    // The wordmark is decoration. A build without it is a build without it.
  }
  return { themeCss: themeCss(theme, { prefix }), logo };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const entries = loadRegistry(root);
  const html = renderView(buildViewData(root, entries), loadChrome(root));

  const out = path.join(root, "build/registry.html");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, html);

  console.log(`${entries.length} components → ${path.relative(root, out)}`);
}

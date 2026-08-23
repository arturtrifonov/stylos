#!/usr/bin/env node
// Builds a readable view of the component registry.
//
//   npm run registry:view     # writes build/registry.html and prints its path
//
// One self-contained HTML file: CSS, JavaScript and data inlined. It is opened
// over file://, where fetching a sibling JSON is blocked — a two-file design
// would fail silently in exactly the situation this is built for. No CDN, no
// external font, no dependency; tools/ stays dependency-free and offline.
//
// The output is derived and cheap to rebuild, so build/ is gitignored rather
// than committed: committing it would put a 96-row diff into every registry
// change. See docs/specs/0002-registry-viewer.md §4.
//
// This renders; it does not edit. The YAML is edited in an editor.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRegistry, derive, documentPathFor, figmaUrl, LEVELS, ROLES } from "./lib/registry.mjs";

// Neutral and plain on purpose: this is a tool, not a showcase. No Stylos
// colour is hand-copied in — once the CSS build exists (PLAN.md Stage 3) this
// view is its natural first consumer, and swapping these six variables for
// generated custom properties is the whole migration.
const CSS = `
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --bg-sunken: #f4f4f5;
  --fg: #18181b;
  --fg-muted: #71717a;
  --line: #e4e4e7;
  --accent: #3f3f46;
  --selected: #eef2ff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #18181b;
    --bg-sunken: #232326;
    --fg: #f4f4f5;
    --fg-muted: #a1a1aa;
    --line: #34343a;
    --accent: #d4d4d8;
    --selected: #2a2a44;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font: 13px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--fg);
}
header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--line);
}
h1 { font-size: 15px; margin: 0 0 4px; font-weight: 600; }
.meta { color: var(--fg-muted); }
.controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 12px; }
.group { display: flex; flex-wrap: wrap; gap: 4px; align-items: baseline; }
.group > .label {
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: .06em;
  font-size: 10px;
  margin-right: 4px;
}
button.chip {
  font: inherit;
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--fg);
  cursor: pointer;
}
button.chip[aria-pressed="true"] { background: var(--accent); color: var(--bg); border-color: var(--accent); }
button.chip .count { color: var(--fg-muted); margin-left: 4px; }
button.chip[aria-pressed="true"] .count { color: var(--bg); }
input[type="search"] {
  font: inherit;
  padding: 3px 8px;
  min-width: 200px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg);
  color: var(--fg);
}
main { display: grid; grid-template-columns: minmax(0, 1fr) 340px; align-items: start; }
@media (max-width: 900px) { main { grid-template-columns: minmax(0, 1fr); } }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 4px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
thead th {
  position: sticky;
  top: 0;
  background: var(--bg-sunken);
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--fg-muted);
}
thead th .arrow { color: var(--fg); }
tbody tr { cursor: pointer; }
tbody tr:hover { background: var(--bg-sunken); }
tbody tr[aria-selected="true"] { background: var(--selected); }
td.flag { text-align: center; color: var(--fg-muted); }
td.flag[data-on="true"] { color: var(--fg); }
td.batch { text-align: right; font-variant-numeric: tabular-nums; }
tbody tr.group-row { cursor: default; }
tbody tr.group-row:hover { background: none; }
tbody tr.group-row td {
  background: var(--bg-sunken);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--fg-muted);
  padding-top: 8px;
  padding-bottom: 3px;
}
tbody tr.group-row td .count { margin-left: 6px; opacity: .7; }
aside {
  position: sticky;
  top: 0;
  padding: 16px 20px;
  border-left: 1px solid var(--line);
  max-height: 100vh;
  overflow-y: auto;
}
@media (max-width: 900px) { aside { position: static; border-left: 0; border-top: 1px solid var(--line); max-height: none; } }
aside h2 { font-size: 14px; margin: 0 0 2px; }
aside h3 {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--fg-muted);
  margin: 16px 0 4px;
  font-weight: 600;
}
aside dl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 12px; margin: 0; }
aside dt { color: var(--fg-muted); }
aside dd { margin: 0; overflow-wrap: anywhere; }
aside ul { margin: 0; padding: 0; list-style: none; }
button.link {
  font: inherit;
  background: none;
  border: 0;
  padding: 0;
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  text-align: left;
}
a { color: var(--fg); overflow-wrap: anywhere; }
code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.empty { color: var(--fg-muted); }
.hint { color: var(--fg-muted); margin-top: 8px; }
.note { white-space: pre-wrap; }
`;

// Written without template literals so it can live inside one here in Node.
const APP = `
"use strict";
var DATA = window.__REGISTRY__;
var LEVELS = DATA.levels;
var ROLES = DATA.roles;
var entries = DATA.entries;
var byId = new Map(entries.map(function (e) { return [e.id, e]; }));

var state = {
  levels: new Set(),
  roles: new Set(),
  batches: new Set(),
  query: "",
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
  state.batches.clear();
  state.query = "";
}

function matches(entry) {
  if (state.levels.size > 0 && !state.levels.has(entry.level)) return false;
  if (state.roles.size > 0 && !state.roles.has(entry.role)) return false;
  if (state.batches.size > 0 && !state.batches.has(entry.batch)) return false;
  if (state.query && entry.name.toLowerCase().indexOf(state.query) === -1) return false;
  return true;
}

// One comparable string per row. Numbers are padded rather than compared
// numerically so every column sorts through the same path; an entry with no
// batch sorts last either way.
function sortKey(entry) {
  if (state.sort === "level") return String(LEVELS.indexOf(entry.level));
  if (state.sort === "role") return entry.role || "";
  if (state.sort === "flow") return entry.flow_behavior.join(", ");
  if (state.sort === "batch") return entry.batch === null ? "zzz" : String(entry.batch).padStart(3, "0");
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
  { key: "level", label: "Level" },
  { key: "role", label: "Role" },
  { key: "flow", label: "Flow" },
  { key: "batch", label: "Batch", title: "Airtable's build sequencing, as it stood on " + DATA.import_date },
  { key: "documented", label: "Doc" },
  { key: "linked", label: "Figma" },
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

  host.appendChild(
    group("Level", LEVELS, state.levels, function (value) {
      return entries.filter(function (e) { return e.level === value; }).length;
    })
  );
  host.appendChild(
    group("Role", ROLES, state.roles, function (value) {
      return entries.filter(function (e) { return e.role === value; }).length;
    })
  );
  if (DATA.batches.length > 0) {
    host.appendChild(
      group("Batch", DATA.batches, state.batches, function (value) {
        return entries.filter(function (e) { return e.batch === value; }).length;
      })
    );
  }

  host.appendChild(
    el("button", {
      class: "chip",
      type: "button",
      "aria-pressed": state.group ? "true" : "false",
      text: "Group by level",
      onclick: function () {
        state.group = !state.group;
        render();
      },
    })
  );

  var search = el("input", { type: "search", placeholder: "Search names…", value: state.query });
  search.addEventListener("input", function (event) {
    state.query = event.target.value.trim().toLowerCase();
    renderTable();
    renderStatus();
  });
  host.appendChild(search);

  host.appendChild(
    el("button", {
      class: "chip",
      type: "button",
      text: "Clear",
      onclick: function () {
        clearFilters();
        render();
      },
    })
  );
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
      tr.appendChild(el("td", { text: entry.name }));
      tr.appendChild(el("td", { text: entry.level || "—" }));
      tr.appendChild(el("td", { text: entry.role || "—" }));
      tr.appendChild(el("td", { text: entry.flow_behavior.join(", ") || "—" }));
      tr.appendChild(el("td", { class: "batch", text: entry.batch === null ? "—" : String(entry.batch) }));
      tr.appendChild(el("td", { class: "flag", "data-on": String(entry.documented), text: entry.documented ? "yes" : "—" }));
      tr.appendChild(el("td", { class: "flag", "data-on": String(entry.linked), text: entry.linked ? "yes" : "—" }));
      body.appendChild(tr);
    });
  });
}

function renderStatus() {
  var shown = visible().length;
  var documented = entries.filter(function (e) { return e.documented; }).length;
  var linked = entries.filter(function (e) { return e.linked; }).length;
  document.getElementById("status").textContent =
    shown + " of " + entries.length + " shown · " + documented + " documented · " + linked + " linked to Figma";
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
  ].forEach(function (pair) {
    facts.appendChild(el("dt", { text: pair[0] }));
    facts.appendChild(el("dd", { text: pair[1] }));
  });
  host.appendChild(facts);

  host.appendChild(el("h3", { text: "Derived" }));
  var derived = el("dl", {});
  derived.appendChild(el("dt", { text: "Document" }));
  derived.appendChild(
    el("dd", {}, [
      entry.documented
        ? el("span", { class: "mono", text: entry.document_path })
        : el("span", { class: "empty", text: "not written — " + entry.document_path }),
    ])
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
  renderHead();
  renderTable();
  renderStatus();
  renderDetail();
}

document.addEventListener("keydown", function (event) {
  if (event.target.tagName === "INPUT") return;
  if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
  if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
});

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
  // The batch values that actually occur, in order. Airtable's build
  // sequencing is history like the rest of `import:` — it is filterable and
  // sortable because it says which components were meant to come first, and it
  // stays labelled by its origin and date wherever it is shown.
  const batches = [
    ...new Set(entries.map((entry) => entry.import?.batch).filter((batch) => typeof batch === "number")),
  ].sort((a, b) => a - b);

  return {
    generated: new Date().toISOString().slice(0, 10),
    import_date: "2026-08-20",
    levels: LEVELS,
    roles: ROLES,
    batches,
    entries: entries.map((entry) => {
      const { documented, linked } = derive(root, entry);
      return {
        id: entry.id,
        name: entry.name,
        file: entry.file,
        level: entry.level,
        role: entry.role,
        flow_behavior: entry.flowBehavior,
        children: entry.children,
        parents: entry.parents,
        notes: entry.notes,
        figma: entry.figma,
        figma_url: figmaUrl(entry.figma),
        import: entry.import,
        batch: typeof entry.import?.batch === "number" ? entry.import.batch : null,
        extra: entry.extra,
        document_path: entry.id ? documentPathFor(entry.id) : null,
        documented,
        linked,
      };
    }),
  };
}

export function renderView(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stylos component registry</title>
<style>${CSS}</style>
</head>
<body>
<header>
  <h1>Stylos component registry</h1>
  <p class="meta">
    ${data.entries.length} components, generated from <span class="mono">docs/components/registry/</span>
    on ${data.generated}. Derived view — edit the YAML, then rebuild with
    <span class="mono">npm run registry:view</span>.
  </p>
  <div class="controls" id="filters"></div>
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

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const entries = loadRegistry(root);
  const html = renderView(buildViewData(root, entries));

  const out = path.join(root, "build/registry.html");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, html);

  console.log(`${entries.length} components → ${path.relative(root, out)}`);
}

# SPEC 0002 — Registry viewer

**Status:** Built — 2026-08-24
**Date:** 2026-08-23

A work order. The component registry becomes readable: a generated view over `docs/components/registry/`, a `figma:` field to link each entry to its node, and a handful of checks the current validator does not make.

---

## 1. Why

The registry holds 96 components — level, role, resizing behaviour, and what each is composed from and used inside. All of it is real data and none of it is legible: relations can only be followed by opening files one at a time, and nothing shows the shape of the whole set.

The consequence is that Airtable is still where the owner looks. The data moved on 2026-08-20; the surface for reading it did not, so the move is not finished. This spec finishes it.

**This is not a documentation site.** It is a working view of structured data, for one person, opened from disk. The documentation surface is a later and different thing ([`PLAN.md`](../../PLAN.md) Stage 6).

## 2. Scope

### In scope

- A `figma:` block in the registry schema.
- Status **derived** from facts on disk, never authored.
- `tools/build-registry-view.mjs` → one self-contained HTML file.
- Additional checks in `tools/lint-registry.mjs`.
- The two schema ambiguities in §3.3, resolved.

### Out of scope

- **Component parameters and the contract.** The registry will grow into the component contract — property names, values, defaults, supported combinations, and declared per-implementation exceptions. That work is blocked on the documentation-boundary decision ([`PLAN.md`](../../PLAN.md) Stage 4) and is not started here. Build the viewer so that unknown fields render rather than break; do not design the contract now.
- Any network access. This tool reads YAML from disk and nothing else.
- Any write path to Figma.
- Editing the registry through the view. It renders; YAML is edited in an editor.

## 3. The schema

### 3.1 `figma:` — new, optional

```yaml
figma:
  file_key: "WUc07ZBtjRvypXtsOlbVut"
  node_id: "4479-13507"
  last_verified: "2026-08-24"
```

Two facts, both copied straight out of the address bar.

**There is no `type` field.** An earlier draft had `component` / `component_set`. It is dropped: the link works the same either way, nothing in the view or the checks reads it, and Figma reports a node's type itself when anything ever asks. A field that is derivable from the thing it describes, and that nothing consumes, is a claim waiting to go stale.

Every key optional; an absent block means "not linked yet", which is the state of all 96 entries today. Entries are filled in as each component is opened in Figma for other reasons — there is no bulk sync step, and this spec does not add one.

**`file_key` belongs to the entry, not to the repository.** Components live in two files, `Stylos / Components` and `Stylos / GUI components` ([`figma/README.md`](../../figma/README.md)).

**Store `node_id` exactly as the URL gives it** — the dash form, `4479-13507`. Both parts are then a straight copy out of the address bar, with no conversion for a human to get wrong:

```
https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components?node-id=4479-13507&t=…
                             └────────── file_key ──────────┘              └ node_id ┘
```

An earlier draft required the API's colon form on the grounds that it is canonical. That was backwards: the only consumer today is the link, which needs the dash, so the rule bought nothing and charged a manual conversion on every entry. `figmaUrl()` normalises `:` → `-`, which makes it a no-op for dash input, so records written either way keep working. A future API consumer converts in the other direction — one line, written once rather than typed ninety-six times.

Accept `%3A` on read as well: older Figma links percent-encode the colon.

Do not store the URL itself. It is derivable, and a stored URL rots in a way the parts do not.

### 3.2 Status is derived, never authored

The only status-like field today is `import.ready` — Airtable's checkbox at import time, which the registry's own README calls "a snapshot, not a live status". Rendering it as status would put a stale checkbox in front of the reader as fact.

Two flags, both computed at build time:

| Flag | True when |
| --- | --- |
| `documented` | the component's Markdown document exists (§3.3) |
| `linked` | `figma.node_id` is present and non-empty |

Both are false for every entry today. That is the correct picture, not a fault.

**Do not add an authored status field.** Lifecycle — version, deprecation, replacement — is point 20 of [`STANDARD.md`](../components/STANDARD.md) and belongs in the component's document; duplicating it here creates two places to update and one of them will be wrong. If a genuinely underivable state is needed later, add that one field then, with its reason.

`import.batch` and `import.ready` stay in the files as history. In the view they appear only in the detail panel, under a heading naming their origin and date, so they cannot be read as current.

### 3.3 Two ambiguities to resolve

**Where a component's document lives.** [`docs/components/README.md`](../components/README.md) says `<component-name>.md` in kebab-case and gives `icon-button.md`; the registry mirrors Figma's hierarchy as a path, `Table / TD Text` → `table/td-text.yaml`. These disagree for any component with a `/` in its name, and `documented` cannot be derived until they agree.

**Resolve as: the document path mirrors the registry path.** `Table / TD Text` → `docs/components/table/td-text.md`, beside nothing else and directly parallel to `docs/components/registry/table/td-text.yaml`. Update `docs/components/README.md` to match.

**Whether registry files are hand-edited.** Each file carries a header saying structural fields are generated and will be overwritten by `import:registry`. The registry README says the opposite — that the CSV importer should be treated as retired once hand-editing starts. Hand-editing is now the workflow.

**Resolve as: hand-editing is the workflow.** Replace the header comment with one that says so and points at the schema. Remove `import:registry` from `package.json`, and keep `tools/import-component-registry.mjs` and the CSV only as the historical bootstrap record — a one-time import that has run and will not run again.

## 4. `tools/build-registry-view.mjs`

```
npm run registry:view     # writes build/registry.html and prints its path
```

Reads every `docs/components/registry/**/*.yaml` through the existing `tools/lib/yaml.mjs` reader, checks which documents exist under `docs/components/`, and writes one file.

### 4.1 One self-contained file

Inline the CSS, the JavaScript, and the data. The file is opened over `file://`, where `fetch` of a sibling JSON is blocked — a two-file design fails silently in exactly the situation it is built for.

No CDN, no external fonts, no dependencies. `tools/` is dependency-free and stays that way.

### 4.2 Output location

`build/registry.html`, and `build/` is added to `.gitignore`.

The view is derived and cheap to rebuild, and committing it would put a 96-row diff into every registry change. This differs from `skills/dist/`, which is committed because it is pasted into Figma by hand and its exact content is what was installed.

### 4.3 What it shows

**A table**, one row per component: name, level, role, flow behaviour, `documented`, `linked`.

- Filter by level and by role.
- Text search over the name.
- Sort by any column.
- Counts per level and per role, visible without filtering — the shape of the set at a glance.

**A detail panel** for the selected component:

- `parents` and `children` as **links that select that component**. This is the part YAML cannot give: today a relation is followed by finding and opening another file.
- The Figma link, when `figma.node_id` is present.
- `notes`, when non-empty.
- The Airtable import fields, under their own dated heading (§3.2).
- Any field the schema gains later, rendered generically rather than ignored.

**Presentation.** Neutral and plain; this is a tool, not a showcase. Respect `prefers-color-scheme`. Do not hand-code Stylos colours into it — once the CSS build exists ([`PLAN.md`](../../PLAN.md) Stage 3) this view is its natural first consumer, and that is worth more as a real test than a styled table is worth now.

## 5. `tools/lint-registry.mjs` — additions

Current checks: every `children`/`parents` reference resolves to a real `id`; every `level` is one of the five.

**New failures — exit 1:**

1. Two entries with the same `id`.
2. A file whose path does not match its `id` under the mapping in §3.3.
3. `figma.node_id` present without `figma.file_key`, or a `file_key` that is not one of the two component files in [`figma/README.md`](../../figma/README.md).

**New reports — exit 0:**

4. **Non-reciprocal relations.** A lists B in `children` while B does not list A in `parents`, or the reverse. Composition is symmetric by definition in this schema, so a one-sided relation is always a defect on one of the two sides — which side is a judgement, so report both and repair nothing automatically.

Report all findings, not the first.

### Two checks this spec asked for and should not have

Both were drafted here and are **withdrawn**. They ran once against the real data and each produced a large number of findings that were not defects, which is worse than producing none: a report that is mostly noise stops being read, and takes the real findings down with it.

- **A child at or above its parent's level.** This assumes `level` is a containment hierarchy. It is not — it is a band of size, which is how [`sizing.md`](../foundations/sizing.md) uses it. Under that meaning a 24px Avatar inside a 40px Input Text is unremarkable, and the check reported 109 such relations, 33 of them Avatar alone.
- **Orphans — entries with neither parents nor children.** This assumes every component is composed of something or contained in something. Nothing says that. The three entries it flagged — Date Picker, Dropdown, Popover — are overlays, which are opened by a component rather than nested inside one. The schema has one relation, composition, and it does not reach that; their emptiness is accurate, not missing.

## 6. Acceptance criteria

1. `npm run registry:view` exits 0 and writes `build/registry.html`.
2. Opened over `file://`, the file works with no network: filtering, search, sort, selection, and relation links.
3. Every one of the 96 entries appears exactly once.
4. Clicking a name in `parents` or `children` selects that component.
5. With a `figma:` block added to one entry by hand, that row shows `linked` and the detail panel offers a link that opens the right node in Figma.
6. With a Markdown document created at the §3.3 path for one entry, that row shows `documented` after a rebuild. No source change is needed to make it appear.
7. `npm run validate:registry` reports the non-reciprocal relations found in the current data, and exits 0 while only reports are outstanding.
8. Introducing a duplicate `id` makes it exit 1.
9. `npm test` passes; the new tools have tests in the existing style.
10. Nothing in `tools/` acquires a dependency or opens a socket.

## 7. Notes for the implementer

- The registry is the seed of the **component contract**, not merely an inventory. Both Figma and the future Svelte package are implementations of it and are checked against it; where an implementation genuinely cannot comply, the divergence is declared in the contract with a reason, and an undeclared divergence is a defect. That model is stated in [`docs/components/README.md`](../components/README.md); nothing in this spec implements it, but do not build anything that assumes the current fields are the final ones.
- Read §5 findings as data about a lossy CSV import, not as bugs in the checker. The first run is expected to be noisy.
- The 96 entries are small. Do not build incremental rebuilds, caching, or a watcher.

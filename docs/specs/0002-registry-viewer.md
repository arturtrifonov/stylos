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
  node_id: "1234:5678"
  type: "component_set"        # component | component_set
  last_verified: "2026-08-24"
```

Every key optional; an absent block means "not linked yet", which is the state of all 96 entries today. Entries are filled in as each component is opened in Figma for other reasons — there is no bulk sync step, and this spec does not add one.

**`file_key` belongs to the entry, not to the repository.** Components live in two files, `Stylos / Components` and `Stylos / GUI components` ([`figma/README.md`](../../figma/README.md)).

**Store `node_id` in the API's colon form** (`1234:5678`). Figma's URLs use a dash (`node-id=1234-5678`); the view converts when it builds the link, so the record keeps one canonical form:

```
https://www.figma.com/design/{file_key}/?node-id={node_id with ":" → "-"}
```

Do not store the URL. It is derivable, and a stored URL rots in a way the parts do not.

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
3. `figma.type` present and not one of `component`, `component_set`.
4. `figma.node_id` present without `figma.file_key`, or a `file_key` that is not one of the two component files in [`figma/README.md`](../../figma/README.md).

**New reports — exit 0:**

5. **Non-reciprocal relations.** A lists B in `children` while B does not list A in `parents`, or the reverse. Expect real findings: the data came from a CSV export of relational fields, which the registry README already records as lossy. Report both directions of every mismatch; do not repair automatically, because which side is wrong is a judgement.
6. **A child at or above its parent's level**, in the order primitive → element → object → widget → layout. Information, not a fault: a legitimate case may exist, and this repository names exceptions rather than forbidding them ([charter](../charter.md), "Explicit exceptions over hidden inconsistency").
7. **Orphans** — entries with neither parents nor children. Usually a gap in the import rather than a real island.

Report all findings, not the first.

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

# docs/components/registry/

Structured, relational metadata for every component: architectural level, behavioral role, composition (parents/children), and sizing behavior. This directory — not Airtable — is the source of truth for this data going forward. The five-level taxonomy — primitive, element, object, widget, layout — comes from the original component registry and is confirmed; see [sizing.md](../../foundations/sizing.md) for what it means for size grids.

## Why this exists separately from `docs/components/<name>.md`

The full [component documentation standard](../STANDARD.md) (20 points: purpose, anatomy, public API, accessibility, examples…) is prose written by hand — it doesn't belong in structured data. This registry holds the narrower slice that's genuinely relational and worth querying/generating from: what level a component is, what it's built from, what it's used inside, and how it behaves when resized. A future documentation generator reads this registry to build composition diagrams and level groupings automatically; it should never need to parse the prose docs to do that.

Don't duplicate registry fields into a component's Markdown doc as prose that can drift — link to the registry entry instead.

## Schema

One YAML file per component, path mirroring Figma's `/` hierarchy naming (e.g. `Table / TD Text` → `table/td-text.yaml`). The component's [document](../README.md) mirrors the same path — `docs/components/table/td-text.md` — and that is what makes "is it documented" derivable rather than something to record by hand.

```yaml
id: "Table / TD Text"        # canonical identifier — must exactly match the component's Figma name
name: "Table / TD Text"      # display name, currently always equal to id
level: "object"              # primitive | element | object | widget | layout
role: "output"               # content | trigger | input | toolbar | output | container
flow_behavior:                # resizing behavior(s) — see docs/foundations/sizing.md
  - "fill"                    # hug | fixed | fill | absolute
children:                     # components this one is composed from
  - "Badge"
parents:                      # components/component sets this one is used inside
  - "Table"
notes: ""                     # freeform, carried over from the Airtable source
figma:                        # optional — where this component is in Figma; absent means not linked yet
  file_key: "WUc07ZBtjRvypXtsOlbVut"
  node_id: "4479-13507"
  last_verified: "2026-08-24"
import:
  batch: 1                    # Airtable's original build/priority sequencing — meaning not yet fully specified, carried over as-is
  ready: true                 # Airtable's "Ready" checkbox at import time — a snapshot, not a live status
```

`children` and `parents` are plain name strings, not file paths — they're validated by reference, not by filesystem lookup, so renaming a file doesn't break a link (only renaming a component's `id` does).

**A list with nothing in it omits its key.** These files are read by the restricted YAML subset in [`tools/lib/yaml.mjs`](../../../tools/lib/yaml.mjs), which has no flow-collection syntax, so `children: []` is written as no `children` line at all. Absent and empty mean the same thing to every reader.

### `figma:`

Every key is optional and the whole block may be absent, which is the state of most entries. Entries are filled in as each component is opened in Figma for other reasons — there is no bulk sync step, and there is not going to be one: the REST API does not reach unpublished components reliably, and the identifier is in the address bar at exactly the moment it is needed.

- **`file_key` belongs to the entry, not to the repository.** Components live in two files, `Stylos / Components` and `Stylos / GUI components` ([`figma/README.md`](../../../figma/README.md)); a key belonging to any other file is a failure.
- **`node_id` is stored exactly as the URL gives it** — the dash form, `4479-13507`. Both parts are then a straight copy out of the address bar and the link is a concatenation; nothing converts anything, so there is no conversion to get wrong. The URL itself is never stored — it is derivable, and a stored URL rots in a way the parts do not.
- **There is no `type` field.** Nothing in the view or the checks reads a node's kind, and Figma reports it itself when anything ever asks. A field that is derivable from the thing it describes, and that nothing consumes, is a claim waiting to go stale.

### There is no status field, deliberately

Two flags are computed at build time and neither is authored:

| Flag | True when |
| --- | --- |
| `documented` | the component's Markdown document exists at the mirrored path |
| `linked` | `figma.node_id` is present |

Lifecycle — version, deprecation, replacement — is point 20 of [`STANDARD.md`](../STANDARD.md) and belongs in the component's document. Recording it here as well would create two places to update, and one of them would be wrong. `import.batch` and `import.ready` stay in the files as history; the view shows them under a dated heading naming their origin, so they cannot be read as current. `batch` also appears as a column, since build sequencing is a question worth asking of the set — labelled with its origin and date there too.

## Reading it

```bash
npm run registry:view
```

Writes `build/registry.html`: one self-contained file — filter by level, role and Airtable batch with counts visible before filtering, search, sort by any column, and follow `parents`/`children` as links instead of opening files one at a time. Rows are grouped by level by default; the grouping toggles off, and it is a display mode rather than a filter, so `Clear` leaves it alone. Open it from disk; it reaches nothing over the network. The output is derived and gitignored, so rebuild it rather than looking for it in a checkout.

`batch` is filterable and sortable because it says which components were meant to come first, but it is still the Airtable record of 2026-08-20 and is labelled as such wherever it appears. `ready`, the other import field, is deliberately not in the table: it is a checkbox from that same day and would read as current status.

## Workflow

- **Editing:** open the YAML file directly in a text editor. It's git-tracked like anything else in this repo — commit messages and diffs are the audit trail Airtable's CSV export couldn't give us.
- **Adding a component:** create a new YAML file following the schema above, at the path its `id` implies. It doesn't need to come through Airtable first.
- **Validating:** `npm run validate:registry`, before committing a registry change. It separates two kinds of finding:
  - **FAIL** (exit 1) — the registry contradicts itself: a reference that resolves to nothing, two files claiming one `id`, a file whose path does not follow from its `id`, a `level` outside the five, a `figma` block that could not address a real node.
  - **REPORT** (exit 0) — something only a human can settle: a relation recorded on one side but not the other, a child at or above its parent's level, an entry with neither parents nor children. Nothing is repaired automatically, because which side of a mismatch is wrong is a judgement.
- **Re-importing from Airtable:** no. [`tools/import-component-registry.mjs`](../../../tools/import-component-registry.mjs) is retired — it ran once, on 2026-08-20, and is kept as the record of how these files came to exist. It deletes and rewrites every file rather than merging, so it now refuses to run without an explicit `--overwrite-hand-edits`, and it has no npm script.

## `import-source/`

The raw Airtable CSV export used for the one-time bootstrap import (2026-08-20), kept as an immutable historical snapshot. Not re-synced; if a future re-export ever happens, add it as a new dated file rather than overwriting this one.

## Airtable's role going forward

Per the project owner: Airtable's CSV export was already lossy for this data (relational fields don't round-trip cleanly), and the goal is to stop treating Airtable as a source of truth at all. This registry is that move — Airtable was one implementation of the component list, the same way a Figma library is one implementation of the components themselves; this repository is the source.

The lossiness was expected to show up in the relations, and it did not. The first run of the extended validator finds **962 child edges and 962 parent edges, every one of them reciprocal** — the export lost nothing here. What it does report is 109 cases of a component composed from something at or above its own level, and 3 entries with no relations at all; both are judgements about the model rather than import damage.

Hand-editing the YAML is the editing surface. Whether something friendlier is built later is open; it will read and write these files, not replace them.

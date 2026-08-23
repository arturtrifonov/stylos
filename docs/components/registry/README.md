# docs/components/registry/

Structured, relational metadata for every component: architectural level, behavioral role, composition (parents/children), and sizing behavior. This directory — not Airtable — is the source of truth for this data going forward. The five-level taxonomy — primitive, element, object, widget, layout — comes from the original component registry and is confirmed; see [sizing.md](../../foundations/sizing.md) for what it means for size grids.

## Why this exists separately from `docs/components/<name>.md`

The full [component documentation standard](../STANDARD.md) (20 points: purpose, anatomy, public API, accessibility, examples…) is prose written by hand — it doesn't belong in structured data. This registry holds the narrower slice that's genuinely relational and worth querying/generating from: what level a component is, what it's built from, what it's used inside, and how it behaves when resized. A future documentation generator reads this registry to build composition diagrams and level groupings automatically; it should never need to parse the prose docs to do that.

Don't duplicate registry fields into a component's Markdown doc as prose that can drift — link to the registry entry instead.

## Schema

One YAML file per component, path mirroring Figma's `/` hierarchy naming (e.g. `Table / TD Text` → `table/td-text.yaml`).

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
import:
  batch: 1                    # Airtable's original build/priority sequencing — meaning not yet fully specified, carried over as-is
  ready: true                 # Airtable's "Ready" checkbox at import time — a snapshot, not a live status
```

`children` and `parents` are plain name strings, not file paths — they're validated by reference, not by filesystem lookup, so renaming a file doesn't break a link (only renaming a component's `id` does).

## Workflow

- **Editing:** open the YAML file directly in a text editor. It's git-tracked like anything else in this repo — commit messages and diffs are the audit trail Airtable's CSV export couldn't give us.
- **Adding a component:** create a new YAML file following the schema above. It doesn't need to come through Airtable first.
- **Validating:** `npm run validate:registry` checks every `children`/`parents` reference resolves to a real component `id`, and every `level` is one of the five confirmed values. Run it before committing a registry change.
- **Re-importing from Airtable:** only relevant if Airtable is still being used as an editing surface in parallel (not recommended — see below). `npm run import:registry` re-generates every file from `import-source/<date>-airtable-export.csv`, **overwriting** hand edits to structural fields. If you've started hand-editing YAML directly, treat the CSV importer as retired.

## `import-source/`

The raw Airtable CSV export used for the one-time bootstrap import (2026-08-20), kept as an immutable historical snapshot — same discipline as [Figma variable exports](../../../figma/variables/exports/README.md). Not re-synced automatically; if a future re-export happens, add it as a new dated file rather than overwriting this one.

## Airtable's role going forward

Per the project owner: Airtable's CSV export was already lossy for this data (relational fields don't round-trip cleanly), and the goal is to stop treating Airtable as a source of truth at all. This registry is that move — Airtable was one implementation of the component list, the same way a Figma library is one implementation of the components themselves; this repository is the source. Whether Airtable stays in use as a *front-end for editing* (vs. hand-editing YAML) is open — see the frontend/tooling decisions still in progress.

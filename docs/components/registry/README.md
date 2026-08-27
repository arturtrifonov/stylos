# docs/components/registry/

**One YAML file per component, carrying that component's whole contract.** Structured metadata — level, role, composition — and everything that used to be prose in a Markdown document: purpose, boundaries, per-property meaning, accessibility findings, limitations.

This directory, not Airtable and not a set of hand-written `.md` files, is the source of truth. The five-level taxonomy — primitive, element, object, widget, layout — comes from the original component registry and is confirmed; see [sizing.md](../../foundations/sizing.md) for what it means for size grids.

The readable page for a component is **generated** from its entry. Nothing here is written twice.

## Files and paths

One file per component, path mirroring Figma's `/` hierarchy naming: `Table / TD Text` → `table/td-text.yaml`. A component's `id` must match its Figma name exactly.

Files are read and written by the restricted YAML subset in [`tools/lib/yaml.mjs`](../../../tools/lib/yaml.mjs). Two consequences that shape the schema:

- **A list with nothing in it omits its key.** There is no flow-collection syntax, so `children: []` is written as no `children` line at all. Absent and empty mean the same thing to every reader.
- **There are no multi-line scalars, and only `\"` and `\\` are escaped.** Every prose field is one long line. This is why nothing here can hold a multi-paragraph text — see *The Figma description* below. If the subset stops being enough, that is the signal to take a dependency deliberately, not to stretch the parser.

## Schema

### Identity

| Field | |
| --- | --- |
| `id` | canonical identifier — must match the component's Figma name exactly |
| `name` | display name, currently always equal to `id` |
| `family` | flat grouping label, e.g. `"Checkbox"`. Not a component and not a slash group — see *Families* |
| `level` | `primitive` \| `element` \| `object` \| `widget` \| `layout` |
| `role` | `content` \| `trigger` \| `input` \| `toolbar` \| `output` \| `container` |
| `status` | `draft` \| `published` \| `deprecated` |
| `version` | the component's own version |

### Narrative

| Field | |
| --- | --- |
| `summary` | one sentence: what it is, by role. The page title's subtitle |
| `purpose` | the product or user need, one paragraph on one line |
| `use_when` | sequence of strings, each a condition under which this is the right component |
| `do_not_use_when` | sequence of `{ text, instead }`. `instead` names the component that is right instead, or is `null` where none is |

**`instead` is an anchor, not a phrase.** The named component must exist in the registry; the validator fails otherwise. A renamed alternative breaks loudly rather than leaving a sentence pointing at nothing.

### The Figma description is derived, never authored

The three lines that go into a component's Figma `descriptionMarkdown` are composed at build time:

1. `summary`
2. the first `use_when`
3. the first `do_not_use_when`, with its `instead`

There is no field holding the description, and there must not be one: it has paragraph breaks, which this YAML subset cannot express, and a second copy of text that already exists in three fields is a second copy that drifts.

Writing it into Figma always goes through **`descriptionMarkdown`**, never `description` — writing the latter silently empties the former. See [`figma/mcp-and-connectors.md`](../../../figma/mcp-and-connectors.md).

### Relations

| Field | Meaning | Authored? |
| --- | --- | --- |
| `children` / `parents` | what is **semantically allowed** inside, and where this is allowed | yes — a judgement, not checkable against Figma |
| `uses` / `used_by` | what is **actually implemented** | no — read from Figma (`instance → mainComponent → parent`) |

These are two different questions and both are worth answering. The Airtable-derived `children` were always the allowed set, which is why `Badge` and `Loader` appear on the old Checkbox entry and are nowhere in the file. Names are validated by reference, not by filesystem lookup, so renaming a file does not break a link — only renaming an `id` does.

`uses` and `used_by` are never hand-authored. They are filled by reading Figma, on the same policy as the `figma:` block: per component, when it is open for other reasons.

#### Families

`family` is a label, not a node. Three components carry `family: "Checkbox"`; no `Checkbox` component exists in Figma or here, and inventing one would create an entity with no properties, variants or instances. No slash group either — `Checkbox / Input` violates [naming.md](../../foundations/naming.md) §2, because `Input` cannot stand alone as an instance name.

**"Variant of" and "sub-component" are not recorded, because they are derived.** A family member that appears in other members' `used_by` is the family's base — `Checkbox Input`. One that does not is a sibling form — `Checkbox Label`, `Checkbox Text`. The relations are not mutually exclusive and no field should pretend they are.

### `api`

A **sequence**, because property order is part of the public API ([naming.md](../../foundations/naming.md) §8, §10). Each entry:

```yaml
api:
  -
    name: "size"
    kind: "variant"          # variant | text | boolean | instance
    default: "extra small"
    description: "What the property means and what it governs."
    a11y:                     # optional, property-level finding
      status: "open"
      note: "…"
    values:                   # variant properties; omitted for text and instance
      -
        value: "extra small"
        note: "…"             # optional — what this value means
        rationale: "…"        # required when the value carries an a11y finding
        a11y:
          status: "warning"
          criterion: "WCAG 2.2 SC 2.5.8"
          note: "…"
    examples:                 # optional, selective — not one per value
      -
        verdict: "do"         # do | dont
        caption: "…"          # optional for do, expected for dont
        props:
          "label text": "Send me release notes"
    controls:                 # booleans only — the properties this one governs
      - "leading icon"
```

**`controls` is what a "controlled group" is.** [naming.md](../../foundations/naming.md) §9 requires that when a boolean governs an element's presence, that element's properties follow it immediately. Recording which properties it governs makes the adjacency checkable instead of conventional.

**Examples are addresses, not assets.** An example is a property assignment against `figma.node_id`; the generator renders it. Nothing image-like is stored, and an example cannot go stale against the component.

`variants`, at top level rather than inside `api` — a sequence cannot hold stray keys:

```yaml
variants:
  count: 60
  complete_cross_product: true
```

The validator multiplies the variant properties' value counts and checks the product.

### `a11y`

At component level a **sequence** of findings; on a property or a value a **single** finding. Four statuses, and no more:

| Status | Means |
| --- | --- |
| `warning` | fails a criterion but is conformant through a stated exception |
| `fail` | fails, and no exception applies |
| `open` | the system has not decided; the gap is real and named |
| `requires` | an obligation the consumer must meet for the component to be accessible at all |

**An absent block means no finding was recorded, not that the component was checked.**

**A value carrying a finding must carry a `rationale`.** If the system ships something that fails a criterion, the file has to say why it exists — usually density. A file that records the problem and stays silent on the reason reads as an oversight rather than a decision.

Accessibility does not get a section. A finding attaches to the thing it is about: `size = extra small` is 16 tall, so the finding is on that value; focus is unmodelled, so the finding is on `state`; a component with no name of its own places a `requires` on itself.

**Implementation is not recorded here.** Which HTML element it maps to, which ARIA attribute carries which value — those belong to `@stylos/ui`, not to the contract.

### `sizing_model`

Absorbs sizing, typography and responsive behaviour, because they are one model:

```yaml
sizing_model:
  horizontal: "hug"        # hug | fixed | fill | absolute
  vertical: "hug"
  adjustable: false
  intent: "…"
  sizes:
    -
      size: "extra small"
      box: "size/s-2_000"
      gap: "gap/g-0_500"
      font_size: "size/0_750"
      line_height: "line height/string/0_750"
```

**Every dimension and every type measure is a token name. Never a number.** `box: 16` would be a transcription of a value that lives in `tokens/`, and it rots the first time the scale moves. The generated page resolves these names against `tokens/` at build time and shows the value with the name beside it — a build-time join, not a second copy.

The field name says which collection to resolve against: `box` and `gap` are dimensions, `font_size` and `line_height` are font measures. Both collections have a `size/` group, so the names alone would be ambiguous.

**Do not record a height.** It is either equal to `box` or derived from the box and the line box. `intent` says which.

**`intent` is not decoration.** It is where the fact that a run is authored — rather than a by-product of hugging something else — survives into the generated page. Without it the page says "hug" and the deliberateness is gone.

Typography has no separate block. Size, gap, font size and line height change together, and a reader comparing them across sizes needs them on one row.

`flow_behavior` predates this block and remains on the 96 legacy entries as a coarse whole-component value. Where `sizing_model` is present it is authoritative, being per-axis. Folding the two is open.

### `limitations`, `figma`, `notes`

`limitations` — a free sequence of strings: unsupported states, absent properties, technical constraints.

`figma` — every key optional, the whole block may be absent, which is the state of most entries.

- **`file_key` belongs to the entry, not to the repository.** Components live in two files ([`figma/README.md`](../../../figma/README.md)); a key belonging to any other file is a failure.
- **`node_id` is stored exactly as the URL gives it** — the dash form, `4479-13507`. Both parts are then a straight copy out of the address bar and the link is a concatenation. The URL itself is never stored: it is derivable, and a stored URL rots in a way the parts do not.
- **There is no `type` field.** Nothing reads a node's kind, and Figma reports it itself when anything asks.

`notes` — freeform, one line. Where a decision is deliberately pending, this is where that is said.

## Computed, never authored

Two flags are derived at build time:

| Flag | True when |
| --- | --- |
| `documented` | `summary`, `purpose`, at least one `use_when` and a `description` on every property are present |
| `linked` | `figma.node_id` is present |

Lifecycle is `status` and `version` on the entry itself. `import.batch` and `import.ready` stay on the legacy files as history; the view shows them under a dated heading naming their origin, so they cannot be read as current.

## Reading it

```bash
npm run registry:view
```

Writes `build/registry.html` — the index over all entries: filter by level, role and Airtable batch, search, sort, follow relations as links. Open it from disk; it reaches nothing over the network. The output is derived and gitignored, so rebuild it rather than looking for it in a checkout.

The per-component page is generated by the same tooling — see [`docs/specs/0003-component-page.md`](../../specs/0003-component-page.md).

## Workflow

- **Editing:** open the YAML file directly. It is git-tracked; commit messages and diffs are the audit trail Airtable's CSV export could not give us.
- **Adding a component:** create a file following the schema above, at the path its `id` implies.
- **Validating:** `npm run validate:registry`, before committing. It separates two kinds of finding:
  - **FAIL** (exit 1) — the registry contradicts itself: a reference resolving to nothing, two files claiming one `id`, a path not following from its `id`, a `level` outside the five, a `figma` block that could not address a real node, a status or kind outside its vocabulary, a default not among its property's values, a `variants.count` that does not match the product, a value with a finding and no `rationale`.
  - **REPORT** (exit 0) — something only a human can settle: a relation recorded on one side but not the other, a child at or above its parent's level, an entry with neither parents nor children, a contract missing narrative fields.
  
  Nothing is repaired automatically, because which side of a mismatch is wrong is a judgement.
- **Re-importing from Airtable:** no. [`tools/import-component-registry.mjs`](../../../tools/import-component-registry.mjs) is retired — it ran once, on 2026-08-20, and is kept as the record of how these files came to exist.

## `import-source/`

The raw Airtable CSV export used for the one-time bootstrap import (2026-08-20), kept as an immutable historical snapshot. Not re-synced.

## Airtable's role going forward

None. Its CSV export was already lossy for this data and the goal was to stop treating it as a source of truth. This registry is that move — Airtable was one implementation of the component list, the same way a Figma library is one implementation of the components themselves; this repository is the source.

The lossiness was expected to show up in the relations and did not: the first run of the extended validator found **962 child edges and 962 parent edges, every one of them reciprocal**. What it does report is 109 cases of a component composed from something at or above its own level, and 3 entries with no relations at all; both are judgements about the model rather than import damage.

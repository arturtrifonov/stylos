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
| `html` | the semantic structure it stands for, or `"no semantic html"` — see below |
| `status` | `draft` \| `published` \| `deprecated` — see below |
| `version` | the component's own version |

#### `status` describes the component, not its entry

The two are independent: a component can be finished in Figma with a thin entry, or fully documented and not yet built. Contract completeness is already derived — `documented` and `linked` are computed at build time — so this field is free to mean one thing.

| Value | Means |
| --- | --- |
| `draft` | does not yet pass *Ready to publish* in [STANDARD.md](../STANDARD.md) |
| `published` | passes both gates there and is in the published Figma library |
| `deprecated` | superseded. Name the replacement — the same obligation `do_not_use_when.instead` carries |

It stays authored rather than computed because readiness turns on judgements a tool cannot make: whether existing instances have an understood migration path, whether the supported states are the right ones.

**Every entry currently says `draft`**, and most were set that way by default rather than assessed. With the values defined they can be.

### `html`

The semantic structure the component stands for, written as a one-line sketch:

```yaml
html: "<label><input type=\"radio\"> Label text</label>"
```

**It is not a template and not an implementation.** No classes, no wrappers, no attributes the element already implies, no ARIA the element already supplies. It is fake code — enough markup to say which standards apply and how the parts nest, and nothing that goes stale when `@stylos/ui` adds the wrappers and styling hooks a real component needs.

**What it buys is deletions.** Naming the element imports its guarantees instead of restating them. `<input type="radio">` sharing a `name` already gives group membership, arrow-key movement, a single tab stop, form participation and name/role/value; an entry that names the element does not need an `a11y` paragraph repeating any of it. Where nesting carries meaning it is written out: a `<label>` wrapping its input is *why* the whole component is the click target and why the association needs no `for`.

**Semantics, not a promise of markup.** The field says what the component is, not what an implementation must emit. A custom element meeting the same standards satisfies it.

**Every entry is expected to carry it, and `"no semantic html"` is a value.** Some components — Loader, Badge — have no element that means anything, and saying so records that the question was asked. An absent `html` means nobody has looked yet, the same distinction the `a11y` block draws between silence and a finding.

### Narrative

| Field | |
| --- | --- |
| `summary` | one sentence: what it is, by role. The page title's subtitle |
| `purpose` | the product or user need, one paragraph on one line |
| `use_when` | sequence of strings, each a condition under which this is the right component |
| `do_not_use_when` | sequence of `{ text, instead }`. `instead` names the component that is right instead — one id, or a sequence of ids — or is `null` where none is |

**`instead` is an anchor, not a phrase.** The named component must exist in the registry; the validator fails otherwise, and it resolves every member of a sequence. A renamed alternative breaks loudly rather than leaving a sentence pointing at nothing.

**A sequence is for a family, not for a shortlist.** `Link` sends an action to all three Button treatments because the judgement behind the sentence is about buttons, and picking one of them arbitrarily would state something narrower than what was decided. Where one component is right, name one; a list of alternatives the reader has to choose between is the sentence failing to reach a conclusion.

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
| `uses` | what is **actually implemented** inside | no — read from Figma (`instance → mainComponent`) |

These are two different questions and both are worth answering. The Airtable-derived `children` were always the allowed set, which is why `Badge` and `Loader` appear on the old Checkbox entry and are nowhere in the file. Names are validated by reference, not by filesystem lookup, so renaming a file does not break a link — only renaming an `id` does.

`uses` is never hand-authored. It is filled by reading Figma, on the same policy as the `figma:` block: per component, when it is open for other reasons.

**There is no `used_by` field.** It is the same edge as `uses`, written a second time in the file least likely to be open when the instance is placed — and on 2026-08-26, across all 96 entries the registry then held, it was never once filled. The reverse index is computed at build time from every entry's `uses`; see *Computed, never authored*. Deriving it makes a one-sided implemented relation impossible rather than something for the validator to report.

#### Families

`family` is a label, not a node. Three components carry `family: "Checkbox"`; no `Checkbox` component exists in Figma or here, and inventing one would create an entity with no properties, variants or instances. No slash group either — `Checkbox / Input` violates [naming.md](../../foundations/naming.md) §2, because `Input` cannot stand alone as an instance name.

**"Variant of" and "sub-component" are not recorded, because they are derived.** A family member that other members name in their `uses` is the family's base — `Checkbox Input`. One that no sibling uses is a sibling form — `Checkbox Label`, `Checkbox Text`. The relations are not mutually exclusive and no field should pretend they are.

#### When a component is split

**Decomposition is expected, not exceptional.** A component that has grown complicated gets divided into two or more, and an existing entry becoming several is a normal event in the life of this registry rather than a correction of a mistake. It has happened three times so far — Checkbox, Radio, Indicator — and two of the three left damage the validator only found weeks later. These steps are fixed so that the next one does not.

1. **Each member is its own entry**, at the path its `id` implies, with `family` set to the shared label. No entry is created for the family itself, and no slash group is introduced — see *Families* above.
2. **Every member inherits the old entry's `children` and `parents` in full.** The allowed axis states what the system permits; until someone judges otherwise it permits, for each member, what it permitted for the whole. Narrowing it is a later per-member judgement recorded with its reason, not a blank the split leaves behind.
3. **`uses` is not inherited.** It records an implemented instance, and an instance points at exactly one member. Read it again from Figma; never distribute it across the members.
4. **Every reference to the old `id` becomes the ids of all the members** — in `children`, `parents` and `do_not_use_when.instead`. Sweep the whole registry, because those references live in files nobody has open at the time.
5. **`import.batch` and `import.ready` carry over unchanged.** They record where the old entry came from, and the members came from the same place.
6. **`status` and `version` are not inherited.** A member is a different component from the one that was split, and its readiness is assessed rather than carried.
7. **The old file is deleted last**, after step 4 and never before. Deleting it first turns every reference into a failure — which is what happened to `Radio`: fifteen entries left pointing at an id that no longer resolved.

`npm run validate:registry` exits 0 before the split is finished. A split that leaves it failing is not done.

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

**There is no `variants` block.** It held `count` and `complete_cross_product`, and both were artifacts of the Figma file rather than decisions. `count` is the product of the variant properties' value counts, which are already in `api` — a hand-copied derived number, checked by a validator that was therefore testing the transcription rather than the system. `complete_cross_product` was `true` in all fourteen entries that ever carried it.

A missing combination is still worth recording, but as what it is: a rule. If `tone = danger` has no `extra small`, say so in `limitations` or on the value, because that is API surface a consumer needs. Whether the Figma set is internally complete is library hygiene and belongs to `component-integrity-check`, which can read the file and compute the product itself.

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

**The four axis values are defined in [sizing.md](../../foundations/sizing.md), and `adjustable` is orthogonal to them.** `horizontal` and `vertical` say how the dimension is arrived at; `adjustable` says who names it. A component that is `fixed` and `adjustable` ships a value that a layout may replace with another value — that is not `fill`, which surrenders the dimension to the container.

**Every dimension and every type measure is a token name. Never a number.** `box: 16` would be a transcription of a value that lives in `tokens/`, and it rots the first time the scale moves. The generated page resolves these names against `tokens/` at build time and shows the value with the name beside it — a build-time join, not a second copy.

The field name says which collection to resolve against: `box` and `gap` are dimensions, `font_size` and `line_height` are font measures. Both collections have a `size/` group, so the names alone would be ambiguous.

**Do not record a height.** It is either equal to `box` or derived from the box and the line box. `intent` says which.

**`intent` is not decoration.** It is where the fact that a run is authored — rather than a by-product of hugging something else — survives into the generated page. Without it the page says "hug" and the deliberateness is gone.

Typography has no separate block. Size, gap, font size and line height change together, and a reader comparing them across sizes needs them on one row.

`flow_behavior` predates this block and remains on the entries with no contract as a coarse whole-component value. Where `sizing_model` is present it is authoritative, being per-axis. Folding the two is open.

### `motion`

Present only on a component whose animation is part of what it is, rather than a transition applied to it. Loader is the case: it has one property, that property exists only to be stepped through, and a static Loader is not a Loader.

```yaml
motion:
  drives: "angle"        # the property the animation steps through, if any
  loop: true
  intent: "…"
```

**Durations, easing curves and per-step timings do not belong here.** Those are how one implementation runs the idea — a Figma prototype today, CSS tomorrow — and the numbers currently in the file are not a decision anyone made. Recording them turns whatever the prototype happens to be doing into a specification, and the first thing that specification would enshrine is a mistake.

What the block *does* record is the part the contract owns: that the component is animated at all, that it loops, which property carries it, and why a stopped instance is wrong. Everything the accessibility fields need — that motion starts on its own and must yield to a reduced-motion preference — hangs off that and nothing more.

### `figma_notes`

A sequence of strings recording **how the Figma library happens to implement this component**, where that implementation would otherwise be read as a requirement. It exists because those facts kept leaking into `limitations` and property descriptions, which are claims about the component, and once there they get treated as things to reproduce.

Nothing in this block constrains an implementation. `@stylos/ui` satisfies the contract by whatever means it likes; a note saying Figma repeats a property on a parent because it cannot drive a nested one is a fact about Figma's model, not an instruction to repeat it in code.

Keep it to what a reader would otherwise misread. Layer names, auto-layout settings, stroke positions and token bindings are still not recorded here — Figma answers those on demand, and *Working rules* in [STANDARD.md](../STANDARD.md) still holds.

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

`used_by` is derived the same way and is a list rather than a flag: for each entry, every other entry whose `uses` names it. It is only as complete as the set of entries that have `uses` filled, and that is the intended trade — an index that follows the files beats a stored one that goes stale the next time an instance is placed.

Lifecycle is `status` and `version` on the entry itself. `import.batch` and `import.ready` stay on the legacy files as history; the view shows them under a dated heading naming their origin, so they cannot be read as current.

## Reading it

```bash
npm run registry:view
```

Writes `build/registry.html` — the index over all entries: filter by level, role, readiness and wave, sort, follow relations as links. **Wave** is [`PLAN.md`](../../../PLAN.md) Stage 4 — read from the plan on every build, never stored on an entry — so filtering to a wave is how you see what it is made of. It is what `import.batch` used to be here: that is Airtable's sequencing from the day of the import, history rather than the queue, so it is no longer a facet, a sort key or a column ([`0004`](../../specs/0004-registry-reconciliation.md) §3.4). Its values stay in the detail panel, under a heading naming their origin and date. Open it from disk; it reaches nothing over the network. The output is derived and gitignored, so rebuild it rather than looking for it in a checkout.

The per-component page is generated by the same tooling — see [`docs/specs/0003-component-page.md`](../../specs/0003-component-page.md).

## Workflow

- **Editing:** open the YAML file directly. It is git-tracked; commit messages and diffs are the audit trail Airtable's CSV export could not give us.
- **Adding a component:** create a file following the schema above, at the path its `id` implies.
- **Validating:** `npm run validate:registry`, before committing. It separates two kinds of finding:
  - **FAIL** (exit 1) — the registry contradicts itself: a reference resolving to nothing, two files claiming one `id`, a path not following from its `id`, a `level` outside the five, a `figma` block that could not address a real node, a status or kind outside its vocabulary, a default not among its property's values, a value with a finding and no `rationale`.
  - **REPORT** (exit 0) — something only a human can settle: a relation recorded on one side but not the other, a child at or above its parent's level, an entry with neither parents nor children, a contract missing narrative fields.
  
  Nothing is repaired automatically, because which side of a mismatch is wrong is a judgement.
- **Re-importing from Airtable:** no. [`tools/import-component-registry.mjs`](../../../tools/import-component-registry.mjs) is retired — it ran once, on 2026-08-20, and is kept as the record of how these files came to exist.

## `import-source/`

The raw Airtable CSV export used for the one-time bootstrap import (2026-08-20), kept as an immutable historical snapshot. Not re-synced.

## Airtable's role going forward

None. Its CSV export was already lossy for this data and the goal was to stop treating it as a source of truth. This registry is that move — Airtable was one implementation of the component list, the same way a Figma library is one implementation of the components themselves; this repository is the source.

The lossiness was expected to show up in the relations and did not: the first run of the extended validator found **962 child edges and 962 parent edges, every one of them reciprocal**. What it does report is 109 cases of a component composed from something at or above its own level, and 3 entries with no relations at all; both are judgements about the model rather than import damage.

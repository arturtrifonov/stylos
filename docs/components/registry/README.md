# docs/components/registry/

**One YAML file per component, carrying that component's whole contract.** Structured metadata — level, role, composition — and everything that used to be prose in a Markdown document: purpose, boundaries, per-property meaning, accessibility findings, limitations.

This directory, not Airtable and not a set of hand-written `.md` files, is the source of truth. The five-level taxonomy — primitive, element, object, widget, layout — comes from the original component registry and is confirmed; see [sizing.md](../../foundations/sizing.md) for what it means for recommended size profiles.

The readable page for a component is **generated** from its entry. Nothing here is written twice.

## Files and paths

One file per component, at the path the `id` implies: `Table Cell Text` → `table-cell-text.yaml`. A component's `id` must match its Figma name exactly.

An `id` carrying a `/` puts its file in a directory — `Foo / Bar` → `foo/bar.yaml` — because the path mirrors Figma's `/` hierarchy naming. No entry does this. The twenty-one that did were the 2026-08-20 import's shape and were renamed to compound names on 2026-09-02; see *Families* below for why a slash group is not how this registry groups anything. The machinery stays because the rule about matching Figma's name is unconditional, not because the shape is wanted.

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
| `status` | `draft` \| `ready` \| `deprecated` — see below |
| `version` | the release in which this contract's current API shipped — see below |

#### `status` describes the component, not its entry

The two are independent: a component can be finished in Figma with a thin entry, or fully documented and not yet built. Contract completeness is derived from the required data in STD-04. Prose coverage (`documented`) and a Figma address (`linked`) are separate indicators, not the completeness calculation.

| Value | Means |
| --- | --- |
| `draft` | does not yet pass *Ready to publish* in [STANDARD.md](../STANDARD.md) |
| `ready` | passes both gates there — the component can be built against |
| `deprecated` | superseded. Name the replacement — the same obligation `do_not_use_when.instead` carries |

It stays authored rather than computed because readiness turns on judgements a tool cannot make: whether existing instances have an understood migration path, whether the supported states are the right ones.

A Figma representation is mandatory for `ready`: `figma.node_id` links it, and `last_verified` records its verification. A component implemented only in code cannot pass the readiness gates. The Figma authoring checks are documented in [figma/components.md](../../../figma/components.md).

**The value is `ready`, not `published`, and the reason is not taste.** Figma publishes a *file*: everything in it goes out at once, and there is no per-component publish state to mirror. A `published` value would have been a fact maintained by hand about something the tool does not have, and it would have gone stale the first time the file was published without it being updated. Which release a component's API shipped in is answered by `version`; what moved in the library at that release is answered by `CHANGELOG.md`. `status` answers the one question neither of those does — can this be built against.

**Thirty-nine entries say `ready`** — the `0.1.0` core set, each assessed against both gates on 2026-09-05. The rest say `draft` or say nothing: the inventory rows were never set at all, and setting one is an assessment rather than a default.

#### `version` is the release the API shipped in

The full release string — `"0.1.0"`, not `"0.1"` — so that it reads against a git tag without interpretation, and sorts.

**Bumped when the entry's `api` changes**: a property, a value, a default, a state. Not for prose, not for an added finding, not for `last_verified`, and not for appearance. A component whose drawing changed but whose API did not is the same contract, and a version that moves on every edit answers no question worth asking.

**What it is for:** the difference between two library versions, answerable without opening thirty-nine files. That is the only reason to carry the field, and it is why the rule above is narrow.

A contract that has never shipped carries the release it is expected to ship in; `status` already says whether it has. The validator rejects a version ahead of the one in `package.json`.

Versioning rules for the system as a whole are [`ARCHITECTURE.md`](../../../ARCHITECTURE.md) §9.

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

A component's Figma `descriptionMarkdown` is composed from the entry by [`stylos-description-sync`](../../../skills/src/description-sync/SKILL.md), which is the only thing that writes it:

1. `summary`, as a bare opening paragraph
2. **Use when** — every entry of `use_when`, as a list
3. **Do not use when** — every entry of `do_not_use_when`, as a list, each with its `instead`

There is no field holding the description, and there must not be one: it has paragraph breaks, which this YAML subset cannot express, and a second copy of text that already exists in three fields is a second copy that drifts.

**Both lists go in full.** Figma preserves bold, lists and links in `descriptionMarkdown`, and the reader that consumes the whole string — an agent choosing a component from the library — is the one the text is for. A person scanning the Assets panel sees a line or two, which is why `summary` opens it and carries no label. Only bold labels and bullets are added; field text is transferred verbatim.

`purpose`, `limitations`, `api` and accessibility findings stay out. They belong to the generated page, where a component is studied; the description is read while a component is being chosen.

Writing it into Figma always goes through **`descriptionMarkdown`**, never `description` — writing the latter silently empties the former, which since the description carries markup means losing every list. See [`figma/mcp-and-connectors.md`](../../../figma/mcp-and-connectors.md).

### Relations

| Field | Meaning | Authored? |
| --- | --- | --- |
| `children` / `parents` | what is **semantically allowed** inside, and where this is allowed | yes — a judgement, not checkable against Figma |
| `uses` | what is **actually implemented** inside | no — read from Figma (`instance → mainComponent`) |

These are two different questions and both are worth answering. The Airtable-derived `children` were always the allowed set, which is why `Badge` and `Loader` appear on the old Checkbox entry and are nowhere in the file. Names are validated by reference, not by filesystem lookup, so renaming a file does not break a link — only renaming an `id` does.

`uses` is never hand-authored. It is filled by reading Figma, on the same policy as the `figma:` block: per component, when it is open for other reasons.

**There is no `used_by` field.** It is the same edge as `uses`, written a second time in the file least likely to be open when the instance is placed — and on 2026-08-26, across all 96 entries the registry then held, it was never once filled. The reverse index is computed at build time from every entry's `uses`; see *Computed, never authored*. Deriving it makes a one-sided implemented relation impossible rather than something for the validator to report.

#### Families

`family` is a label, not a node. Three components carry `family: "Checkbox"`; no `Checkbox` component exists in Figma or here, and inventing one would create an entity with no properties, variants or instances. No slash group either — `Checkbox / Input` violates the [Figma component-organization convention](../../../figma/naming.md#component-organization), because `Input` cannot stand alone as an instance name.

**"Variant of" and "sub-component" are not recorded, because they are derived.** A family member that other members name in their `uses` is the family's base — `Checkbox Input`. One that no sibling uses is a sibling form — `Checkbox Label`, `Checkbox Text`. The relations are not mutually exclusive and no field should pretend they are.

#### When a component is split

**Decomposition is expected, not exceptional.** A component that has grown complicated gets divided into two or more, and an existing entry becoming several is a normal event in the life of this registry rather than a correction of a mistake. It has happened six times so far — Checkbox, Indicator, Radio, Toggle, Tag and Button Icon — and the early ones left damage the validator only found weeks later. These steps are fixed so that the next one does not.

1. **Each member is its own entry**, at the path its `id` implies, with `family` set to the shared label. No entry is created for the family itself, and no slash group is introduced — see *Families* above.
2. **Every member inherits the old entry's `children` and `parents` in full.** The allowed axis states what the system permits; until someone judges otherwise it permits, for each member, what it permitted for the whole. Narrowing it is a later per-member judgement recorded with its reason, not a blank the split leaves behind.
3. **`uses` is not inherited.** It records an implemented instance, and an instance points at exactly one member. Read it again from Figma; never distribute it across the members.
4. **Every reference to the old `id` becomes the ids of all the members** — in `children`, `parents` and `do_not_use_when.instead`, and in [`PLAN.md`](../../../PLAN.md)'s component tables. Sweep the whole registry, because those references live in files nobody has open at the time. Sweep the plan for a second reason: `milestone` and `wave` are read from it on every build and are never stored on an entry, so a member the plan places nowhere has no milestone at all. That is how a finished split disappears — the entries exist, the viewer files them under nothing, and deleting the old file takes its row in the plan with it.
5. **`import.batch` and `import.ready` carry over unchanged.** They record where the old entry came from, and the members came from the same place.
6. **`status` and `version` are not inherited.** A member is a different component from the one that was split, and its readiness is assessed rather than carried.
7. **The old file is deleted last**, after step 4 and never before. Deleting it first turns every reference into a failure — which is what happened to `Radio`: fifteen entries left pointing at an id that no longer resolved.

`npm run validate:registry` exits 0 before the split is finished. A split that leaves it failing is not done.

### `api`

Property names in `api` use the canonical contract spelling. Frontend props map to them through FND-NAMING-05; Figma uses the canonical names as described in [figma/naming.md](../../../figma/naming.md#names-and-descriptions).

A **sequence**, because property order is part of the public API (FND-NAMING-18, FND-NAMING-19 and FND-NAMING-20 in [naming.md](../../foundations/naming.md)). The variant and non-variant lists give relative order within each kind of property; they do not prescribe one merged sequence. A controlled group remains adjacent in `api`. Figma's separate panel sections are an implementation projection, described in [figma/naming.md](../../../figma/naming.md), not a second source of contract order. Each entry:

```yaml
api:
  -
    name: "size"
    kind: "variant"          # variant | text | string | boolean | instance | slot | event
    default: "extra small"
    description: "What the property means and what it governs."
    a11y:                     # optional, property-level finding
      status: "open"
      note: "…"
    values:                   # a variant's vocabulary; on text/string, examples
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

**`slot` and `instance` are different things.** An `instance` property holds one instance of one type — swapping it changes which component sits in that place. A `slot` holds however many instances the consumer puts in it, of several types, sometimes drawn from a constrained set and sometimes from none. Table Row Body is the case: a row holds as many cells as the table has columns, and a name, a date, a set of tags and a row of actions are four different components in one slot. A slot has no `default` and no `values`; what a slot will accept is recorded where every other allowed composition is, in `children`.

An `instance` may specify `svelte_type: "snippet"` when its web implementation renders configured content through `{@render}`. This narrows its generated Svelte prop to `Snippet` without changing the instance name or multiplicity; place a configured component inside the snippet. Existing entries without this field retain their generated component/snippet union.

**`text` and `string` use the same storage type but carry different things.** `text` supplies textual content: a label, heading, message, placeholder or input value. Its name follows FND-NAMING-12. `string` supplies an identifier or other non-text string value: `Icon.name` selects a mark rather than displaying the name as copy. A string property is named for its role and does not acquire the `text` suffix just because its value is stored as a string. Both kinds have string defaults and string example values, and both generate TypeScript `string` props.

**`event` supplies a native callback.** It has no default or values. `onclick` receives a `MouseEvent`; keyboard activation of a native button also dispatches click. `oninput` and `onchange` receive an `Event` from a native form control. Event handlers are web integration properties and do not become Figma controls. The generator rejects an unsupported event name.

**`controls` is what a "controlled group" is.** FND-NAMING-19 requires that when a boolean governs an element's presence, that element's properties follow it immediately. Recording which properties it governs makes the adjacency checkable instead of conventional.

**A property that only draws a state in Figma is not part of the API.** Some properties exist so a mockup can show something the real component decides for itself: `has scrollbar` on Dropdown is the case — a scrollbar appears in a browser when the content overflows, and no consumer sets it. Recording it in `api` would put a property in the contract that the Svelte package can never have, and every later check comparing the two would report a divergence that is correct and useless.

Such a property is recorded in [`figma_notes`](#figma_notes) instead, saying what it draws and what decides it in the real component ([STANDARD.md](../STANDARD.md)). A different Figma representation of a public property is also recorded there: Icon chooses a mark by instance swap while the contract exposes its string identifier. These notes explain the implementation; they do not add or rename public properties.

**Examples are addresses, not assets.** An example is a property assignment against `figma.node_id`; the generator renders it. Nothing image-like is stored, and an example cannot go stale against the component.

**There is no `variants` block.** It held `count` and `complete_cross_product`, and both were artifacts of the Figma file rather than decisions. `count` is the product of the variant properties' value counts, which are already in `api` — a hand-copied derived number, checked by a validator that was therefore testing the transcription rather than the system. `complete_cross_product` was `true` in all fourteen entries that ever carried it.

A missing combination is still worth recording, but as what it is: a rule. If `tone = danger` has no `extra small`, say so in `limitations` or on the value, because that is API surface a consumer needs. Whether the Figma set is internally complete is library hygiene and belongs to `component-integrity-check`, which can read the file and compute the product itself.

### `a11y`

At component level a **sequence** of findings; on a property or a value a **single** finding. Four statuses, and no more:

| Status | Means |
| --- | --- |
| `warning` | needs a stated condition or standard-defined exception to be conformant in use |
| `fail` | violates a requirement under the assessed conditions, and no exception applies |
| `open` | the system has not decided; the gap is real and named |
| `requires` | an obligation the consumer must meet for the component to be accessible at all |

**An absent block means no finding was recorded, not that the component was checked.**

FND-ACCESSIBILITY-03 defines source citations. A finding can describe a consumer obligation without claiming that the component fails on its own. A `warning` is conditional: the note identifies what the surrounding interface supplies or which exception applies; recording the condition does not verify that a consumer fulfils it. A `fail` remains a failure even when its `rationale` explains why the system ships it. Full-interface conformance is assessed separately, as described in [Accessibility](../../foundations/accessibility.md#components-and-complete-interfaces).

**A value carrying a finding must carry a `rationale`.** If the system ships something that fails a criterion, the file has to say why it exists — usually density. A file that records the problem and stays silent on the reason reads as an oversight rather than a decision.

Accessibility does not get a section. A finding attaches to the thing it is about: `size = extra small` is 16 tall, so the finding is on that value; focus is unmodelled, so the finding is on `state`; a component with no name of its own places a `requires` on itself.

**Implementation is not recorded here.** Which HTML element it maps to, which ARIA attribute carries which value — those belong to `@stylos/ui`, not to the contract.

### `sizing_model`

Absorbs sizing, typography and responsive behaviour, because they are one model:

```yaml
sizing_model:
  horizontal: "hug"        # hug | fixed | fill
  vertical: "hug"
  adjustable:
    horizontal: false
    vertical: false
  intent: "…"
  sizes:
    -
      size: "extra small"
      box: "size/s-2_000"
      gap: "gap/g-0_500"
      font_size: "size/0_750"
      line_height: "line height/string/0_750"
```

**Sizing type and adjustment permissions are separate.** [Sizing](../../foundations/sizing.md) defines the three axis types and the per-axis `adjustable` flags. Both axes and both flags are required when a sizing model is present. The public `size` property records preset choices; the adjustment flags record permission for an external dimension. Fixed dimensions can use either mechanism, or both when their contract supports it. The axes describe defaults; `intent` describes supported overrides, constraints and how internal parts respond. A button may hug horizontally and allow an explicit width while its height remains controlled by `size`. A default token binding does not prohibit a contract-supported external override. Figma representation details are in [figma/sizing.md](../../../figma/sizing.md).

**Every dimension and every type measure is a token name. Never a number.** `box: 16` would be a transcription of a value that lives in `tokens/`, and it rots the first time the scale moves. The generated page resolves these names against `tokens/` at build time and shows the value with the name beside it — a build-time join, not a second copy.

The field name says which collection to resolve against: `box` and `gap` are dimensions, `font_size` and `line_height` are font measures. Both collections have a `size/` group, so the names alone would be ambiguous.

**Do not record a height.** It is either equal to `box` or derived from the box and the line box. `intent` says which.

**`intent` is not decoration.** It is where the fact that a run is authored — rather than a by-product of hugging something else — survives into the generated page. Without it the page says "hug" and the deliberateness is gone.

Typography has no separate block. Size, gap, font size and line height change together, and a reader comparing them across sizes needs them on one row.

`flow_behavior` predates this block and remains as historical inventory metadata. Where `sizing_model` is present, its axes are authoritative for sizing. Entries without a sizing model remain incomplete inventory; their old flow values do not supply a contract.

### `motion`

Present only on a component whose animation is part of what it is, rather than a transition applied to it. Loader is the case: its Figma prototype steps an angle, while its public API has no properties and its contract describes continuous rotation.

```yaml
motion:
  drives: "angle"        # the property the animation steps through, if any
  loop: true
  intent: "…"
```

**Amended 2026-10-06 — shared motion parameters are system decisions.** The owner approved system-defined parameters and recommended profiles by the kind and extent of a change, with the component choosing its treatment. FND-MOTION-03, FND-MOTION-14 and FND-MOTION-15 define those boundaries; this guide defines their recording format.

**The current block still has exactly three fields: `drives`, `loop`, `intent`.** Raw durations, curve definitions and per-step timings are not accepted fields. Shared values will live in the canonical parameter record rather than being copied into this block; they are not automatically implementation-owned. A Figma prototype's current timing does not establish an agreed system value.

What the block *does* record is the part the contract owns: that the component is animated at all, that it loops, which property carries it, and why a stopped instance is wrong. Everything the accessibility fields need — that motion starts on its own and must yield to a reduced-motion preference — hangs off that and nothing more.

For an intrinsic animation, the choice can be stated in `motion.intent`. For a transition-only component, the existing `notes` field can record the choice and its rationale until a structured transition representation is agreed. This does not introduce new `motion` keys or a new public property.

**Open:** agree the structured format for transition profiles, visual delays and parameter references, then update the schema, validation and generated pages together.

### `figma_notes`

A sequence of strings recording **how the Figma library happens to implement this component**, where that implementation would otherwise be read as a requirement. It exists because those facts kept leaking into `limitations` and property descriptions, which are claims about the component, and once there they get treated as things to reproduce.

Nothing in this block constrains an implementation. `@stylos/ui` satisfies the contract by whatever means it likes; a note saying Figma repeats a property on a parent because it cannot drive a nested one is a fact about Figma's model, not an instruction to repeat it in code.

Keep it to what a reader would otherwise misread. Layer names, auto-layout settings, stroke positions and token bindings are still not recorded here — Figma answers those on demand, and *Working rules* in [STANDARD.md](../STANDARD.md) still holds.

### `limitations`, `figma`, `notes`

`limitations` — a free sequence of strings: unsupported states, absent properties, technical constraints.

`figma` — the block may be absent on inventory or draft entries. STD-05 requires `file_key`, `node_id` and a valid `last_verified` date for `ready`; these are verification evidence, not contract-completeness fields.

- **`file_key` belongs to the entry, not to the repository.** Components live in two files ([`figma/README.md`](../../../figma/README.md)); a key belonging to any other file is a failure.
- **`node_id` is stored exactly as the URL gives it** — the dash form, `4479-13507`. Both parts are then a straight copy out of the address bar and the link is a concatenation. The URL itself is never stored: it is derivable, and a stored URL rots in a way the parts do not.
- **Contract prose is rendered as Markdown.** `summary`, `purpose`, `use_when`, `do_not_use_when` and `limitations` reach Storybook's docs page through `build-ui-stories.mjs`, which assembles them into one Markdown block. An identifier written bare in that prose is read as markup — `chevron_right, check_circle` loses both underscores to emphasis and italicises everything after it, which is how Icon's own property names were displayed wrong. Write such a name inside backticks, or keep it out of the prose; text and string properties' `values` are the place for examples and are not rendered as Markdown.
- **`values` mean different things on a variant and on text or string properties.** On a variant they are the vocabulary: exhaustive, checked, and projected into a TypeScript union. On `text` and `string` they are **examples** — the value space is open (Icon's string `name` is any name the active preset carries), and they exist so the generated story and the component page render a real sample instead of an empty box. Either kind with no `default` starts its sample from the first of them; that is the sample's fallback and never the component's.
- **There is no `type` field.** Nothing reads a node's kind, and Figma reports it itself when anything asks.
- **`last_verified` is the date a person compared this entry to the live component**, in `YYYY-MM-DD`. Not the date the entry was edited, not the date the component changed in Figma, and nothing derives it — a field that moved on every touch of the file would stop answering its one question, which is *how old is the last time anyone actually looked*. Only a person sets it, and only after looking.

  Set it after comparing the current representation with the contract and resolving discrepancies. It is not updated for opening the file, editing prose or syncing a description. The [Figma conventions](../../../figma/components.md#published-component-checks) define the required error-free state of published components; this date does not prove a pre-publication skill run.

  STD-05 requires verification after the latest relevant change as a review condition. The validator requires a valid calendar date for `ready` and reports verification older than 90 days. It does not know when the live component last changed and cannot verify freshness automatically.

  **It is not the same fact as `status`.** `last_verified` says when someone looked; `status: ready` says the component passed both gates of `STANDARD.md`. A component can be freshly verified and still `draft`. Order on a pass: fix Figma → correct the entry → `version` if the `api` moved → `last_verified` → `status`.

`notes` — freeform, one line. Where a decision is deliberately pending, this is where that is said.

## Computed, never authored

Two flags are derived at build time:

| Flag | True when |
| --- | --- |
| `documented` | `summary`, `purpose`, at least one `use_when` and a `description` on every property are present |
| `linked` | `figma.file_key` and `figma.node_id` are present |

The `Contract` column is computed separately from the required fields in STD-04: `complete` when those data are present, `in progress` when some contract data exist, and `not started` for inventory-only entries. The same `contractGaps` function is used by the view and the validator. Field values and references are also checked by the validator; coverage and meaning need review.

Figma evidence is independent. A complete contract without a Figma address remains `complete`, but cannot be `ready`. A link alone does not make a contract started or complete. For `ready`, the validator rejects missing required contract data or verification evidence; the live checks and readiness judgement are not automated.

`used_by` is derived the same way and is a list rather than a flag: for each entry, every other entry whose `uses` names it. It is only as complete as the set of entries that have `uses` filled, and that is the intended trade — an index that follows the files beats a stored one that goes stale the next time an instance is placed.

Lifecycle is `status` and `version` on the entry itself. `import.batch` and `import.ready` stay on the legacy files as history; the view shows them under a dated heading naming their origin, so they cannot be read as current.

## Reading it

```bash
npm run registry:view
```

Writes `build/registry.html` — the index over all entries: filter by level, role, contract, status, milestone and wave, sort, follow relations as links. **Milestone** and **Wave** are where [`PLAN.md`](../../../PLAN.md) puts the component — §9 the distribution decision its checklist belongs to, §4 the unit of work it is sequenced in. Both are read from the plan on every build and never stored on an entry, so filtering to one is how you see what it is made of, and an entry the plan places nowhere is reported by the validator. Every entry has a milestone; a blank wave means unsequenced, because waves are cut only for the milestone being worked. It is what `import.batch` used to be here: that is Airtable's sequencing from the day of the import, history rather than the queue, so it is no longer a facet, a sort key or a column (`0004` §3.4). Its values stay in the detail panel, under a heading naming their origin and date. Open it from disk; it reaches nothing over the network. The output is derived and gitignored, so rebuild it rather than looking for it in a checkout.

The per-component page is generated by the same tooling — `tools/build-component-page.mjs`, described in [`tools/README.md`](../../../tools/README.md) and specified by SPEC 0003.

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

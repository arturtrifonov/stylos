# SPEC 0003 — Component page

**Status:** Not started
**Date:** 2026-08-26

A work order. The component contract became data ([`STANDARD.md`](../components/STANDARD.md), [`registry/README.md`](../components/registry/README.md)); this builds the page that makes it readable, extends the validator to enforce the new schema, and sweeps the repository for what the change left stale.

---

## 1. Why

Three contracts exist — the Checkbox family — and every field in them was written to be rendered. Nothing renders them. Until it does, the model is a claim rather than a working surface, and the remaining twenty components of the v0.1 set will be written blind.

Spec [0002](0002-registry-viewer.md) built the index over the whole set. This builds the page for one component.

## 2. Scope

### In scope

- `tools/build-component-page.mjs` → one self-contained HTML file per contract, plus an index.
- New checks in `tools/lint-registry.mjs` for the contract schema.
- A repository consistency sweep (§6) covering what the model change left behind.

### Out of scope

- **Component previews.** Every place a rendered sample belongs gets a placeholder slot of the right size and position. Rendering them means exporting from Figma, and that is a separate spec. Build the slot so that filling it later changes nothing structural.
- Any network access. Read YAML from disk and nothing else.
- Any write path to Figma. In particular, do not compose or push the derived Figma description here — that is its own step.
- Editing a contract through the page. It renders; YAML is edited in an editor.
- Rewriting the 93 legacy entries. They have no contract fields and must render as what they are.

## 3. The schema

**Normative source: [`docs/components/registry/README.md`](../components/registry/README.md).** Read it before writing the reader. This section lists only what the validator must enforce; it does not restate the schema.

### 3.1 New FAIL conditions

Add to `tools/lint-registry.mjs`. Each fails the run with exit 1.

| Condition |
| --- |
| `status` outside `draft` \| `published` \| `deprecated` |
| `api[].kind` outside `variant` \| `text` \| `boolean` \| `instance` |
| `a11y.status` outside `warning` \| `fail` \| `open` \| `requires` |
| a variant property whose `default` is not one of its `values[].value` |
| `do_not_use_when[].instead` naming a component that is not in the registry (a `null` is fine) |
| a value carrying an `a11y` block and no `rationale` |
| `api[].controls` naming a property that does not exist on the same component |
| `api[].controls` on a property whose `kind` is not `boolean` |
| a property named in `controls` that does not immediately follow its boolean in `api` order ([naming.md](../foundations/naming.md) §9) |
| `sizing_model.sizes[]` whose `size` values do not match the `size` property's values exactly, in order |
| a `sizing_model.sizes[]` dimension or typography field holding a number rather than a token name |
| a token name in `sizing_model` that does not resolve against `tokens/` |
| `sizing_model.horizontal` / `vertical` outside `hug` \| `fixed` \| `fill` \| `absolute` |
| `line_height_family` outside `text` \| `string` \| `heading` \| `code` |

### 3.2 New REPORT conditions

Exit 0. These are judgements.

| Condition |
| --- |
| an entry with `api` but missing `summary`, `purpose`, `use_when` or `do_not_use_when` |
| a property with no `description` |
| an entry with `api` and no `sizing_model`, or a `sizing_model` with no `intent` |
| an `a11y` finding whose `status` is `warning` or `fail` and whose `note` does not name a criterion |
| `figma.last_verified` older than 90 days on an entry whose `status` is `published` |
| an entry with `family` set where no other entry shares that family |

### 3.3 Legacy entries must not fail

93 entries have none of the contract fields. Absence is never a FAIL — every check above applies only when the field it concerns is present. The generator renders what exists and says plainly that the contract is not written, in the same way 0002 renders an absent `figma:` block.

## 4. `tools/build-component-page.mjs`

`npm run components:view`. Reads every file under `docs/components/registry/`, writes:

```
build/components/index.html
build/components/<path>.html        e.g. checkbox-input.html, table/td-text.html
```

Same constraints as [0002](0002-registry-viewer.md): self-contained files, no network at build time or open time, output gitignored and rebuilt rather than committed, opened from disk over `file://`. Relative links between pages must work from the filesystem.

`build/registry.html` gains a link from each row to that component's page. Where no page exists — a legacy entry — link anyway; the page renders the entry as it is.

### 4.1 What the page must carry

**There is no reference design.** A rough sketch exists at Figma `WUc07ZBtjRvypXtsOlbVut`, node `4963-7009`; it is an early draft made to work out *which information belongs next to which*, and nothing about its appearance is a target. Do not reproduce it, do not treat it as an acceptance criterion, and do not take its typography, spacing or colour from it. The visual design of this page is yours to make well.

What is fixed is the information and its grouping, in this order:

1. **Header** — `name` as the title, `summary` beneath it, then a row of small caps badges: `level`, `status`, `version`. A `family` with siblings adds a link to each sibling.
2. **Purpose** — `purpose`.
3. **Use when / do not use when** — one list. `use_when` entries marked affirmative, `do_not_use_when` entries marked negative. Where `instead` is present, append the component name as a link to its page. Where it is `null`, append nothing.
4. **Requirements** — the component-level `a11y` sequence, if present. `requires` entries read as obligations on the consumer and belong above the API, not buried under it.
5. **Public API** — one card per `api` entry, in file order. See §4.2.
6. **Sizing model** — `horizontal`, `vertical` and `adjustable` as a short definition list, `intent` as prose, then `sizes[]` as a table with a column per key present. This is also where typography lives; there is no separate typography section, because size, gap, font size and line height move together and a reader comparing them across sizes needs them on one row. See §4.3 on resolving the token names — a table of bare token names is unreadable and fails this spec.
7. **Limitations** — `limitations` as a list.
8. **Footer** — the Figma link built from `figma.file_key` and `figma.node_id`, `last_verified`, `uses` and the derived `used_by`, and `children` / `parents` as links, and `notes`.

Sections whose fields are absent are omitted entirely — no empty headings.

### 4.2 The property card

Two columns.

**Left:** the property `name`, a small glyph for `kind`, `default` marked as such, `description`, and the property-level `a11y` finding if present.

**Right:** one row per value:

```
[ preview slot ]   size: extra small   [ A11Y WARNING ]
```

- **Preview slot** — a fixed-size bordered placeholder carrying the variant assignment as text, e.g. `size=extra small, state=default, is checked=false`. Give it the dimensions a real render would take: for the `size` property, resolve `sizing_model.sizes[].box` through `tokens/` (§4.3); otherwise a sensible constant. This is the only thing in the page that is deliberately unfinished; make the swap a one-function change.
- **Label** — `name: value` in a monospace face, as in the reference.
- **Badge** — present only where the value carries an `a11y` block, coloured by status. `note`, `criterion` and `rationale` render beneath the row or in a disclosure — the reader must be able to reach them without leaving the page, and must not have them shouting on first read.
- **`note` without an `a11y` block** renders beneath the row as plain text.

For `kind: "text"` and `kind: "instance"` there are no values. Render the `default` and the `description`, then the examples.

**Examples**, where present, render as a Do / Do not pair at the foot of the card: the preview slot with the `props` assignment printed in it, the verdict, and the `caption`.

### 4.3 Token names must be resolved, not printed

`sizing_model.sizes[]` carries **token names, never numbers** — `box: "size/s-2_000"`, `gap: "gap/g-0_500"`, `font_size: "size/0_750"`, `line_height: "line height/string/0_750"`. That is deliberate: the scale is the system, and a contract that recorded `16` would be a transcription that rots (`docs/foundations/`).

A page that prints those strings and stops is unreadable, and is the failure this section exists to prevent. **Resolve every one against `tokens/` at build time and show both** — the value as the primary reading, the token name beside or beneath it as the address. `12 px` alone loses the scale; `size/s-2_000` alone loses the size. The reader needs to see the run 16 · 20 · 24 · 28 · 32 as a run, and see that it is `s-2_000` through `s-4_000`.

This is a build-time join, not a transcription: the numbers live in `tokens/` and are read from there on every build.

A name that does not resolve is a FAIL in the validator (§3.1), not a blank cell on the page.

### 4.4 Other rendering rules

- Escape every string from YAML. No field is trusted markup.
- Prose fields are one line in the file by necessity; render them as paragraphs, not as `<pre>`.
- Do not invent copy. If a field is absent, the page says nothing about it — no "not specified", no placeholder prose. An absent `intent` is a REPORT, not a sentence on the page.
- Never write a number into the HTML that did not come from `tokens/` or from a contract field.

### 4.5 The design is part of the deliverable

This page is what a designer and an agent will open every time they need to know what a component is. It is read, not skimmed, and it will exist for a hundred components. A bare stack of definition lists technically carries the data and fails the job.

The brief:

- **One person, from disk, on a wide screen.** No responsive breakpoints beyond not breaking at a narrow window. No navigation chrome beyond a link back to the index.
- **Dense but not cramped.** The contract is long; the reader is looking for one thing at a time. Clear section boundaries, a scannable property list, prose held to a comfortable measure rather than the full window width.
- **Typographic hierarchy does the work, not boxes and borders.** One accent colour. Monospace for property names, values, and token names — they are identifiers and should read as identifiers.
- **Accessibility findings must be visible without shouting.** A reader scanning the property list should see at a glance which values carry one; a reader reading straight through should not be interrupted by them. The `note`, `criterion` and `rationale` belong within reach — a disclosure, a sidenote — not behind a click to another page and not shouting in red at the top.
- **It should survive being printed to PDF**, because it will be.
- **Dark and light both.** Follow the system preference; do not build a toggle.

Judge the result by opening it and reading the Checkbox Input contract end to end. If any part of it is easier to understand by opening the YAML, the page is not finished.

## 5. Tests

`tools/build-component-page.test.mjs`, run by `npm test`:

- every FAIL condition in §3.1 fires on a fixture that violates it and does not fire on one that does not;
- a legacy entry with no contract fields produces a page and zero failures;
- the derived Figma description composes to exactly three lines from `summary`, `use_when[0]` and `do_not_use_when[0]` — build the composer here even though nothing writes it to Figma yet, and test it;
- generated HTML contains no `http://` or `https://` reference other than links to `figma.com`.

## 6. Repository sweep

The model change on 2026-08-26 replaced the per-component Markdown document with the registry contract. Check and report — do not silently repair anything in the last group.

### 6.1 Fix

- Four files were deleted: `docs/components/_template.md`, `checkbox-input.md`, `checkbox-label.md`, `checkbox-text.md`. Find every remaining reference to them, and to the twenty-point document model, across `docs/`, `ARCHITECTURE.md`, `README.md`, `PLAN.md` and `skills/src/`. Repoint or remove.
- `docs/specs/README.md` — add the row for this spec.
- `CHANGELOG.md` — an entry for the model change and for this work.
- Verify every relative link in the two rewritten files — `docs/components/STANDARD.md` and `docs/components/registry/README.md` — resolves.

### 6.2 Verify

- Every `.yaml` under `docs/components/registry/` parses with `tools/lib/yaml.mjs` and round-trips (`stringify(parse(x))` re-parses equal). Report any that do not.
- `npm run validate:registry`, `npm run tokens:check`, `npm run validate:skills` and `npm test` all pass, or their failures are reported with the reason.

### 6.3 Report, do not act

These need the owner's judgement:

- **`docs/components/registry/checkbox.yaml` still exists** with `id: "Checkbox"`, which matches no component in Figma. Thirteen entries name `"Checkbox"` as a child. Splitting those references across `Checkbox Input`, `Checkbox Label` and `Checkbox Text` is a judgement about allowed composition, not a transcription. List the thirteen files and the reference in each; change nothing.
- **`toggle.yaml` has `id: "Toggle"`**, and Figma has `Toggle Label`. The `instead` check in §3.1 fails on it today. Report whether Toggle has the same three-way shape as Checkbox; propose nothing.
- **`flow_behavior` and `sizing_model` overlap.** The first is a coarse whole-component value on all 96 entries, the second is per-axis. Folding them is open. Report which entries have both and whether they agree.
- **`PLAN.md` Stage 4** reserves an ADR for the documentation-boundary decision. That decision is made and the boundary is this spec's schema. Report the reference; do not edit `PLAN.md`.

## 7. Acceptance

- `npm run components:view` writes `build/components/index.html` and a page per entry, with no network access.
- The three Checkbox contracts render every field they carry, grouped and ordered as §4.1 requires.
- Every token name in `sizing_model` appears resolved to its value, with the name alongside it (§4.3). No bare token name and no orphan number anywhere on the page.
- The page meets the brief in §4.5 on its own terms. It is not measured against the Figma sketch.
- A legacy entry renders without error and without invented copy.
- `npm run validate:registry` enforces every FAIL in §3.1 and emits every REPORT in §3.2, and passes on the three Checkbox contracts.
- `npm test` passes, including the new tests in §5.
- §6.1 and §6.2 are done; §6.3 is a written report and nothing more.

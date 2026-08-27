# SPEC 0003 — Component page

**Status:** Built — 2026-08-27
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
| `variants.complete_cross_product: true` and `variants.count` ≠ the product of the variant properties' value counts |
| a value carrying an `a11y` block and no `rationale` |
| `api[].controls` naming a property that does not exist on the same component |
| `api[].controls` on a property whose `kind` is not `boolean` |
| a property named in `controls` that does not immediately follow its boolean in `api` order ([naming.md](../foundations/naming.md) §9) |
| `sizing_model.sizes[]` whose `size` values do not match the `size` property's values exactly, in order |
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

### 4.1 Page structure

Follow the reference layout: Figma `WUc07ZBtjRvypXtsOlbVut`, node `4963-7009`. In order:

1. **Header** — `name` as the title, `summary` beneath it, then a row of small caps badges: `level`, `status`, `version`. A `family` with siblings adds a link to each sibling.
2. **Purpose** — `purpose`.
3. **Use when / do not use when** — one list. `use_when` entries marked affirmative, `do_not_use_when` entries marked negative. Where `instead` is present, append the component name as a link to its page. Where it is `null`, append nothing.
4. **Requirements** — the component-level `a11y` sequence, if present. `requires` entries read as obligations on the consumer and belong above the API, not buried under it.
5. **Public API** — one card per `api` entry, in file order. See §4.2.
6. **Sizing model** — `intent` as prose, then `sizes[]` as a table with a column per key present. `horizontal`, `vertical` and `adjustable` above it as a short definition list.
7. **Limitations** — `limitations` as a list.
8. **Footer** — the Figma link built from `figma.file_key` and `figma.node_id`, `last_verified`, `uses` / `used_by` and `children` / `parents` as links, and `notes`.

Sections whose fields are absent are omitted entirely — no empty headings.

### 4.2 The property card

Two columns.

**Left:** the property `name`, a small glyph for `kind`, `default` marked as such, `description`, and the property-level `a11y` finding if present.

**Right:** one row per value:

```
[ preview slot ]   size: extra small   [ A11Y WARNING ]
```

- **Preview slot** — a fixed-size bordered placeholder carrying the variant assignment as text, e.g. `size=extra small, state=default, is checked=false`. Give it the dimensions a real render would take, from `sizing_model.sizes[]` where the property is `size`, and a sensible constant otherwise. This is the only thing in the page that is deliberately unfinished; make the swap a one-function change.
- **Label** — `name: value` in a monospace face, as in the reference.
- **Badge** — present only where the value carries an `a11y` block, coloured by status. `note`, `criterion` and `rationale` render beneath the row or in a disclosure — the reader must be able to reach them without leaving the page, and must not have them shouting on first read.
- **`note` without an `a11y` block** renders beneath the row as plain text.

For `kind: "text"` and `kind: "instance"` there are no values. Render the `default` and the `description`, then the examples.

**Examples**, where present, render as a Do / Do not pair at the foot of the card: the preview slot with the `props` assignment printed in it, the verdict, and the `caption`.

### 4.3 Rendering rules

- Escape every string from YAML. No field is trusted markup.
- Prose fields are one line in the file by necessity; render them as paragraphs, not as `<pre>`.
- Do not invent copy. If a field is absent, the page says nothing about it — no "not specified", no placeholder prose. An absent `intent` is a REPORT, not a sentence on the page.
- No values from `tokens/` appear anywhere. The contract does not carry them and the page must not fetch them.

### 4.4 Presentation

The page is opened by one person, from disk, to read a contract. Dense, quiet, and legible at a glance beats decorative. System font stack, generous measure limits on prose, monospace for property and value names, one accent colour, and enough whitespace that the property cards read as separate objects. It should survive being printed to PDF.

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
- The three Checkbox contracts render every field they carry, in the order of §4.1, matching the reference layout closely enough that the difference is styling rather than structure.
- A legacy entry renders without error and without invented copy.
- `npm run validate:registry` enforces every FAIL in §3.1 and emits every REPORT in §3.2, and passes on the three Checkbox contracts.
- `npm test` passes, including the new tests in §5.
- §6.1 and §6.2 are done; §6.3 is a written report and nothing more.

---

## 8. Report — §6.3, and what §6.2 found

Written 2026-08-27, on completing the work above. Nothing in this section was acted on; each item needs the owner's judgement.

### 8.1 `checkbox.yaml` still exists, and thirteen entries name `"Checkbox"` as a child

`docs/components/registry/checkbox.yaml` carries `id: "Checkbox"`, `level: element`, `role: input`, `flow_behavior: hug`, `import: { batch: 1, ready: true }`, and no `figma:` block. No component of that name exists on the Checkbox page in Figma. It records:

- `children` — `Label`, `Icon`, `Badge`, `Loader`. The allowed-composition set, not the implemented one.
- `parents` — the thirteen below.

**The thirteen, each naming `"Checkbox"` in `children`:**

| File | Entry | Level |
| --- | --- | --- |
| `accordion/container.yaml` | Accordion / Container | object |
| `alert.yaml` | Alert | widget |
| `asset.yaml` | Asset | object |
| `bottom-sheet.yaml` | Bottom Sheet | layout |
| `flex-layout.yaml` | Flex Layout | layout |
| `header.yaml` | Header | layout |
| `hero.yaml` | Hero | layout |
| `modal.yaml` | Modal | layout |
| `side-panel.yaml` | Side Panel | layout |
| `side-panel-menu.yaml` | Side Panel Menu | layout |
| `table/td-checkbox.yaml` | Table / TD Checkbox | object |
| `table/th-checkbox.yaml` | Table / TH Checkbox | object |
| `toast.yaml` | Toast | widget |

**And four more name it as a parent** — the other side of `checkbox.yaml`'s own `children`: `badge.yaml`, `icon.yaml`, `label.yaml`, `loader.yaml`, each listing `"Checkbox"` in `parents`. Seventeen files in total refer to the id; deleting `checkbox.yaml` without settling them breaks seventeen references and fails the validator.

**Why it is a judgement.** Which of the three family members each context allows is a decision about composition, not a transcription. `Table / TD Checkbox` and `Table / TH Checkbox` almost certainly want `Checkbox Input` — the cell supplies the name and the hit area, which is exactly what that component's two `requires` findings say. The layouts are less obvious: `Modal` and `Side Panel` plausibly allow all three. And the four primitives listing `Checkbox` as a parent describe the old entry's *allowed* children, of which only `Icon` appears in the new contracts' `uses`.

### 8.2 `toggle.yaml` has `id: "Toggle"`; Figma has the same three-way family

Confirmed against Figma (`Stylos: Components`, read 2026-08-27): the library holds **`Toggle Input`, `Toggle Label` and `Toggle Text`** as three component sets, each with an authored description, and **no `Toggle`**. The three other `Toggle` components the search returns belong to `Minimax UI Kit`, `Stylos Prototype Kit` and `Hidden UI Kit` — none of them Stylos Components.

So Toggle has exactly the shape Checkbox has, and `toggle.yaml` is in exactly the position `checkbox.yaml` was in: one entry standing in for three components, with `children` (`Label`, `Icon`, `Badge`, `Loader`) and thirteen `parents` that would have to be split the same way.

**This is what fails the validator today.** `Checkbox Input` and `Checkbox Label` both name `"Toggle Label"` as the `instead` for "the change takes effect on click", and no entry has that id, so `npm run validate:registry` exits 1 with two FAILs. The check is behaving correctly — a named alternative that resolves to nothing is what it exists to catch. Splitting `toggle.yaml`, or renaming it, clears both; neither is a transcription and neither was done here.

### 8.3 `flow_behavior` and `sizing_model` overlap

`flow_behavior` is on all 96 entries as a coarse whole-component value; `sizing_model` is on the three contracts and is per-axis. **All three that carry both agree**, so nothing is in conflict today:

| Entry | `flow_behavior` | `sizing_model` |
| --- | --- | --- |
| Checkbox Input | `fixed` | `horizontal: fixed`, `vertical: fixed`, `adjustable: false` |
| Checkbox Label | `hug` | `horizontal: hug`, `vertical: hug`, `adjustable: false` |
| Checkbox Text | `fill`, `hug` | `horizontal: fill`, `vertical: hug`, `adjustable: true` |

What the agreement hides is that `flow_behavior` **cannot** express `Checkbox Text` correctly: the sequence `fill, hug` says the component does both without saying which axis does which, and the answer — width fills, height hugs — is only recoverable from `sizing_model`. Where the two ever disagree, the coarse value is the one that cannot be right.

Folding them means either deriving `flow_behavior` from `sizing_model` at build time for the entries that have one, or dropping it as each contract is written and accepting that 93 entries keep it as inventory history. Both are cheap; which is right depends on whether anything outside this repository still reads `flow_behavior`. Nothing here does, beyond displaying it.

### 8.4 `PLAN.md` Stage 4 still reserves the documentation-boundary decision

Two references, both left exactly as they are:

- **`PLAN.md:81`** — "**First**, settle the documentation boundary — which of `STANDARD.md`'s twenty points live in Figma and which in Markdown. Writing twenty documents before that rule exists guarantees rewriting them."
- **`PLAN.md:172`** — the open-questions table, row "Figma / Markdown documentation boundary | 4".

That decision is made. The boundary is this spec's schema: the contract is the registry entry, Figma holds the values and the spatial documentation (StateDiagrams, PropTables, anatomy), and the readable page is generated from the entry. There are no twenty points and no Markdown documents to place. Both references are stale, and `PLAN.md` Stage 4's ordering — settle the boundary *before* writing — is satisfied rather than pending.

Everything else in Stage 4 that named the retired model was repointed under §6.1: the `_template.md` task is gone, "write the documents" is now "write the contracts", the accessibility bullet no longer asks for a section per component, and the Figma-description bullet points at the derivation rule instead of "points 2 and 3".

### 8.5 §6.2, in full

- **Every `.yaml` under `docs/components/registry/` parses and round-trips.** 99 files, `stringify(parse(x))` re-parses equal for all of them, 0 problems.
- `npm run tokens:check` — passes. 8 collections, alias contract holds.
- `npm test` — passes. 117 tests.
- **`npm run validate:registry` — exits 1**, on the two `"Toggle Label"` references in §8.2 and nothing else. 116 reports, which is the expected noise on the imported relations plus the new contract judgements.
- **`npm run validate:skills` — fails**, and not because of this work: `skills/src/description-sync/` is a new, uncommitted skill source, and `skills/dist/stylos-figma-agent.md` has not been rebuilt since it appeared. `npm run build:skills` clears it. That is in-progress work by the owner and was left alone.

# SPEC 0001 — Token pipeline

**Status:** Implemented 2026-08-23
**Date:** 2026-08-22
**Implements:** [ADR 0007 — Token normalization and canonical storage](../decisions/0007-token-normalization.md)

A work order, not a normative document. It says what to build; [ADR 0007](../decisions/0007-token-normalization.md) says why, and wins on any conflict. Rules of the design language live in [`docs/foundations/`](../foundations/README.md).

---

## 1. Goal

Turn Figma's variable export into a canonical, readable, versioned record the project owns, and keep it verified.

Three commands, three scripts, no dependencies.

```
Figma native export (one JSON per mode, handed over by name)
     │
     ▼  tools/import-tokens.mjs   ← tokens/_naming.yaml, tokens/_aliases.yaml
tokens/*.yaml                       the record — generated, never hand-edited
     │                              the exported files are not kept
     ├──▶ tools/check-tokens.mjs    verifies the record against itself
     └──▶ tools/tokens-report.mjs   Markdown for documentation
```

**Nothing raw is stored.** An earlier draft of this spec kept the export committed under `figma/variables/exports/` as immutable evidence, first as dated snapshots and then as a single mirrored directory. Both are withdrawn — see §4.

### In scope

- `tools/import-tokens.mjs` — named collections + authored inputs → canonical YAML
- `tools/check-tokens.mjs` — verifies the canonical set against itself; `--bootstrap-aliases`
- `tools/tokens-report.mjs` — canonical YAML → Markdown
- `tools/lib/yaml.mjs` — a restricted-subset YAML writer/reader
- `tools/lib/convert.mjs` — DTCG → canonical, plus the checks needing the raw floats
- `tools/lib/verify.mjs` — the canonical-set checks
- `tools/lib/tokens.mjs` — a canonical-set loader, so no consumer re-implements YAML → model
- npm scripts under a `tokens:` namespace, and a `node:test` suite under `npm test`

### Out of scope

- CSS generation (`tokens:build`) — a later spec
- The Figma plugin — a later spec; see [ADR 0007](../decisions/0007-token-normalization.md) §9
- Any write path to Figma — a standing non-goal ([ADR 0001](../decisions/0001-figma-connection-model.md))
- Changing anything under `docs/foundations/` — those documents already defer values to the report

---

## 2. Constraints

| | |
| --- | --- |
| Runtime | Node ≥ 22, ESM (`.mjs`) |
| Dependencies | **none** — `node:` built-ins only. This is a standing rule for `tools/` ([ADR 0004](../decisions/0004-frontend-library-foundations.md), `tools/README.md`) |
| Style | match the existing scripts in `tools/` — small, single-purpose, fail loudly with a message that says what to do next |
| Output to stdout | the report only. Everything else goes to stderr, so `npm run tokens:report > file.md` is clean |
| Exit codes | 0 success, 1 any failure |

---

## 3. Input: what Figma's native export actually produces

Verified against the 2026-08-22 export from **Stylos / Styles**. Do not infer this from documentation — it is the observed shape.

- **One JSON file per mode**, downloaded separately. Not an archive — an earlier draft of this section claimed one zip per collection, which the owner has corrected.
- **DTCG shape** — `$type` / `$value`, nested by `/`-separated name segments.
- **Every token carries** `$extensions."com.figma.variableId"`, and most carry `$extensions."com.figma.scopes"`.
- **Each document carries** `$extensions."com.figma.modeName"` at its root. This is the *only* trustworthy source of the mode name: filenames arrive renamed by hand (the 2026-08-20 export contains `effect (unresloved).json`), so nothing may be inferred from them.
- **Colours** are `{colorSpace: "srgb", components: [r, g, b], alpha?}` with float components.
- **Values are resolved, but the alias graph is not discarded.** An earlier draft of this section claimed no token carries a reference. In fact `$extensions."com.figma.aliasData"` is present on 108/110 `color` tokens, 37/37 `space` tokens, and 2/14 `effect` tokens, carrying `targetVariableName` and `targetVariableSetName`.

  The pipeline still treats `tokens/_aliases.yaml` as the authored record and verifies it by value matching, per [ADR 0007](../decisions/0007-token-normalization.md) §2 — but where `aliasData` exists it is **cross-checked** against the value match, and a disagreement is a hard failure. Value matching alone could pick the wrong step where two primitives share a value.

  The two `color` tokens without `aliasData` are `shadow/base` and `shadow/primary`. Figma cannot build a semi-transparent colour from an alias, so those roles are stored as literals despite being conceptually bound to `base/black`/`base/white` and `indigo/700`. That limitation is why `ignore_alpha` exists — see §5.2.

  This weakens the case in [ADR 0007](../decisions/0007-token-normalization.md) §9 for building a Figma plugin, whose stated purpose is to recover an alias graph the export was believed to destroy. That record needs revisiting.

### The nine collections in the current export

| Figma collection | Modes | Tokens/mode |
| --- | --- | ---: |
| `palette.light` | `Value` | 288 |
| `palette.dark` | `Value` | 288 |
| `color` | `Light Mode`, `Dark Mode` | 110 |
| `font` | `Mode 1` | 107 |
| `space.scale` | `Mode 1` | 33 |
| `space` | `Value` | 37 |
| `effect` | `Mode 1` | 14 |
| `radius` | `Mode 1` | 7 |
| `border` | `Mode 1` | 2 |

996 values total. The collection set will change; nothing may be hard-coded to this table.

---

## 4. `tools/import-tokens.mjs`

```
npm run tokens:import -- --collection <name> <file…> [--collection <name> <file…>] [--dry-run]
```

### Nothing is discovered

You name the collection you are updating and hand it its files. The tool never scans a directory, never matches a filename, and never infers which file you meant.

An earlier draft of this section designed import as a scan of `~/Downloads`, recognising exports by content and silently skipping everything else. **That is withdrawn.** The collections are known and declared; a pipeline that searches for its own input is a pipeline that will one day import the wrong file and say nothing. Recognition-by-content survives only as *validation* of a file you pointed at.

`<name>` is a **Figma** collection name as declared in `tokens/_naming.yaml` — `palette.light`, `color`, `space.scale`. Not a canonical name: the argument names the thing being exported, and `_naming.yaml` already keys on exactly that, which makes it the whitelist. It must therefore exist before the first import.

A repeatable flag rather than positional pairs, because a collection can have several mode files and positional grouping would have to guess where one collection's files end and the next name begins. Nine flags for a full refresh is the honest price.

Every failure is loud and names what to do:

| Condition | Message |
| --- | --- |
| Collection not declared | lists every declared collection with its modes |
| File missing, not JSON, or no `com.figma.variableId` | names the file and what a real export looks like |
| Mode set does not match the declaration | prints declared vs found, and what is missing or unexpected |
| Two files claiming the same mode | names the collection and the mode |

Everything is validated before anything is written.

### The file is named after its mode, not its collection

This is the trap the design has to survive. Figma names an export after the **mode** inside it, so a full refresh downloads ten files of which five are called `Mode 1.tokens.json` (`font`, `space.scale`, `radius`, `effect`, `border`) and three are `Value.tokens.json` (`palette.light`, `palette.dark`, `space`) — the browser distinguishing them only by appending ` (1)`, ` (2)`.

The mode check cannot catch a mix-up, because the swapped files declare the same mode. Handing `radius`'s file to `--collection font` would otherwise be accepted in silence, and swapping the two palettes would invert light and dark across the whole system.

So the importer compares **variable ids** against the same collection already in the export directory. Ids are stable across exports and unique to a collection, so a file sharing none of them is the wrong file. Where its ids belong to another declared collection, the message says which:

```
--collection palette.light: the files given share no variable id with the
"palette.light" already in figma/variables/exports/.
  288 of 288 ids belong to "palette.dark" — the two files were probably swapped.
```

Partial overlap is normal — tokens get added and removed between exports. Only *zero* overlap is an error, and a collection not yet imported is not checked at all. `--allow-new-ids` is the escape hatch for the one legitimate case: a collection genuinely rebuilt in Figma, where every variable is new.

### Output layout

```
figma/variables/exports/<date>/
  _manifest.yaml
  <collection>/<mode>.tokens.json
```

Mode name from `com.figma.modeName` inside the document — **never** from the filename, which arrives renamed by hand. File contents are copied byte-for-byte; the directory is a faithful copy of what Figma produced, and normalization is the next script's job.

### Nothing raw is committed

The files you hand over are read once and discarded. `tokens/*.yaml` is the record.

Two earlier drafts kept them: first as dated, immutable snapshot directories with copy-forward, then as a single directory mirroring the last export. **Both are withdrawn**, for two separate reasons.

The dated scheme was version control reimplemented by hand — git already stores every past version with dates, diffs and authorship, and the dated copies bought only the ability to see two exports side by side without git commands, at the cost of copy-forward, `-2`/`-3` suffixes, a `--date` override and half a megabyte of duplicated working tree per import.

The mirrored directory was worse, and the reason is not size. **Because collections are imported one at a time, the directory was never an export of anything.** `radius` from one evening, `color` from three months later — a combination that existed in Figma at no single moment, with a manifest stamping one date across the whole thing as though it had. Checks anchored to it were verifying the token contract against a composite the tool had fabricated: confidence without grounds, which is worse than no check.

What makes this safe to drop is that **the canonical set verifies against itself.** `ref` and `values` are deliberately redundant (ADR 0007 §5) — `ref` is the contract, `values` is what Figma resolved it to — so comparing them needs no export. All 257 value↔reference pairs check out from `tokens/*.yaml` alone.

The checks that genuinely need the raw floats — colour space, 8-bit representability, mode-name parity — are meaningful **only about the export in hand**, so they run during import and nowhere else.

The honest cost: regenerating after a change to `_naming.yaml` requires exporting from Figma again. That is the correct behaviour. Changing how Figma's vocabulary maps onto ours is exactly the moment to be looking at current Figma data, not at a file downloaded on a random Sunday.

### A collection is imported whole

A canonical collection with several modes — `palette` (from `palette.light` + `palette.dark`), `color` (two modes in one collection) — must be imported with every mode at once. Importing one alone would leave the other at a different moment in time, which is the same fabrication at a smaller scale.

### `tokens/_history.yaml`

A line per import: when, which collection, how many tokens, and whether it was `new`, `changed`, or `unchanged`.

```yaml
imports:
  -
    at: "2026-08-23 09:20Z"
    collections:
      -
        collection: "radius"
        tokens: 7
        status: "changed"
```

Values are not recorded — git holds those. This is the "when did `font` last change" view, not a second copy of the data.

### After import

Verify the **whole** canonical set, not only what was imported — a change in one collection can break an alias declared in another. If it fails, exit 1 but keep what was written: it is what Figma produced, and the fix belongs in the authored inputs.

`--dry-run` validates everything, reports what would be imported, and writes nothing.

---

## 5. `tools/check-tokens.mjs`

```
npm run tokens:check                # verify tokens/*.yaml against itself
npm run tokens:check -- --strict    # also fail on warnings
node tools/check-tokens.mjs --bootstrap-aliases
```

It reads `tokens/*.yaml` and `tokens/_naming.yaml`, and nothing else. No Figma export is involved.

### 5.1 `tokens/_naming.yaml` — authored

Maps Figma's vocabulary onto Stylos's. Nothing is guessed.

```yaml
source:
  file: "Stylos / Styles"
  key: "2OJYDoTE9EAdQKaJAJK9Kt"
  url: "https://www.figma.com/design/…"

draws_from:                    # semantic collection -> its primitive collection
  color: "palette"
  space: "space-scale"

collections:
  palette:
    layer: "primitive"         # primitive | semantic
    modes:
      light:
        from: "palette.light"  # Figma collection
        mode: "Value"          # Figma mode
      dark:
        from: "palette.dark"
        mode: "Value"
  color:
    layer: "semantic"
    modes:
      light:
        from: "color"
        mode: "Light Mode"
      dark:
        from: "color"
        mode: "Dark Mode"
  # … one entry per canonical collection

mode_dependent:                # roles allowed to point at a different
  - "color/text/static-light"  # primitive per mode
  - "color/text/static-dark"
  - "color/background/base"
  - "color/shadow/base"
```

Canonical mode names: `default` for single-mode collections, `light` / `dark` where a real mode distinction exists.

Note the shape this normalises away: `palette.light` and `palette.dark` are two Figma *collections* that become one canonical collection with two *modes*.

### 5.2 `tokens/_aliases.yaml` — authored (temporarily)

The semantic → primitive map, restored because Figma's export discards it.

```yaml
"color/surface/base":
  ref:
    default: "palette/slate/25"
"color/background/base":
  ref:
    light: "palette/base/white"
    dark: "palette/base/black"
"color/shadow/primary":
  ref:
    default: "palette/indigo/700"
  ignore_alpha: true
```

`ignore_alpha` marks a role that reuses a primitive's colour at a different opacity — verification compares RGB only. Without it those roles would have to be recorded as literals, which throws away the theming link.

**Keep this a pure fact file.** Token → reference, nothing else: no rationale, no explanatory comments, no hand-tuning. It becomes generated output once the Figma plugin lands, and anything else written into it would be destroyed. Rationale belongs in a foundation document or a decision record.

### 5.3 `--bootstrap-aliases`

Generates `_aliases.yaml` from one value-matching pass, for review. A one-time scaffolding step, not a mechanism the system relies on — see §5.5.

For each semantic collection named in `draws_from`, for each token, in each mode: look for a primitive whose value matches exactly. If exactly one matches in every mode, emit the reference. If not, retry ignoring alpha; on a unique match, emit with `ignore_alpha: true`. Otherwise emit nothing and list the token as needing a decision by hand.

Collapse to `default:` when every mode resolves to the same reference; keep per-mode keys otherwise.

Never runs implicitly. Overwrites `_aliases.yaml` — that is the point, and it is why the file must stay a pure fact file.

### 5.4 Canonical output

One file per canonical collection at `tokens/<collection>.yaml`.

```yaml
# GENERATED FILE — do not edit. Written by tools/import-tokens.mjs from a Figma export.
# Imported 2026-08-23 09:19Z from Stylos / Styles.
collection: "color"
layer: "semantic"
source:
  imported: "2026-08-23 09:19Z"
  figma_file: "Stylos / Styles"
  figma_key: "2OJYDoTE9EAdQKaJAJK9Kt"
modes:
  - "light"
  - "dark"
tokens:
  "surface/bold/primary/default":
    type: "color"
    id: "VariableID:1943:1229"
    scopes:
      - "FRAME_FILL"
      - "SHAPE_FILL"
    values:
      light: "#5752f1"
      dark: "#b2bff8"
    ref:
      default: "palette/indigo/700"
```

Optional keys are omitted when empty, never emitted as `null` or `[]`. `alpha` appears as a per-mode map alongside `values` when any mode has alpha < 1. `ref_ignores_alpha: true` appears when the alias entry carried `ignore_alpha`.

`ref` and `values` are redundant on purpose: `ref` is the contract, `values` is what Figma resolves it to today, and §5.6 rule 5 checks one against the other on every run so the redundancy cannot drift.

Token order follows the export. Preserving it keeps diffs readable when a value changes.

### 5.5 Value conversion

**Colour → hex.** `#rrggbb` from the RGB components. Alpha, when not 1, is stored separately as a decimal rounded to 3 places — never folded into an 8-digit hex.

**The 8-bit check applies to RGB only.** Alpha is a decimal and may hold any value; check instead that it survives rounding to 3 places.

A component further than `1/(255*4)` from a multiple of `1/255` is **reported as a warning**, giving the token, the stored hex, and the drift in units of 1/255. Anything closer is float32 representation noise and is silent.

Numbers and strings pass through unchanged.

**Comparison for alias verification uses the stored hex and alpha**, since the raw export is not kept. Two colours closer than 1/255 would compare equal; that is the same tolerance the 8-bit warning already flags at import, so nothing slips past unremarked.

### 5.6 Validation

**Hard failures — exit 1, always:**

1. *(import only)* A collection name not declared in `_naming.yaml`, or a mode set that does not match its declaration.
2. *(import only)* A canonical collection imported without every one of its modes.
3. *(import only)* Token names not identical across a collection's modes.
4. A semantic token (in a collection named in `draws_from`) with no `ref`.
5. A `ref` whose target does not exist, or whose value disagrees with the value stored beside it in any mode — including alpha, unless `ref_ignores_alpha`.
6. A role resolving to different primitives per mode without being listed in `mode_dependent` — **and the converse**: a role listed there that resolves identically in every mode.
7. A YAML round-trip that does not reproduce the token map.

**Warnings — reported on every run, exit 0:**

8. *(import only)* A colour that is not 8-bit representable (§5.5).
9. *(import only)* An alpha that does not survive rounding to 3 places.

`--strict` promotes warnings to failures. Default is lenient because a 0.30/255 drift is imperceptible, and failing the whole pipeline on it would only teach people to bypass the check.

Collect and report **all** problems, not the first. Warnings print before failures.

Rule 6's converse matters: a stale `mode_dependent` entry silently weakens rule 6 for that role, so it must be caught.

### 5.7 Why aliases are authored rather than inferred

Value matching works on the current data but cannot be relied on: two palette entries already share a value — `zinc/25` = `neutral/25` in light, `zinc/975` = `neutral/975` in dark. Recovery succeeds today only because no semantic role happens to point at either. The map is the record; matching only verifies it.

Full reasoning: [ADR 0007](../decisions/0007-token-normalization.md) §2.

---

## 6. `tools/tokens-report.mjs`

```
npm run tokens:report                # everything
npm run tokens:report radius space   # named collections only
```

Reads `tokens/*.yaml` — **never the export** — and writes Markdown to stdout.

Contents: a header naming the import date and Figma file; a summary table of collections, layers, modes and token counts; then one section per collection with tokens grouped by their name prefix, one column per mode, and a reference column showing `ref` where present. Tokens whose name has no prefix (`radius`, `border`) form one table rather than one each.

Colours with alpha render as `#5752f1 @ 4%`. A reference recovered on RGB alone is marked *(RGB only)*.

This script is why no foundation document transcribes a token value. Anything it cannot render is a gap in it, not a reason to copy values into Markdown.

It loads through `tools/lib/tokens.mjs` rather than parsing YAML itself. That loader is the one place that knows the canonical shape, so the planned colour and accessibility viewer can consume the same model instead of growing a second reader.

---

## 7. Shared YAML helper

A writer and reader as a **matched pair**, in `tools/lib/yaml.mjs`.

The writer emits only:

- block mappings and block sequences, 2-space indent
- numbers, `true`/`false`, `null` unquoted; every other scalar double-quoted with `\"` and `\\` escaping
- keys quoted unless they match `^[A-Za-z0-9_-]+$`
- optional leading `#` comment lines
- no anchors, no aliases, no flow collections, no multi-line scalars

The reader accepts exactly that and **throws on anything outside it**, naming the line — tabs in indentation, odd indentation, an indent that matches no enclosing level, an unquoted non-numeric scalar, a mapping and a sequence mixed at one level, and a duplicate key.

Two deliberate widenings, both for the sake of the hand-authored files: comments are accepted at any indentation (the writer still only emits them at column 0), and a duplicate key is an error rather than last-key-wins.

This is deliberately narrower than YAML: it is what keeps `tools/` dependency-free without pretending to implement the spec. If the subset stops being enough, that is the signal to take a dependency — deliberately, in a new decision record — not to stretch the parser.

`_naming.yaml` and `_aliases.yaml` are authored by hand but must stay inside the subset, since the same reader parses them.

---

## 8. npm scripts

```json
"tokens:import":    "node tools/import-tokens.mjs",
"tokens:check":     "node tools/check-tokens.mjs",
"tokens:report":    "node tools/tokens-report.mjs",
"test":             "node --test \"tools/**/*.test.mjs\""
```

---

## 9. Acceptance criteria

Measured against the 2026-08-22 export from **Stylos / Styles**. These are checkable expectations, not constants to code against.

**Import**

1. An undeclared collection name is refused, listing every declared collection with its modes. A file that is not a Figma export is refused, naming the file. Supplying only one of `color`'s two modes is refused, printing declared against found.
2. Handing `radius`'s file to `--collection font` is refused, naming `radius` as where those variable ids actually belong.
3. Importing `palette.light` without `palette.dark` is refused, naming the sources for both.
4. `--dry-run` reports what would be imported and writes nothing.
5. Each collection is reported as `new`, `changed`, or `unchanged`, and `tokens/_history.yaml` gains one entry per import.
6. A full import of all nine Figma collections writes 8 files — `palette`, `color`, `space-scale`, `space`, `font`, `radius`, `border`, `effect` — totalling 598 canonical tokens, and prints exactly two warnings: `palette/neutral/50` (light) and `palette/neutral/950` (dark), each a drift of 0.30/255.
7. No Figma export file is left anywhere in the repository afterwards.

**Check**

8. `--bootstrap-aliases` produces 147 references with none unresolved, including `ignore_alpha` on `color/shadow/base` and `color/shadow/primary`.
9. `tokens:check` exits 0 on a clean set, and `--strict` does not change that when there is nothing to warn about — the 8-bit warnings belong to import.
10. Deleting one entry from `_aliases.yaml` and re-importing fails rule 4, naming that token.
11. Editing one value in a canonical file so it no longer matches its `ref` fails rule 5, naming the mode.
12. Removing `color/background/base` from `mode_dependent` fails rule 6; adding a mode-independent role to it fails rule 6's converse; naming a token that does not exist fails too.
13. All of the above are caught with no Figma export present.

**Report**

14. `tokens:report radius` renders 7 rows with a single value column.
15. `tokens:report color` renders `light` and `dark` columns and a reference column, with `background/base` showing its two per-mode references.
16. Nothing but Markdown reaches stdout.

**YAML helper**

17. Round-trip of a structure containing quoted keys, `/` in keys, escaped quotes and backslashes, nested maps and sequences returns a deeply equal object.
18. Tab indentation, 3-space indentation, and an unquoted `hello` each throw with a message naming the line.

---

## 10. Notes for the implementer

- The two known warnings in criterion 8 are real data, not a bug: `neutral/50` and `neutral/950` are authored in Figma as `0.94`, which is not a multiple of 1/255. Leave them warning.
- `space` aliases `space-scale` cleanly — all 37 roles resolve. The alias mechanism is not colour-specific; drive it from `draws_from` rather than hard-coding palette.
- `color/shadow/base` is both `ignore_alpha` and mode-dependent (black in light, white in dark). It exercises two rules at once and is a good first test case.
- `ignore_alpha` is not a loosening of the check. Figma cannot build a semi-transparent colour from an alias, so a role that reuses a primitive at reduced opacity exports as a literal. Comparing on RGB recovers the binding that limitation hid; recording those roles as literals instead would throw away the theming link.
- `color/shadow/primary` aliases `indigo/700` in **both** modes and is therefore *not* mode-dependent, even though its resolved RGB differs per mode — because the palette's own value for `indigo/700` differs. Rule 6 turns on the step name, not the value.
- Failure messages are part of the deliverable. Each should name the file, the token, and what to do — the audience is one person returning to this in three months.

### Kept in mind for the colour and accessibility viewer

Not built here, and its own spec when it is. Three things exist so it is not a rewrite: `tools/lib/tokens.mjs` as the shared model; `ref` and `values` kept deliberately redundant, since the chain `surface/base → palette/slate/25 → #f8fafc` needs the first and contrast needs the second; and `scopes` kept per token, which is how a viewer tells a text role from a fill role without guessing.

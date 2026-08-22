# SPEC 0001 — Token pipeline

**Status:** Ready to implement
**Date:** 2026-08-22
**Implements:** [ADR 0007 — Token normalization and canonical storage](../decisions/0007-token-normalization.md)

A work order, not a normative document. It says what to build; [ADR 0007](../decisions/0007-token-normalization.md) says why, and wins on any conflict. Rules of the design language live in [`docs/foundations/`](../foundations/README.md).

---

## 1. Goal

Turn Figma's variable export into a canonical, readable, versioned record the project owns, and keep it verified.

Three commands, three scripts, no dependencies.

```
Figma native export (zip per collection)
     │
     ▼  tools/import-tokens.mjs
figma/variables/exports/<date>/     raw snapshot — immutable evidence
     │
     ▼  tools/normalize-tokens.mjs  ← tokens/_naming.yaml, tokens/_aliases.yaml
tokens/*.yaml                       canonical — generated, never hand-edited
     │
     ▼  tools/tokens-report.mjs
Markdown for documentation
```

### In scope

- `tools/import-tokens.mjs` — archives → dated snapshot + manifest
- `tools/normalize-tokens.mjs` — snapshot + authored inputs → canonical YAML, with validation
- `tools/tokens-report.mjs` — canonical YAML → Markdown
- A restricted-subset YAML writer/reader shared by all three
- npm scripts under a `tokens:` namespace

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

- **One zip per collection.** Filename is the collection name (`color.zip`, `palette.light.zip`, `space.scale.zip`). Browser downloads may append ` (2)`.
- **One JSON per mode inside**, named for the mode (`Light Mode.tokens.json`, `Mode 1.tokens.json`, `Value.tokens.json`).
- **DTCG shape** — `$type` / `$value`, nested by `/`-separated name segments.
- **Aliases are resolved.** No token carries a reference. This is the problem the pipeline exists to fix.
- **Every token carries** `$extensions."com.figma.variableId"`, and most carry `$extensions."com.figma.scopes"`.
- **Each document carries** `$extensions."com.figma.modeName"` at its root — the authoritative mode name; the filename is a fallback only.
- **Colours** are `{colorSpace: "srgb", components: [r, g, b], alpha?}` with float components.

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
npm run tokens:import -- <dir> [--dry-run] [--date YYYY-MM-DD]
```

### Recognition — by content, never by filename

An archive qualifies only if it contains a `.json` member whose text contains `com.figma.variableId` and parses as an object. A bare `.json` file in the directory qualifies on the same test.

This matters: the source directory is normally `~/Downloads`, which holds unrelated files, other projects' exports, and corrupt or partial downloads. Anything that fails the test is skipped silently — not an error. If nothing qualifies, that is an error, and the message must state the recognition rule so the user can tell why their file was ignored.

Ignore `__MACOSX/` members.

### Zip reading

Implement a minimal reader over `node:zlib` — locate the end-of-central-directory record, walk the central directory, read each local header, and inflate. Support compression methods 0 (stored) and 8 (deflate); anything else is an error naming the member and method.

An already-unpacked directory of JSON must also work, so the zip reader is never the only way in.

### Output layout

```
figma/variables/exports/<date>/
  _manifest.yaml
  <collection>/<mode>.tokens.json
```

Collection name from the archive filename, stripped of a trailing ` (n)`. Mode name from `com.figma.modeName` inside the document, falling back to the member filename. **No other renaming** — the snapshot is a faithful copy of what Figma produced; normalization is the next script's job.

### Immutability

If `<date>/` exists, write `<date>-2`, then `-3`, and say so. Never overwrite. `--date` overrides the date; there is no `--force`.

### `_manifest.yaml`

```yaml
snapshot: "2026-08-22"
imported_from: "/home/arturtrifonov/Downloads"
figma_file: "Stylos / Styles"
figma_key: "2OJYDoTE9EAdQKaJAJK9Kt"
figma_url: "https://www.figma.com/design/..."
archives:
  -
    filename: "color.zip"
    sha256: "…"
    collection: "color"
    modes:
      -
        mode: "Light Mode"
        file: "Light Mode.tokens.json"
        tokens: 110
```

`figma_file` / `figma_key` / `figma_url` come from `tokens/_naming.yaml`'s `source:` block — provenance is recorded automatically, not remembered. If `_naming.yaml` is missing, warn and leave them out; the import still proceeds.

A snapshot without provenance cannot be built on. This is the gap that makes the legacy `2026-02-22.json` unusable.

### After import

Run the normalizer on the snapshot just written and let its output through. If normalization fails, exit 1 but **keep the snapshot** — it is evidence of what Figma produced, whether or not it normalises.

`--dry-run` reports what would be imported and writes nothing.

---

## 5. `tools/normalize-tokens.mjs`

```
npm run tokens:normalize                      # write tokens/*.yaml
npm run tokens:check                           # verify, write nothing
npm run tokens:check -- --strict               # also fail on warnings
node tools/normalize-tokens.mjs --bootstrap-aliases
node tools/normalize-tokens.mjs 2026-08-22     # a specific snapshot
```

Default snapshot is the newest directory matching `YYYY-MM-DD` or `YYYY-MM-DD-n`.

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
# GENERATED FILE — do not edit. Run: npm run tokens:normalize
# Source: figma/variables/exports/2026-08-22/
collection: "color"
layer: "semantic"
source:
  snapshot: "2026-08-22"
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

**Comparison for alias verification uses the raw exported value**, not the hex — components rounded to 4 decimal places, plus alpha unless `ignore_alpha`.

### 5.6 Validation

**Hard failures — exit 1, always:**

1. A snapshot collection or mode with no entry in `_naming.yaml`.
2. A `_naming.yaml` entry pointing at a collection or mode the snapshot does not contain.
3. Token names not identical across a collection's modes.
4. A semantic token (in a collection named in `draws_from`) with no entry in `_aliases.yaml`.
5. A declared alias whose value disagrees with the export in any mode, or that references a token which does not exist.
6. A role resolving to different primitives per mode without being listed in `mode_dependent` — **and the converse**: a role listed there that resolves identically in every mode.
7. A YAML round-trip that does not reproduce the token map.

**Warnings — reported on every run, exit 0:**

8. A colour that is not 8-bit representable (§5.5).
9. An alpha that does not survive rounding to 3 places.

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

Reads `tokens/*.yaml` — **never the snapshot** — and writes Markdown to stdout.

Contents: a header naming the snapshot and Figma file; a summary table of collections, layers, modes and token counts; then one section per collection with tokens grouped by their name prefix, one column per mode, and a reference column showing `ref` where present.

Colours with alpha render as `#5752f1 @ 4%`.

This script is why no foundation document transcribes a token value. Anything it cannot render is a gap in it, not a reason to copy values into Markdown.

---

## 7. Shared YAML helper

A writer and reader as a **matched pair**, in `tools/lib/yaml.mjs`.

The writer emits only:

- block mappings and block sequences, 2-space indent
- numbers, `true`/`false`, `null` unquoted; every other scalar double-quoted with `\"` and `\\` escaping
- keys quoted unless they match `^[A-Za-z0-9_-]+$`
- optional leading `#` comment lines
- no anchors, no aliases, no flow collections, no multi-line scalars

The reader accepts exactly that and **throws on anything outside it** — tabs in indentation, odd indentation, an unquoted non-numeric scalar, a mapping and a sequence mixed at one level.

This is deliberately narrower than YAML: it is what keeps `tools/` dependency-free without pretending to implement the spec. If the subset stops being enough, that is the signal to take a dependency — deliberately, in a new decision record — not to stretch the parser.

`_naming.yaml` and `_aliases.yaml` are authored by hand but must stay inside the subset, since the same reader parses them.

---

## 8. npm scripts

```json
"tokens:import":    "node tools/import-tokens.mjs",
"tokens:normalize": "node tools/normalize-tokens.mjs",
"tokens:check":     "node tools/normalize-tokens.mjs --check",
"tokens:report":    "node tools/tokens-report.mjs"
```

---

## 9. Acceptance criteria

Measured against the committed `figma/variables/exports/2026-08-22/` snapshot. These are checkable expectations, not constants to code against.

**Import**

1. Given a directory containing the nine export zips plus a text file, a corrupt zip and an unrelated JSON, exactly nine exports are found and the three decoys are skipped without error.
2. `--dry-run` writes nothing.
3. A real run against a date whose directory exists writes `<date>-2` and says so.
4. `_manifest.yaml` records the Figma file and key from `_naming.yaml`, and a SHA-256 per archive.
5. The snapshot reproduces the export byte-for-byte in content: 9 collections, 10 mode files, 996 values.

**Normalize**

6. A clean run writes 8 files — `palette`, `color`, `space-scale`, `space`, `font`, `radius`, `border`, `effect` — totalling 598 canonical tokens.
7. `--bootstrap-aliases` produces 147 references with none unresolved, including `ignore_alpha` on `color/shadow/base` and `color/shadow/primary`.
8. `tokens:check` exits 0 and prints exactly two warnings: `palette/neutral/50` (light) and `palette/neutral/950` (dark), each a drift of 0.30/255.
9. `tokens:check -- --strict` exits 1 on those same two warnings.
10. Changing one mode's name in `_naming.yaml` to something absent produces **two** failures — the unresolvable mapping, and the now-unmapped snapshot mode — and exits 1.
11. Deleting one entry from `_aliases.yaml` fails rule 4 naming that token.
12. Pointing one alias at the wrong palette step fails rule 5 naming the mode.
13. Removing `color/background/base` from `mode_dependent` fails rule 6; adding a mode-independent role to it fails rule 6's converse.

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
- Failure messages are part of the deliverable. Each should name the file, the token, and what to do — the audience is one person returning to this in three months.

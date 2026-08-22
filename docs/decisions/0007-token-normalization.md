# 0007 — Token normalization and canonical storage

**Status:** Accepted and implemented
**Date:** 2026-08-22

## Problem

Figma's variable export is a transport format, not a record. As stored it cannot serve as the project's account of its own token system:

- **Mode names are meaningless.** `Mode 1`, `Value`. Only `Light Mode` / `Dark Mode` carry information.
- **Collection structure does not match the conceptual model.** `palette.light` and `palette.dark` are two collections where the system has one palette with two modes. `space` and `space.scale` are two collections where the system has one scale with a primitive and a semantic layer.
- **Aliases are discarded.** Every one of the 996 tokens in the 2026-08-22 snapshot exports as a resolved value. `surface/base` appears as an sRGB triple, not as a reference to a palette step. The layer that makes theming and rebranding work is precisely the layer the export throws away.
- **Values are unreadable.** `{"colorSpace":"srgb","components":[0.9725,0.9803,0.9882]}` in a diff tells no one that slate/25 changed.
- **The format is inconsistent with the rest of the project.** Component metadata is YAML, one file per component, hand-readable and git-diffable. Tokens are JSON shaped by another tool's export routine.

The consequence has already been demonstrated in this repository: foundation documents transcribed token values, the values went stale, and a document that was wrong got treated as a source. Removing transcription (`npm run tokens:report`) fixed the symptom by reading the raw export directly — which means documentation and any future build now depend on Figma's naming accidents.

## Decision

**Three layers, two generated steps, two authored inputs.**

```
Figma export
     │
     ▼
figma/variables/exports/<date>/          RAW SNAPSHOT — immutable evidence
     │                                   read by nothing except the normalizer
     │   + tokens/_naming.yaml     ─┐    AUTHORED
     │   + tokens/_aliases.yaml    ─┤
     ▼                              │
tools/normalize-tokens.mjs  ◀───────┘
     │
     ▼
tokens/*.yaml                            CANONICAL — generated, never hand-edited
     │                                   the contract everything else reads
     ├──▶ tools/tokens-report.mjs        values for documentation
     ├──▶ tools/build-tokens.mjs         CSS custom properties        [Stage 3]
     └──▶ future: docs generation, lint rules
```

### 1. Why normalization and CSS generation are separate steps

Normalization answers *what are these tokens called and how do they relate* — a Stylos decision. CSS generation answers *what does the output file look like* — a consumer decision.

Merged into one script, the CSS generator would have to know that `Mode 1` means "default" and that `palette.light` plus `palette.dark` are one thing. Every future consumer would have to know it too. Split, the canonical layer is the contract, and any number of outputs derive from it without ever seeing Figma's vocabulary.

This is the same separation already in force elsewhere: `skills/src/` is the authored contract, `skills/dist/` is one target's output.

### 2. Aliases are authored, not inferred

An earlier proposal was to reconstruct the alias graph by matching values — a semantic colour equal to exactly one palette entry must be an alias of it. On the 2026-08-22 snapshot that recovers 108 of 110 roles with zero ambiguity, which looked sufficient.

**It is not sufficient, and the same snapshot proves it.** Two palette entries already hold identical values:

| | light | dark |
| --- | --- | --- |
| collision | `zinc/25` = `neutral/25` | `zinc/975` = `neutral/975` |

Recovery succeeds today only because no semantic role happens to point at either. The moment one does, value matching cannot say which step it came from, and an inference-based pipeline either guesses or stops. Two more roles (`shadow/base`, `shadow/primary`) are alpha derivatives that match nothing at all, and three (`text/static-light`, `text/static-dark`, `background/base`) legitimately resolve to different steps per mode.

So: **`tokens/_aliases.yaml` records the semantic → primitive map as an authored fact**, and value matching becomes *verification* rather than inference. The normalizer checks every declared alias against the exported values and fails when they disagree.

The map is bootstrapped once from a successful recovery run — that is a legitimate use of value matching, performed once under review, rather than a mechanism the system depends on forever. After that it is maintained by hand like any other contract. A new semantic token with no entry fails the build until someone decides what it aliases; that failure is the feature.

### 3. Naming normalization is a mapping, not a heuristic

`tokens/_naming.yaml` declares, explicitly:

- which Figma collection(s) map to which canonical collection, and under which mode;
- which Figma mode name maps to which canonical mode name.

Nothing is guessed from string patterns. **An unmapped collection or mode is a build failure**, not a default. A heuristic that silently invents a name for something new is how a rename in Figma becomes a silent corruption of the canonical set — the same class of failure as the unlinked component registry (`ARCHITECTURE.md` §5, break 1).

Canonical modes: `default` for single-mode collections, `light` / `dark` where a real mode distinction exists.

### 4. Format: YAML

Consistent with `docs/components/registry/*.yaml`. One format for structured project data, not two.

The cost is honest and worth stating: the repository's tools are deliberately dependency-free, so this means writing YAML **and** reading it back without a library. The mitigation is that the writer and reader are a matched pair — the normalizer emits a **restricted subset** (block style only; no anchors, no aliases, no multi-line scalars, no implicit typing; every non-numeric scalar quoted), so the reader only has to handle what the writer produces. A round-trip test in the normalizer's `--check` mode enforces that: parse what was written, compare to what was intended, fail on any difference.

This is narrower than "parse arbitrary YAML" and is testable. If the restricted subset ever stops being enough, that is the signal to take a dependency — deliberately, in a new record, not by stretching a regex.

### 5. Canonical token shape

One file per canonical collection. Every token carries its Figma identity, its type, its scopes, its declared reference where it has one, and its resolved values per mode:

```yaml
# GENERATED FILE — do not edit. Run `npm run tokens:normalize`.
# Source: figma/variables/exports/2026-08-22/  (Stylos / Styles)
collection: color
modes: [light, dark]
tokens:
  surface/base:
    type: color
    id: "VariableID:1943:1232"
    scopes: [FRAME_FILL]
    ref:
      default: palette/slate/25
    values:
      light: "#f8fafc"
      dark: "#02101e"
  background/base:
    type: color
    id: "VariableID:1943:1240"
    scopes: [FRAME_FILL]
    ref:
      light: palette/base/white
      dark: palette/base/black
    values:
      light: "#ffffff"
      dark: "#000000"
```

`ref` and `values` are deliberately redundant. `ref` is the contract; `values` is what Figma currently resolves it to. Because the normalizer verifies one against the other on every run, the redundancy cannot drift — and it makes the file readable without cross-referencing another file.

`id` is the Figma variable identity, serving the same role for tokens that `node_id` will serve for components in Stage 2.

### 6. Colour representation: hex, with drift reported

Colours are stored as hex, with alpha as a separate decimal where it is not 1. Measured on the current snapshot:

| | count |
| --- | ---: |
| Exactly 8-bit representable | 6 |
| Float32 noise only — round-trips to the same hex | 787 |
| **Genuinely not 8-bit representable** | **5** |

Of the five, three are alpha channels on shadow colours (`0.03`, `0.04`) — which is why alpha is stored as a decimal rather than folded into an eight-digit hex. The remaining two are `neutral/50` (light) and `neutral/950` (dark), both authored as `0.94` rather than a multiple of 1/255.

The rule: **the normalizer reports every value that is not 8-bit representable rather than silently rounding it — as a warning, not a failure.** A drift of 0.30/255 is imperceptible, but imperceptible is not lossless, and a value that cannot round-trip is usually one someone typed by hand in Figma and should fix there. Blocking the whole pipeline on it would be disproportionate and would only teach people to bypass the check, so warnings print on every run and `--strict` promotes them to failures for CI. The raw float always remains in the immutable snapshot, so nothing is lost — only the working record is simplified.

The 8-bit rule applies to RGB only. Alpha is stored as a decimal, not folded into an eight-digit hex, so it may legitimately hold any value; it is checked instead for surviving rounding to three decimal places.

### 7. Location: `tokens/` at the repository root

The canonical set is consumed by the future `@stylos/ui` package and by documentation tooling. It is system data, not documentation about the system, so it sits alongside `docs/`, `figma/`, `skills/`, and `tools/` rather than inside one of them.

The alternative considered was `docs/tokens/`, for symmetry with `docs/components/registry/`. Rejected because the registry is metadata *about* components that documentation generates from, whereas this is the token system itself in its canonical form — the thing a build points at.

### 8. What must fail the build

`npm run tokens:check` exits non-zero when:

1. a Figma collection or mode has no entry in `_naming.yaml`;
2. a semantic token has no entry in `_aliases.yaml`;
3. a declared alias does not match the exported value in any mode;
4. a token declared mode-independent resolves to different palette steps per mode;
5. *(warning, not failure — see §6)* a colour is not 8-bit representable beyond the stated tolerance;
6. a token present in the previous canonical set has disappeared, without an explicit acknowledgement flag;
7. the YAML round-trip does not reproduce the intended structure.

Rule 6 is the release-validation step master doc Phase 4 asks for: a removed or renamed token is a breaking change, and it should require a person to say so.

### 9. How the export actually happens — tools and commands

The layers above say *what is stored*. This says *what is run*.

#### Command surface

All token commands share one namespace. `report:tokens` from the previous step is renamed into it.

| Command | Does |
| --- | --- |
| `npm run tokens:import -- <dir>` | finds Figma export archives in `<dir>`, unpacks them into a new dated snapshot, writes a manifest |
| `npm run tokens:normalize` | newest snapshot + authored inputs → `tokens/*.yaml` |
| `npm run tokens:check` | all invariants in §8; exits non-zero on any violation |
| `npm run tokens:report` | renders current values for documentation |
| `npm run tokens:build` | `tokens/*.yaml` → CSS custom properties (Stage 3) |

A normal update is two commands:

```bash
npm run tokens:import -- ~/Downloads
npm run tokens:normalize && npm run tokens:check
```

`tokens:import` runs `tokens:normalize` automatically on success, so the second line is a re-run for confidence, not a required step.

#### `tools/import-tokens.mjs`

1. **Finds** export archives in the given directory **by content, not by filename.** An archive qualifies only if it contains at least one `*.tokens.json` whose tokens carry `$extensions."com.figma.variableId"`. Filenames from a browser download are unreliable (`palette.light (2).zip`), and a directory like `~/Downloads` contains unrelated files — the importer must recognise its own input rather than trust where it was found or what it is called.
2. **Unpacks** into `figma/variables/exports/<YYYY-MM-DD>/<collection>/<mode>.tokens.json`. Collection name comes from the archive, mode name from the file inside it. No renaming happens here — normalization is the next step's job, and the snapshot must stay a faithful copy of what Figma produced.
3. **Refuses to overwrite** an existing dated directory. Snapshots are immutable; a second export on the same day is `<date>-2` or, if it supersedes a mistake, a new day. `--force` exists and should be needed roughly never.
4. **Writes `_manifest.yaml`** into the snapshot: the Figma file name and key, the export date, each source archive's original filename and SHA-256, per-collection token counts, and the importer version. This is what `2026-02-22.json` lacks and why nothing can be built on it. The file key is not in the archive — it comes from `tokens/_naming.yaml`, which declares which Figma file each collection belongs to, so provenance is recorded automatically rather than remembered.
5. **Runs the normalizer**, and reports what changed against the previous canonical set: tokens added, removed, values changed.

Unzipping is done with a ~60-line reader over `node:zlib` (`inflateRawSync`), covering the stored and deflate methods Figma emits. This keeps `tools/` dependency-free per [ADR 0004](0004-frontend-library-foundations.md) and `tools/README.md`. The importer also accepts an already-unpacked directory, so the archive reader is never the only way in.

#### Acquisition: manual export now, own plugin next

The step that gets data *out of Figma* is the only part not under this repository's control, so it is isolated deliberately: everything downstream of the snapshot is identical whichever path produces it. That is why the snapshot is the boundary.

| Path | Aliases | Availability | Status |
| --- | --- | --- | --- |
| **A. Figma's native variable export → `tokens:import`** | resolved — `_aliases.yaml` authored | available now, no plugin involved | **in use** |
| **B. Variables REST API** | preserved | Enterprise only — **not expected** | ruled out |
| **C. Own Figma plugin** (`figma.variables.getLocalVariablesAsync()`) | **preserved** | any paid plan | **the target** |

The export in the 2026-08-22 snapshot came from Figma's own native export, so path A carries no third-party dependency — one fewer thing to track.

Path B is closed. The Variables REST API is Enterprise-only and Enterprise is not expected, so no part of this design may assume it.

**Path C is where this is going.** The Plugin API returns each variable's `valuesByMode` with `VARIABLE_ALIAS` entries intact, which is precisely what the native export discards. A plugin therefore does not merely automate path A — it removes the problem that makes `_aliases.yaml` necessary at all, turning the alias map from an authored file into generated output that `tokens:check` verifies. This also answers the "whether" half of open decision #18; the plugin's own scope, transport, and build get their own decision record when they are decided.

**Why not build the plugin first, then?** Because the plugin is the smaller half of the value and the larger half of the unknown. The normalizer, the canonical layer, and the checks are needed identically on both paths and are days of work; a plugin is weeks, and everything waits behind it. Path A ships the pipeline now, and the plugin swaps one input for another later.

**Consequence for how `_aliases.yaml` is written.** Because it is destined to become generated output, it must be a **pure fact file** — token to reference, per mode, nothing else. No rationale, no comments explaining why a role points where it does, no hand-tuning that would be lost. Anything worth saying about a mapping goes in a foundation document or a decision record, not in the file the plugin will overwrite.

For the same reason the initial map is generated from one reviewed value-matching pass rather than curated by hand. It is scaffolding with a known demolition date; treating it as a lovingly maintained artifact would be effort spent twice. This is the mistake `import-component-registry.mjs` made in the other direction — a generator whose output people started hand-editing, leaving the generator unusable — and the fix is to decide up front which side of the line the file is on.

**Trigger for building the plugin:** whichever comes first — manual export becoming a bottleneck on the update cycle, or `_aliases.yaml` maintenance costing real time as the semantic layer grows.

#### Direction

This mechanism is **export only**. Writing tokens back into Figma from the repository remains an explicit non-goal ([ADR 0001](0001-figma-connection-model.md)); paths B and C are both technically capable of it, and neither is authorised to. If a canonical-source-of-truth model is ever wanted, that is a new decision, not a capability to switch on.

### 10. What implementation changed

Built and verified against the 2026-08-22 snapshot on the day this record was written. Three things the design did not anticipate:

- **`space` aliases `space-scale` cleanly** — all 37 semantic spacing roles resolve to exactly one primitive. The alias mechanism is therefore not colour-specific, and `_naming.yaml` declares the primitive source per semantic collection (`draws_from`) rather than hard-coding palette.
- **Shadow colours are aliases after all.** `shadow/base` and `shadow/primary` matched nothing on exact value, but both match a palette entry on RGB alone: `base/black`/`base/white` and `indigo/700`, reused at 3% and 4% opacity. Rather than record them as literals, the alias entry carries `ignore_alpha: true` and is verified on RGB — which keeps the theming link that treating them as literals would have thrown away. `shadow/base` is also mode-dependent, joining the declared list.
- **The alias map is complete**: 147 references across two semantic collections, none unresolved. `_aliases.yaml` is roughly 450 lines.

Canonical output is 8 files, 598 canonical tokens (996 per-mode values), ~124 KB.

## Alternatives considered

**Keep JSON, normalize in place.** Cheapest. Rejected: it leaves two structured-data formats in one repository for no gain, and the readability problem — which is the point of having a canonical layer at all — is not solved by rearranging JSON.

**Make the canonical set the source of truth and write back to Figma.** This is the eventual ideal and is what would remove the whole normalization problem. Rejected now: [ADR 0001](0001-figma-connection-model.md) makes writing to Figma an explicit non-goal until a reliable round trip exists, and nothing about that has changed. The canonical layer is a derived record, one-directional, exactly like the snapshot it comes from.

**One script: export straight to CSS.** Rejected per §1 — it would embed Figma's mode names in every consumer.

**Infer aliases at build time, no authored map.** Rejected per §2 — proven fragile by a collision already present in the data.

**Adopt Style Dictionary or a DTCG toolchain now.** Rejected for the reasons already recorded in [ADR 0004](0004-frontend-library-foundations.md): full control over the mapping, no external config DSL, no dependency whose cadence Stylos does not control. The restricted-subset YAML rule in §4 is where that trade-off is paid, and §4 also states the condition under which it should be revisited.

## Consequences

- The repository gains a top-level `tokens/` directory. `ARCHITECTURE.md` §1 gains a row — canonical tokens, *derived*, produced by `tools/normalize-tokens.mjs` — and §6's list of derived artifacts gains an entry.
- `tools/tokens-report.mjs` is rewritten to read `tokens/` rather than the raw snapshot, and is renamed to the `tokens:report` command. Its alias-recovery check moves into the normalizer, where it becomes verification of an authored map instead of inference.
- Foundation documents keep citing the report, not values. The command they name changes to `npm run tokens:report`; the four foundation documents must be updated when the rename lands. Nothing about [ADR 0006](0006-proportional-logic.md) or the no-transcription rule changes.
- `_aliases.yaml` is a real maintenance obligation: roughly 110 entries today, growing with the semantic layer. That is the price of having the alias graph as a record rather than a guess, and it is the same price the component registry already pays.
- Two authored files now sit next to generated ones in the same directory. The `_` prefix marks them; the generated files carry a header saying they are generated. If that proves too subtle, the authored inputs move to `tokens/_source/`.

## Follow-up

- Implement `tools/import-tokens.mjs` and `tools/normalize-tokens.mjs`, wired to the `tokens:*` command namespace in §9. Rename the existing `report:tokens` / `validate:tokens` scripts into it.
- Bootstrap `_aliases.yaml` from one reviewed value-matching pass, and treat the two known palette collisions (`zinc`/`neutral`) as the test case that the map — not the matcher — is what the system relies on.
- Fix `neutral/50` and `neutral/950` in Figma to 8-bit values, or record why they are not.
- Stage 3's `build-tokens.mjs` reads `tokens/`, never the snapshot.

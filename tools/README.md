# tools/

Only scripts required to build or validate project artifacts. Kept small and dependency-free during Alpha (master doc [§20.5](../docs/master-document.md#205-tools)) — add a dependency only when a script genuinely can't do its job without one.

## `build-skills.mjs`

Compiles `skills/src/*/SKILL.md` into `skills/dist/stylos-figma-agent.md`, in the order declared by `skills/targets/figma-agent.md`. No dependencies — plain Node, run via:

```bash
npm run build:skills       # write skills/dist/stylos-figma-agent.md
npm run validate:skills    # fail if dist/ is missing or stale relative to src/
```

Fails loudly (not silently) if: the include order references a skill directory that doesn't exist, or a skill's `SKILL.md` is missing YAML frontmatter or a `name`/`version`.

## `import-component-registry.mjs` and `lint-registry.mjs`

`import-component-registry.mjs` converts an Airtable component-registry CSV export into one YAML file per component under `docs/components/registry/`. It's a one-time-per-refresh bootstrap tool, not a sync — see [docs/components/registry/README.md](../docs/components/registry/README.md) for why hand-editing YAML directly is the expected long-term workflow rather than re-running this against Airtable repeatedly.

`lint-registry.mjs` validates the generated (or hand-edited) YAML: every `children`/`parents` reference must resolve to a real component `id`, and every `level` must be one of the five confirmed values (primitive, element, object, widget, layout).

```bash
npm run import:registry     # regenerate docs/components/registry/*.yaml from the stored CSV (overwrites hand edits)
npm run validate:registry   # check registry references and levels are internally consistent
```

Both are deliberately dependency-free — the CSV parser and the YAML reader are small and purpose-built rather than pulling in a real CSV/YAML library, per the "keep tools/ small" rule below. If the registry schema grows meaningfully more complex, that trade-off should be revisited rather than the regexes stretched further.

## The token pipeline

Turns a Figma variable export into a canonical, self-verifying record. Built to [SPEC 0001](../docs/specs/0001-token-pipeline.md); the reasoning is [ADR 0007](../docs/decisions/0007-token-normalization.md).

```bash
npm run tokens:import -- --collection radius ~/Downloads/"Mode 1.tokens.json"
npm run tokens:check               # verify tokens/ against itself
npm run tokens:check -- --strict   # also fail on warnings
npm run tokens:report              # render current values as Markdown, to stdout
npm test
```

`import-tokens.mjs` reads the files you hand it and writes `tokens/<collection>.yaml`. **The exported files are never committed** — they are input, read once and discarded; `tokens/` is the record. It also **never searches for its input**: you name the collection you are updating, and the name must be one declared in `tokens/_naming.yaml`, which is the whitelist. Run it with no arguments to list them.

Figma names each file after its **mode**, not its collection, so a full refresh downloads five files called `Mode 1.tokens.json` and three called `Value.tokens.json`. Filenames are therefore ignored entirely: the mode is read from inside the document, and the variable ids are checked against those already in `tokens/`, so a file handed to the wrong collection is refused with the name of the collection it really belongs to. A collection with several modes (`palette`, `color`) must be imported whole — one mode alone would leave the other at a different moment in time.

`check-tokens.mjs` verifies the canonical set **against itself**, needing no Figma export: every reference resolves, none loop, and a role referencing a different token per mode is declared in `_naming.yaml`. A bound token stores no value, so there is no stored copy to disagree with anything.

`tokens-report.mjs` renders `tokens/*.yaml` as Markdown. This is why no foundation document transcribes a token value — a copied value is wrong at the next tweak in Figma.

Fails loudly on: a reference that does not resolve or that loops; a token with neither a value nor a reference; a reference bound across modes (a dark-mode variable pointing into `palette.light`); a role referencing a different token per mode without being declared `mode_dependent`, and the converse; a stale `mode_dependent` entry; token names differing between a collection's modes; a colour space other than sRGB, which cannot be stored as hex; and a YAML round-trip that does not reproduce what was intended. Colours that are not 8-bit representable are warnings, not failures — `--strict` promotes them.

## `lib/`

Shared, dependency-free modules for the above.

`lib/yaml.mjs` is a writer and reader for a deliberately restricted subset of YAML, as a matched pair — block collections only, everything non-numeric quoted, no anchors or flow syntax. The reader throws on anything the writer would not have produced, naming the line. This is what keeps `tools/` dependency-free without pretending to implement the YAML spec; if the subset stops being enough, that is the signal to take a dependency in a new decision record, not to stretch the parser.

`lib/convert.mjs` turns Figma's DTCG shape into canonical documents, and holds the checks that only mean anything while the raw export is in hand — colour space and 8-bit representability.

`lib/verify.mjs` checks the canonical set against itself — every reference resolves, none loop, mode dependence is declared.

`lib/tokens.mjs` loads `tokens/*.yaml` into an in-memory model and resolves references — following `effect/shadow/color/base` through `color` into `palette`, in whichever theme is asked for. It is the one place that knows the canonical shape, so a consumer never re-implements YAML → model — the planned colour and accessibility viewer is meant to use it rather than grow a second reader.

## Future candidates

Not built yet — see [docs/decisions/0001-figma-connection-model.md](../docs/decisions/0001-figma-connection-model.md):

- A Figma REST API script to pull variable snapshots and/or component screenshots automatically, now that a real component inventory exists to point it at (`docs/components/registry/`).
- Link/heading/duplicate-rule validation across skill sources (master doc [§19](../docs/master-document.md#19-skill-source-and-distribution-architecture) mentions this as a build-model goal; not implemented — `build-skills.mjs` currently only validates structural completeness, not cross-skill rule conflicts).

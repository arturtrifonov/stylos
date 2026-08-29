# tools/

Only scripts required to build or validate project artifacts. **Kept small and dependency-free** — a dependency is added only when a script genuinely cannot do its job without one, because every one of them is a thing to track, update and be broken by — add a dependency only when a script genuinely can't do its job without one.

## `build-skills.mjs`

Compiles `skills/src/*/SKILL.md` into `skills/dist/stylos-figma-agent.md`, in the order declared by `skills/targets/figma-agent.md`. No dependencies — plain Node, run via:

```bash
npm run build:skills       # write skills/dist/stylos-figma-agent.md
npm run validate:skills    # fail if dist/ is missing or stale relative to src/
```

Fails loudly (not silently) if: the include order references a skill directory that doesn't exist, or a skill's `SKILL.md` is missing YAML frontmatter or a `name`/`version`.

## `import-component-registry.mjs` and `lint-registry.mjs`

`import-component-registry.mjs` converts an Airtable component-registry CSV export into one YAML file per component under `docs/components/registry/`. It's a one-time-per-refresh bootstrap tool, not a sync — see [docs/components/registry/README.md](../docs/components/registry/README.md) for why hand-editing YAML directly is the expected long-term workflow rather than re-running this against Airtable repeatedly.

`lint-registry.mjs` validates the generated (or hand-edited) YAML on two levels. The registry as a whole: every `children`/`parents` reference resolves to a real component `id`, ids are unique, each file sits at the path its `id` implies, and every `level` is one of the five confirmed values. And each contract, for the fields it carries: statuses, property kinds, accessibility statuses, sizing axes and line-height families inside their vocabularies; a default among its property's values; a `do_not_use_when` alternative that exists; a variant count matching the product; a controlled group that is adjacent; a sizing run matching the size property value for value; every dimension and type measure in that run written as a token name rather than a number, and resolving against `tokens/`; a value with a finding and a reason for shipping it. **Absence is never a failure** — 93 entries carry no contract at all, and every contract check runs only where its field is present. See [SPEC 0003](../docs/specs/0003-component-page.md) §3.

```bash
npm run import:registry     # regenerate docs/components/registry/*.yaml from the stored CSV (overwrites hand edits)
npm run validate:registry   # check the registry and every contract in it against itself
```

## `build-site.mjs` — the publishable tree

```bash
npm run build       # → build/
```

The one command that produces something uploadable. It writes the home page, the registry view and all 101 component pages, and copies `assets/` in beside them; the three renderers stay runnable on their own for the edit loop, but only this one carries the fonts, so only its output is complete.

It calls the renderers rather than spawning them — one process, one read of `tokens/` and of the registry, and an error that stops the build instead of leaving half a tree behind. It clears `build/` first, so a page belonging to a component that has since been renamed cannot survive into a publish.

## `build-home.mjs`

The front door, and deliberately a placeholder: a wordmark, one sentence about what Stylos is, three counts derived from the registry, and a door into each of the two views. It exists so the published tree opens on something other than a 101-row table, and it is the first thing a real documentation surface replaces ([`PLAN.md`](../PLAN.md) Stage 6).

It also draws the core set wave by wave: one bar per wave of [`PLAN.md`](../PLAN.md) Stage 4, the track proportional to how many components are in that wave and the filled part to how many are ready. The count and the percent are written beside every bar, because the bar is the second cue and never the only one. Which components a wave is made of is not written here: the bar is the shape of the work, and the registry view is where you filter to a wave and read its members.

It used to draw one bar per `import.batch`; that was Airtable's sequencing from the day of the import, which `PLAN.md` §4 states is history and not the queue — and a chart is the strongest way there is of saying something *is* the queue ([`0004`](../docs/specs/0004-registry-reconciliation.md) §3.4).

### `lib/plan.mjs`

Reads the two tables in `PLAN.md`: §4, the waves the v0.1 core set is worked in, and §9, the groups everything after it is worked in. Both the home page and the registry view read them through here, so neither holds a copy and neither can claim an order the plan has since changed.

The two are kept apart rather than numbered on from 6. §9 states it carries no order inside a group, no estimate and no date; a chip reading "Wave 7" would say it did. The registry view shows them in one **Queue** column and filters them as two facets; the home page charts the waves only.

The Entries column is prose written to be read, so two forms are accepted: a full id, and the family shorthand `Radio Input / Label / Text`, where the first part is a full id and each part after it is joined to that entry's `family`. A full id is tried first, so `Table / TD Text` reads as itself — the two use the same punctuation and only the registry can tell them apart. **A token that resolves to nothing throws**: a wave quietly one component short is a wrong percentage nobody would ever catch.

There is deliberately no `wave:` field on the registry entry. It would put the plan's sequence into a hundred files that are edited for entirely different reasons, and the two would part company inside a week.

`plannedIds` is the union of both tables, and `npm run validate:registry` reports any entry outside it. That is what makes the plan's claim to place every entry exactly once checkable rather than asserted.

`assets/column.png` is optional. When it is absent the page is built without it and the build says so once.

## `build-registry-view.mjs` and `build-component-page.mjs`

The two readable views over the same data, both generated from `docs/components/registry/` and neither committed.

```bash
npm run registry:view       # build/registry.html — the filterable index over every entry
npm run components:view     # build/components/ — one page per component, plus an index
```

Self-contained by construction: CSS, script and data are inlined, nothing is fetched at build time or at open time, and the files are opened from disk over `file://` where a sibling `fetch` would be blocked. Links between pages are relative, so the tree can be copied anywhere. The only absolute URLs in either output are the Figma links built from the entries themselves and the SVG namespace on the inlined wordmark, and a test enforces that.

The one thing not inlined is the fonts: four woff2 subsets under `build/assets/fonts/`, one shared copy for the whole tree, because 101 pages × 116 KB of base64 is a 12 MB output for four files. They are still local — nothing is fetched over the network, which is what the constraint was for. A page copied out of the tree on its own loses them and falls back to the system stack.

`build-component-page.mjs` renders the contract as it is: sections whose fields are absent are omitted rather than filled with "not specified", and an entry with no contract says so once and then shows the inventory record it does carry. Every place a rendered sample belongs gets a **preview slot** — a placeholder at the dimensions `sizing_model` says the real render will take. Filling those means exporting from Figma, which is separate work; `previewSlot` is the one function that changes when it happens.

**Token names are resolved, not printed.** `sizing_model` carries addresses into `tokens/` — `box: "size/s-2_000"`, `line_height: "line height/string/0_750"` — and the page shows the resolved value with the name beneath it. A table of bare names is unreadable; a table of bare numbers loses the scale. `lib/sizing.mjs` holds the field-to-collection map, because `size/s-2_000` is a dimension and `size/0_750` is a font measure and only the field name says which. The join happens on every build and nothing is copied into the contract.

It also holds the composer for a component's Figma description, which is derived from `summary`, the first `use_when` and the first `do_not_use_when` rather than authored. Nothing writes it to Figma from here — the repository does not write to Figma at all ([ARCHITECTURE.md](../ARCHITECTURE.md) §1) — but whatever does will take the text from one place.

Both are deliberately dependency-free — the CSV parser and the YAML reader are small and purpose-built rather than pulling in a real CSV/YAML library, per the "keep tools/ small" rule below. If the registry schema grows meaningfully more complex, that trade-off should be revisited rather than the regexes stretched further.

## The token pipeline

Turns a Figma variable export into a canonical, self-verifying record. Built to [SPEC 0001](../docs/specs/0001-token-pipeline.md), which also carries the reasoning.

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

`lib/theme.mjs` dresses the generated pages from `tokens/`. Seventeen colour roles, six radii, a seven-step type scale and both families, each an address into the canonical set, resolved on every build through the same loader `tokens-report.mjs` uses and emitted as custom properties for light and for dark. [SPEC 0002](../docs/specs/0002-registry-viewer.md) §4.3 asked for no hand-coded Stylos colour in the viewer and there is none — the rule it was protecting is that a copied value rots, and a resolved one cannot. It is a theme and not an implementation: the pages are hand-written HTML, no Stylos component is used in them, and this is not the CSS build of [`PLAN.md`](../PLAN.md) Stage 3. A role whose token stops resolving is dropped and named on stderr rather than defaulted, so a page degrades to the browser's own colours instead of to a wrong one.

`lib/yaml.mjs` is a writer and reader for a deliberately restricted subset of YAML, as a matched pair — block collections only, everything non-numeric quoted, no anchors or flow syntax. The reader throws on anything the writer would not have produced, naming the line. This is what keeps `tools/` dependency-free without pretending to implement the YAML spec; if the subset stops being enough, that is the signal to take a dependency in a new decision record, not to stretch the parser.

`lib/convert.mjs` turns Figma's DTCG shape into canonical documents, and holds the checks that only mean anything while the raw export is in hand — colour space and 8-bit representability.

`lib/verify.mjs` checks the canonical set against itself — every reference resolves, none loop, mode dependence is declared.

`lib/tokens.mjs` loads `tokens/*.yaml` into an in-memory model and resolves references — following `effect/shadow/color/base` through `color` into `palette`, in whichever theme is asked for. It is the one place that knows the canonical shape, so a consumer never re-implements YAML → model — the planned colour and accessibility viewer is meant to use it rather than grow a second reader.

## Future candidates

Not built yet — see [docs/decisions/0001-figma-connection-model.md](../docs/decisions/0001-figma-connection-model.md):

- A Figma REST API script to pull variable snapshots and/or component screenshots automatically, now that a real component inventory exists to point it at (`docs/components/registry/`).
- Link/heading/duplicate-rule validation across skill sources (not implemented — `build-skills.mjs` currently only validates structural completeness, not cross-skill rule conflicts).

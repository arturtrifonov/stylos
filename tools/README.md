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

`lint-registry.mjs` validates the generated (or hand-edited) YAML on two levels. The registry as a whole: every `children`/`parents` reference resolves to a real component `id`, ids are unique, each file sits at the path its `id` implies, and every `level` is one of the five confirmed values. And each contract, for the fields it carries: statuses, property kinds, accessibility statuses, sizing axes and line-height families inside their vocabularies; a default among its property's values; a `do_not_use_when` alternative that exists; a variant count matching the product; a controlled group that is adjacent; a sizing run matching the size property value for value; every dimension and type measure in that run written as a token name rather than a number, and resolving against `tokens/`; a value with a finding and a reason for shipping it. **Absence is never a failure** — most entries carry no contract at all, and every contract check runs only where its field is present. See [SPEC 0003](../docs/specs/0003-component-page.md) §3.

```bash
npm run import:registry     # regenerate docs/components/registry/*.yaml from the stored CSV (overwrites hand edits)
npm run validate:registry   # check the registry and every contract in it against itself
```

## `validate-rules.mjs`

Validates the guideline documents — `docs/RULES.md`, `docs/principles.md`, the four guideline directories and `docs/components/STANDARD.md` — against the grammar in [`docs/RULES.md`](../docs/RULES.md).

```bash
npm run validate:rules   # also runs inside npm test
```

**Fails** on: an ID that does not match the grammar or does not follow the file it is in; one ID on two rules; a rule block whose statement opens with no level, or that carries no `Why:`; an ID cited in `docs/`, `skills/src/`, `packages/ui/src/` or `tools/` that no rule carries; a guideline file with no header or a status outside *Yet to fill · Partial · Confirmed*; a directory `README.md` whose table disagrees with a file or omits one.

**Reports** — exit 0, because they are judgements: the file and rule counts per directory, a *Confirmed* file carrying no rule block (today, the eight foundations still to be migrated — that report is the migration queue), and a rule naming no `Checked by:`, which review satisfies.

A citation is an ID written as bare text. One inside a fenced block or a code span is a specimen — that is what lets `RULES.md` print an example rule block — and fixtures are skipped entirely: those in `tests/rules/` and those written inline in a `*.test.mjs`, since a fixture citing nothing is the fixture working. Built by [SPEC 0013](../docs/specs/0013-guideline-structure.md) §5.

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

Reads the two tables in `PLAN.md`: §4, the waves, and §9, the milestones. The vocabulary — what a milestone is, how it differs from a release and from a wave — is [`ARCHITECTURE.md`](../ARCHITECTURE.md) §8. Both the home page and the registry view read them through here, so neither holds a copy and neither can claim an order the plan has stopped stating.

**They are two axes, not two values of one.** Every entry has a milestone; only the milestone being worked has been cut into waves, so most entries have no wave and a blank there means unsequenced, not missing. The registry view gives each its own column and its own facet, and the home page charts both — waves with tracks scaled to their size, milestones all full width, because a milestone is a checklist rather than a quantity of work. `0.1` is the one place the tables meet: §4 *is* its checklist, so §9 does not list its members again and `milestoneById` supplies it.

A §9 header the parser does not recognise throws, naming the stale header if it finds one. Reading a rename as "there are no milestones" would empty a facet, a column and a chart at once, and every one of them would look deliberate.

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
npm run tokens:css                 # project tokens/ onto CSS custom properties
npm run tokens:report              # render current values as Markdown, to stdout
npm test
```

`import-tokens.mjs` reads the files you hand it and writes `tokens/<collection>.yaml`. **The exported files are never committed** — they are input, read once and discarded; `tokens/` is the record. It also **never searches for its input**: you name the collection you are updating, and the name must be one declared in `tokens/_naming.yaml`, which is the whitelist. Run it with no arguments to list them.

Figma names each file after its **mode**, not its collection, so a full refresh downloads five files called `Mode 1.tokens.json` and three called `Value.tokens.json`. Filenames are therefore ignored entirely: the mode is read from inside the document, and the variable ids are checked against those already in `tokens/`, so a file handed to the wrong collection is refused with the name of the collection it really belongs to. A collection with several modes (`palette`, `color`) must be imported whole — one mode alone would leave the other at a different moment in time.

`check-tokens.mjs` verifies the canonical set **against itself**, needing no Figma export: every reference resolves, none loop, and a role referencing a different token per mode is declared in `_naming.yaml`. A bound token stores no value, so there is no stored copy to disagree with anything.

**A withdrawal is named, not noticed.** An import that removes a token from a collection already in `tokens/` refuses, lists what disappeared, and prints the `--withdraw <collection/token>` flags to re-run with — one per token, and a `--withdraw` for a token that is *not* disappearing fails too, because a stale acknowledgement would cover the next real one. Each withdrawal is recorded in `tokens/_history.yaml` beside the import that carried it. This lives here rather than in the CSS build because this is where a token actually disappears: `tokens/*.yaml` is committed and is the record, while the CSS is a build result with no baseline to compare a run against ([SPEC 0007](../docs/specs/0007-tokens-to-css.md) §6).

`build-css.mjs` projects the canonical set onto CSS custom properties — 957 of them, into `packages/ui/dist/tokens.css`, with `tokens.json` recording which canonical token each name came from. Built to [SPEC 0007](../docs/specs/0007-tokens-to-css.md). Neither file is committed. It reads `tokens/*.yaml` and nothing else, and it refuses to run at all on a set that fails `tokens:check`.

Three things in it are authored rather than read, because Figma has no field for them: the five slot bindings, the font fallback stacks, and the shadow composition. **The slot layer is the one that matters** — Figma binds `surface/bold/primary/default` straight to `indigo/700`, and the generator makes the indirection real, so rebinding a slot is thirteen redeclared properties per scope instead of 110 role overrides. The bindings being authored is what lets them be checked: every aliasing role, in both modes, must reach the hue group its name implies, and a role rebound in Figma to a hue outside its slot fails the build naming the role, the slot and the group it actually reached.

`tokens-report.mjs` renders `tokens/*.yaml` as Markdown. This is why no foundation document transcribes a token value — a copied value is wrong at the next tweak in Figma.

## `build-ui-types.mjs` and `build-ui-stories.mjs`

The `@stylos/ui` generators ([SPEC 0009](../docs/specs/0009-stylos-ui-package.md) §4), run together with `tokens:css` by `npm run ui:generate`. Both read the registry through `lib/registry.mjs` and generate only for components that have a directory under `packages/ui/src/components/` — a directory appears when a component's `.svelte` is written, and a directory matching no registry entry fails the build.

`build-ui-types.mjs` writes `props.ts` per component from the entry's `api`, under the §3 mapping rule — variant values as a string union, verbatim — so a wrong prop value is a compile error and the 1:1 props ↔ `api` mapping is checked by the compiler rather than by eye. This is the condition under which TypeScript was accepted ([ADR 0002](../docs/decisions/0002-frontend-stack.md)): types are generated, never hand-written.

`build-ui-stories.mjs` writes one Svelte CSF story file per component into `apps/workshop/stories/generated/`, with a `default` case and a case per documented variant value, every other prop at its contract default. The directory is regenerated wholesale, so a story survives exactly as long as its contract does.

Both outputs are gitignored and rebuilt, like every generated thing.

## `build-icons.mjs` — the icon set

```bash
npm run icons:import      # assets/icons/manifest.yaml → assets/icons/svg/*.svg
```

Draws each icon named in the manifest out of the Material Symbols variable font at the one instance [`icons.md`](../docs/foundations/icons.md) fixes — Rounded, `wght 500`, `FILL 1`, `GRAD 0`, `opsz 20` — and writes it as an SVG carrying geometry only: the upstream `0 -960 960 960` box, `currentColor`, no size, no ARIA.

Run by hand, never from a build. The SVGs are committed, so a change to the set or to the instance arrives as a readable diff — the same rule `assets/fonts/` follows — and nothing downstream needs the font. `npm test` fails if `svg/` and `manifest.yaml` disagree, which is what makes editing the manifest without re-running this a caught mistake rather than a silent one.

A name that does not shape into exactly one glyph stops the import. A blank icon that ships is worse than a build that stops.

**This is the exception to the dependency-free norm at the top of this file**, and the only one: `fontkit`, `wawoff2` and `material-symbols`, all devDependencies, none of them on any build path. Instancing a variable font and reading a glyph outline is genuinely not something plain Node can do, and the alternative — the stock `@material-symbols/svg-NNN` packages — cannot supply `opsz 20`, because those are drawn at `opsz 48` and optical size is a redrawing rather than a scale. `wawoff2` is there for a narrower reason: fontkit's `getVariation` cannot read a WOFF2, so the packaged face is decompressed to TrueType in memory first.

## `build-ui-icons.mjs`

```bash
npm run ui:generate       # assets/icons/svg/*.svg → packages/ui/src/components/icon/icons.ts
```

A projection, in the same sense `tokens:css` is one: the committed SVGs are the source and this restates them as data the Icon component renders, so nothing parses markup at runtime and nothing anywhere needs `{@html}` — no injection shape, no sanitiser to keep. The emitted shape is [SPEC 0012](../docs/specs/0012-icon-system.md) §4, which is also the shape a client's replacement set has to satisfy, so the default set and a replacement are one type.

A file it cannot read whole stops the build. These SVGs are generated, so an unreadable one means `build-icons.mjs` changed underneath — a half-read drawing reaching the component would be a mark that is wrong rather than absent.

Not to be confused with `build-icons.mjs` above: that one draws the set out of the variable font and is run by hand; this one runs on every `ui:generate` and never touches a font.

## `build-ui-css.mjs`

The independent CSS export ([SPEC 0010](../docs/specs/0010-distribution-surface.md) §2.2), run by `npm run ui:generate` after the two generators above. It copies each built component's authored `src/components/<name>/<name>.css` to `packages/ui/dist/css/<name>.css` unchanged, and concatenates all of them, in registry order, into `dist/css/stylos.css` with a generated header naming the version and the components inside. No transform, no minification, no autoprefixing — a build that improved a value on the way through would be a second source of it. Neither output contains `tokens.css`: a consumer links tokens separately, because that is the file a client theme overrides. A component directory without its authored CSS fails the build.

The CSS build fails loudly on: two token names that slugify to one custom property, naming both; a role whose alias contradicts its slot; a `var()` referencing a name the file does not define; the two scopes declaring different sets of properties; a string token with no authored fallback stack; and a token in `tokens/` that did not reach the output — there is no allowlist and no pruning by current usage, because that would make the CSS a function of the component set rather than of the token set.

`tokens:check` and `tokens:import` fail loudly on: a reference that does not resolve or that loops; a token with neither a value nor a reference; a reference bound across modes (a dark-mode variable pointing into `palette.light`); a role referencing a different token per mode without being declared `mode_dependent`, and the converse; a stale `mode_dependent` entry; token names differing between a collection's modes; a colour space other than sRGB, which cannot be stored as hex; and a YAML round-trip that does not reproduce what was intended. Colours that are not 8-bit representable are warnings, not failures — `--strict` promotes them.

## `lib/`

Shared, dependency-free modules for the above.

`lib/theme.mjs` dresses the generated pages from `tokens/`. Seventeen colour roles, six radii, a seven-step type scale and both families, each an address into the canonical set, resolved on every build through the same loader `tokens-report.mjs` uses and emitted as custom properties for light and for dark. [SPEC 0002](../docs/specs/0002-registry-viewer.md) §4.3 asked for no hand-coded Stylos colour in the viewer and there is none — the rule it was protecting is that a copied value rots, and a resolved one cannot. It is a theme and not an implementation: the pages are hand-written HTML, no Stylos component is used in them, and it is not the CSS build — that is `build-css.mjs` below, [SPEC 0007](../docs/specs/0007-tokens-to-css.md). A role whose token stops resolving is dropped and named on stderr rather than defaulted, so a page degrades to the browser's own colours instead of to a wrong one.

`lib/yaml.mjs` is a writer and reader for a deliberately restricted subset of YAML, as a matched pair — block collections only, everything non-numeric quoted, no anchors or flow syntax. The reader throws on anything the writer would not have produced, naming the line. This is what keeps `tools/` dependency-free without pretending to implement the YAML spec; if the subset stops being enough, that is the signal to take a dependency in a new decision record, not to stretch the parser.

`lib/convert.mjs` turns Figma's DTCG shape into canonical documents, and holds the checks that only mean anything while the raw export is in hand — colour space and 8-bit representability.

`lib/verify.mjs` checks the canonical set against itself — every reference resolves, none loop, mode dependence is declared.

`lib/tokens.mjs` loads `tokens/*.yaml` into an in-memory model and resolves references — following `effect/shadow/color/base` through `color` into `palette`, in whichever theme is asked for. It is the one place that knows the canonical shape, so a consumer never re-implements YAML → model — the planned colour and accessibility viewer is meant to use it rather than grow a second reader.

## Future candidates

Not built yet — see [docs/decisions/0001-figma-connection-model.md](../docs/decisions/0001-figma-connection-model.md):

- A Figma REST API script to pull variable snapshots and/or component screenshots automatically, now that a real component inventory exists to point it at (`docs/components/registry/`).
- Link/heading/duplicate-rule validation across skill sources (not implemented — `build-skills.mjs` currently only validates structural completeness, not cross-skill rule conflicts).

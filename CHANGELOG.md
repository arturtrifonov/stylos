# Changelog

All notable changes to the Stylos Design System project (foundations, components, skills, documentation, and — later — the code package) are recorded here. Format is loosely [Keep a Changelog](https://keepachangelog.com/); the versioning rules — what one version line covers, what major, minor and patch mean here, and what is not promised before `1.0` — are [`ARCHITECTURE.md`](ARCHITECTURE.md) §9. **This file is the only source of release notes**: the GitHub release body and the Figma publish description are copies of a section below, made when the release is cut.

## [Unreleased]

### Added — 2026-09-06 (the workshop documents from the registry)

- **Autodocs, fed by the contract** — the story generator now writes each component's docs page from its registry entry: summary, purpose, use-when and do-not-use-when (with *Instead*), limitations and the contract's path, plus a per-story description wherever a variant value carries a note, a rationale or an a11y finding. Nothing is authored in the workshop and nothing is restated — the entry is the documentation. `@storybook/addon-docs` joins the workshop to render the pages.

### Added — 2026-09-06 (Loader — the first animated component)

- **`Loader`** — the fourth component of `@stylos/ui`, and the first whose animation is the component. The contract turned out to have imported a drawn state as API: `angle` exists in Figma so the prototype can step the rotation, and no consumer sets an angle on a thing that must never stand still — it is now a `figma_notes` entry under the registry's drawn-state exception, and the contract has **no properties**. The generators learned the case (`LoaderProps = Record<string, never>`, one story). The DOM stays one empty span: the arc is the Figma mark's geometry as an SVG mask in the CSS (ring of thickness 2 in a 20-box, 270°, round caps), painted `text/primary` — the one colour the contract fixes — at 5/6 of the element *by percentage*, so `width`/`height` in consumer CSS is the whole sizing story: the token is the default, nothing is mandatory, and the mark follows any resize. The open timing question is decided in the implementation: one turn per second, linear, because easing on a loop reads as a stutter. Under `prefers-reduced-motion` the rotation is replaced — not stopped — by a slow opacity pulse, the entry's "stop or be replaced" obligation; announcing the wait stays the consumer's.

### Changed — 2026-09-06 (weight roles say what they mean: base / emphasis / strong)

- **`weight/normal`/`semibold`/`bold` → `weight/base`/`emphasis`/`strong`** (400/450/600) — the old words were typeface-weight vocabulary and two of them lied in it: CSS `bold` means 700 (ours is 600), the industry's `semibold` means 600 (ours is 450). The role is a level of accent; `emphasis`/`strong` carry the ordering HTML authors know from `em`/`strong`. Renamed in Figma, withdrawn and re-imported through the ritual, cascaded through `badge.css`, the Badge contract and `typography.md` — which also stops claiming bold is 700; 600 is the decision. The text styles were regrouped in Figma to match (`text/base|emphasis/*`, `label/base|emphasis/*` — labels' pair is case, not weight) and the record and `text.css` follow. All 32 styles now resolve: the `family/string`/Manrope binding and the drifted paragraph spacing are fixed at the source, so `text.css` no longer skips anything.

### Added — 2026-09-06 (the text styles are recorded, and shipped as CSS)

- **`figma/text-styles.yaml`** — the record of the 32 Figma text styles, which Variables exports cannot carry: `tools/import-styles.mjs` takes a Plugin API read of the Styles file and writes aliases into `tokens/`, never raw values; each alias is cross-checked against the value the style actually renders, and a binding that does not resolve is recorded under `unresolved` rather than dropped or invented. Elevation needed no record of its own — the live effect styles were verified layer-by-layer against `foundations/effects.md`'s composition rule, and the rule is the record; `focus/*` is out of scope by decision.
- **`@stylos/ui/text.css`** — one class per recorded style (`.stylos-heading-h2`, `.stylos-text-normal-medium`, …), every declaration a `var()` into `tokens.css`, written by `tools/build-text-css.mjs` in `ui:generate`. Uppercase labels become `text-transform`; the headings' 110 width axis becomes `font-stretch: 110%`; paragraph spacing, which has no non-opinionated CSS analog, rides along as `--stylos-paragraph-spacing` for the consumer to apply. A style with an unresolved binding is skipped loudly in the file header, not projected with a dangling `var()`.
- **`assets/avatars/`** — the 25 avatar paint styles are image fills, not values; exported once at 256×256 JPEG (~1.5 MB total, from ~50 MB of originals). They enter the package when the Avatar component slice needs them.

### Added — 2026-09-06 (the Indicator family — two components, as the registry split them)

- **`IndicatorStatus` and `IndicatorSpecial`** — the second and third components of `@stylos/ui`, built to their registry entries on the pattern Badge proved: authored CSS keyed on data attributes, a thin Svelte wrapper, generated `props.ts` and stories. Two components, not one: the registry split the old Indicator deliberately — semantic colour that judges (`text/*`) against categorical colour that identifies (`text/special/*`) — and one code component would re-merge the vocabularies into a 30-value tone prop where a category compiles in a status seat. The element is the footprint and the dot is a `::before` that keeps its own dimension when a layout resizes the footprint — the entry's sizing model, decoupled runs and all. Static primitives on slice 1's proven chain; slice 2 (Checkbox Input, first interactive) is still next.

### Added — 2026-09-06 (the package supplies its fonts)

- **The font export** — `@stylos/ui/fonts.css` plus the woff2 subsets under `dist/assets/fonts/`, written by `tools/build-ui-fonts.mjs` in `ui:generate`. `tokens.css` names Georama and JetBrains Mono; until now nothing in the package supplied them, and every consumer — the workshop first — silently fell back to the system stack. The faces are rendered by the same `fontFacesCss` (`tools/lib/theme.mjs`) the registry-viewer pages use, from the same committed files under `assets/fonts/` — copied at build, never fetched, so a font update is a deliberate commit with a diff. SPEC 0010 §2.1 is amended in place; the workshop now imports the export it tests.

### Changed — 2026-09-06 (Badge's default size is medium)

- **`size` defaults to `medium`, not `extra large`** — in the registry entry, the wrapper and everything generated from them. `extra large` was the import's accident, not a decision; `medium` is the middle of the ramp and the size a badge dropped into running text should take.

### Added — 2026-09-06 (the code surface of the distribution — SPEC 0010 Part A)

[SPEC 0010](docs/specs/0010-distribution-surface.md) specifies everything `@stylos/ui` hands to a consumer, split in two: Part A, the code surface, lands now; Part B — `registry.json`, the consumer skill, the design-system bundle, the exported lint config — is Stage 6 work toward `0.3.0`. `PLAN.md` is rewritten around the sharpened `0.3.0` gate: the code half of the proof screen is built **by an agent from the published artifacts alone**, without access to this repository.

- **The exports map** — `packages/ui/package.json` declares the full target surface of SPEC 0010 §2.1: `./tokens.json`, `./css`, `./css/*.css`, `./registry.json`, `./registry/*.json`, `./stylelint` and `./skill` join `.` and `./tokens.css`. The `dist/` paths are generated; the Part B paths resolve when Part B lands.
- **The CSS export, per component and in aggregate** — `tools/build-ui-css.mjs` copies each built component's authored CSS to `packages/ui/dist/css/<name>.css` unchanged and concatenates them, in registry order, into `dist/css/stylos.css`. Neither file contains `tokens.css` — a consumer links tokens separately, because that is the file a client theme overrides. Runs in `ui:generate`, so every package build carries it.
- **The DOM contract is public** (SPEC 0010 §2.3) — entry `id` → class `stylos-<slug>`, `api` variant/boolean → `data-<kebab-name>` verbatim, text/slot → element content. It is what `Badge.svelte` already writes; stating it makes hand-written HTML and the Svelte wrapper's output the same string.

### Added — 2026-09-06 (`@stylos/ui` exists — the first vertical slice)

Built to [SPEC 0009](docs/specs/0009-stylos-ui-package.md). The repository is now an npm workspace: `packages/ui` is the Svelte 5 component package, `apps/workshop` is its Storybook.

- **Badge is the first built component** — authored `badge.css` (every value a `var(--stylos-…)`) and `Badge.svelte`; every documented variant renders in the workshop from `tokens.css` alone.
- **Props types and stories are generated from the registry, never authored** — `tools/build-ui-types.mjs` writes `props.ts` per component from its entry's `api` (variant values as a string union, so props ↔ `api` is checked by the compiler); `tools/build-ui-stories.mjs` writes one story per component with a case per documented variant value.
- **Stylelint holds the token boundary** — `color-no-hex`, `unit-disallowed-list: px` and declaration-strict-value on colour, spacing and size, over `packages/ui/src/**` including `.svelte`.
- **`npm run validate:registry` reports drawing-only state in `api`** — `state` carrying `hover`/`active`/`focus`, or an `is focused` property, belongs in `figma_notes`; `read only` joins `state` in [`naming.md`](docs/foundations/naming.md) §4. Per SPEC 0009 §5 the entries are corrected per component, as each contract is opened for implementation.
- **CI runs the package** — lint, `svelte-check`, the package build and the workshop build, after the four checks.

### Added — 2026-09-06 (the development and release flow exists)

Built to [SPEC 0008](docs/specs/0008-development-and-release-flow.md). On 2026-09-05 an agent's command fast-forward-merged a branch into `master` because there was nothing to refuse it; this is the flow that refuses it. **No component, token or contract value changed.**

- **`master` is the release line, reached only by pull request** — normative in [`ARCHITECTURE.md`](ARCHITECTURE.md) §7. Work branches from `master`, goes up with `gh pr create`, and lands by squash-merge on GitHub; a release is a decision cut by the ritual in the spec, not a side effect of a merge. `.githooks/` refuses a commit on `master` and a push to it without `STYLOS_RELEASE=1` (enabled per clone by `git config core.hooksPath .githooks`); the shared `.claude/settings.json` denies `git merge`, `git tag` and force-push in agent sessions; `CLAUDE.md` states the rules an agent follows.
- **CI on every pull request** — `.github/workflows/ci.yml` runs the four checks (`npm test`, `validate:registry`, `validate:skills`, `tokens:check`) and proves the two generators (`tokens:css`, `build`) on Node 22.
- **`@stylos/ui` moves to lockstep versioning** — `ARCHITECTURE.md` §9 amended: the package shares the system's number until `1.0`, when a separate schedule returns as an option.
- **The definition of done is the pull-request template** — the four checks, documents corrected in the same PR, an `[Unreleased]` line when the change earns one, generated output never hand-edited.

### Added — 2026-09-06 (the accessibility target and browser baseline are decided)

- **[`accessibility.md`](docs/foundations/accessibility.md) — WCAG 2.2 Level AA, WAI-ARIA 1.2 with APG patterns, and Baseline Widely available as the browser floor.** A rule in `foundations/`, not a decision record, per the bar `docs/decisions/` sets. The target ratifies what the registry already does — every criterion citation reads WCAG 2.2 and every cited criterion is A or AA — so no existing finding is re-judged; what changes is that `warning` now names the bar it fails against. The browser floor is Baseline rather than an authored version list because Baseline is checkable mechanically and maintained by someone else, with per-case named exceptions working the way raw values do in Figma. An assistive-technology matrix is deferred, in as many words, until Stage 5's tests give it a reader. [`PLAN.md`](PLAN.md) Stage 4 and Stage 5 now point at the document instead of carrying the open question.

### Added — 2026-09-06 (the frontend stack is decided)

- **Decision record [0002](docs/decisions/0002-frontend-stack.md) — Svelte 5, TypeScript, Zag.js for behaviour.** The first record since the purge of 2026-08-23, and kept because the choice now clears the bar `docs/decisions/` sets: Stage 5's package work is starting, every component will be written against this stack, and reversing it later rewrites the package rather than adjusting it. Melt UI stops being named as the leading candidate anywhere — the argument for Zag's state machines over a Svelte-bound builder library is made once, in the record. [`PLAN.md`](PLAN.md) Stage 5 and [`naming.md`](docs/foundations/naming.md) now point at it instead of carrying a provisional answer.

### Added — 2026-09-06 (the record renders as CSS)

Built to [SPEC 0007](docs/specs/0007-tokens-to-css.md), and the first half of [`PLAN.md`](PLAN.md) Stage 5. `tokens/` has been the canonical record since Stage 1 and nothing outside this repository could read it; this is what makes it consumable without transcribing a value.

- **`npm run tokens:css` writes 957 custom properties.** `tools/build-css.mjs` reads `tokens/*.yaml` and nothing else — no network, no Figma access — and writes `packages/ui/dist/tokens.css` with a `tokens.json` manifest beside it. Neither is committed (`packages/*/dist/`), because both are cheap to rebuild and a generated file in git is a second record. It refuses to run on a set that does not pass `npm run tokens:check`.
- **A projection, not a second record.** No value is improved on the way through: `radius/round` is emitted as `1000px` because that is what the token says, and a generator that rounded it to `9999px` would be the second source of truth this whole pipeline exists to avoid.
- **One name rule, three substitutions, applied to the whole string** — lowercase, `/` → `-`, space → `-`, and nothing else touched. Two canonical names that slugify to the same string fail the build, named on both sides; the generator does not disambiguate and does not rename. The rule is not reversible — `-` stands for both `/` and a space — which is what `tokens.json` is for: the generator that produced the name records where it came from.
- **The slot layer is synthesised, because Figma has no slot layer.** Figma binds roles straight to palette steps; the five slots exist in [`color.md`](docs/foundations/color.md) as a fact about that binding rather than as variables. The build makes the indirection real — 65 properties per mode, all thirteen steps of each slot whether a role uses them or not — so a client rebrand is five bindings rather than 110 overrides, with the generator writing the other 130 lines.
- **The five bindings are authored in the generator rather than derived, and that is the point.** Derived from the data they would agree with it by construction and check nothing. Stated, `color.md`'s central claim — 66 slot-bound roles drawing on exactly five hue groups — becomes a build failure the moment a role is rebound in Figma to a hue outside its slot.
- **The palette is flat and unscoped; the semantic layer is emitted twice, complete both times.** All 110 roles in the light scope and all 110 in the dark, including the ones whose value does not change — if the dark scope redeclared only the differences, a client override in light would inherit into dark. One global switch, in three states, with an explicit `data-theme` beating the system preference in both directions.
- **`draws_from` in [`tokens/_naming.yaml`](tokens/README.md) got its first reader.** Declared and unread since the pipeline was built, it was still holding two collection names that had not existed since `space` became `dimension`.

### Changed — 2026-09-06 (the repository stops asserting things that are not true)

`0.1.0` was tagged and the CSS build landed while a dozen documents went on describing the state before both. Stage 0's standing gate is that nothing in the repository is known to be false; this restores it. **No component, token or contract value changed.**

- **`ARCHITECTURE.md` describes the CSS build instead of promising it.** §2.1 said the conversion and the package were "both planned but unbuilt" and called the command `tokens:build`, which is a name nothing has ever answered to; §4 listed CSS token output under *What does not exist*. The §2.1 diagram drew `──✗──▶ CSS` and cited an `_aliases.yaml` that is not in `tokens/`. §3 gained rows for `tokens/_history.yaml`, `figma/library.yaml` and `packages/ui/dist/`, all generated and only the first two committed. The `~71 KB` skill build is 86 KB, and the number is gone rather than corrected — it was wrong within a fortnight and would be again.
- **A break §5 records as closed stopped being listed as open.** §2.3 still called skill installation "manual and unversioned" while §5 had recorded the unversioned half closed on 2026-08-24. Installation is still manual, and now that is all it says.
- **Three counts and two lists that the registry contradicts.** `registry/README.md` said every entry says `draft`; thirty-nine say `ready`. It said a component had been split three times — Checkbox, Radio, Indicator — where six have: Toggle, Tag and Button Icon followed. `docs/components/README.md` used `Icon Button` and `Table / TD Text` as examples of the path rule, and neither id exists — every entry has been flat since 2026-09-02 — and it called Button's family *base, hollow, ghost*, which is `Button Base`, `Button Outline`, `Button Ghost`.
- **Two pointers into a stage that no longer exists.** `color.md` and `ARCHITECTURE.md` §2.2 both sent the reader to `PLAN.md` Stage 3 for the CSS build; Stage 3 was folded into Stage 5, where the build's output finally has a reader.
- **`docs/research/README.md` named a pending investigation that is closed**, `PLAN.md` §8 called the interim icon source Material Symbols where every other statement in the repository says Material Icons and says explicitly that it is not Symbols, and `tokens/README.md` said the `_` prefix marks the authored files while sitting directly above a table listing `_history.yaml` as generated. The prefix marks what the pipeline treats specially.
- **`0001-figma-connection-model`'s amendment banner now covers everything the body outlives.** The record is left as it was written — correcting an ADR's body rewrites the understanding along with the fact — and the banner names the third library file (*Stylos / GUI components*, not "GUI Helpers"), the phase numbers no stage maps onto, and every place the deleted `figma/variables/exports/` still appears.
- **A paragraph inside `[0.1.0]` still described the work as unfinished** — `status` staying `draft`, `[Unreleased]` unrolled, no tag cut — which was true when it was written and false by the time the section shipped. Its one surviving claim, the untested variant-property rename, is stated as what it is.
- **SPEC 0006 is Built.** Its own header and its row in `docs/specs/README.md` both still read Open, with the tag cut and the library published.
- **`docs/foundations/README.md`'s state column agreed with none of the files it indexes.** It held four foundations open — color's theme contract, which spacing steps stay, sizing's Element/Object scale, effects' shadow scale — where each file's own header reads `Status: Confirmed`. Confirmed by Artur, 2026-09-06: the files are current and the table was stale. It now says what each file says, and says in as many words that confirmed means the structure and the rules are settled rather than that nothing is left — `color.md` and `effects.md` keep their *Open* sections, which are questions inside a settled model.

### Fixed — 2026-09-06 (three contract fields the loader never saw)

`html`, `figma_notes` and `motion` were absent from `KNOWN_FIELDS` in `tools/lib/registry.mjs`, so they fell into `extra`, the validator never checked them and the page never rendered them. The field meant to be the agent's constraint surface did not reach the reader: `badge.html` showed no "no semantic html", and none of Dropdown's six `figma_notes` appeared anywhere.

- **All three are known to the loader**, and they reach the page where each is read. `html` joins the identity facts in the **Record** block — the semantic sketch is the reason a component's `a11y` block can be short, so a page that hides it makes the silence look like an omission. `motion` and the Figma notes get sections of their own, the notes set quieter than the contract above them because nothing in them constrains an implementation.
- **The validator enforces the shapes `registry/README.md` defines.** `figma_notes` is a sequence of strings and nothing else. `motion` has exactly three keys — `drives`, `loop`, `intent` — and the closed set is the rule: durations, easing curves and per-step timings are how one implementation runs the idea, and a block that accepted them would turn whatever the Figma prototype happens to do into a specification. `drives` is an anchor into `api` the same way `controls` is, so a renamed property breaks loudly.
- **Two new reports, both judgements.** A `ready` entry with no `html` — `"no semantic html"` is a value and absence is not — and a `motion` block with no `intent`, which is the same gap a `sizing_model` without one has. Neither fires on the current set.
- [SPEC 0003](docs/specs/0003-component-page.md) carries the three fields in §3.1, §3.2 and §4.1, in the same change that added them.

## [0.1.0] — 2026-09-05

The first release, and the first thing in this project carrying a number. It fixes the contracts for the thirty-nine components a dense product screen needs, and the Figma library that implements them.

**What it is.** Thirty-nine registry entries carry a complete contract — what the component is for, where it must not be used and what to reach for instead, its public API property by property, its sizing model written in token names rather than numbers, its accessibility findings and the reason anything ships despite one. Each was checked against the live component on 2026-09-05, reads `status: ready` and `version: "0.1.0"`, and records the node it is implemented by.

**What it is not.** There is no code package: `@stylos/ui` and the CSS build arrive at `0.2.0`, and the screen that proves the whole chain at `0.3.0` ([`PLAN.md`](PLAN.md) §1). The other seventy-five registry entries carry an inventory record only — they are placed in [`PLAN.md`](PLAN.md) §9 and nothing here promises them. No public documentation surface, no native icon set, no mobile support, and no license: the repository is `UNLICENSED` and the library is private.

**What is promised.** Below `1.0`, very little, and deliberately ([`ARCHITECTURE.md`](ARCHITECTURE.md) §9): a breaking change may ship in a minor release, and the only undertaking is that these notes name it when it does. What the tag means is that the thirty-nine contracts describe the library as it stands, and that a change to one of them from here on is recorded rather than silent.

### Figma library

- **Thirty-nine components are covered.** The library holds more than that; the rest are in it because they are drawn, not because this release says anything about them.
- **Names lead from the registry.** The twenty-one ids that carried a slash group became compound names on 2026-09-02, and the library was renamed to match as each contract was written. `id` and the Figma name are equal for every component this release covers.
- **Descriptions are composed, never authored.** Each covered component's `descriptionMarkdown` is built from its entry's `summary`, `use_when` and `do_not_use_when` by `stylos-description-sync`. The twenty-nine icon marks share one line instead: they differ in nothing but the drawing, and what they need said is that they are swapped into a slot rather than placed.
- **The library states its own version.** `meta/version` in *Stylos / Styles* reads `0.1.0`. It is hidden from publishing — a version is not a token and does not belong in a consumer's variable list — so it is read from that file by its key ([`figma/README.md`](figma/README.md)).
- **Nothing here removes a component, a variant or a property.** What would, and what would not, break an instance is [`ARCHITECTURE.md`](ARCHITECTURE.md) §9.

Everything below, down to the next version heading, is the record of the work this release is made of, newest first. **The release body is this section down to the first dated heading** — above it is what `0.1.0` is, below it is how it came to be, which is worth keeping and not worth pasting into GitHub.

### Changed — 2026-09-05 (what a version means here, and the road cut into three)

Stage 4 closed on 2026-09-04 with all thirty-nine core contracts written, and nothing in the repository marked it. The one number the plan had reserved — `v0.1` — was defined as something four months away, so tagging under that definition would have made the repository assert four things that were not true. Written as [SPEC 0006](docs/specs/0006-versioning-and-release-0-1-0.md); this is what has landed of it.

- **One label was doing duty for two bars, and now there are three tags.** `PLAN.md` §1 defined `v0.1` as one dense screen built twice from Stylos alone; `PLAN.md` §9 and `ARCHITECTURE.md` §8 defined the milestone `0.1` as the thirty-nine-contract checklist. The seven requirements are not dropped, they are distributed: `0.1.0` fixes the contracts and publishes the library, `0.2.0` makes the system render, `0.3.0` is the old `v0.1` gate with its bar untouched. All three fall inside the `0.1` milestone — a release is a tag, a milestone is a decision about distribution, and §8 already said they are not the same thing. **The schedule moved by one row and no other**: publishing a library was never priced, and it is priced now rather than discovered.
- **`ARCHITECTURE.md` §9 is new and answers the versioning question without sending the reader anywhere.** One version line covers the contracts, the tokens and the Figma library, because a registry entry *is* that library's contract and holds its `figma.node_id` — versioning them apart would track a difference that must not be allowed to exist. Semver is read against the contract rather than the code. And it says in as many words that below `1.0` a major change may ship in a minor release and the only commitment is that the notes name it: a stability guarantee a solo project cannot honour is worth less than none, because it is believed once.
- **Figma compatibility is not version negotiation.** A consumer cannot pin or install an earlier version of a library — an update is to the latest publish or nothing — so §9 answers the only question there is: does this change break existing instances. Deleting a component, a used variant or a property does; so does moving a component to another file, which mints a new key and orphans every instance. Renaming does not, which is what makes the core renames free before the first publish.
- **`status: published` became `status: ready`.** Figma publishes a *file* — everything in it goes out at once, and there is no per-component publish state to mirror. `published` was a fact maintained by hand about something the tool does not have, and it would have gone stale the first time the file was published without it being updated. The vocabulary, the linter's staleness report and the component page all move with it.
- **The two columns of the index stopped sharing a word.** Putting the authored `status` in the table beside the derived readiness made both read `ready`, meaning two different things, with the column heading as the only thing separating them — and nobody reads a heading twice. The derived vocabulary is now `complete` · `in progress` · `not started` and its column is **Contract**, which is what it actually computes: STANDARD.md's first gate, *Complete enough to publish*, which names the prose fields and `figma.node_id` together. The `documented` column, one of its two inputs, is relabelled **Written** — calling an input by the name of the result is what made the pair unreadable. A row now says `Contract: complete · Status: ready`, or `Contract: complete · Status: draft`, and both are sentences.
- **The marker moved to the column that decides something.** The coloured dot was on the derived state and the authored one was plain text, which put the visual weight on the cheaper fact. In an index the first question is whether the component is ready, not whether its record is finished, so `Status` carries the dot and `Contract` reads as plain text beside it.
- **The one direction the two may disagree in is now checked.** `status: ready` asserts both gates of `STANDARD.md`, and the first of them is exactly what the contract state computes — so `ready` on an incomplete contract is the registry contradicting itself and `npm run validate:registry` fails it, naming which half is missing. The converse is not a finding: a complete contract on a `draft` component is the ordinary state of everything written up and not yet checked in Figma, which is most of the core set between a wave closing and the release pass reaching it.
- **`version` on a registry entry says something checkable, or it was decoration in thirty-nine files.** It is the release in which the entry's current API shipped — bumped when `api` changes, never for prose, findings, `last_verified` or appearance. Normalised from `"0.1"` to the full `"0.1.0"` across the set, so it reads against a git tag without interpretation and sorts. `npm run validate:registry` now fails a version that is not a release string, and one ahead of `package.json` — a contract cannot have shipped in a release that has not been cut.
- **The published library states its own version, in a variable rather than a frame.** A `Meta` collection in *Stylos / Styles* carries one `STRING`, `version`. A variable because an agent reads variables — the plugin API, the REST API and `get_variable_defs` all reach it — and a cover frame reaches none of them while being a second copy of a fact besides. `npm run tokens:import -- --collection Meta <file>` records what it said into `figma/library.yaml`, generated and never hand-edited, and `npm run tokens:check` fails when that disagrees with `package.json`. It goes to `figma/` rather than `tokens/` because a version is not a token.
- **The limit on that check is stated rather than papered over.** The export is manual and per-collection, so it answers what the library reported at the last export and nothing about right now. That is enough: the moment the number has to be right is the release, and the release is when the export is made. Before the collection exists the check warns rather than failing — there is nothing to disagree with yet, which is a gap to close, not a contradiction.
- **`CHANGELOG.md` is the only source of release notes.** The GitHub release body and the Figma publish description are copies of a section here. GitHub Milestones are declined for the same reason `ARCHITECTURE.md` §8 exists: the milestone list is already normative in `PLAN.md` §9 and parsed by `plan.mjs` on every build, and a second copy is the thing being prevented.

**Block B of the spec — the Figma pass over the thirty-nine — followed on 2026-09-05**: the integrity and naming runs, the core renames, the `documentationLinks` targets and the `Meta` collection itself. That is what turned `status` to `ready` across the set, rolled this section up, and made the tag cuttable. One thing it did not settle: **the variant-property rename behaviour is still untested where it matters.** `content` became `content slot` on Drawer and Modal with nothing visibly broken, but neither component had instances, so that is an absence of evidence rather than evidence, and it stays open until a rename lands on a component something actually uses ([SPEC 0006](docs/specs/0006-versioning-and-release-0-1-0.md) §12).

### Added — 2026-08-27 (readiness, so the registry reads at a glance)

`build/registry.html` is a table of 99 rows in which the two facts that say how far a component has been taken — `documented` and `linked` — sat at the far right as two words reading "yes" or "—". Reading which components are ready meant reading two columns and doing the AND in your head, row by row.

- **One derived word, second column, in colour.** `readiness()` in `tools/lib/registry.mjs` reads the two flags as `ready` · `in progress` · `not started`, and the view carries it as a sortable and filterable column beside the component name. Today it says 4 ready and 95 not started, which is the true picture.
- **Still derived, never authored** ([SPEC 0002](docs/specs/0002-registry-viewer.md) §3.2). `derive()` keeps its shape and readiness is composed from it, so there is no third fact to keep in step and nothing to tick by hand.
- **Colour is the second cue, never the only one.** The cell carries the word; the tone and the dot only make the column scannable, and the two tones are the ones the generated component page already uses — green for done, amber for partway, muted for neither. No Stylos colour is hand-copied in, so the migration to generated custom properties is still the same swap.
- **The authored lifecycle is shown apart from it.** `status` — `draft` / `published` / `deprecated` — was a known field that the view dropped on the floor; it now sits in the detail panel beside level and role. A complete record of a draft component is a real state, and conflating it with readiness would have made the new column lie.

### Added — 2026-08-27 (the component page, and a validator that reads the contract)

Built to [SPEC 0003](docs/specs/0003-component-page.md). The contract became data on 2026-08-26; this is what reads it.

- **`npm run components:view`** writes `build/components/` — one self-contained HTML page per entry, plus an index. Same constraints as the registry viewer: everything inlined, nothing fetched at build time or at open time, output gitignored and rebuilt rather than committed, links between pages relative so the tree can be copied anywhere. Every row in `build/registry.html` now links to its page, legacy entries included.
- **The page renders what exists and invents nothing.** A section whose fields are absent is not a heading over a blank space; it is not there. An entry with no contract says so once and then shows the inventory record it does carry, which is the state of 93 of the 96 entries.
- **Token names are resolved at build time, not printed.** `sizing_model` carries addresses into `tokens/` — `box: "size/s-2_000"`, `line_height: "line height/string/0_750"` — and the page shows the value with the name beneath it. A table of bare names is unreadable and a table of bare numbers loses the scale: the reader has to see 16 · 20 · 24 · 28 · 32 *as a run* and see that it is `s-2_000` through `s-4_000`. Font size and line height sit on those same rows rather than in a typography section of their own, because they move with the box and are read against it. `tools/lib/sizing.mjs` holds the one copy of the field-to-collection map — `size/s-2_000` is a dimension, `size/0_750` is a font measure, and only the field name says which.
- **The preview slot is the one deliberately unfinished thing.** Every place a rendered sample belongs gets a placeholder at the dimensions `sizing_model` resolves to — the height being the taller of the box and the line box, which is why no height is recorded and why `Checkbox Text` is 18 tall at extra small where `Checkbox Label` is 16. Filling them means exporting from Figma, which is separate work; `previewSlot` is the only function that changes when it happens, and nothing structural moves.
- **`npm run validate:registry` now enforces the contract**, field by field, where the field is present: statuses, property kinds, accessibility statuses, sizing axes and line-height families inside their vocabularies; a default among its property's values; a `do_not_use_when` alternative that resolves; a variant count matching the product of the value counts; a controlled group adjacent to its boolean ([`naming.md`](docs/foundations/naming.md) §9); a sizing run matching the size property value for value; every dimension and type measure in that run written as a token name rather than a number, and resolving against `tokens/`; a value carrying a finding and no reason for shipping it. It reports what only a person can settle — a contract missing narrative, a property with no description, a sizing model with no intent, a `warning` naming no criterion, a published entry verified against Figma more than 90 days ago, a family of one.
- **Absence is never a failure.** Every contract check runs only where its field is present, so the 93 inventory-only entries pass without being pretended to be contracts. A test asserts it rather than a comment claiming it.
- **The Figma description is composed, not stored.** `composeFigmaDescription` builds the three lines from `summary`, the first `use_when` and the first `do_not_use_when`. Nothing writes it to Figma — the repository does not write to Figma at all — but whatever does will take the text from one place.
- `documented` changed meaning with the model. It was "a Markdown document exists at the mirrored path"; it is now "the entry carries a `summary`, a `purpose`, at least one `use_when` and a `description` on every property". Still derived, still nothing to tick by hand.

### Changed — 2026-08-26 (a component's contract is its registry entry)

The per-component Markdown document is withdrawn. `docs/components/_template.md`, `checkbox-input.md`, `checkbox-label.md` and `checkbox-text.md` are deleted, and the registry entry carries the whole contract — [`STANDARD.md`](docs/components/STANDARD.md), schema in [`registry/README.md`](docs/components/registry/README.md).

- **A template is an attempt to formalise prose, and prose only ever looks uniform.** Nothing checked that a section was present, that a value existed, that a named alternative still existed, or that a property list matched Figma. Every one of those is checkable once the contract is data, and none of them was checkable before.
- **Prose did not disappear — it moved into fields.** `purpose`, `use_when`, `do_not_use_when`, a `description` on every property, `rationale` on a value, `sizing_model.intent`, `limitations`. What disappeared is prose with nowhere to belong.
- **`sizing_model` holds token names, never numbers.** `box: 16` is a copy of a value that lives in `tokens/` and is wrong the first time the scale moves; `box: "size/s-2_000"` is an address, and everything downstream resolves it. There is no `height` field either — a height is equal to the box or derived from the box and the line box, and `intent` says which. Typography joined the same rows for the same reason: size, gap, font size and line height change together.
- **Accessibility stopped being a section.** A finding attaches to the thing it is about: `size = extra small` is 16 tall, so the finding sits on that value; focus is unmodelled, so the finding sits on `state`; a component with no name of its own carries a `requires` on itself. A value that fails a criterion and ships must say why — the file records the decision, not just the defect.
- **`instead` is an anchor, not a phrase.** A `do_not_use_when` that names an alternative names a component that exists, and the validator fails otherwise. A renamed alternative breaks loudly rather than leaving a sentence pointing at nothing.
- **The Figma description gets no field.** It has paragraph breaks, which this YAML subset cannot express, and a second copy of text that already exists in three fields is a second copy that drifts. It is composed at build time from those three.
- Three contracts were written this way — `Checkbox Input`, `Checkbox Label`, `Checkbox Text` — replacing `checkbox.yaml`, whose `id: "Checkbox"` matches no component in Figma. That file still exists and thirteen entries still name `"Checkbox"` as a child; splitting those references is a judgement about allowed composition and is left open.

### Changed — 2026-08-24 (a loaded skill names its own version)

- `skills/README.md` and `PLAN.md` Stage 0 gave two different answers to the same question. The plan said the version belongs in `description`; the README said a loaded skill is identified "by comparing the text, not by trusting a number". Comparison is not a workable answer — it means diffing seventy kilobytes by hand at the moment you want a one-word answer.
- Settled on the description, with one condition: **the version is appended by `tools/build-skills.mjs` from each source's `metadata.version`, never typed in.** A hand-written version is a claim about a file that becomes false the moment the file changes without it — which is precisely when the question is asked. Three versions were bumped in this repository today with no build between them.
- The two questions are also separated: the description answers *which* build is loaded in Figma; `npm run validate:skills` answers whether `dist/` matches the sources at all.

### Changed — 2026-08-24 (`stylos-reference-reconstruction` v0.2)

The rules in this skill were already right. What failed was that its central step produced nothing anyone could see.

- **The semantic mapping is now required, printed, and concrete.** It was described as an internal structure to use "when useful" — optional, and invisible, so skipping it left no trace. The report then listed what was mapped *after* the build, which means it could be written from whatever was produced rather than from a plan that drove it. Rows now name real assets and real property values, and a row with an empty asset column is not a mapping — that role goes to the gap list instead of becoming an improvised shape.
- **The mapping is what gets delegated.** The Figma Agent hands the actual construction to an executor that never sees the skill: it cannot learn that a component exposes `has checkbox` unless the instruction says so, and given a goal rather than a mapping it will build the shape out of primitives. Everything in the skill is invisible downstream, so a rule only the planner has read cannot constrain a build the planner does not perform. Printing the mapping is not an approval gate — it prints and proceeds.
- **Verification counts before it judges.** Thirteen "confirm that…" items were all internal opinions. The report now opens with instances placed, instances detached, layers drawn from primitives, and the components used by name. Those can be checked without opening the file; "preserved the hierarchy" cannot.
- **The report reports departures from the mapping, not the mapping again.** It was printed before the build, so repeating it doubles the output and hides the one thing worth reading — where the build diverged from the plan.
- `Primary type` in the mapping example is `tone=primary`; buttons carry `tone`.

### Added — 2026-08-24 (component descriptions)

- **A component's Figma description is written when its document is written** ([`STANDARD.md`](docs/components/STANDARD.md), [`PLAN.md`](PLAN.md) Stage 4). Three lines: what it is for by role, what it is not for and which neighbour is, and where it normally lives if it is used inside another component — points 2 and 3 of the standard, compressed to what Figma carries.
- Besides the name, the description is the only thing shown in the Assets panel, in Dev Mode, and to an agent searching the library. That last part is a **hypothesis, not a measured result**: whether richer descriptions improve how `reference-reconstruction` finds roles is untested, and how the orchestrator reads the library is not documented anywhere we can see. The description earns its place for a designer browsing the panel regardless, which is why it is recorded as a deliverable rather than as a fix.

### Changed — 2026-08-24 (`stylos-component-integrity-check` v0.3)

Only what had fallen behind. The skill's substance is sound and is left alone — it already marks its own summaries as examples rather than a closed vocabulary, carries twelve rules against inventing findings, refuses to fabricate an allowlist, and reports the sizing exceptions as information rather than faults. That is the discipline `naming-cleanup` had to be taught this week.

- **Dead variable names in the report examples.** `Text Size / 1_125` → `font/size/1_125`; `Size / 1_500` → `size/s-3_000`. Neither path exists any more. The skill reads bindings rather than making them, so nothing failed — but an agent takes the shape of a report from its examples, and a plausible name in a retired scheme reads as a real finding. Nothing in the repository refers to the old scheme now.
- **`/` no longer appears as a path separator in reports.** Component names now use a slash for Assets-panel grouping ([`naming.md`](docs/foundations/naming.md) §2), so a report that also used it for hierarchy made the two indistinguishable. Every level is separated by `›`, and a variant is written as Figma names it — `size=medium, state=hover` rather than `Button / medium`.
- Example component names follow the current library — `Button Basic`, not `Button`.

**Left as it is, deliberately.** Two findings from the review are not defects at this stage:

- The report says what it found but not what it covered, so `No problems found` cannot be weighed against how much was inspected.
- `Info` findings repeat on every run: a legitimate unbound icon-container width is re-announced forever, because a declared exception has nowhere to live that the skill can read.

Both resolve the same way and neither needs the skill changed: once a component is documented, its exceptions are recorded there and the audit's list is reconciled against them once, in Stage 4. The skill is also intended to ship with the system for people checking components of their own, where there is no registry to read at all.

### Changed — 2026-08-24 (`stylos-naming-cleanup` v0.9 — the vocabulary stops judging)

Running v0.8 on Indicator produced one rename and a page of architectural questions. Two mistakes, both introduced in v0.8 and both mine.

- **The tone vocabulary was wrong.** It listed the five semantic slots plus `inverted` and called everything else a defect. [`color.md`](docs/foundations/color.md) describes two kinds of colour role — 66 slot-bound and 44 hue-bound `*/special/*` for categorical colour — and the vocabulary was written from the first half only. Indicator is a coloured dot: exposing the whole palette on `tone` is exactly what it is for. `neutral` was also declared "another word for `base`", which is false — it is a palette hue group of its own, and `surface/special/neutral` exists. `secondary` and `tertiary` are real too: `text/secondary`, `background/tertiary`.
- **The skill should not have been checking values at all.** Whether `secondary` belongs on a component's `tone` is a design decision made when the component was designed, not a naming defect. A naming tool that walks every value asking which are permitted turns a rename into an architecture review, which is what it did.

The rule now: **mappings are applied, lists are not swept.** Seeing `Status` makes it `tone`; seeing `error` as a tone makes it `danger`. Nothing reports a value as missing, unlisted, or in need of justification. The Vocabulary section is a reference for mapping and says so in its heading.

- **`naming.md` restates `tone` as a condition rather than a list**: a tone value names a colour role the system has, of which there are three kinds — semantic slots, the neutral hierarchy (`secondary`, `tertiary`, `inverted`), and any palette hue by name. Only `error` and `info` are wrong, and only the first has a rename.
- The "Left alone" section added in v0.8 is what surfaced all of this. With the old counting report the run would have read "1 renamed" and the cause would have been invisible.

### Added — 2026-08-24 (Indicator splits)

- `Indicator` carries semantic status tones and the full categorical palette on one `tone` property, and one property cannot mean both. It becomes two components — `Indicator Status` for the semantic tones, a second for the hues — which is also how it was arranged before. Recorded in the component's registry entry; the work is Stage 4.
- The name order follows [`naming.md`](docs/foundations/naming.md) §2: the component's own name leads, so `Indicator Status`, not `Status Indicator`.

### Added — 2026-08-24 (how components are organised)

- **A slash may only be used where the last segment is a name that stands on its own.** Figma names an instance after the last segment and drops the rest of the path, so `Button / Base` becomes a layer called `Base` — meaningless in a layer tree — while `Tabs / Tab Item` becomes `Tab Item`, which is not. Related components that cannot share a path share a **prefix** instead: `Button Base`, `Button Hollow`. That prefix is also what Figma itself uses to decide components are related.
- **A slash group is a category, never a claim about containment.** A component used inside another stays top-level; `Tab Item` is not filed under `Tabs`. What is composed of what lives in the registry's `children` and `parents`, where it is checkable — a folder name is not.
- **Components used inside others stay public and unprefixed.** No `_` marker: publishing them is required for composition, so a marker prevents nothing, and a prefix lands in every nested instance and clutters the tree it was meant to help. Where a component is normally used inside another, its Figma description says so — visible in the Assets panel and in Dev Mode, free in the layer tree. Pagination's page links stay available for anyone building a custom paginator.
- **A visual treatment that shares anatomy and API is a `style` value, not a component — except where the variant matrix would make the set too large.** Button's base, hollow and ghost are conceptually `style`; they are separate components because a third dimension over `tone` × `size` × `state` triples the set and Figma's performance suffers at that size. Recorded in [`docs/components/README.md`](docs/components/README.md) as a declared exception, in the sense that section already defines: the contract says these are separate components and says the reason is a Figma limit, not a difference in the components. A Svelte implementation has no such limit and may expose one component with a `style` prop.

### Added — 2026-08-24 (two audiences)

- [`charter.md`](docs/charter.md) now distinguishes **the library's users from the infrastructure's user.** `docs/`, `tools/`, `tokens/` and `skills/` serve one person today, so a warning there aimed at nobody is clutter. Figma component names, their descriptions and the component documents are read by whoever designs with Stylos, and that set is meant to grow. The distinction is what decides whether a signal earns its place — the two were being conflated, which made "nobody would do that" look like an argument in both directions.

### Changed — 2026-08-24 (naming-cleanup, second pass)

- **A name collision is usually a name that is not specific enough.** Only a genuinely uniform list — five items, six page links — produces a real collision, and those are numbered. If one name fits two unrelated layers, they are two different things and each needs the name that says which; the skill now looks for the more precise name instead of resolving the conflict.
- **The breakage warning is removed.** The skill said to flag renames that could break a public API or existing instances, without saying which those are — a warning with no case behind it, so it either fires on everything or on nothing. Nothing leaves the library file until the library is published, and instances inside the file follow their component. The paragraph now records that, and records that publication is when to revisit it.

### Changed — 2026-08-24 (`stylos-naming-cleanup` v0.8)

- **One `Vocabulary` section replaces five copies.** The property values were stated in the variant-properties section, the size section, a "Meaning of common variant properties" section, the mappings table and the quality bar. Five copies is why `tone` ended up with two different lists that agreed with neither each other nor the tokens. The other sections now refer to the one.
- **The vocabulary marks each list as closed, vocabulary, or open** — a distinction the skill never made and that caused most of the confusion here. *Closed*: a value outside the list is a violation (`state`, `validation`, `size`, the booleans). *Vocabulary*: the words are fixed but the per-component subset is not, so offering only some is fine (`tone`). *Open*: the values belong to the component and only the naming convention applies (`type`, `style`, `orientation`, `alignment`, `position`). Without the third kind, `primary` and `secondary` sat in a global list of "good values" as though every component shared them.
- **Mappings are per property.** A flat list of values cannot map correctly: `Error` → `error` is right on `validation` and wrong on `tone`, where it is `danger`. That flat list is how the dead colours survived.
- **Four stale facts removed.** `density` (dropped from the system, and it appeared in three places); `size / xs` … `size / xl` presented as correct token naming, which the scale never used — it is `s-1_000`…`s-7_000`; `error`, `info` and `neutral` as tone values; `regular` and `compact`, which were density values.
- **The canonical property order now states its principle** — a property that changes the meaning of what is below it comes first — so an unlisted property can be placed by reasoning instead of by memory. Also added to [`naming.md`](docs/foundations/naming.md) §8, which is where the rule belongs.

### Changed — 2026-08-24 (how the skill applies and reports)

- **It applies directly instead of asking first.** The two-stage default meant every ordinary run produced a plan and waited. A rename is reversible and Figma keeps undo, so the gate bought nothing: a forty-line plan gets approved unread, which is worse than no gate because it looks like review. Confirmation now happens only where §Ambiguity rules already required it — a name a human has to choose — and about those names specifically.
- **The report shows the resulting state, not a list of edits.** "Is this right now" is a state; "what did you touch" is a diff, and the second was being printed for the first question. Closed properties are shown in full including unchanged values, because a missing `focus` is visible in a complete state set and invisible in a diff. Properties print in canonical order, so a wrong order shows itself.
- **"Left alone" is now required in every report.** Counting renames hid the skips, and a skipped name is exactly what a report exists to surface.
- **What the API cannot do is handed over as an instruction, not a sentence.** Property order cannot be changed through the Plugin API without breaking instance bindings, so it is always manual — and it was being emitted as `has active page → active page text → … → has page 6`, a horizontal chain with an ellipsis, to be carried out in a vertical panel by dragging. It is now a numbered list of the target order with every entry spelled out, and what is wrong stated once in prose underneath.
- `→` now means one thing in a report — "was renamed to". It previously also meant "comes before", in the same document.
- **Renames are passed down as finished pairs**, never as an intent. The Figma Agent delegates the actual mutation to a sub-agent that does not see the skill, so a constraint like "do not change auto layout" never reaches it; an instruction naming both ends of a rename has nothing else it could do.

### Removed — 2026-08-24 (`stylos-text-sizing`)

- **The skill is gone.** It bound font size and line height to `Text Size / [measure]` — a variable path Figma no longer has, so it would have failed on every component it touched. Beyond that it restated the Element and Object size→measure profiles that [`typography.md`](docs/foundations/typography.md) authors, which that document had already flagged as a duplicate waiting to drift; it performed a one-time operation, where the recurring need is the *check* that `component-integrity-check` already covers; and it was the narrowest of the four, one property pair on one layer, carrying its own version and its own slot in the imported document for that.
- Removed from the build target's include order and from the skills table. `typography.md` is now the only copy of the profiles. `src/shared/` no longer lists the size values as duplicated logic — only `naming-cleanup` uses them.
- If the mechanical application across five variants is wanted later, it belongs inside a broader component-building skill rather than as a skill of its own.

### Changed — 2026-08-24 (what a skill may restate)

Two rules added to `skills/README.md`, both learned from `naming-cleanup` carrying two different `tone` lists, neither matching the tokens:

- **A closed list may be restated in a skill; an authored rule may not.** Figma Agent reads one document and cannot reach the repository, so `state`, `validation` and the canonical size values have to be written in verbatim — they are short, stable, and changing one means changing both places. A rule that carries reasoning belongs in `docs/foundations/` and is cited, not retold.
- **A list of examples is not a whitelist**, and a skill that illustrates values has to say so — otherwise the illustration is later enforced as the permitted set. This is what happened to `tone`, whose values are a vocabulary each component draws from rather than a set every component must satisfy.

An earlier proposal to *generate* these lists into the skills at build time is withdrawn: there is nothing to generate them from. `size` and `state` are not tokens and have no machine-readable source, and the drift that prompted the idea was in an example enumeration, which generation would not have touched.

### Changed — 2026-08-24 (Stage 3 folded into Stage 5)

- **Tokens-to-CSS is no longer its own stage.** Custom properties can only be proved by something rendering with them, and nothing renders until the package exists — so a week of generation ahead of S5 produced output with no reader and no test. It is now the first step of S5, with the mode scoping, slot layer and cumulative shadow composition the foundations settled. Requirement 2 of the definition of done is unchanged; it is satisfied inside S5.
- The total is unchanged at **26 weeks** — the week did not vanish, it moved next to what consumes it. The critical path is now a single line: S0 → S4 → S5 → S6.

### Added — 2026-08-24 (the registry becomes readable — SPEC 0002)

- **`npm run registry:view` writes `build/registry.html`**, one self-contained file over the 96 registry entries: filter by level and role with counts visible before filtering, search, sort by any column, and a detail panel where `parents` and `children` are links that select that component. Following a relation used to mean finding and opening another file. CSS, JavaScript and data are inlined because the file is opened over `file://`, where fetching a sibling JSON is blocked — a two-file design would have failed silently in exactly the situation it is built for. No CDN, no font, no dependency, no socket. The output is gitignored: it is derived, cheap to rebuild, and committing it would put a 96-row diff into every registry change.
- **Two flags, both derived, neither authored.** `documented` is whether the component's Markdown document exists at the mirrored path; `linked` is whether a Figma node has been recorded. Nothing has to be remembered or ticked for either to become true. There is deliberately no status field: lifecycle is point 20 of `STANDARD.md` and belongs in the component's document, and a second place to record it would be the wrong one.
- **A `figma:` block in the registry schema** — `file_key`, `node_id`, `last_verified`, all optional. The `file_key` belongs to the entry rather than the repository, because components live in two Figma files. Both parts are copied straight out of the address bar — `node_id` in the URL's dash form — and the link is built from them rather than stored: a stored URL rots in a way the parts do not. There is no `type` field: nothing reads a node's kind, and Figma reports it itself when anything asks. Filled in as each component is opened in Figma for other reasons; there is no bulk sync and there is not going to be one.
- **`npm run validate:registry` now separates contradictions from judgements.** Fail (exit 1): a dangling reference, two files claiming one `id`, a file away from the path its `id` implies, a level outside the five, a `figma` block that could not address a real node — a node id with no file key, or a file key that is not one of the two component files. Report (exit 0): a relation recorded on one side only, a child at or above its parent's level, an entry with no relations at all. Nothing is repaired automatically, because which side of a mismatch is wrong is a judgement.
- **Rows are grouped by level by default**, with a toggle. Grouping is a display mode, not a filter: `Clear`, and following a relation into a filtered-out row, both leave it as it was. Level is the only grouping — the other columns are filters instead.
- **`import.batch` is filterable and sortable**, as its own column and its own chip group. It is Airtable's build sequencing and says which components were meant to come first, which is a real question to ask of the set; it stays labelled by its origin and date wherever it is shown. `import.ready` stays out of the table for the reason SPEC 0002 §3.2 gives — a checkbox from 2026-08-20 would be read as current status.
- The validator now reads the files with the real reader in `tools/lib/yaml.mjs` instead of the regexes it carried, via a shared `tools/lib/registry.mjs` that the view builder also uses. The regexes could not have seen inside a `figma:` block, and the two tools cannot now disagree about what an entry is.

### Changed — 2026-08-24 (the registry is hand-edited, and says so)

- **Every registry file's header comment is replaced.** It used to say the file was generated and would be overwritten by re-running the importer; the registry README said the opposite. Hand-editing is the workflow, and the files now say that.
- **`import:registry` is removed from `package.json`.** `tools/import-component-registry.mjs` is kept as the record of how the registry came to exist — a one-time import that ran on 2026-08-20 — and now refuses to run without `--overwrite-hand-edits`, since it deletes and rewrites all 96 files rather than merging. Its output was checked to reproduce the current files byte for byte, so nothing was lost in the reformatting.
- **An empty list omits its key** rather than writing `[]`: the restricted YAML subset has no flow-collection syntax, and every reader of the registry now goes through it. Absent and empty mean the same thing.
- **The CSV export was less lossy than expected.** SPEC 0002 predicted real damage in the relations — Airtable's relational fields were known not to round-trip. There is none: all 962 child edges and 962 parent edges are reciprocal.

### Removed — 2026-08-24 (two checks that reported non-defects)

The 112 findings left over after the reciprocity check came up clean were not defects, and both checks that produced them are withdrawn. A report that is mostly noise stops being read, and takes the real findings down with it — the same argument that makes exceptions declarable rather than permitted.

- **A child at or above its parent's level** — 109 findings, 33 of them Avatar alone. The check assumed `level` is a containment hierarchy. It is a band of size, which is how [`sizing.md`](docs/foundations/sizing.md) uses it and all it has ever meant; nothing about composition was ever restricted by it. A 24px Avatar inside a 40px Input Text is unremarkable, and 58 of the 109 were object-inside-object, the band doing the least work.
- **Entries with no relations at all** — 3 findings: Date Picker, Dropdown, Popover. The check assumed every component is composed of something or contained in something, which nothing in the system says. All three are overlays: opened by a component rather than nested inside one. The schema has a single relation, composition, and it does not describe that, so their emptiness is accurate rather than missing.

Both were invented in SPEC 0002 rather than derived from how the system works, and the spec now records their withdrawal beside the checks that stayed.

### Changed — 2026-08-24 (Stage 2 closed)

- Stage 2 is removed from `PLAN.md`, which carries sequence rather than status. The schedule stands at **26 weeks**, and the critical path is now S0 → (S3 ‖ S4) → S5 → S6.

### Changed — 2026-08-23 (Figma is an implementation, not the contract)

- **A component's contract is authored in this repository; Figma and the future Svelte package are implementations of it.** `ARCHITECTURE.md` §1 said the opposite — that Figma was the source of truth for components, variants and states. It cannot be: a contract that two things must satisfy cannot be held by either of them. The concrete case is Figma's inability to give a frame both `hug` width and text truncation, which CSS can do. Read from Figma, that component's contract would say it does not truncate — false about the system, true only about the tool.
- The line drawn instead: **values are authored where they are judged by eye, contracts where they can bind more than one implementation.** Colours and dimensions stay in Figma and flow into `tokens/`. Authoring values in Figma is recorded as current practice rather than a permanent commitment.
- **Exceptions are declared, not permitted** ([`docs/components/README.md`](docs/components/README.md)). Where an implementation genuinely cannot comply, the divergence is recorded in the contract with its reason; an undeclared divergence is a defect. Same mechanism as `mode_dependent` in the token pipeline, and for the same reason: "differences are allowed" fills the report with noise until nobody reads it.
- **Figma comes first in time, not in authority.** A component is tried in Figma, then the contract is written from it *after review* — the review being where accumulated dirt is filtered rather than transcribed. This does not add a write path: checking Figma against the contract is not editing it.
- Corrected in `README.md`, `figma/README.md` and `docs/components/README.md`, all of which asserted Figma as the source of truth for components.
- Decision 0001 carries a dated amendment saying the same. Its citations to the deleted `master-document.md` are removed; the decision it actually records — one-directional, never write to Figma — is unaffected.
- `ARCHITECTURE.md` §1 still listed `tokens/_aliases.yaml`, which does not exist; references are stored inline in the token files.
- **A component's document path now mirrors its registry path** — `Table / TD Text` → `docs/components/table/td-text.md`. The two directories disagreed for any name containing `/`, and "is it documented" cannot be derived while they do.

### Changed — 2026-08-23 (Stage 2 rewritten)

- Stage 2 was four weeks of automated registry↔Figma reconciliation. Its output had no consumer: the registry's only stated consumer is a documentation generator that v0.1 explicitly excludes. What the registry actually lacks is a way to read it — the data left Airtable on 20 August and the reading surface did not, which is why Airtable is still where the owner looks. Rewritten as **make the registry readable**, one week, specified in [SPEC 0002](docs/specs/0002-registry-viewer.md).
- Registry status is **derived, never authored** — a document exists, a Figma node is linked. The only status-like field today is `import.ready`, Airtable's checkbox at import time, which the registry's own README calls a snapshot rather than a live status.
- `figma:` per entry, filled as each component is opened for other reasons. No bulk sync step: the REST API does not reach unpublished components reliably, and the identifier is in the address bar exactly when it is needed.
- The schedule drops from 29 to **27 weeks**. Both reductions came from inspection, not optimism.

### Changed — 2026-08-23 (foundations closed)

- **The shadow composition is written down, and it is derivable.** `Elevation N` is not one shadow but a stack: layers 1…N in `shadow/color/base`, then layer N repeated in `shadow/color/primary` — N + 1 layers. Each layer is `0 elevation(k) elevation(k) spread(k)`, so X is always zero and **blur equals the Y offset**. That is why there is no blur token: it is not independent. The rule reproduces all six Figma effect styles exactly, which means effect styles never need exporting — the CSS build generates them from two number scales and this composition.
- Two consequences recorded in `effects.md`, both easy to get wrong: the stack is **cumulative**, so a generator emitting one layer per level is wrong above level 1; and every level carries a `shadow/color/primary` tint, so shadows are brand-coloured — and since that colour is a literal rather than a reference, rebinding the `primary` slot leaves all six behind.
- The `space` collection is now **`dimension`** (`dimension` and `dimension-scale`). Sizes and gaps are both lengths in the layout plane; a control's height is not spacing. `sizing.md` and `spacing.md` follow the new name.
- **Stage 1 is removed from `PLAN.md`.** Every document in `docs/foundations/` is confirmed and nothing left open in them blocks a component contract or the CSS build. Stage numbers 2–6 are kept as they were so references elsewhere still resolve.
- The schedule drops from 32 to **29 weeks**, and the long pole moves from foundations to S4. The stage budgeted at 6–8 weeks cost days — nearly all of it was ratification of what Figma already held.

### Changed — 2026-08-23 (Stage 1 closed down)

- **`density` is dropped.** It held a canonical slot in the variant-property order with no definition behind it. Removed from `naming.md` §8 rather than left as a placeholder for a dimension the system does not have.
- **The dark palette has no transformation rule, deliberately.** Measured across all 288 tokens: the dark ramp broadly inverts the light one — steps 900/950/975 reproduce light 100/50/25 almost exactly — but the deep steps diverge, lifted by 3–7 L% and desaturated, because a literal inversion gives unusable near-black surfaces. `color.md` now records the palette as authored rather than derived. A formula is not wanted: the same transform on different hues does not give equivalent results, so a rule written in numbers would be false at the first new hue group.
- **Ratio naming in `spacing.md` is ratified with its reason.** `s-1_500` means "one and a half bases", not "12 pixels", and that is the point — the scale exists so decisions are made in relations. The planned seven-way naming comparison is dropped; it would have reviewed a model that is already working for the reason it was chosen.
- **Radius and border are ratified.** Seven radius steps (0, 2, 4, 6, 8, 10, 1000) and two border widths (1, 2), all already matching `effects.md`. What remains open under effects is only the shadow scale.
- `effect/shadow/color/*` aliases `color/shadow/*` rather than duplicating it, so the question of where shadow colour belongs is closed. What is *not* closed: `color/shadow/primary` holds indigo/700's value as a literal, not a reference, so it will not follow a rebinding of the `primary` slot — and the SPEC 0001 §5.6 rule 7 check cannot see it, because it walks references.
- Skill repairs and the `tone=error` migration moved from Stage 1 to **Stage 4**, where the components they operate on are actually worked. `text-sizing` binds `Text Size / [measure]`, a collection Figma no longer has; which component sets carry `tone=error` is visible only in Figma, and recording it belongs with documenting each component.
- `PLAN.md` Stage 1 is down to two items: rename the collection, and define the shadow scale.
- `STANDARD.md` cited "open decision #14, settled by ADR 0015". Decision records were retired and no such file exists; the sentence now points at the stage that settles it.

### Changed — 2026-08-23 (theme contract)

- **The mode lives in `color`, not in the palette.** `color.md` claimed the opposite. The palettes are two sources; the semantic collection is the one with Light Mode and Dark Mode, and each mode picks a step from the palette of the same name. That is why they are separate Figma collections: two modes of one collection would only let a step change its value, while separate collections let a role choose a *different step* per mode. `tokens/_naming.yaml` already said this correctly — the document was the thing that was wrong.
- **The slot layer is named.** Every semantic role outside `*/special/*` resolves into exactly five hue groups: `base`→slate, `primary`→indigo, `success`→green, `warning`→amber, `danger`→red. Verified against `tokens/color.yaml`: 64 referencing roles, no sixth group. A client rebrands by rebinding those five, not by overriding roles.
- **Two kinds of role.** 66 slot-bound roles follow a rebrand; 44 hue-bound `*/special/*` roles do not, because naming a specific hue is their purpose — categorical colour for tags, statuses and series must not move when the brand does.
- `error` finished becoming `danger`. `background/error` and `border/error` were the last two holdouts; every other role had already moved.
- **A colour is not a state** ([`naming.md`](docs/foundations/naming.md) §4). `tone` names a colour, `state` and `validation` name a condition, and they map many-to-one: an input's `error` state takes the `danger` colour, and a destructive button is `danger` without any error being involved. `tone` loses `error` (a validation outcome), `neutral` (duplicate of `base`) and `info` (no such colour exists).
- **`naming.md` no longer treats a skill as a contract.** Its opening paragraph named `stylos-naming-cleanup` v0.7 "the operational contract" and gave the skill the last word, citing an `ARCHITECTURE.md` section that says nothing of the kind — §6 lists the normative places, and `skills/` is not among them; `skills/dist/` is explicitly derived. A skill takes the rules, it does not set them.
- `naming.md`'s `tone` row is a **vocabulary, not a whitelist**. Values are drawn from the five slots plus `inverted`; which subset a component offers is that component's business, and a Button and a Badge are not expected to match.
- The checkbox / radio variant property is **`is checked`** with values `false`, `true`, `mixed` — not `checked` with `unchecked`/`checked`/`indeterminate`. Under the `is` form the old values stopped parsing: `is checked = checked` says nothing.
- `color.md` listed four mode-dependent roles. There are three — `shadow/*` arrives as literals because Figma cannot bind a variable and change its opacity, so the mode rules never reach it. The SPEC 0001 example carried the same error.

### Added — 2026-08-23 (theme contract)

- SPEC 0001 §5.1 gains a `slots:` declaration and §5.6 a check for it: a role bound to a hue group outside the five fails. Such a role looks harmless in Figma but will not follow a rebrand, so the theme comes out half-changed silently.
- `PLAN.md` 1.8 — bring `tone` values in the Figma component sets onto the colour vocabulary. A breaking change to component APIs, cheapest now.

### Changed — 2026-08-23 (sizing)

- `docs/foundations/sizing.md` — the level→size mapping is recorded, and recorded as **a recommendation rather than a rule**. It says what a component of that level and size usually is, so a new one built to it lines up with what exists. Every other value on the scale stays available: a status indicator is 8px, below the smallest recommended Primitive, because at 12 it would read as enormous. That is not a violation and nothing flags it.
- The Element and Object runs are no longer open — both are written down, in token names rather than pixels so they cannot go stale.
- **rem is not part of the sizing scale.** A relative unit would earn its place if component dimensions derived from font size; they are set directly, so rem only adds a second base to reason about. It also collides with the token naming, where the ratio is to 8 and not to 16 — `s-1_500` is 12px, which is 0.75rem, and two different "one and a half" sitting next to each other is a defect waiting to happen.

### Added — 2026-08-23 (Figma files recorded)

- All five Figma files are now identified by key in [`figma/README.md`](figma/README.md): Styles, Components, GUI components, Playground, and the external Material Icons kit. The key is the URL segment after `/design/` — what the REST API addresses a file by, and without which nothing can ask Figma what it contains. This unblocks Stage 2.
- Two files the repository did not know about: the **Playground**, a scratch file for testing component behaviour, and the icon library as a specific addressable file.

### Changed — 2026-08-23 (Figma files recorded)

- The third Stylos file is **GUI components**, not "GUI Helpers" as the repository called it.
- The icon source is Google's older **Material Icons** set, not Material Symbols. `icons.md` claimed the latter. Different libraries; the one actually bound is the former.

### Removed — 2026-08-23

- `docs/master-document.md`. Its content moved into `docs/charter.md`, `ARCHITECTURE.md`, `docs/foundations/` and `docs/components/STANDARD.md`; the rest was superseded.

### Added — 2026-08-23

- [`docs/charter.md`](docs/charter.md) — purpose, character, the customization boundary, scope, four principles, and what success looks like.

### Removed — 2026-08-23

- **Six of seven decision records.** Kept: `0001` Figma connection model. Removed: skill version supersession, component levels and size-grid scope, frontend library foundations, proportional logic, token normalization.

  Not because they were wrong, but because a decision record is a commitment device, and at pre-alpha the friction it creates works against the search. Their content moved to where it is cheap to change and actually read: rules into `docs/foundations/`, work orders into `docs/specs/`, the frontend direction into `PLAN.md` Stage 5, the skill-version note into `skills/README.md`. Two of the six had already been contradicted by the system within a day of being written. See [docs/decisions/README.md](docs/decisions/README.md) for the map and the rule for what earns a record from now on.

- **`docs/foundations/palette/`** — three `stylos-core-palette-*.json` files of unestablished origin, imported in error. They were a second copy of the palette, already diverging from `tokens/palette.yaml`, which is imported from Figma and self-verifying. `color.md` now describes the palette's structure and rules in text; values come from `npm run tokens:report`.

### Changed — 2026-08-23

- `PLAN.md` **no longer carries status.** No checkboxes, no "done", no paths to artifacts that may move. It carries sequence, gates and estimates; what is done is answered by the repository and by git. A plan that tracks state has to be edited whenever work lands and rots in between — the same failure as documentation that transcribes token values.
- `PLAN.md` — Stage 3 reduced from a four-week token pipeline to one week of CSS generation, the rest having been built. Estimate to v0.1 now ≈ 8–10 months.
- `docs/foundations/` — rules that lived in decision records are now stated in the foundation documents themselves, each with its justification in a sentence: the Element/Object size-grid boundary in `sizing.md`, the base-8 scale in `spacing.md`.
- **Prohibitions that guard against nothing were removed.** A rule saying the system is *not* something only earns its place if someone would plausibly do that thing. Two did not: the scale being "not Fibonacci-derived", and Cyrillic being "not a requirement". Both existed only because an earlier document had asserted the opposite; an abandoned decision is deleted, not written up as a ban. Both foundations now state what is true rather than what was dropped.
- `ARCHITECTURE.md` — four statements corrected that described a system no longer there: immutable dated snapshots, `docs/decisions/` as the destination for every material change, `figma/variables/exports/` as a derived artifact, and `tokens/_aliases.yaml` as an input. Open questions are now anchored to `docs/foundations/` and to the stage in `PLAN.md` that answers them.
- `docs/foundations/color.md` — rewritten around the two-layer structure and why the indirection matters, rather than around a snapshot.
- References to the removed records repointed across `ARCHITECTURE.md`, `naming.md`, `typography.md`, `spacing.md`, `sizing.md`, `color.md`, `STANDARD.md`, `registry/README.md`, `skills/README.md`, `tools/README.md`, `tokens/README.md` and `docs/specs/`.


### Added

- Initial repository structure: `docs/`, `figma/`, `skills/`, `tools/`.
- First native Figma Variables snapshot stored at `figma/variables/exports/2026-02-22.json`.
- Modular skill sources under `skills/src/`, one directory per skill.
- Skill compiler (`tools/build-skills.mjs`) producing `skills/dist/stylos-figma-agent.md`.
- Decision record: [Figma connection model](docs/decisions/0001-figma-connection-model.md).
- Interim decision: use Material Symbols as the icon source until a native Stylos icon set exists — see [docs/foundations/icons.md](docs/foundations/icons.md).
- Decision record: Component levels and size-grid scope *(record removed 2026-08-23; the rule now lives in `docs/foundations/sizing.md`)* — confirmed the five-level component taxonomy (Primitive, Element, Object, Widget, Layout) from the Airtable component registry, and confirms that shared size grids apply to Element and Object only, permanently — not an open gap for Widget/Layout, by design (widgets vary too much in size to share a rule; the skill can't know what kind of widget it's looking at). `docs/foundations/sizing.md` and `docs/foundations/typography.md` updated accordingly.
- Component registry imported: 96 components converted from the owner's Airtable "Components — Grid view" CSV export into one YAML file per component under `docs/components/registry/`, path mirroring each component's Figma `/` hierarchy. Fields: `level`, `role`, `flow_behavior`, `children`, `parents`, `notes`, and the original Airtable `batch`/`ready` values under `import:`. Raw CSV kept as an immutable snapshot at `docs/components/registry/import-source/2026-08-20-airtable-export.csv`. All 96 rows' parent/child references resolved cleanly against each other — no dangling references found on import.
- `tools/import-component-registry.mjs` (CSV → YAML, one-time-per-refresh bootstrap) and `tools/lint-registry.mjs` (validates references and levels), wired up as `npm run import:registry` / `npm run validate:registry`.
- Airtable is retired as the source of truth for this data going forward — see [docs/components/registry/README.md](docs/components/registry/README.md). Hand-editing the generated YAML directly, validated with `npm run validate:registry`, is the expected workflow; re-running the CSV importer overwrites hand edits and should be treated as a one-time bootstrap step, not an ongoing sync.
- Decision record: Frontend library foundations *(record removed 2026-08-23; the direction now lives in `PLAN.md` Stage 5)* — single `@stylos/ui` package, a small custom token script, plain CSS + custom properties, and a headless behaviour library. Decisions only; nothing was scaffolded.

### Changed

- `stylos-naming-cleanup` imported at **v0.7**. It resolves the naming conflict earlier documentation described as open (abbreviated `xs`/`s`/`m`/`l`/`xl` are now flagged as violations and mapped to the full-word canonical values). The master document should be updated to cite v0.7 and to close open decision item 7. Recorded at the time as decision record 0002, removed 2026-08-23; the note now lives in `skills/README.md`.
- `stylos-reference-reconstruction`'s source (`skills/src/reference-reconstruction/SKILL.md`) was missing the `metadata` block (owner/system/version) that the other three skills carry — added `version: 0.1` for consistency with the naming-cleanup, text-sizing, and component-integrity-check sources, and because the skill build script (`tools/build-skills.mjs`) requires a version to compile. No behavioral content was changed.

### Known gaps carried over from Downloads

Files that were **not** imported into this repository, pending an explicit decision on their provenance and role:

- `tokens.stylos-renamed.json`, `tokens.stylos-typed.json` — look like Tokens Studio interchange exports; Tokens Studio was treated as optional and non-authoritative, so these were not assumed to be current.
- `stylos-core-palette-light.json`, `stylos-core-palette-dark.json`, `stylos-core-palette-dark-reversed.json` — unclear whether these are a Figma-native export, a Tokens Studio export, or a hand-authored reference; not imported until their source is confirmed.
- `stylos-component-integrity-check-v0.1-SKILL.md` — superseded by v0.2, which is already the version imported here.
- `stylos-naming-cleanup-v0.5-SKILL.md`, `stylos-naming-cleanup-v0.6-SKILL.md`, `stylos-naming-cleanup .md` (undated), `SKILL.md`, `SKILL-current.md` — superseded by v0.7 or unclear which skill they represent; not imported.

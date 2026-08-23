# Changelog

All notable changes to the Stylos Design System project (foundations, components, skills, documentation, and — later — the code package) are recorded here. Format is loosely [Keep a Changelog](https://keepachangelog.com/); versioning is not yet defined — there is nothing released to version.

## [Unreleased]

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

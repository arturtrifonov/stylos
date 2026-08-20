# Changelog

All notable changes to the Stylos Design System project (foundations, components, skills, documentation, and — later — the code package) are recorded here. Format is loosely [Keep a Changelog](https://keepachangelog.com/); versioning follows the project's own SemVer-during-0.x rule (master doc [§24](docs/master-document.md#24-versioning-and-releases)).

## [Unreleased]

### Added

- Initial repository structure: `docs/`, `figma/`, `skills/`, `tools/` per master doc [§20](docs/master-document.md#20-proposed-repository-structure).
- Master project document adopted as `docs/master-document.md`.
- First native Figma Variables snapshot stored at `figma/variables/exports/2026-02-22.json`.
- Modular skill sources under `skills/src/`, one directory per skill.
- Skill compiler (`tools/build-skills.mjs`) producing `skills/dist/stylos-figma-agent.md`.
- Decision record: [Figma connection model](docs/decisions/0001-figma-connection-model.md).
- Interim decision: use Material Symbols as the icon source until a native Stylos icon set exists — see [docs/foundations/icons.md](docs/foundations/icons.md).
- Decision record: [Component levels and size-grid scope](docs/decisions/0003-component-levels-and-size-grid-scope.md) — confirms the five-level component taxonomy (Primitive, Element, Object, Widget, Layout) from the Airtable component registry, and confirms that shared size grids apply to Element and Object only, permanently — not an open gap for Widget/Layout, by design (widgets vary too much in size to share a rule; the skill can't know what kind of widget it's looking at). `docs/foundations/sizing.md` and `docs/foundations/typography.md` updated accordingly.
- Component registry imported: 96 components converted from the owner's Airtable "Components — Grid view" CSV export into one YAML file per component under `docs/components/registry/`, path mirroring each component's Figma `/` hierarchy. Fields: `level`, `role`, `flow_behavior`, `children`, `parents`, `notes`, and the original Airtable `batch`/`ready` values under `import:`. Raw CSV kept as an immutable snapshot at `docs/components/registry/import-source/2026-08-20-airtable-export.csv`. All 96 rows' parent/child references resolved cleanly against each other — no dangling references found on import.
- `tools/import-component-registry.mjs` (CSV → YAML, one-time-per-refresh bootstrap) and `tools/lint-registry.mjs` (validates references and levels), wired up as `npm run import:registry` / `npm run validate:registry`.
- Airtable is retired as the source of truth for this data going forward — see [docs/components/registry/README.md](docs/components/registry/README.md). Hand-editing the generated YAML directly, validated with `npm run validate:registry`, is the expected workflow; re-running the CSV importer overwrites hand edits and should be treated as a one-time bootstrap step, not an ongoing sync.
- Decision record: [Frontend library foundations](docs/decisions/0004-frontend-library-foundations.md) — single `@stylos/ui` package, a small custom Figma-Variables-to-CSS token script (not Style Dictionary/Cobalt UI), plain CSS + CSS Custom Properties (no Tailwind/CSS-in-JS), and Melt UI (not Bits UI) for interactive-component accessibility behavior, chosen specifically because Melt keeps component anatomy fully authored by Stylos rather than inherited from a pre-built library. Decisions only — no Svelte package or dependencies were scaffolded; that stays out of scope until Phase 5 per master doc §20.6/§28.6.

### Changed

- `stylos-naming-cleanup` imported at **v0.7**, not the v0.5 cited as current throughout the master document. v0.7 already resolves the [known naming conflict](docs/master-document.md#16-known-naming-conflict) described in master doc §16 (abbreviated `xs`/`s`/`m`/`l`/`xl` are now flagged as violations and mapped to the full-word canonical values). The master document should be updated to cite v0.7 and to close open decision item 7. See [docs/decisions/0002-skill-version-supersession.md](docs/decisions/0002-skill-version-supersession.md).
- `stylos-reference-reconstruction`'s source (`skills/src/reference-reconstruction/SKILL.md`) was missing the `metadata` block (owner/system/version) that the other three skills carry — added `version: 0.1` for consistency with the naming-cleanup, text-sizing, and component-integrity-check sources, and because the skill build script (`tools/build-skills.mjs`) requires a version to compile. No behavioral content was changed.

### Known gaps carried over from Downloads

Files found alongside the master document that were **not** imported into this repository, pending an explicit decision on their provenance and role:

- `tokens.stylos-renamed.json`, `tokens.stylos-typed.json` — look like Tokens Studio interchange exports; master doc [§8.4](docs/master-document.md#84-tokens-studio) treats Tokens Studio as optional and non-authoritative, so these were not assumed to be current.
- `stylos-core-palette-light.json`, `stylos-core-palette-dark.json`, `stylos-core-palette-dark-reversed.json` — unclear whether these are a Figma-native export, a Tokens Studio export, or a hand-authored reference; not imported until their source is confirmed.
- `stylos-component-integrity-check-v0.1-SKILL.md` — superseded by v0.2, which is already the version imported here.
- `stylos-naming-cleanup-v0.5-SKILL.md`, `stylos-naming-cleanup-v0.6-SKILL.md`, `stylos-naming-cleanup .md` (undated), `SKILL.md`, `SKILL-current.md` — superseded by v0.7 or unclear which skill they represent; not imported.

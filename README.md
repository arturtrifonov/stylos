# Stylos Design System

Stylos is a design system for dense, desktop-oriented web product interfaces. Its visual language draws on antiquity, classical architecture, proportion, and Fibonacci/golden-ratio-derived logic — strict and structural rather than decorative.

**Status:** Alpha. Private, owner-led project. Not yet released.

This repository is the source of truth for everything about Stylos that is *not* live Figma state: project decisions, foundation and component documentation, versioned Figma variable snapshots, and the Figma Agent skills used to work on the Figma library consistently. See the [master document](docs/master-document.md) for the full, authoritative description of the project — purpose, principles, architecture, naming rules, skill system, roadmap, and open decisions. Everything below is a short map of the repo; the master document is where the real detail lives.

## Why this repo exists

Stylos is not meant to stay a pile of Figma components. The end state is:

1. **A documented design system** — foundations, components, and rules written down, not just implied by Figma files.
2. **A Figma library kept consistent by skills** — repeatable, auditable operations (naming, text sizing, integrity checks, reference reconstruction) instead of manual one-off fixes.
3. **A front-end component library** (planned — Svelte) generated or hand-built from the same design decisions.
4. **A documentation surface** that stays in sync with both Figma and the code — Storybook for developers, and a separate, friendlier web surface for designers.

This repository is where (1) and (2) live today, and where (3) and (4) will be added once the Figma-side contracts are stable. See [§28.6 of the master document](docs/master-document.md#286-premature-frontend-structure) for why frontend scaffolding is deliberately not part of this milestone yet.

## Repository structure

```text
/
├── docs/          Project documentation: master doc, foundations, components, decisions, research
├── figma/         Figma library documentation + versioned native variable export snapshots
├── skills/        Figma Agent skills — modular source, compiled to one importable document
└── tools/         Small scripts that build or validate the above (currently: the skill compiler)
```

Each directory has its own `README.md` explaining what belongs there and why. Start with [docs/README.md](docs/README.md).

## Figma ↔ repo relationship

Figma is the live source of truth for variables, styles, and components. This repo does not try to make Figma bidirectionally editable from code — that's an explicit non-goal until a reliable round trip exists (master doc [§4.3](docs/master-document.md#43-explicit-non-goals-for-the-current-stage)). Instead, the relationship is one-directional and versioned:

- **Snapshots** — native Figma Variables exports, stored as dated, immutable JSON in [`figma/variables/exports/`](figma/variables/exports/).
- **Skills** — Markdown instructions authored per-skill in [`skills/src/`](skills/src/), compiled into one Figma Agent-importable document in [`skills/dist/`](skills/dist/).
- **Documentation** — this repo describes what the Figma library *should* contain; Figma remains where live components, StateDiagrams, and PropTables actually are.

The full reasoning and the options that were considered are in [docs/decisions/0001-figma-connection-model.md](docs/decisions/0001-figma-connection-model.md).

## Getting started

```bash
npm install
npm run build:skills
```

This compiles `skills/src/*/SKILL.md` into `skills/dist/stylos-figma-agent.md`, which you import manually into Figma Agent. See [skills/README.md](skills/README.md).

## Current milestone

Per the master document's [§25](docs/master-document.md#25-current-milestone), this milestone is complete when the project has a documented structure, the Figma library is documented well enough for systematic use, variable snapshots are reproducible, every skill has a modular source, and skills compile deterministically into one importable document — **without requiring a frontend package to exist.**

## License

Not yet decided. This repository is private and unlicensed for external use until a license is chosen (master doc [§27, item 19](docs/master-document.md#27-open-decisions)).

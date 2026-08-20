# 0004 — Frontend library foundations

**Status:** Accepted (architecture decisions only — no implementation yet)
**Date:** 2026-08-20

## Problem

The master document's passport names Svelte as the planned implementation technology and Storybook (or equivalent) as the planned documentation surface, but records no concrete architecture: package structure, token pipeline, styling approach, or how interactive component behavior gets built. The project owner wanted these decided now, ahead of Phase 5 ([roadmap](../master-document.md#26-roadmap)), so implementation can start from a settled brief instead of re-deriving architecture under pressure later.

## Decisions

### Package structure: single package

Ship as one package, `@stylos/ui`, rather than splitting tokens/icons/components into separate packages.

**Why:** simplest to version and consume for a solo maintainer during Alpha. The alternative (split packages) buys independent token versioning — useful once client-brand theming is a real, active use case — at the cost of release/versioning overhead that isn't earned yet. If a split becomes necessary later, it's a mechanical extraction from one package, not a redesign.

### Token pipeline: small custom script

Figma Variable exports become CSS/JS tokens via a small, dependency-free script — not Style Dictionary, not Cobalt UI.

**Why:** consistent with the pattern already set in this repository's `tools/` directory (`build-skills.mjs`, `import-component-registry.mjs`) — full control over the exact Figma Variables JSON → CSS Custom Property mapping, no external config DSL to learn, and no dependency whose update cadence Stylos doesn't control. The cost, accepted deliberately: Stylos owns maintaining this mapping as Figma's export format evolves, rather than inheriting that maintenance from an established tool.

### Internal styling: plain CSS + CSS Custom Properties

Component internals are built with plain CSS, referencing the same CSS Custom Properties that consumer-facing theming uses — no Tailwind, no CSS-in-JS/build-time atomic tooling (vanilla-extract, PandaCSS).

**Why:** no build-time styling dependency, one styling vocabulary instead of two, and it mirrors the token system directly — a component's internal styles and a consumer's theme override are the same mechanism, not two different layers translated into each other.

### Interactive component behavior: Melt UI

Accessible interactive components (Select, Dialog, Tabs, Accordion, Combobox…) are built on **Melt UI**, not Bits UI, and not from scratch.

**Why:** Melt UI is a headless "builders" library — actions and stores that attach keyboard/focus/ARIA behavior to markup the consumer writes. It supplies behavior only; **anatomy, layer names, and DOM structure stay 100% Stylos's own**, which is what master doc [§14.2](../master-document.md#142-component-contract) and [§15](../master-document.md#15-naming-and-public-api-rules) require (components are public APIs with an authored, documented anatomy — layer names, controlled property groups, canonical ordering). Bits UI was rejected specifically because it ships pre-built component markup/anatomy — faster to adopt, but Stylos would be working around Bits UI's structure rather than authoring its own, which conflicts with the naming and anatomy rules already in force. Building all interaction logic from scratch was rejected as too much accessibility surface area to get right solo, component by component.

## Pattern across all four decisions

Every choice above trades faster setup for more ownership: a custom token script over an established pipeline tool, one package over a more flexible split, plain CSS over a styling framework, and a behavior-only library over a fully pre-built component library. This isn't an accident — it matches the project's existing posture (visible in `tools/` already: small, dependency-free, purpose-built scripts) and the master document's insistence that Stylos is an authored system, not an assembly of someone else's defaults ([§5](../master-document.md#5-design-character), [§6.2](../master-document.md#62-stylos-is-the-visual-source-of-truth)).

## Scope note — this is a decision, not implementation

Nothing in this repository was scaffolded as a result of this record: no `package.json` for a Svelte package, no build config, no new dependencies. Master doc [§20.6](../master-document.md#206-future-code-structure) and [§28.6](../master-document.md#286-premature-frontend-structure) are explicit that empty package scaffolding before the current documentation milestone is unnecessary and risky. This record exists so that when Phase 5 actually starts, these four questions don't need to be re-litigated — it's a settled brief, not a green light to start building today.

## Consequences

- Future component documentation (`docs/components/<name>.md`) should describe anatomy in terms that map directly to hand-authored markup wired up with Melt UI builders, not to any pre-built component library's structure.
- The token pipeline script (when built, Phase 4–5) needs its Figma Variables → CSS Custom Property mapping designed deliberately, including how modes (light/dark/client-brand) become CSS Custom Property scoping — this is now Stylos's design problem to solve, not inherited from a tool's defaults.
- Client-brand theming (master doc [§10.3](../master-document.md#103-theme-direction)) will happen via CSS Custom Property overrides at the consumer level within the single `@stylos/ui` package, not via a separate installable token package — revisit the single-package decision if that stops being sufficient.

## Follow-up

- When Phase 5 begins, treat this record as the starting brief for the Svelte package's initial setup.
- If real implementation surfaces a constraint that breaks one of these decisions (e.g. Melt UI can't cover a needed interaction pattern), update this record explicitly rather than silently drifting from it.
- The master document's project passport (planned implementation technology: Svelte) could be expanded to reference this record the next time the master document itself is edited.

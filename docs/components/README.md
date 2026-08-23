# docs/components/

One Markdown file per public component, named `<component-name>.md` (kebab-case, matching the component's Title Case Figma name — e.g. `icon-button.md` for `Icon Button`).

Every component document must follow the standard in [`STANDARD.md`](STANDARD.md): name/summary, purpose, use-when/do-not-use-when, architectural level, anatomy, public API in canonical order, property definitions, controlled groups, states, sizing, typography roles, token usage, composition, content guidance, accessibility, responsive behavior, examples, anti-examples, known limitations, and lifecycle status.

No prose component documents yet — but a component inventory now exists: [`registry/`](registry/README.md) holds structured level/role/composition data for 96 components, imported from the project owner's Airtable registry on 2026-08-20. The *inventory* exists; the per-component documentation this directory is for is [`PLAN.md`](../../PLAN.md) Stage 4 work. Start each document from its `registry/` entry rather than from scratch — level, role and composition are already filled in.

## What belongs here vs. in Figma

Figma stays the live source for StateDiagrams, PropTables, anatomy diagrams, variant matrices, and other spatial/visual documentation (see [`STANDARD.md`](STANDARD.md)). This directory holds the parts that are easier to keep precise as text: purpose, boundaries against adjacent components, property definitions and defaults, composition rules, content guidance, and lifecycle status. Don't duplicate a PropTable here that already lives correctly in Figma — link to it, or reference the component by name.

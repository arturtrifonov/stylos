# Component documentation standard

**Normative.** What a component document must contain. Extracted from master doc §17.

Every public component gets one Markdown file in this directory, named `<component-name>.md` — kebab-case matching the component's Title Case Figma name (`Icon Button` → `icon-button.md`).

## Why the bar is this high

Documentation here serves two readers with the same need. A designer can inspect a component's appearance in Figma but cannot see its intended role, supported composition, resizable axes, or component-specific typography mapping. A Figma Agent has exactly the same blind spot, and will confidently configure a component wrongly when those are undocumented — the failure mode named in `ARCHITECTURE.md` as under-documentation.

A document that describes only appearance has not met this standard.

## The twenty points

1. **Name and summary** — what the component is.
2. **Purpose** — the user or product need it serves.
3. **Use when / do not use when** — boundaries against adjacent components.
4. **Architectural level** — primitive, element, object, widget, or layout (see [sizing.md](../foundations/sizing.md)). Take it from the [registry entry](registry/README.md), do not re-derive it.
5. **Anatomy** — named parts and nested components.
6. **Public API** — variant, text, boolean, and instance-swap properties in the canonical order defined by [naming.md](../foundations/naming.md) §8–§10.
7. **Property definitions** — meaning, values, defaults, dependencies, invalid combinations.
8. **Controlled groups** — which `has` property governs which related properties ([naming.md](../foundations/naming.md) §9).
9. **States and behaviour** — default, hover, active, focus, disabled, selected, loading, validation, expanded, and any other supported state.
10. **Sizing** — supported size values, component-specific text-size mapping, intrinsic axes, adjustable axes, min/max behaviour, fill/hug rules ([sizing.md](../foundations/sizing.md)).
11. **Typography roles** — primary text, supporting text, line-height family ([typography.md](../foundations/typography.md)).
12. **Token usage** — semantic bindings and any deliberate component-specific aliases.
13. **Composition** — allowed parent/child patterns and nested dependencies. The registry entry already holds `children` and `parents`; link to it rather than restating it.
14. **Content guidance** — length, wrapping, truncation, placeholder, and localization constraints where relevant.
15. **Accessibility** — semantics, keyboard behaviour, focus, labels, contrast expectations.
16. **Responsive behaviour** — resizing and reflow rules where relevant.
17. **Examples** — representative use cases and state diagrams.
18. **Anti-examples** — common misuse and prohibited overrides.
19. **Known limitations** — unsupported states, layouts, or technical constraints.
20. **Lifecycle** — version, status, replacement, deprecation.

## What lives here vs. in Figma

Figma stays the live source for StateDiagrams, PropTables, anatomy diagrams, and variant matrices — spatial documentation that text reproduces badly. This directory holds what stays precise as text: purpose, boundaries, property definitions and defaults, composition rules, content guidance, lifecycle.

Do not copy a PropTable that already lives correctly in Figma. Reference it.

**This split is provisional.** Which of the twenty points is authoritative in which home is open decision #14, settled by ADR 0015 ([`PLAN.md`](../../PLAN.md) Stage 4). Writing a full set of documents before that record exists risks rewriting them, which is why the plan puts the boundary decision first.

## Working rules

- **Start from the registry entry.** Level, role, composition, and flow behaviour are already recorded there for all 96 components. Points 4 and 13 are transcription, not research.
- **Do not duplicate a registry field as prose.** Prose drifts; the registry is validated by `npm run validate:registry`.
- **Run the integrity check first.** `stylos-component-integrity-check` before writing. A component that fails its own audit will otherwise have the defect written down as its contract.
- **A missing section is stated, not omitted.** "No responsive behaviour — fixed height on both axes" is documentation. Silence is not.

## Status

No component documents exist yet. The inventory does — 96 entries under [`registry/`](registry/README.md) — and the v0.1 core set of 23 components is scheduled in [`PLAN.md`](../../PLAN.md) Stage 4. `Button` is described in narrative form in the archived master document; that description is a starting point, not a document meeting this standard.

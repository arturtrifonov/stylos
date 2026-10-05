# Component readiness in the Figma implementation

The system's readiness gates are STD-04 and STD-05 in [Component standard](../docs/components/STANDARD.md). Figma representation is required evidence for readiness: a code-only component cannot be marked `ready`.

## Authoring checks

Before recording `ready`, verify the Figma component against its registry contract:

- `figma.node_id` points to the component, and `last_verified` records a check no older than its last change.
- Component, property and layer names follow [figma/naming.md](naming.md); no default or meaningless layer names remain.
- Supported variants and combinations agree with the contract. Drawing-only controls and differing property representations are recorded in `figma_notes`.
- Variable, style and component references resolve, and token-backed properties use the expected bindings.
- Existing instances have an understood migration path when the public API changes.

Use [`stylos-component-integrity-check`](../skills/src/component-integrity-check/SKILL.md) and [`stylos-naming-cleanup`](../skills/src/naming-cleanup/SKILL.md) for the checks they cover. Property-panel order is inspected using the limitations described in [figma/naming.md](naming.md#panel-order-and-controlled-groups).

## Inspection

Read token bindings, layer names, auto-layout settings and stroke positions from the Figma file when needed. They are implementation details covered by STD-08, rather than a second set of contract fields. The registry records the public decisions and explicit representation differences, not a copy of the layer tree.

Measurements come from inspecting the implementation; rationale is authored by the person making the decision (STD-07).

## Accessibility evidence

The shared target is FND-ACCESSIBILITY-01 in [Accessibility](../docs/foundations/accessibility.md). Inspection can provide evidence about visual contrast, use of colour, dimensions and the spacing between targets. Check the relevant combinations and the intended surroundings, rather than assigning an unconditional result to a visual part.

Record findings in the registry, with the source citation described by FND-ACCESSIBILITY-03. Record consumer obligations as `requires` and unresolved questions as `open`. A drawing does not verify keyboard behaviour, accessible names, focus management or screen-reader output; those checks belong to the rendered implementation.

A verified Figma representation is evidence for component readiness under STD-04 and STD-05, not a WCAG conformance claim.

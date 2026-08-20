# docs/foundations/

One document per foundation. Each should eventually contain the confirmed values, the naming pattern, the modes/aliasing rules, and the constraints for that foundation — detailed enough that a designer or a Figma Agent skill doesn't need to reverse-engineer intent from the Figma file.

Right now most of these are stubs: they record what the master document already confirms, and point at the specific open decisions blocking the rest. Fill them in as each foundation is formalized (master doc [Phase 2](../master-document.md#phase-2--foundation-formalization)).

| Foundation | File | Status |
| --- | --- | --- |
| Color | [color.md](color.md) | Core palette structure confirmed; canonical palette values and dark-context transformations open |
| Typography | [typography.md](typography.md) | Size scale and text/line-height binding pattern confirmed; primary typeface not yet chosen |
| Spacing | [spacing.md](spacing.md) | Direction confirmed (Fibonacci-derived); scale and naming model open |
| Sizing | [sizing.md](sizing.md) | Component-sizing decision order confirmed; final scale open |
| Icons | [icons.md](icons.md) | Usage rules confirmed; interim source decided (Material Symbols), native icon set not started |
| Effects | [effects.md](effects.md) | Usage rules confirmed (variables only); scale not yet defined |

Do not invent values here to fill a gap. If a value isn't confirmed in Figma or the master document, the document should say so and link to the relevant [open decision](../master-document.md#27-open-decisions) rather than guessing.

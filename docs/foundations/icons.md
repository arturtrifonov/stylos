# Icons

Status: **Usage rules confirmed (master doc [§13.1](../master-document.md#131-icons)); icon source is an interim decision, not a finished foundation.**

## Confirmed usage rules

- Choose icons by function, not visual resemblance to a reference.
- Use the Stylos icon system through exposed instance-swap properties (`icon`, `leading icon`, `trailing icon` — master doc [§15.7](../master-document.md#157-instance-swap-properties)); prefer `leading`/`trailing` over `left`/`right` for localization/RTL.
- Preserve system icon size, stroke, and optical treatment — never trace from a screenshot or manually resize a nested icon.
- Product logos and meaningful illustrations are content assets, not system icons.

## Interim decision: Material Symbols

This is not yet a master-document-level decision, so it's recorded here rather than asserted as confirmed project-wide. Until Stylos has its own icon set, **Material Symbols/Icons** is the interim icon source:

- **Why:** it's free, comprehensive, actively maintained, and available as a Figma library — it unblocks component work now without committing engineering time to drawing an icon set during Alpha.
- **What this means in practice:** icon instance-swap properties point at Material Symbols instances. The system-level rules above still apply — pick by function, don't recolor or restyle individual icons outside the component API, don't trace or hand-edit them.
- **What this doesn't mean:** this is not a claim that Material's visual language matches Stylos's classical/structural character long-term. A native Stylos icon set replacing this interim source is expected, not merely possible.
- **Revisit when:** component coverage stabilizes enough to justify commissioning or drawing a matching icon set (candidate for [Phase 3 or later](../master-document.md#phase-3--component-documentation-and-coverage)).

## Open

- Whether Stylos will own a dedicated Figma file for icons (a fourth library file alongside Components, Styles, and GUI Helpers — see [figma/README.md](../../figma/README.md)) once this stops being interim.

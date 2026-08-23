# Icons

Status: **Usage rules confirmed; the icon source is interim.**

## Confirmed usage rules

- Choose icons by function, not visual resemblance to a reference.
- Use the Stylos icon system through exposed instance-swap properties (`icon`, `leading icon`, `trailing icon` — see [naming.md](naming.md) §7); prefer `leading`/`trailing` over `left`/`right` for localization/RTL.
- Preserve system icon size, stroke, and optical treatment — never trace from a screenshot or manually resize a nested icon.
- Product logos and meaningful illustrations are content assets, not system icons.

## Interim source: Material Icons

Until Stylos has its own icon set, the icon source is the **[Default Kit / Material Icons](https://www.figma.com/design/mal5Fp20UXdswiLoBTVDvI/Default-Kit--Material-Icons)** Figma library — Google's older Material Icons set, not the newer Material Symbols:

- **Why:** it's free, comprehensive, actively maintained, and available as a Figma library — it unblocks component work now without committing engineering time to drawing an icon set during Alpha.
- **What this means in practice:** icon instance-swap properties point at instances from that library. The system-level rules above still apply — pick by function, don't recolor or restyle individual icons outside the component API, don't trace or hand-edit them.
- **What this doesn't mean:** this is not a claim that Material's visual language matches Stylos's classical and structural character. A native Stylos icon set replacing it is expected, not merely possible — drawing one is simply too expensive right now.
- **Revisit when:** component coverage stabilizes enough to justify commissioning or drawing a matching icon set (candidate for [`PLAN.md`](../../PLAN.md) Stage 4 or later).

## Open

- Whether Stylos will own a dedicated Figma file for icons once this stops being interim — see [figma/README.md](../../figma/README.md) for the current library layout.

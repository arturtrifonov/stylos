# Icons

Status: Confirmed
Scope: Where the icon set comes from, how it is delivered, and how an icon is used and named.

What is built from the source and delivery decisions below is [SPEC 0012](../specs/0012-icon-system.md).

## Confirmed usage rules

- Choose icons by function, not visual resemblance to a reference.
- Use the Stylos icon system through exposed instance-swap properties (`icon`, `leading icon`, `trailing icon` — see [naming.md](naming.md) §7); prefer `leading`/`trailing` over `left`/`right` for localization/RTL.
- Preserve system icon size, stroke, and optical treatment — never trace from a screenshot or manually resize a nested icon.
- Product logos and meaningful illustrations are content assets, not system icons.

## The source: Material Symbols Rounded, at one instance

**Amended 2026-09-07, replacing the interim Material Icons source below.** The set is drawn from **Material Symbols** (Apache-2.0), Rounded, at a single fixed instance:

| Axis | Value | Why this one |
| --- | ---: | --- |
| `wght` | 500 | Heavier than the text it sits beside (Georama base 400, emphasis 450), which is what keeps a 16px mark from reading thinner than its label. |
| `FILL` | 1 | The whole set is filled. |
| `GRAD` | 0 | Unused — the correction it makes is below the threshold this system needs. |
| `opsz` | 20 | The bottom of the axis: strokes redrawn for a small mark rather than scaled down from a large one. |

The pairing is the point: **heavier weight against a smaller optical size**, which reads well at 16px and does not go coarse at 40px, so one instance covers the whole size range. Chosen by eye on a bench that put the axes over the real type scale, not derived.

**The consequence to hold on to: `FILL` is no longer a state axis.** In Material Symbols, FILL 0 → 1 is the unselected → selected pair, and shipping only FILL 1 spends it. A navigation item, a tab or a toggle that wants to show selection distinguishes it some other way — colour, surface, label weight — and may not reach for a filled/unfilled pair, because the set does not carry one. Reversing this means regenerating the set and re-checking every place that leaned on the single fill.

## The delivery form: SVG, generated, committed

**Icons ship as SVG, never as an icon font.** The set lives in [`assets/icons/`](../../assets/icons/README.md): `manifest.yaml` is authored, `svg/*.svg` is written by `npm run icons:import` and committed.

Screen-reader behaviour is not the reason. That part is solved for both forms by the same two lines — `aria-hidden` on the mark, the accessible name on the control — and it is the rule below regardless. The reason is the class of failure a font cannot be argued out of:

- **The font does not load** — network, CSP, a corporate proxy — and a ligature renders as the literal word. A button reading `delete_forever` instead of a mark. The accessible name is intact; the screen is not.
- **The reader has overridden fonts** — Windows *ignore font styles*, Firefox with page fonts off, a dyslexia extension, a user stylesheet. Same result, and it lands on exactly the readers the accessibility work is for.
- **The page is machine-translated.** Translation rewrites text nodes; the ligature stops being a ligature and the icon disappears.

A second reason is local: SPEC 0010 already settled that faces are *copied, never fetched* — a font update is a deliberate commit with a diff. The Google Fonts CSS API, subsetting and all, was closed by that decision before this one was taken.

**What SVG costs, and why the cost is acceptable.** The variable axes stop being live. Only `opsz` is a real loss, because optical size is a redrawing rather than a scale — and it is recovered by instancing the variable font at import time rather than taking the stock `@material-symbols/svg-NNN` packages, which are drawn at `opsz 48` only. The other three axes were never wanted at runtime: a design system that tokenises its decisions should hand consumers one weight, not a slider.

**One instance, not a set of stops.** Multiple optical sizes in one file, switched by `<use>`, does not work as an automatic mechanism: `href` is an attribute, not a CSS property, so nothing in CSS can retarget it. The workable version is stops as `<g>` elements toggled by a container query, or — far simpler — the component picking a stop from the size it already knows. Neither is needed while one instance covers 16–40px, and a second stop is added only if a real case shows the first one failing.

## The accessibility contract

The same for every icon, whatever renders it:

- **An icon never carries the accessible name.** Always `aria-hidden="true"`; on an inline `<svg>`, `focusable="false"` too.
- **Icon beside a label** — decorative, and that is the whole rule.
- **Icon alone in a control** — the name goes on the control (`aria-label`, or visually hidden text inside it). It says what the action does, not what the mark depicts.
- **A standalone informative icon** — visually hidden text beside it, not `role="img"` on the SVG.
- Colour is never the only carrier of an icon's meaning.

The generated files hold none of this: they are geometry, so that the same file is correct inline, in a sprite, and in a button. ARIA is applied where the icon is used.

## Superseded: the interim Material Icons source

Until 2026-09-07 the source was the **[Default Kit / Material Icons](https://www.figma.com/design/mal5Fp20UXdswiLoBTVDvI/Default-Kit--Material-Icons)** Figma library — Google's older set, taken because it was free, comprehensive and available as a Figma library, and it unblocked component work without spending Alpha time drawing icons. The reasoning that replaced it is above; what it correctly said still stands: **this is not a claim that Material's visual language matches Stylos's classical and structural character.** A native Stylos icon set is still expected rather than merely possible, and drawing one is still too expensive now. What changed is that the placeholder is now a generated artifact in this repository rather than a link to someone else's Figma file — so replacing it later is a manifest and a generator, not a hunt through instances.

## The direction of travel between Figma and code

**The code set is authoritative and the Figma library is what moves to match**, decided 2026-09-07 with the source. Until the swap, a component's Figma face and its code face are different drawings — the thirty components at [node `2839:2469`](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components?node-id=2839-2469) are still the old Default Kit set. Cheapest to do before the Button family (Stage 5) fills in its icon slots.

Three marks change appearance in the swap, and are named here so the change is not read as a mistake: **Success, Warning and Error are outlined today and become filled**, because the instance is `FILL 1`.

**The placeholder does not cross into code.** In Figma it marks an instance nobody has chosen yet — a state a design file has and a program does not. An icon that was not chosen is not written, and an unresolved meaning renders nothing: no fallback mark, no warning glyph.

## Open

- Whether Stylos will own a dedicated Figma file for icons once the swap happens — see [figma/README.md](../../figma/README.md) for the current library layout.
- Whether the set needs a second optical stop, and whether losing the FILL state pair costs anything in the navigation and tab components — both answerable only once those components exist.

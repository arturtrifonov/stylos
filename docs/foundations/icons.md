# Icons

Status: Confirmed
Scope: Where the icon set comes from, how it is delivered, and how an icon is used and named.

What is built from the source and delivery decisions below is [SPEC 0012](../specs/0012-icon-system.md).

## Using an icon

### FND-ICONS-01 — An icon is chosen by function, not by resemblance

**MUST.** An icon is chosen for what it means, never for looking like the mark in a reference.

Why: a mark matched by appearance carries the other system's meaning with it, and the mismatch surfaces only when someone reads the screen rather than looks at it.

Serves: PRN-04.

### FND-ICONS-02 — An icon reaches a component through an exposed swap property

**MUST.** A component takes its icon through the instance-swap property it publishes — `icon`, `leading icon`, `trailing icon` — and not by editing a nested layer.

Why: the swap property is the component's API for the mark; a nested edit is invisible to every consumer of that API and does not survive the component changing.

`leading`/`trailing` are preferred over `left`/`right`, for localization and RTL — the property names themselves are [naming.md](naming.md) §7.

Serves: PRN-06.

### FND-ICONS-03 — An icon's size, stroke and optical treatment are the system's

**MUST.** System icon size, stroke and optical treatment are preserved: no tracing from a screenshot, no manually resizing a nested icon.

Why: the instance below was chosen so that one drawing holds from 16 to 40px, and a manual resize is the one operation that silently undoes it.

Serves: PRN-01.

### FND-ICONS-04 — Logos and illustrations are content, not system icons

**MUST.** Product logos and meaningful illustrations are content assets and do not enter the icon system.

Why: the icon set is a vocabulary with one visual treatment; a logo has an owner and a specification of its own, and an illustration carries meaning the set cannot normalise.

## The source: Material Symbols Rounded, at one instance

### FND-ICONS-05 — The set is one fixed instance of Material Symbols Rounded

**MUST.** Every mark comes from **Material Symbols** (Apache-2.0), Rounded, at a single fixed instance.

Why: one instance is what makes the set a set — mixed axes read as several icon families in one screen, and the axes are not a decision a call site should be able to take.

**Amended 2026-09-07, replacing the interim Material Icons source below.** The instance:

| Axis | Value | Why this one |
| --- | ---: | --- |
| `wght` | 500 | Heavier than the text it sits beside (Georama base 400, emphasis 450), which is what keeps a 16px mark from reading thinner than its label. |
| `FILL` | 1 | The whole set is filled. |
| `GRAD` | 0 | Unused — the correction it makes is below the threshold this system needs. |
| `opsz` | 20 | The bottom of the axis: strokes redrawn for a small mark rather than scaled down from a large one. |

The pairing is the point: **heavier weight against a smaller optical size**, which reads well at 16px and does not go coarse at 40px, so one instance covers the whole size range. Chosen by eye on a bench that put the axes over the real type scale, not derived.

Serves: PRN-05.

### FND-ICONS-06 — `FILL` is not a state axis

**MUST.** Selection is not shown by a filled/unfilled icon pair.

Why: in Material Symbols, FILL 0 → 1 *is* the unselected → selected pair, and shipping only FILL 1 spends it. A navigation item, a tab or a toggle distinguishes selection some other way — colour, surface, label weight — because the set does not carry the pair.

Reversing this means regenerating the set and re-checking every place that leaned on the single fill.

## The delivery form: SVG, generated, committed

### FND-ICONS-07 — Icons ship as SVG, never as an icon font

**MUST.** The set is delivered as SVG. The files live in [`assets/icons/`](../../assets/icons/README.md): `manifest.yaml` is authored, `svg/*.svg` is written by `npm run icons:import` and committed.

Why: screen-reader behaviour is not the reason — that is solved for both forms by `aria-hidden` on the mark and the name on the control (FND-ICONS-09). The reason is the class of failure a font cannot be argued out of:

- **The font does not load** — network, CSP, a corporate proxy — and a ligature renders as the literal word. A button reading `delete_forever` instead of a mark. The accessible name is intact; the screen is not.
- **The reader has overridden fonts** — Windows *ignore font styles*, Firefox with page fonts off, a dyslexia extension, a user stylesheet. Same result, and it lands on exactly the readers the accessibility work is for.
- **The page is machine-translated.** Translation rewrites text nodes; the ligature stops being a ligature and the icon disappears.

A second reason is local: SPEC 0010 already settled that faces are *copied, never fetched* — a font update is a deliberate commit with a diff. The Google Fonts CSS API, subsetting and all, was closed by that decision before this one was taken.

**What SVG costs, and why the cost is acceptable.** The variable axes stop being live. Only `opsz` is a real loss, because optical size is a redrawing rather than a scale — and it is recovered by instancing the variable font at import time rather than taking the stock `@material-symbols/svg-NNN` packages, which are drawn at `opsz 48` only. The other three axes were never wanted at runtime: a design system that tokenises its decisions should hand consumers one weight, not a slider.

**One instance, not a set of stops.** Multiple optical sizes in one file, switched by `<use>`, does not work as an automatic mechanism: `href` is an attribute, not a CSS property, so nothing in CSS can retarget it. The workable version is stops as `<g>` elements toggled by a container query, or — far simpler — the component picking a stop from the size it already knows. Neither is needed while one instance covers 16–40px, and a second stop is added only if a real case shows the first one failing.

Checked by: `npm test` fails if the set and the manifest disagree.

### FND-ICONS-08 — A generated icon file carries geometry alone

**MUST.** The written SVG holds the outline and nothing else — no size, no colour of its own, no ARIA.

Why: the same file has to be correct inline, in a sprite and inside a button. Size is a token and the accessible name belongs on the control, so a file that carried either would be wrong in two of the three places it is used.

## The accessibility contract

The same for every icon, whatever renders it.

### FND-ICONS-09 — An icon never carries the accessible name

**MUST.** An icon is always `aria-hidden="true"`, and on an inline `<svg>` also `focusable="false"`; the name lives on what the icon is inside.

Why: whether a mark needs a name is a question only its context can answer, and an icon that answers it for itself is either announcing "image" into a label that already reads correctly, or hiding the fact that the control has no name at all.

| Where the icon is | Where the name is |
| --- | --- |
| beside a label | nowhere — the icon is decorative, and that is the whole rule |
| alone in a control | on the control (`aria-label`, or visually hidden text inside it), saying what the action does rather than what the mark depicts |
| standalone and informative | visually hidden text beside it — not `role="img"` on the SVG |

Serves: PRN-04.

### FND-ICONS-10 — Colour is never the only carrier of an icon's meaning

**MUST.** An icon's meaning survives the colour being unavailable.

Why: it is WCAG 2.2 SC 1.4.1 at the smallest element the system ships, and a status set distinguished by hue alone fails for the readers the mark was added to help.

Serves: PRN-07.

## Superseded: the interim Material Icons source

Until 2026-09-07 the source was the **[Default Kit / Material Icons](https://www.figma.com/design/mal5Fp20UXdswiLoBTVDvI/Default-Kit--Material-Icons)** Figma library — Google's older set, taken because it was free, comprehensive and available as a Figma library, and it unblocked component work without spending Alpha time drawing icons. The reasoning that replaced it is above; what it correctly said still stands: **this is not a claim that Material's visual language matches Stylos's classical and structural character.** A native Stylos icon set is still expected rather than merely possible, and drawing one is still too expensive now. What changed is that the placeholder is now a generated artifact in this repository rather than a link to someone else's Figma file — so replacing it later is a manifest and a generator, not a hunt through instances.

## The direction of travel between Figma and code

### FND-ICONS-11 — The code set is authoritative and Figma moves to match

**MUST.** Where the two sets disagree, the committed SVG set is right and the Figma library is what changes.

Why: decided 2026-09-07 with the source. The set is generated from a manifest in this repository, so it is the only side of the pair that can be reproduced.

Until the swap, a component's Figma face and its code face are different drawings — the thirty components at [node `2839:2469`](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components?node-id=2839-2469) are still the old Default Kit set. Cheapest to do before the Button family (Stage 5) fills in its icon slots.

Three marks change appearance in the swap, and are named here so the change is not read as a mistake: **Success, Warning and Error are outlined today and become filled**, because the instance is `FILL 1`.

### FND-ICONS-12 — An unresolved icon renders nothing

**MUST.** A name the set does not carry draws nothing: no fallback mark, no warning glyph, and no placeholder crossing from Figma into code.

Why: Figma's placeholder marks an instance nobody has chosen yet — a state a design file has and a program does not. A default mark would mean a forgotten property silently drawing a real icon, which is worse than drawing none: nothing is visibly wrong, and a magnifier where a trash can belongs is invisibly wrong.

## Open

- Whether Stylos will own a dedicated Figma file for icons once the swap happens — see [figma/README.md](../../figma/README.md) for the current library layout.
- Whether the set needs a second optical stop, and whether losing the FILL state pair costs anything in the navigation and tab components — both answerable only once those components exist.

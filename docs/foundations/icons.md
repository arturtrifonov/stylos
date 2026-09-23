# Icons

Status: Confirmed
Scope: Where the icon set comes from, how it is delivered, and how an icon is used and named.

SPEC 0012 built the source and delivery decisions below.

## Using an icon

### FND-ICONS-01 — An icon is chosen by function, not by resemblance

**MUST.** An icon is chosen for what it means, never because it looks like the mark in a reference.

Why: a mark matched by appearance brings with it the meaning it had in the other system. The mismatch shows only when someone reads the screen, not when they just look at it.

Serves: PRN-04.

### FND-ICONS-02 — An icon reaches a component through an exposed swap property

**MUST.** A component takes its icon through the instance-swap property it publishes — `icon`, `leading icon`, `trailing icon` — and not by editing a nested layer.

Why: the swap property is the component's API for the mark. A nested edit is invisible to every consumer of that API, and it is lost when the component changes.

`leading`/`trailing` are preferred over `left`/`right`, for localization and RTL. The property names themselves are set in [naming.md](naming.md) §7.

Serves: PRN-06.

### FND-ICONS-03 — An icon keeps the system's size, stroke and optical treatment

**MUST.** System icon size, stroke and optical treatment are preserved: no tracing from a screenshot, no manually resizing a nested icon.

Why: the instance below was chosen so that one drawing works at every size from 16 to 40px. A manual resize is the one operation that undoes this without anyone noticing.

Serves: PRN-01.

### FND-ICONS-04 — Logos and illustrations are content, not system icons

**MUST.** Product logos and meaningful illustrations are content assets and do not enter the icon system.

Why: the icon set is a vocabulary with one visual treatment. A logo has an owner and a specification of its own, and an illustration carries meaning that the set cannot normalise.

## The source: Material Symbols Rounded, at one instance

### FND-ICONS-05 — The set is one fixed instance of Material Symbols Rounded

**MUST.** Every mark comes from **Material Symbols** (Apache-2.0), Rounded, at a single fixed instance.

Why: a single instance is what makes the icons one set. Mixed axis values look like several icon families on one screen, and the axes are not a decision a call site should be able to make.

**Amended 2026-09-07, replacing the interim Material Icons source below.** The instance:

| Axis | Value | Why this one |
| --- | ---: | --- |
| `wght` | 500 | Heavier than the text beside it (Georama base 400, emphasis 450). This keeps a 16px mark from looking thinner than its label. |
| `FILL` | 1 | The whole set is filled. |
| `GRAD` | 0 | Unused — the correction it makes is too small to matter for this system. |
| `opsz` | 20 | The bottom of the axis: strokes redrawn for a small mark rather than scaled down from a large one. |

What matters is the pairing: **heavier weight against a smaller optical size**. It reads well at 16px and does not look coarse at 40px, so one instance covers the whole size range. It was chosen by eye, not derived, on a test bench that showed the axes against the real type scale.

Serves: PRN-05.

### FND-ICONS-06 — `FILL` is not a state axis

**MUST.** Selection is not shown by a filled/unfilled icon pair.

Why: in Material Symbols, FILL 0 → 1 *is* the unselected → selected pair, and a set that ships only FILL 1 has used that pair up. A navigation item, a tab or a toggle shows selection some other way — colour, surface, label weight — because the set does not carry the pair.

Reversing this means regenerating the set and re-checking every place that relied on the single fill.

## The delivery form: SVG, generated, committed

### FND-ICONS-07 — Icons ship as SVG, never as an icon font

**MUST.** The set is delivered as SVG. The files live in [`assets/icons/`](../../assets/icons/README.md): `manifest.yaml` is authored, `svg/*.svg` is written by `npm run icons:import` and committed.

Why: screen-reader behaviour is not the reason. Both forms handle it the same way, with `aria-hidden` on the mark and the name on the control (FND-ICONS-09). The reason is a kind of failure that an icon font cannot avoid:

- **The font does not load** — because of the network, CSP or a corporate proxy — and a ligature renders as the literal word: a button reads `delete_forever` instead of showing a mark. The accessible name is intact, but what the screen shows is not.
- **The reader has overridden fonts** — with Windows *ignore font styles*, Firefox with page fonts off, a dyslexia extension or a user stylesheet. The result is the same, and it affects exactly the readers the accessibility work is for.
- **The page is machine-translated.** Translation rewrites text nodes, so the ligature stops being a ligature and the icon disappears.

A second reason is specific to this repository: SPEC 0010 already decided that faces are *copied, never fetched*, so a font update is a deliberate commit with a diff. That decision ruled out the Google Fonts CSS API, subsetting included, before this one was made.

**What SVG costs, and why the cost is acceptable.** The variable axes can no longer be adjusted at runtime. Only `opsz` is a real loss, because a change of optical size redraws the mark rather than scaling it. That loss is recovered by instancing the variable font at import time, instead of taking the stock `@material-symbols/svg-NNN` packages, which are drawn at `opsz 48` only. The other three axes were never wanted at runtime: a design system that tokenises its decisions should give consumers one weight, not a slider.

**One instance, not a set of stops.** Putting several optical sizes in one file and switching between them with `<use>` does not work automatically: `href` is an attribute, not a CSS property, so nothing in CSS can change its target. Two versions do work: stops as `<g>` elements toggled by a container query, or — far simpler — the component picking a stop from the size it already knows. Neither is needed while one instance covers 16–40px. A second stop is added only if a real case shows the first one failing.

Checked by: `npm test` fails if the set and the manifest disagree.

### FND-ICONS-08 — A generated icon file carries geometry alone

**MUST.** The written SVG holds the outline and nothing else — no size, no colour of its own, no ARIA.

Why: the same file has to be correct inline, in a sprite and inside a button. Size is a token and the accessible name belongs on the control, so a file that carried either would be wrong in two of the three places it is used.

## The accessibility contract

The same for every icon, whatever renders it.

### FND-ICONS-09 — An icon never carries the accessible name

**MUST.** An icon is always `aria-hidden="true"`, and on an inline `<svg>` also `focusable="false"`; the name lives on what the icon is inside.

Why: only the context of a mark can say whether it needs a name. An icon that names itself does one of two wrong things: it announces "image" inside a label that already reads correctly, or it hides the fact that the control has no name at all.

| Where the icon is | Where the name is |
| --- | --- |
| beside a label | nowhere — the icon is decorative, and that is the whole rule |
| alone in a control | on the control (`aria-label`, or visually hidden text inside it), saying what the action does rather than what the mark depicts |
| standalone and informative | visually hidden text beside it — not `role="img"` on the SVG |

Serves: PRN-04.

### FND-ICONS-10 — Colour is never the only carrier of an icon's meaning

**MUST.** An icon's meaning stays clear when its colour is not available.

Why: this is WCAG 2.2 SC 1.4.1 applied to the smallest element the system ships. A status set told apart by hue alone fails the readers the mark was added to help.

## Superseded: the interim Material Icons source

Until 2026-09-07 the source was the **[Default Kit / Material Icons](https://www.figma.com/design/mal5Fp20UXdswiLoBTVDvI/Default-Kit--Material-Icons)** Figma library, Google's older set. It was taken because it was free, comprehensive and available as a Figma library, and because it unblocked component work without spending Alpha time on drawing icons. The reasoning that replaced it is above. One thing this section said correctly still stands: **this is not a claim that Material's visual language matches Stylos's classical and structural character.** A native Stylos icon set is still expected, not merely possible, and drawing one is still too expensive now. What changed is that the placeholder is now a generated artifact in this repository, not a link to someone else's Figma file. Replacing it later means changing a manifest and a generator, not searching through instances.

## The direction of travel between Figma and code

### FND-ICONS-11 — The code set is authoritative and Figma moves to match

**MUST.** Where the two sets disagree, the committed SVG set is right and the Figma library is what changes.

Why: decided on 2026-09-07, together with the source. The set is generated from a manifest in this repository, so it is the only side of the pair that can be reproduced.

Until the swap, a component's icons are different drawings in Figma and in code: the thirty components at [node `2839:2469`](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components?node-id=2839-2469) still use the old Default Kit set. The swap is cheapest to do before the Button family (Stage 5) fills in its icon slots.

Three marks change appearance in the swap. They are named here so the change is not taken for a mistake: **Success, Warning and Error are outlined today and become filled**, because the instance is `FILL 1`.

### FND-ICONS-12 — An unresolved icon renders nothing

**MUST.** A name the set does not carry draws nothing: no fallback mark, no warning glyph, and no placeholder crossing from Figma into code.

Why: Figma's placeholder marks an instance that nobody has chosen yet. A design file has that state; a program does not. With a default mark, a forgotten property would draw a real icon without any warning. That is worse than drawing nothing: an empty place is visibly wrong, but a magnifier where a trash can belongs is wrong in a way nobody sees.

## Open

- Whether Stylos will own a dedicated Figma file for icons once the swap happens — see [figma/README.md](../../figma/README.md) for the current library layout.
- Whether the set needs a second optical stop, and whether losing the FILL state pair costs anything in the navigation and tab components — both answerable only once those components exist.

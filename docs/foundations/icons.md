# Icons

Status: Confirmed
Scope: Where the icon set comes from, how it is delivered, and how an icon is used and named.

This guide defines the system rules for icons. The particular drawings and
their source are a preset, not a foundation rule; the preset currently shipped
by the repository is recorded below so that its implementation can be changed
without turning a vendor choice into a design requirement.

## Using an icon

### FND-ICONS-01 — An icon is chosen by function, not by resemblance

**MUST.** An icon is chosen for what it means, never because it looks like the mark in a reference.

Why: a mark matched by appearance brings with it the meaning it had in the other system. The mismatch shows only when someone reads the screen, not when they just look at it.

Serves: PRN-04.

### FND-ICONS-02 — An icon reaches a component through an exposed swap property

**MUST.** A component takes its icon through the instance-swap property it publishes — `icon`, `leading icon`, `trailing icon` — and not by editing a nested layer.

Why: the swap property is the component's API for the mark. A nested edit is invisible to every consumer of that API, and it is lost when the component changes.

Positional names follow FND-NAMING-16, and the property names themselves are set in [naming.md](naming.md) §7.

Serves: PRN-06.

### FND-ICONS-03 — An icon keeps the system's size, stroke and optical treatment

**MUST.** System icon size, stroke and optical treatment are preserved: no tracing from a screenshot, no manually resizing a nested icon.

Why: the instance below was chosen so that one drawing works at every size from 16 to 40px. A manual resize is the one operation that undoes this without anyone noticing.

Serves: PRN-01.

### FND-ICONS-04 — Logos and illustrations are content, not system icons

**MUST.** Product logos and meaningful illustrations are content assets and do not enter the icon system.

Why: the icon set is a vocabulary with one visual treatment. A logo has an owner and a specification of its own, and an illustration carries meaning that the set cannot normalise.

## The set

### FND-ICONS-05 — A set has one declared visual preset

**MUST.** Every system mark comes from the same declared icon preset. A call site does not choose a family, weight, fill or optical treatment.

Why: one preset is what makes the icons one set. Mixing families or treatments looks like several icon systems on one screen, and those choices belong to the set's owner, not to a call site.

### FND-ICONS-06 — State in a drawing is an explicit preset capability

**MUST.** A component uses a filled/unfilled or otherwise alternate drawing to show state only when the active preset explicitly supplies that state pair.

Why: a visual difference that happens to exist in one source is not a system state model. Treating it as one makes components depend on a preset detail that the next preset may not have.

## The delivery form: SVG, generated, committed

### FND-ICONS-07 — Icons ship as SVG, never as an icon font

**MUST.** The set is delivered as SVG, never as an icon font.

Why: screen-reader behaviour is not the reason. Both forms handle it the same way, with `aria-hidden` on the mark and the name on the control (FND-ICONS-10). The reason is a kind of failure that an icon font cannot avoid:

- **The font does not load** — because of the network, CSP or a corporate proxy — and a ligature renders as the literal word: a button reads `delete_forever` instead of showing a mark. The accessible name is intact, but what the screen shows is not.
- **The reader has overridden fonts** — with Windows *ignore font styles*, Firefox with page fonts off, a dyslexia extension or a user stylesheet. The result is the same, and it affects exactly the readers the accessibility work is for.
- **The page is machine-translated.** Translation rewrites text nodes, so the ligature stops being a ligature and the icon disappears.

A second reason is specific to this repository: SPEC 0010 already decided that faces are *copied, never fetched*, so a font update is a deliberate commit with a diff. That decision ruled out the Google Fonts CSS API, subsetting included, before this one was made.

### FND-ICONS-08 — The delivered set is reproducible and committed

**MUST.** The delivered icons are reproducible from their declared preset and are committed with it.

Why: reproducible assets let a preset be replaced deliberately, and committed assets turn every change to it into a diff.

Checked by: `npm test` fails if the set and the manifest disagree.

### FND-ICONS-09 — A generated icon file carries geometry alone

**MUST.** A delivered SVG holds the outline and nothing else — no size, no colour of its own, no ARIA.

Why: the same file has to be correct inline, in a sprite and inside a button. Size is a token and the accessible name belongs on the control, so a file that carried either would be wrong in two of the three places it is used.

## The accessibility contract

The same for every icon, whatever renders it.

### FND-ICONS-10 — An icon never carries the accessible name

**MUST.** An icon is always `aria-hidden="true"`, and on an inline `<svg>` also `focusable="false"`; the name lives on what the icon is inside.

Why: only the context of a mark can say whether it needs a name. An icon that names itself does one of two wrong things: it announces "image" inside a label that already reads correctly, or it hides the fact that the control has no name at all.

| Where the icon is | Where the name is |
| --- | --- |
| beside a label | nowhere — the icon is decorative, and that is the whole rule |
| alone in a control | on the control (`aria-label`, or visually hidden text inside it), saying what the action does rather than what the mark depicts |
| standalone and informative | visually hidden text beside it — not `role="img"` on the SVG |

Serves: PRN-04.

### FND-ICONS-11 — Colour is never the only carrier of an icon's meaning

**MUST.** An icon's meaning stays clear when its colour is not available.

Why: this is WCAG 2.2 SC 1.4.1 applied to the smallest element the system ships. A status set told apart by hue alone fails the readers the mark was added to help.

## Current default preset — Material Symbols Rounded

This is the preset the repository currently builds, not a rule that Stylos
icons must be Material. Its source, axes and names live in the authored
[`assets/icons/manifest.yaml`](../../assets/icons/manifest.yaml); the importer
turns those choices into the committed SVGs in
[`assets/icons/svg/`](../../assets/icons/README.md). A replacement preset must
continue to satisfy the rules above and the `Icon` drawing contract, but may
use different drawings, names and an importer appropriate to its source.

Stylos supplies this preset. A consumer choosing another preset is responsible
for its assets, integration and Figma library. A managed way to supply other
presets may be considered later; none is promised now.

The current instance is Material Symbols Rounded (Apache-2.0), `wght 500`,
`FILL 1`, `GRAD 0`, `opsz 20`. It was selected for this implementation because
it is available, comprehensive and works at the system's icon sizes. It does
not claim that Material is Stylos's visual language.

The importer instances that variable font rather than using the stock SVG
packages, which are drawn at a different optical size. That is a property of
this preset's source, not a requirement for a later source. Its variable axes
are fixed at import time; no call site receives an axis control.

The owner chose these parameters by visual comparison so that one optical
version works across the system's icon sizes. The preset supplies one drawing
per mark, scaled to the required footprint, with no second optical version.

The current preset provides only filled drawings. Stylos currently has no
component that uses a filled/unfilled pair to show state, so omitting the
unfilled version loses no behaviour the system currently supports. A state
pair is outside this preset's scope.

The Figma implementation will have a dedicated icon file containing this
preset only. It will supply the same drawings as the repository. Creating the
file and aligning existing components are implementation work still to do;
the choice of library structure is settled. See
[figma/README.md](../../figma/README.md) for the existing files.

## The direction of travel between Figma and code

### FND-ICONS-12 — The published preset has one authority

**MUST.** Each published preset identifies one authoritative artifact. Other representations, including Figma, move to match it.

Why: an icon mismatch cannot be resolved by taste at every component. One authority makes a replacement auditable and prevents the two representations quietly becoming different sets.

For the current default preset, the committed SVGs are authoritative because
they are reproducible from the manifest. The thirty Figma icon components at
[node `2839:2469`](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components?node-id=2839-2469)
still use the earlier external Material Icons library and have not yet been
aligned.

Three marks will change appearance during that alignment: **Success, Warning and Error** are outlined in Figma today and filled in the current preset.

### FND-ICONS-13 — An unresolved icon renders nothing

**MUST.** A name the set does not carry draws nothing: no fallback mark, no warning glyph, and no placeholder crossing from Figma into code.

Why: Figma's placeholder marks an instance that nobody has chosen yet. A design file has that state; a program does not. With a default mark, a forgotten property would draw a real icon without any warning. That is worse than drawing nothing: an empty place is visibly wrong, but a magnifier where a trash can belongs is wrong in a way nobody sees.

# Color

Status: Confirmed
Scope: The palette, the semantic roles and the mode mechanism — how a colour is chosen; how a whole theme is applied is [theming.md](theming.md).

## Two layers

| Layer | Collection | What it is |
| --- | --- | --- |
| Primitive | `palette` | hue groups × steps, one value per mode |
| Semantic | `color` | roles — `surface`, `text`, `background`, `border`, `shadow` — each naming a palette step |

### FND-COLOR-01 — The palette is hue groups in numbered steps

**MUST.** The core palette is stable hue groups with numbered steps `25`–`975`, plus `base/black` and `base/white`.

Why: numbered steps are positions on a ramp, so a role can be moved one step without renaming anything, and two hue groups can be compared step for step. Named lightnesses (`light`, `darker`) cannot do either.

### FND-COLOR-02 — Interface decisions bind to semantic roles

**MUST.** A colour decision binds to a semantic role, and never to a primitive directly where a semantic variable exists.

Why: the role is what survives a mode change and a rebrand; a primitive binding is a decision about *which* colour, made in a place that only knows *what* the thing is.

Serves: PRN-04.

### FND-COLOR-03 — The dark palette is authored, not derived

**MUST.** The dark ramp is authored by hand; no formula generates it from the light one.

Why: its ramp broadly inverts the light one — the light end of dark is the dark end of light — but the deep steps are lifted and desaturated by hand, because a literal inversion gives near-black saturated surfaces that are unusable. There is no formula behind it and none is wanted: the same transform applied to different hues does not produce equivalent results, so a rule stated in numbers would be false the first time it met a new hue group.

Serves: PRN-05.

## What is never done to a colour

### FND-COLOR-04 — No colour is sampled from a reference

**MUST.** A colour is never taken from a reference by sampling it.

Why: a sampled value carries the other system's decision and none of its reasoning, and it is bound to nothing — so it stays behind at every later palette change.

Serves: PRN-04.

### FND-COLOR-05 — No one-off variable is created for a reconstruction

**MUST.** A reconstruction does not add variables of its own.

Why: a variable created for one screen is indistinguishable from a system one afterwards, and the palette grows by accretion until nobody can say which colours the system actually has.

### FND-COLOR-06 — Nested layers are not recoloured outside the component API

**MUST.** A component's inner layers are recoloured only through the properties the component publishes.

Why: an override inside an instance is invisible to every consumer of that component's API, and it is undone — or silently kept — the next time the component changes.

Serves: PRN-06.

### FND-COLOR-07 — A variable name never encodes a theme

**MUST.** No variable name carries a theme or mode in it.

Why: the mode is a property of the collection, not of the name (FND-COLOR-08). A name that says `dark` has to be duplicated for every other mode, and the duplicates then have to be kept in step by hand.

## The mode lives in `color`

### FND-COLOR-08 — The mode is a property of the semantic layer, not of the palette

**MUST.** `color` is the collection that carries Light Mode and Dark Mode; each mode picks a step from the palette collection of the same name, and the palettes themselves are two plain sources.

Why: this is why `palette.light` and `palette.dark` are separate collections in Figma rather than one collection with two modes. Two modes of one collection would only let a step change its *value*. Separate collections let a role choose a **different step** per mode — indigo/700 in light, indigo/800 in dark — which is what a dark context actually needs.

A `ref` such as `palette/indigo/700` therefore names a step, **not a collection**. The collection is supplied by the role's mode. The mapping mode name → palette collection is declared in [`tokens/_naming.yaml`](../../tokens/_naming.yaml) and is part of the contract, not an implementation detail.

### FND-COLOR-09 — A role that diverges per mode is declared

**MUST.** A role resolving to a *different token* per mode is declared in `mode_dependent`.

Why: undeclared divergence is indistinguishable from an import error, and the declaration is what makes the list checkable in both directions — a declared role that turns out not to diverge fails too, so the list cannot go stale.

Eight are declared, for two different reasons. Three are anchored to the ends of the ramp and take the opposite end per mode: `text/static-light`, `text/static-dark`, `background/base`. Five are the bold disabled surfaces — `surface/bold/{base,primary,success,warning,danger}/disabled` — which take `slate/100` in light and `slate/200` in dark, because the step that reads as a filled-but-inert surface is not the same distance from the background in both modes. `surface/subtle/*/disabled` is `slate/25` in both and is deliberately not among them: a subtle surface sits on the background rather than over it.

Checked by: `npm run tokens:check`.

### FND-COLOR-10 — Shadow colours are stored as literals

**MUST.** `shadow/base` and `shadow/primary` are stored exactly as given, as values rather than references.

Why: Figma cannot bind a variable and change its opacity, so the colour arrives as a literal with alpha and storing it any other way would be storing something the file does not contain. They are not mode-dependent roles; they are not references at all. `effect/shadow/color/*` aliases them, so the colour is defined here once and the effect collection points at it.

That literalness has a cost: `shadow/primary` currently holds indigo/700's value without referencing it, so **it will not follow a slot rebinding**. The check in [SPEC 0001](../specs/0001-token-pipeline.md) §5.6 rule 7 cannot catch this — it walks references, and there is none.

## Slots — the five colours the system has

### FND-COLOR-11 — Every slot-bound role resolves into one of five slots

**MUST.** Every semantic role except `*/special/*` resolves into one of five hue groups, and no other.

| Slot | Bound to | Carries |
| --- | --- | --- |
| `base` | slate | all neutral structure — surfaces, body text, borders, dividers |
| `primary` | indigo | brand, primary action, focus, selection |
| `success` | green | positive outcome |
| `warning` | amber | caution |
| `danger` | red | destructive action and error states |

Why: **the slot is the unit of customization**, and it is the reason the indirection exists. Rebinding one slot moves every role that draws on it, in both modes, at once. The 64 referencing roles outside `*/special/*` draw on exactly these five groups.

Exception: disabled states resolve into `base` rather than into a pale version of their own slot — `surface/bold/danger/disabled` is neutral. A disabled control is structurally inert regardless of what it would have meant enabled.

### FND-COLOR-12 — A hue-bound role does not follow a rebrand

**MUST.** `*/special/*` names a palette hue group directly, and a rebrand does not move it.

Why: those roles carry **categorical** colour — tags, labels, statuses a product defines for itself, chart series — where the point is that specific colour. If a client binds `primary` to violet, `surface/special/indigo` still means indigo and `surface/special/violet` now coincides with the brand, which is the correct reading of both rather than a collision.

| Kind | Count | Example | Rebrandable |
| --- | --- | --- | --- |
| slot-bound | 66 | `surface/bold/danger/default` | yes — by rebinding the slot |
| hue-bound | 44 | `surface/special/violet` | no — the hue is the meaning |

They exist as 44 authored variables because Figma offers no way to generate them. If that changes they become generated; the contract does not change with it.

## The customization boundary

### FND-COLOR-13 — A client binds slots and does not edit roles

**MUST.** Customization happens by binding a slot; the role names, the role set, the mode mechanism and the hue-bound roles are not customizable at any stage.

| Stage | What a client may do |
| --- | --- |
| now | bind each of the five slots to any hue group in the palette |
| later | supply their own hue group and bind a slot to it |
| much later | control which *step* a given role takes within its slot |

Why: repointing an individual role is deliberately outside this. With 110 roles across two modes, per-role overrides would make the entire set public API — every rename a breaking change needing a migration. Five slots do not carry that cost, and they cover the cases a client actually has.

Serves: PRN-06.

## What this settles for the CSS build

The contract above is what the CSS build generates from — `npm run tokens:css`, [SPEC 0007](../specs/0007-tokens-to-css.md), the first half of [Stage 5](../../PLAN.md) — and it fixes three things that are otherwise a guess.

### FND-COLOR-14 — The palette is emitted flat, not mode-scoped

**MUST.** Both palettes are emitted unconditionally as two independent sets, with no selector switching them.

Why: the palette is a source, not a theme (FND-COLOR-08). Scoping it by mode would mean a step's identity depended on where it was read from.

### FND-COLOR-15 — The semantic layer is emitted twice, in full

**MUST.** Every role is declared in both the light and the dark scope, including the ones whose value does not change.

Why: if the dark scope only redeclared the roles that differ, a client override in the light scope would inherit into dark — silently, and only for the roles they happened to touch.

### FND-COLOR-16 — One global mode switch

**MUST.** A mode applies to the document, not to an arbitrary subtree.

Why: a dark region inside a light page is not a supported case, and supporting it later would mean re-emitting the whole semantic layer per mode-bearing node.

## Values

### FND-COLOR-17 — The palette exists only in `tokens/`

**MUST.** Anything outside `tokens/` that claims to be the Stylos palette is not one.

Why: it is an input someone used once, and it will drift. A value copied into a document is wrong the moment a variable is tweaked in Figma, and a stale value in a foundation document gets built against (RUL-09).

**Not written here.** Run `npm run tokens:report` — the values live in [`tokens/palette.yaml`](../../tokens/) and `tokens/color.yaml`, imported from Figma and verified against their own references.

## Open

- **`info`.** A well-known sixth status colour, used nowhere in Stylos and absent from the tokens. Adding it means adding a sixth slot, not a one-off role.
- **Two different `base`.** The slot `base` binds to slate; the palette group `base` holds white and black. Same word, unrelated meanings, and only `background/base` currently touches the latter.
- **Shadows and a rebrand.** `shadow/primary` is a literal, so rebinding the `primary` slot leaves the shadow behind. Either the shadow follows the slot somehow, or the system states that shadows do not participate in a rebrand.

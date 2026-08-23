# Color

Status: **Confirmed.**

## Confirmed

- The core palette uses stable hue groups with numbered steps `25`–`975`, plus `base/black` and `base/white`.
- Interface decisions bind to **semantic roles** — never to a primitive directly when a semantic variable exists.
- **The dark palette is authored, not derived.** Its ramp broadly inverts the light one — the light end of dark is the dark end of light — but the deep steps are lifted and desaturated by hand, because a literal inversion gives near-black saturated surfaces that are unusable. There is no formula behind it and none is wanted: the same transform applied to different hues does not produce equivalent results, so a rule stated in numbers would be false the first time it met a new hue group.
- No sampling colours from references. No per-reconstruction one-off variables. No recolouring nested layers outside the component API. No theme names encoded in variable names.

## Two layers

| Layer | Collection | What it is |
| --- | --- | --- |
| Primitive | `palette` | hue groups × steps, one value per mode |
| Semantic | `color` | roles — `surface`, `text`, `background`, `border`, `shadow` — each naming a palette step |

## The mode lives in `color`

**The mode is a property of the semantic layer, not of the palette.** The palettes are two *sources*; `color` is the collection that has Light Mode and Dark Mode, and each mode picks a step from the palette collection of the same name.

This is why `palette.light` and `palette.dark` are separate collections in Figma rather than one collection with two modes. Two modes of one collection would only let a step change its *value*. Separate collections let a role choose a **different step** per mode — indigo/700 in light, indigo/800 in dark — which is what a dark context actually needs.

Two consequences that are easy to miss:

- A `ref` such as `palette/indigo/700` names a step, **not a collection**. The collection is supplied by the role's mode. The mapping mode name → palette collection is declared in [`tokens/_naming.yaml`](../../tokens/_naming.yaml) and is part of the contract, not an implementation detail.
- A role that resolves to a *different token* per mode must be declared in `mode_dependent`. Three are: `text/static-light`, `text/static-dark`, `background/base`. Undeclared divergence fails the check — and so does a declared role that turns out not to diverge, so the list cannot go stale.

**Shadow colours are literals.** Figma cannot bind a variable and change its opacity, so `shadow/base` and `shadow/primary` arrive as values rather than references and are stored exactly as given. They are not mode-dependent roles; they are not references at all. `effect/shadow/color/*` aliases them, so the colour is defined here once and the effect collection points at it.

That literalness has a cost: `shadow/primary` currently holds indigo/700's value without referencing it, so **it will not follow a slot rebinding**. The check in [SPEC 0001](../specs/0001-token-pipeline.md) §5.6 rule 7 cannot catch this — it walks references, and there is none.

## Slots — the five colours the system has

Every semantic role except `*/special/*` resolves into one of five hue groups:

| Slot | Bound to | Carries |
| --- | --- | --- |
| `base` | slate | all neutral structure — surfaces, body text, borders, dividers |
| `primary` | indigo | brand, primary action, focus, selection |
| `success` | green | positive outcome |
| `warning` | amber | caution |
| `danger` | red | destructive action and error states |

Nothing else. The 64 referencing roles outside `*/special/*` draw on exactly these five groups and no other.

**The slot is the unit of customization**, and it is the reason the indirection exists. Rebinding one slot moves every role that draws on it, in both modes, at once.

Disabled states are the deliberate exception: `surface/bold/danger/disabled` resolves into `base`, not into a pale red. A disabled control is structurally inert regardless of what it would have meant enabled.

## Two kinds of role

| Kind | Count | Example | Rebrandable |
| --- | --- | --- | --- |
| slot-bound | 66 | `surface/bold/danger/default` | yes — by rebinding the slot |
| hue-bound | 44 | `surface/special/violet` | no — the hue is the meaning |

`*/special/*` names a palette hue group directly, for **categorical** colour: tags, labels, statuses a product defines for itself, chart series. There the point is that specific colour, so a rebrand must not move it. If a client binds `primary` to violet, `surface/special/indigo` still means indigo and `surface/special/violet` now coincides with the brand — which is the correct reading of both, not a collision.

They exist as 44 authored variables because Figma offers no way to generate them. If that changes they become generated; the contract does not change with it.

## The customization boundary

A client configures Stylos by **binding slots**, not by editing roles.

| Stage | What a client may do |
| --- | --- |
| now | bind each of the five slots to any hue group in the palette |
| later | supply their own hue group and bind a slot to it |
| much later | control which *step* a given role takes within its slot |

Not customizable at any stage: the role names and the role set; the mode mechanism; hue-bound roles.

Repointing an individual role is deliberately outside this. With 110 roles across two modes, per-role overrides would make the entire set public API — every rename a breaking change needing a migration. Five slots do not carry that cost, and they cover the cases a client actually has.

## What this settles for the CSS build

The contract above is what [Stage 3](../../PLAN.md) generates from, and it fixes three things that are otherwise a guess:

- **The palette is not mode-scoped.** Both palettes are emitted flat and unconditionally as two independent sets. No selector switches them.
- **The semantic layer is emitted twice** — once in the light scope, once in the dark — with *every* role declared in both, including the ones whose value does not change. If the dark scope only redeclared the roles that differ, a client override in the light scope would inherit into dark.
- **One global mode switch.** A theme applies to the document, not to an arbitrary subtree; a dark region inside a light page is not a supported case, and supporting it later would mean re-emitting the whole layer per theme-bearing node.

## Values

**Not written here.** Run `npm run tokens:report` — the values live in [`tokens/palette.yaml`](../../tokens/) and `tokens/color.yaml`, imported from Figma and verified against their own references.

A value copied into this document is wrong the moment a variable is tweaked in Figma, and a stale value in a foundation document gets built against. That is why none appear here.

The same holds for palette files kept anywhere else. **Anything outside `tokens/` that claims to be the Stylos palette is not one** — it is an input someone used once, and it will drift.

## Open

- **`info`.** A well-known sixth status colour, used nowhere in Stylos and absent from the tokens. Adding it means adding a sixth slot, not a one-off role.
- **Two different `base`.** The slot `base` binds to slate; the palette group `base` holds white and black. Same word, unrelated meanings, and only `background/base` currently touches the latter.
- **Shadows and a rebrand.** `shadow/primary` is a literal, so rebinding the `primary` slot leaves the shadow behind. Either the shadow follows the slot somehow, or the system states that shadows do not participate in a rebrand.

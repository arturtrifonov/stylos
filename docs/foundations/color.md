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

The declarations live in [`tokens/_naming.yaml`](../../tokens/_naming.yaml), each with the reason it diverges, and they are not copied here: a list restated in prose is a second copy of the contract, and this one had already gone stale — it said eight, and the ninth arrived with the shadow colours.

"A different token" means a different target. A role whose *alpha* differs per mode is not covered by this rule.

Checked by: `npm run tokens:check`.

## Slots — the five colours the system has

A **slot** is a name a role reaches the palette *through*: five of them stand between the 110 roles and the hue groups, and rebinding one is how a product recolours Stylos. The slots are not a collection of their own — they are the indirection the role names imply, made explicit by the CSS build as `--stylos-slot-<name>-<step>` and bound in [`tools/build-css.mjs`](../../tools/build-css.mjs).

### FND-COLOR-18 — Every role that takes a slot resolves into one of five hue groups

**MUST.** Every semantic role except `*/special/*` resolves into one of five hue groups, and no other.

| Slot | Bound to | Carries |
| --- | --- | --- |
| `base` | slate | all neutral structure — surfaces, body text, borders, dividers |
| `primary` | indigo | brand, primary action, focus, selection |
| `success` | green | positive outcome |
| `warning` | amber | caution |
| `danger` | red | destructive action and error states |

Why: **the slot is the unit of customization**, and it is the reason the indirection exists. Rebinding one slot moves every role that draws on it, in both modes, at once. All 66 roles outside `*/special/*` are references, and they draw on exactly these five groups and the two exceptions below.

Exception: disabled states resolve into `base` rather than into a pale version of their own slot — `surface/bold/danger/disabled` is neutral. A disabled control is structurally inert regardless of what it would have meant enabled.
Exception: `background/base` and `shadow/base` are anchored on the ends and name the palette group `base` — white and black — directly, taking no slot. The ground a page is painted on is white or black whatever the brand is, and so is the neutral shadow cast on it.
Checked by: `npm run tokens:css` — a role whose binding contradicts its slot fails the build, naming the role, the slot and the group it landed in.

### FND-COLOR-12 — A hue-bound role does not follow a rebrand

**MUST.** `*/special/*` names a palette hue group directly, and a rebrand does not move it.

Why: those roles carry **categorical** colour — tags, labels, statuses a product defines for itself, chart series — where the point is that specific colour. If a client binds `primary` to violet, `surface/special/indigo` still means indigo and `surface/special/violet` now coincides with the brand, which is the correct reading of both rather than a collision.

| Kind | Count | Example | Rebrandable |
| --- | --- | --- | --- |
| slot-bound | 66 | `surface/bold/danger/default` | yes — by rebinding the slot |
| hue-bound | 44 | `surface/special/violet` | no — the hue is the meaning |

They exist as 44 authored variables because Figma offers no way to generate them. If that changes they become generated; the contract does not change with it.

## A translucent colour

### FND-COLOR-19 — An opacity is stored on the binding, never baked into a value

**MUST.** A role that takes a palette step at reduced opacity keeps the reference and stores the opacity beside it, rather than storing the colour that results.

Why: the resulting colour is a copy of a palette value with the link cut — it stays behind at every rebrand and every palette change, and nothing reports it, because a check that walks references cannot see a role that has none. The two shadow colours are the worked example. They were literals for as long as Figma could not bind a variable and reduce its opacity in one value; the guideline recorded that workaround as a rule of the design language, and the rule then outlived the limitation. Figma gained the capability in September 2026, `shadow/primary` is `indigo/700` at 4% in light and `indigo/50` at 24% in dark, and rebinding the `primary` slot now moves every shadow with it.

The opacity stored is the one applied at that binding, not the composed result: a step that is itself translucent contributes its own alpha where it is resolved, and storing the product would count it twice. `effect/shadow/color/*` aliases these roles, so the colour is defined here once and the effect collection points at it.

No check can find a violation — a colour flattened by hand in Figma is indistinguishable from one that was always a value — so this is enforced by review. What `npm run tokens:import` does guarantee is that an opacity Figma reports on a binding is carried through as an alpha on the reference rather than dropped.

Serves: PRN-04.

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

The contract above is what the CSS build generates from — `npm run tokens:css`, [`tools/build-css.mjs`](../../tools/build-css.mjs), the first half of [Stage 5](../../PLAN.md) — and it fixes three things that are otherwise a guess.

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
- **Two different `base`.** The slot `base` binds to slate; the palette group `base` holds white and black. Same word, unrelated meanings, and two roles reach the latter — `background/base` and `shadow/base`, the two exceptions on FND-COLOR-18.
- **A mode-dependent alpha is not declared.** FND-COLOR-09 covers a role that references a different *token* per mode, and `shadow/base` references `base/black` in both while taking it at 3% in light and 83% in dark. That divergence is as invisible as the one the rule exists to catch, and nothing checks it. Either the rule widens to cover an alpha, or the system states why an opacity is different.

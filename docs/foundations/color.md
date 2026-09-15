# Color

Status: Confirmed
Scope: The palette, the semantic roles and the mode mechanism — how a colour is chosen; how a whole theme is applied is [theming.md](theming.md).

## Two layers

| Layer | Collection | What it is |
| --- | --- | --- |
| Primitive | `palette` | hue groups × steps, one value per mode |
| Semantic | `color` | roles — `surface`, `text`, `background`, `border`, `shadow` — each naming a palette step |

The dark ramp is authored, not generated from the light one: a literal inversion gives near-black saturated surfaces that are unusable, and the same transform does not hold across hue groups. It is the worked example behind PRN-05.

### FND-COLOR-01 — The palette is hue groups in numbered steps

**MUST.** The core palette is stable hue groups with numbered steps `25`–`975`, plus one group holding pure black and pure white.

Why: numbered steps are positions on a ramp, so a role can be moved one step without renaming anything, and two hue groups can be compared step for step. Named lightnesses (`light`, `darker`) cannot do either.

### FND-COLOR-02 — Interface decisions bind to semantic roles

**MUST.** A colour decision binds to a semantic role, and never to a primitive directly where a semantic variable exists.

Why: the role is what survives a mode change and a rebrand; a primitive binding is a decision about *which* colour, made in a place that only knows *what* the thing is.

Serves: PRN-04.

### FND-COLOR-03 — A colour outside the palette is not used

**MUST.** Every colour in an interface comes from the palette through a semantic role — none is sampled from a reference, picked by eye, or added as a variable of its own.

Why: a colour chosen outside the palette is bound to nothing. It carries whoever picked it and none of their reasoning, it sits out every later palette change untouched, and once a few exist nobody can say which colours the system actually has.

Exception: a gradient, a mesh or any other multi-stop fill that no single palette step can express is placed as an image rather than coloured, and adds no variables.
Serves: PRN-04.

## Modes

### FND-COLOR-04 — A variable name never encodes a theme

**MUST.** No variable name carries a theme or mode in it.

Why: the mode is a property of the collection, not of the name (FND-COLOR-05). A name that says `dark` has to be duplicated for every other mode, and the duplicates then have to be kept in step by hand.

### FND-COLOR-05 — The mode is a property of the semantic layer, not of the palette

**MUST.** The modes live in `color`: each mode of a role picks a step from the palette of the same name, and the palettes themselves are two plain sources carrying no modes.

Why: a role has to be able to choose a **different step** per mode — indigo/700 in light, indigo/800 in dark — because a dark context is not the light one recoloured. A palette that carried the modes itself could only change a step's *value*, which is the weaker of the two and not the one a dark context needs.

A `ref` such as `palette/indigo/700` therefore names a step, **not a collection**. The collection is supplied by the role's mode, and the mapping mode name → palette is declared in [`tokens/_naming.yaml`](../../tokens/_naming.yaml) as part of the contract.

## How the roles are organised

The semantic layer is cut by **what a colour paints**, and then, inside an area that needs it, a second time.

| Area | Paints |
| --- | --- |
| `surface` | the fill of something tangible — a button, a tag, a field, a card |
| `text` | anything read |
| `background` | the ground the interface sits on |
| `border` | the edge of an object |
| `shadow` | what an object casts on what is under it |

| Second cut | Where | Values |
| --- | --- | --- |
| intensity | `surface` | `bold` — the object *is* the colour; `subtle` — the colour is a wash the ground still shows through |
| tone | `surface`, `text`, `background`, `border` | `base` for neutral structure, then `primary`, `success`, `warning`, `danger` |
| prominence | `text`, `background` | `base`, `secondary`, `tertiary` |
| state | `surface` | `default`, `hover`, `active`, `disabled` |
| type | `surface`, `text` | `special/<hue>` — one role per named hue |

`text` carries four of its own besides: `inverted`, `static-light`, `static-dark` and `disabled`. Disabled is the one place a tone is dropped rather than paled — `surface/bold/danger/disabled` is neutral, because a disabled control is structurally inert regardless of what it would have meant enabled.

### FND-COLOR-06 — A role is named for what it paints

**MUST.** A role's name states the area it paints and, inside it, its intensity, tone, prominence or state — never the hue or the step it resolves to.

Why: the name is what an interface binds to, and it has to survive the colour moving underneath it. A role named after its colour has to be renamed the first time that colour changes, and renaming means finding every consumer.

Exception: `*/special/*` names a hue, because there the hue is the meaning — FND-COLOR-08.
Serves: PRN-04.

### FND-COLOR-07 — A surface is an object; a background is the ground

**MUST.** `surface/*` paints something a person can act on; `background/*` paints what the interface sits on, and nothing wearing it is interactive.

Why: the two are one decision apart and get confused constantly, with the same colour reached for either way. Keeping them separate is what lets a surface carry `hover`, `active` and `disabled` while a background carries no states at all — and it is why something that becomes clickable changes role rather than merely changing value.

### FND-COLOR-08 — A hue-named role keeps its hue

**MUST.** `*/special/*` names a palette hue group directly, and nothing recolours it.

Why: those roles carry **categorical** colour — tags, labels, statuses a product defines for itself, chart series — where the point is that specific colour. A role that means "violet" and stops being violet means nothing at all.

Checked by: `npm run tokens:css` — a `special` role bound to another hue fails the build, naming both.

## Translucency

### FND-COLOR-09 — A translucent colour is a palette colour plus an opacity

**MUST.** A colour with transparency is a palette step and an opacity beside it, never a colour stored with the alpha already mixed into it.

Why: the mixed result is a copy of a palette value with its link cut, so it sits out the next palette change and nothing reports it — a check that walks references cannot see a role that has none.

## What this settles for the CSS build

The contract above is what the CSS build generates from — `npm run tokens:css`, [`tools/build-css.mjs`](../../tools/build-css.mjs) — and it fixes three things that are otherwise a guess.

### FND-COLOR-10 — The palette is emitted flat, not mode-scoped

**MUST.** Both palettes are emitted unconditionally as two independent sets, with no selector switching them.

Why: the palette is a source, not a theme (FND-COLOR-05). Scoping it by mode would mean a step's identity depended on where it was read from.

### FND-COLOR-11 — The semantic layer is emitted twice, in full

**MUST.** Every role is declared in both the light and the dark scope, including the ones whose value does not change.

Why: if the dark scope only redeclared the roles that differ, a client override in the light scope would inherit into dark — silently, and only for the roles they happened to touch.

### FND-COLOR-12 — One global mode switch

**MUST.** A mode applies to the document, not to an arbitrary subtree.

Why: a dark region inside a light page is not a supported case, and supporting it later would mean re-emitting the whole semantic layer per mode-bearing node.

## Values

### FND-COLOR-13 — The palette exists only in `tokens/`

**MUST.** Anything outside `tokens/` that claims to be the Stylos palette is not one.

Why: it is an input someone used once, and it will drift. A value copied into a document is wrong the moment a variable is tweaked, and a stale value in a foundation document gets built against (RUL-09).

**Not written here.** Run `npm run tokens:report` — the values live in [`tokens/palette.yaml`](../../tokens/) and `tokens/color.yaml`.

## Open

- **`info`.** A well-known sixth status colour, used nowhere in Stylos and absent from the tokens. Adding it means adding a sixth tone across the areas that carry one, not a role in one place.
- **`special` could be generated.** The hue-named roles are authored one by one, and they are the one part of the set that is mechanical: one chosen step per hue group. Generating them means deciding that step — and deciding whether light and dark take the same one.

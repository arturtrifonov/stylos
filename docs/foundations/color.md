# Color

Status: Confirmed
Scope: The palette, the semantic roles and the mode mechanism — how a colour is chosen; how a whole theme is applied is in [theming.md](theming.md).

## Two layers

| Layer | Collection | What it is |
| --- | --- | --- |
| Primitive | [`tokens/palette.yaml`](../../tokens/palette.yaml) | hue groups × steps, with separate light and dark ramps |
| Semantic | `color` — [`tokens/color.yaml`](../../tokens/color.yaml) | roles — `surface`, `text`, `background`, `border`, `shadow` — each naming a palette step |

The palette supplies the light and dark ramps; semantic roles choose a step from the appropriate ramp in each mode (FND-COLOR-05). Figma collection layout and its import mapping are documented in [figma/foundations.md](../../figma/foundations.md#color-collections).

The dark ramp is authored by hand, not generated from the light one. A literal inversion of the light ramp gives near-black, saturated surfaces that are unusable, and no single transform works for every hue group. It is the worked example behind PRN-05.

### FND-COLOR-01 — The palette is hue groups in numbered steps

**MUST.** The core palette consists of stable hue groups with numbered steps `25`–`975`, plus one group that holds pure black and pure white.

Why: numbered steps are positions on a ramp, so a role can be moved one step without renaming anything, and two hue groups can be compared step for step. Named lightnesses (`light`, `darker`) cannot do either.

### FND-COLOR-02 — Interface decisions bind to semantic roles

**MUST.** A colour decision binds to a semantic role, and never to a primitive directly where a semantic variable exists.

Why: a binding to a role still holds after a mode change or a rebrand. A binding to a primitive decides *which* colour to use, and it makes that decision in a place that knows only *what* the thing is.

Serves: PRN-04.

### FND-COLOR-03 — A colour outside the palette is not used

**MUST.** Every colour in an interface comes from the palette through a semantic role; no colour is sampled from a reference, picked by eye, or added as a variable of its own.

Why: a colour chosen outside the palette is bound to nothing. It holds one person's choice and none of their reasoning, and no later palette change reaches it. Once a few such colours exist, nobody can say which colours the system actually has.

Exception: a gradient, a mesh or another multi-stop fill is treated as image content for colour selection, so its colours may fall outside the palette and need no new variables; the fill may remain an editable gradient or mesh and does not need conversion to an image.
Serves: PRN-04.

## Modes

### FND-COLOR-04 — A variable name never encodes a theme

**MUST.** No variable name carries a theme or mode in it.

Why: the mode selects the bindings of semantic roles, not their names (FND-COLOR-05). A name that says `dark` has to be duplicated for every other mode, and the duplicates then have to be kept in sync by hand.

### FND-COLOR-05 — A semantic role chooses its palette step per mode

**MUST.** Choose each semantic colour role's palette step separately for each mode, using that mode's palette ramp.

Why: a role may need a different step in each mode — the disabled surfaces take a different `slate` step in dark than in light. Changing only the value behind one fixed step would not express that decision.

A `ref` such as `palette/indigo/700` names a hue and step. The role's mode selects the ramp from which that step is resolved; the storage arrangement does not change this meaning.

## How the roles are organised

The semantic layer is cut first by **what a colour paints**. Inside an area that needs it, it is cut a second time.

| Area | Paints |
| --- | --- |
| `surface` | the fill of something tangible — a button, a tag, a field, a card |
| `text` | anything read |
| `background` | the ground the interface sits on |
| `border` | the edge of an object |
| `shadow` | what an object casts on what is under it |

| Second cut | Where | Values |
| --- | --- | --- |
| intensity | `surface` | `bold` — the object *is* the colour; `subtle` — the object is a pale tint of it |
| tone | `surface`, `text`, `background`, `border`, `shadow` | `base` for neutral structure (`default` on `border`), then `primary`, `info`, `success`, `warning`, `danger`; `shadow` has only `base` and `primary` |
| prominence | `text`, `background`, `border` | `base`, `secondary`, `tertiary`; `border` has `default` and `secondary` |
| state | `surface` | `default`, `hover`, `active`, `disabled` |
| type | `surface`, `text`, `background`, `border` | `special/<hue>` in place of a tone — one set of roles per palette hue group, generated (FND-COLOR-14) |

Besides these, `text` has four roles of its own: `inverted`, `static-light`, `static-dark` and `disabled`. Disabled is the one place where a tone is dropped instead of made paler. `surface/bold/danger/disabled` is neutral, because a disabled control cannot be used, whatever it would have meant when enabled.

### FND-COLOR-06 — A role is named for what it paints

**MUST.** A role's name states the area it paints and, inside it, its intensity, tone, prominence or state — never the hue or the step it resolves to.

Why: an interface binds to the name, so the name has to stay correct when the colour behind it changes. A role named after its colour has to be renamed the first time that colour changes, and renaming it means finding every consumer.

Exception: `*/special/*` names a hue, because there the hue is the meaning — FND-COLOR-08.
Serves: PRN-04.

### FND-COLOR-07 — A surface is an object; a background is the ground

**MUST.** `surface/*` paints something a person can act on; `background/*` paints what the interface sits on, and nothing painted with it is interactive.

Why: the two differ by one decision, and people confuse them all the time, picking the same colour for either. Keeping them separate is what lets a surface have `hover`, `active` and `disabled` while a background has no states at all. It is also why something that becomes clickable moves to another role, instead of only getting another value.

### FND-COLOR-08 — A hue-named role keeps its hue

**MUST.** `*/special/*` names a palette hue group directly, and nothing recolours it.

Why: those roles carry **categorical** colour — tags, labels, statuses a product defines for itself, chart series — where the specific colour is the point. A role that means "violet" and stops being violet has no meaning left.

Exception: a disabled special surface drops its hue like every disabled surface, because a disabled control cannot be used, whatever it would have meant when enabled.
Checked by: `npm run tokens:css` — a `special` role bound to another hue fails the build, naming both.

## Translucency

### FND-COLOR-09 — A translucent colour is a palette colour plus an opacity

**MUST.** A colour with transparency is a palette step and an opacity beside it, never a colour stored with the alpha already mixed into it.

Why: the mixed result is a copy of a palette value with no link back to it. The next palette change does not reach it, and nothing reports that, because a check that follows references cannot see a role that has none.

## What this settles for the CSS build

The CSS build — `npm run tokens:css`, [`tools/build-css.mjs`](../../tools/build-css.mjs) — generates its output from the contract above. The contract settles three things that the build would otherwise have to guess.

### FND-COLOR-10 — The palette is emitted flat, not mode-scoped

**MUST.** Both palettes are always emitted, as two independent sets, and no selector switches between them.

Why: the palette is a source, not a theme (FND-COLOR-05). Scoping it by mode would make a step's identity depend on where it is read from.

### FND-COLOR-11 — The semantic layer is emitted twice, in full

**MUST.** Every role is declared in both the light and the dark scope, including the ones whose value does not change.

Why: if the dark scope redeclared only the roles that differ, a client's override in the light scope would also apply in dark. It would do so with no warning, and only for the roles the client happened to override.

### FND-COLOR-12 — One global mode switch

**MUST.** A mode applies to the document, not to an arbitrary subtree.

Why: a dark region inside a light page is not a supported case. Supporting it later would mean emitting the whole semantic layer again for every node that carries a mode.

### FND-COLOR-13 — Special roles are generated from the palette

**RETIRED** 2026-10-21. `surface/special/<hue>` and `text/special/<hue>` were a generated family of one role per area for every palette hue group except `mono`, each bound to `palette/<hue>/700` in both modes, and imported from the Figma export.

Why: categorical colour needs the full set of roles a tone has — bold and subtle surfaces with their states, text, background and border — and one step for every area made tags hard to colour. Importing a family whose membership the palette already decides was busywork. Superseded by FND-COLOR-14.

### FND-COLOR-14 — Special roles are generated from an authored scale

**MUST.** Generate every `*/special/<hue>` role from the scale in [`tokens/_special.yaml`](../../tokens/_special.yaml), for every palette hue group except `mono`, and never record one from a Figma export.

Why: categorical colour — tags, labels, categories a product defines — is used wherever a tone is: bold and subtle surfaces with their states, text, background and border. Which roles exist is decided by the palette, so generating them makes a new hue group available everywhere at once and stops a hand-kept subset, a wrong hue or a stray step from becoming part of the language. The family keeps a scale of its own rather than copying `primary`, because darker steps raise contrast and make hues harder to tell apart; its first steps are those of `warning`, the tone most sensitive to hue. The generated tokens remain semantic roles, so components still bind roles rather than palette primitives (FND-COLOR-02).

The scale names each role with `{hue}` where the hue group goes — `surface/bold/special/{hue}/hover`, `text/special/{hue}` — and the step it takes in each mode. One hue's roles coincide with a tone's roles when that tone uses the same hue and steps; that is expected. A Figma file may carry its own copy of these variables for design work. The import drops it and reports where it differs from the generated family.

Checked by: `npm run tokens:check` — a malformed scale, a role off its own hue, a step some hue group lacks, or a special role recorded in `tokens/color.yaml` fails.

## Open

No open colour questions.

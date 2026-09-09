# Borders, radii, and effects

Status: Confirmed
Scope: Borders, radii, gradients, opacity and shadows; the layer order a shadow expresses is [elevation.md](elevation.md).

## Binding

### FND-EFFECTS-01 — Borders, radii and effects resolve to system variables and styles

**MUST.** A border, radius, gradient, opacity or shadow is bound to the system variable or style for it.

Why: these are the properties a mockup is matched by eye against, and each one bound locally is a value that no longer follows a token change — invisibly, because the screen still looks right the day it is written.

### FND-EFFECTS-02 — No effect value is copied from a reference

**MUST.** A radius, border, gradient, opacity or shadow value is never taken from a reference.

Why: a copied value is a second system's decision imported without its reasoning, and it survives every later correction of the first system's.

### FND-EFFECTS-03 — A component's internal effects are not overridden

**MUST.** The effects inside a component are not overridden to increase visual similarity to a mockup.

Why: it is the customization boundary at its thinnest point — an override here is invisible in the component's API and defeats the next change to the component itself.

Serves: PRN-06.

### FND-EFFECTS-04 — A new foundation token is a system decision

**MUST.** A new border, radius or effect token is created through an explicit system decision, never as a local exception.

Why: a token created to solve one screen is a scale nobody agreed to, and it is indistinguishable from the ratified ones afterwards.

Serves: PRN-01.

## Structure

Three separate Figma collections, each single-mode:

| Collection | Shape |
| --- | --- |
| `radius` | seven steps — `zero`, the five full-word sizes, and `round` |
| `border` | `width/normal`, `width/thick` |
| `effect` | `shadow/elevation/level-1`…`level-6`, `shadow/spread/level-1`…`level-6`, `shadow/color/base`, `shadow/color/primary` |

Radius step names are already the full-word canonical size values required by [naming.md](naming.md) §4 — nothing to normalise there.

`shadow/color/*` aliases `color/shadow/*`, where the colour is actually defined — as a literal with alpha, because Figma cannot bind a variable and change its opacity. The colour lives in one place; this collection points at it. See [color.md](color.md), including what that literalness costs a rebrand.

**Radius and border are ratified.** Seven radius steps — `zero` 0, `extra small` 2, `small` 4, `medium` 6, `large` 8, `extra large` 10, `round` 1000 — and two border widths, `width/normal` 1 and `width/thick` 2. Both are deliberate as they stand; there is nothing here to decide.

## The shadow scale

Six levels, `Elevation 1`…`Elevation 6`. One layer at step *k* is always:

```
0  elevation(k)  elevation(k)  spread(k)  <colour>
```

X is always zero, and **blur equals the Y offset** — which is why there is no blur token and none is missing. Only two number scales exist:

| k | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| elevation (= Y and blur) | 2 | 4 | 8 | 12 | 16 | 24 |
| spread | −1 | −2 | −3 | −4 | −8 | −12 |

### FND-EFFECTS-05 — An elevation level is a cumulative stack

**MUST.** `Elevation N` is layers 1…N in `shadow/color/base` followed by layer N repeated in `shadow/color/primary` — N + 1 layers, each level containing every level below it.

Why: a level is not one shadow, and a generator that emits one `box-shadow` layer per level produces the wrong thing at every level above 1 — `Elevation 6` is seven layers. The composition plus the two number scales above reproduce all six styles exactly, which is why nothing about a shadow is exported from Figma and the CSS build generates them rather than reading them.

**Every level carries a brand tint.** `shadow/color/primary` appears in all six, so shadows are not neutral — and since it is stored as a literal rather than a reference ([color.md](color.md)), rebinding the `primary` slot leaves all six shadows on the old brand colour. That is the one real defect here.

Checked by: `npm run tokens:css` composes the six stacks from the two scales ([SPEC 0007](../specs/0007-tokens-to-css.md) §4.5).

## Values

**Not transcribed here** — except the radius and border steps above, which are recorded because ratifying them is the point, and the two shadow number scales, which the build composes from rather than reads. Run `npm run tokens:report` for everything else; the values live in `tokens/`. Documentation that carries copied token values goes stale the first time a variable is tweaked in Figma, and a stale value in a foundation document is worse than no value — it gets built against.

## Open

- **When to use which level.** The scale is defined; what an elevation *means* — which surface sits at which level — is not, and belongs with the components that use them.
- **Shadows and a rebrand.** `shadow/color/primary` is a literal, so a slot rebinding leaves every shadow behind. Either shadows follow the slot, or the system states that they do not participate in a rebrand ([color.md](color.md)).
- **Two names for one thing.** The variables say `level-1`…`level-6`; the styles say `Elevation 1`…`Elevation 6`. The Title Case on the variables was fixed on 2026-09-05; the two vocabularies remain, and the styles are the half still to settle. The CSS build reads neither — it composes the six stacks from the two number scales ([SPEC 0007](../specs/0007-tokens-to-css.md) §4.5) — so this costs nothing downstream and everything in a Figma panel.

Border *colour* roles live in the semantic `color` collection, not here — see [color.md](color.md).

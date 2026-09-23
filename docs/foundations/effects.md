# Borders, radii, and effects

Status: Confirmed
Scope: Borders, radii, gradients, opacity and shadows; the layer order a shadow expresses is [elevation.md](elevation.md).

## Binding

### FND-EFFECTS-01 — Borders, radii and effects resolve to system variables and styles

**MUST.** A border, radius, gradient, opacity or shadow is bound to the system variable or style for it.

Why: these are the properties that people match to a mockup by eye. Each one given a local value no longer follows a token change, and nobody notices, because the screen still looks right on the day it is made.

### FND-EFFECTS-02 — No effect value is copied from a reference

**MUST.** A radius, border, gradient, opacity or shadow value is never taken from a reference.

Why: a copied value is another system's decision, brought in without its reasoning. When this system later corrects its own values, the copied value stays as it was.

### FND-EFFECTS-03 — A component's internal effects are not overridden

**MUST.** The effects inside a component are not overridden to make it look more like a mockup.

Why: this is the weakest point of the customization boundary. An override here does not show in the component's API, and it stops the next change to the component itself from taking effect.

Serves: PRN-06.

### FND-EFFECTS-04 — A new foundation token is a system decision

**MUST.** A new border, radius or effect token is created through an explicit system decision, never as a local exception.

Why: a token created to solve one screen changes the scale without anyone agreeing to it, and afterwards it cannot be told apart from the confirmed ones.

Serves: PRN-01.

## Structure

Three separate Figma collections, each with a single mode:

| Collection | Shape |
| --- | --- |
| `radius` | seven steps — `zero`, the five full-word sizes, and `round` |
| `border` | `width/normal`, `width/thick` |
| `effect` | `shadow/elevation/level-1`…`level-6`, `shadow/spread/level-1`…`level-6`, `shadow/color/base`, `shadow/color/primary` |

Radius step names are already the full-word canonical size values required by [naming.md](naming.md) §4, so there is nothing to normalise.

`shadow/color/*` aliases `color/shadow/*`. That is where the colour is actually defined, as a palette step with an opacity beside it (FND-COLOR-09). The colour is defined in one place, and this collection points at it.

**Radius and border are confirmed.** Seven radius steps — `zero` 0, `extra small` 2, `small` 4, `medium` 6, `large` 8, `extra large` 10, `round` 1000 — and two border widths, `width/normal` 1 and `width/thick` 2. Both are deliberate as they are, and there is nothing here to decide.

## The shadow scale

Six levels, `Elevation 1`…`Elevation 6`. One layer at step *k* is always:

```
0  elevation(k)  elevation(k)  spread(k)  <colour>
```

X is always zero, and **blur equals the Y offset**. That is why there is no blur token, and none is missing. Only two number scales exist:

| k | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| elevation (= Y and blur) | 2 | 4 | 8 | 12 | 16 | 24 |
| spread | −1 | −2 | −3 | −4 | −8 | −12 |

### FND-EFFECTS-05 — An elevation level is a cumulative stack

**MUST.** `Elevation N` is layers 1…N in `shadow/color/base` followed by layer N repeated in `shadow/color/primary` — N + 1 layers, each level containing every level below it.

Why: a level is not one shadow. A generator that emits one `box-shadow` layer per level produces the wrong result at every level above 1: `Elevation 6` is seven layers. This composition and the two number scales above reproduce all six styles exactly. That is why nothing about a shadow is exported from Figma: the CSS build generates the shadows instead of reading them.

**Every level carries a brand tint.** `shadow/color/primary` appears in all six, so shadows are not neutral. It references `indigo` and carries its opacity beside the reference (FND-COLOR-09), so a change to that palette step reaches all six shadows. Until 2026-09-15 the colour was stored flattened, and a change to the step reached none of them.

Checked by: `npm run tokens:css` composes the six stacks from the two scales (SPEC 0007 §4.5).

## Values

**Not copied here**, with two exceptions: the radius and border steps above, recorded because confirming them is the point, and the two shadow number scales, which the build composes the shadows from instead of reading them. For everything else, run `npm run tokens:report`; the values live in `tokens/`. A document that carries copied token values goes stale the first time someone changes a variable in Figma. A stale value in a foundation document is worse than no value, because people build against it.

## Open

- **When to use which level.** The scale is defined. What an elevation *means* — which surface sits at which level — is not, and that belongs with the components that use the levels.
- **Two names for one thing.** The variables say `level-1`…`level-6`; the styles say `Elevation 1`…`Elevation 6`. The Title Case on the variables was fixed on 2026-09-05. The two vocabularies remain, and the style names are the half still to settle. The CSS build reads neither — it composes the six stacks from the two number scales (SPEC 0007 §4.5) — so the mismatch costs nothing downstream and matters only in a Figma panel.

Border *colour* roles live in the semantic `color` collection, not here — see [color.md](color.md).

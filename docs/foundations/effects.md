# Borders, radii, and effects

Status: **Confirmed.**

## Confirmed

- Use system variables and styles for borders, radii, gradients, opacity, and shadows.
- Do not copy radius, border, gradient, opacity, or shadow values from a reference.
- Do not override a component's internal effects to increase visual similarity to a mockup.
- New foundation tokens are created only through an explicit system decision, never as a local exception.

## Structure

Three separate Figma collections, each single-mode:

| Collection | Shape |
| --- | --- |
| `radius` | seven steps — `zero`, the five full-word sizes, and `round` |
| `border` | `width/normal`, `width/thick` |
| `effect` | `shadow/elevation/Level 1`…`Level 6`, `shadow/spread/Level 1`…`Level 6`, `shadow/color/base`, `shadow/color/primary` |

Radius step names are already the full-word canonical size values required by [naming.md](naming.md) §4 — nothing to normalise there.

`shadow/color/*` aliases `color/shadow/*`, where the colour is actually defined — as a literal with alpha, because Figma cannot bind a variable and change its opacity. The colour lives in one place; this collection points at it. See [color.md](color.md), including what that literalness costs a rebrand.

**Radius and border are ratified.** Seven radius steps — `zero` 0, `extra small` 2, `small` 4, `medium` 6, `large` 8, `extra large` 10, `round` 1000 — and two border widths, `width/normal` 1 and `width/thick` 2. Both are deliberate as they stand; there is nothing here to decide.

## The shadow scale

Six levels, `Elevation 1`…`Elevation 6`. A level is **not one shadow** — it is a stack, and each level contains every level below it.

One layer at step *k* is always:

```
0  elevation(k)  elevation(k)  spread(k)  <colour>
```

X is always zero, and **blur equals the Y offset** — which is why there is no blur token and none is missing. Only two number scales exist:

| k | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| elevation (= Y and blur) | 2 | 4 | 8 | 12 | 16 | 24 |
| spread | −1 | −2 | −3 | −4 | −8 | −12 |

**`Elevation N` = layers 1…N in `shadow/color/base`, then layer N repeated in `shadow/color/primary`.** N + 1 layers in total; the primary repeat is the brand tint that sits on top.

That is the whole rule, and it reproduces all six styles exactly. Nothing about a shadow needs to be exported from Figma: the effect styles are derivable from the two scales above plus this composition, and the CSS build generates them rather than reading them.

Two consequences worth stating, because both are easy to get wrong:

- **The stack is cumulative.** A generator that emits one `box-shadow` layer per level produces the wrong thing at every level above 1. `Elevation 6` is seven layers.
- **Every level carries a brand tint.** `shadow/color/primary` appears in all six, so shadows are not neutral — and since it is stored as a literal rather than a reference ([color.md](color.md)), rebinding the `primary` slot leaves all six shadows on the old brand colour. That is the one real defect here.

## Values

**Not transcribed here** — except the radius and border steps above, which are recorded because ratifying them is the point. Run `npm run tokens:report` for everything else; the values live in `tokens/`. Documentation that carries copied token values goes stale the first time a variable is tweaked in Figma, and a stale value in a foundation document is worse than no value — it gets built against.

## Open

- **When to use which level.** The scale is defined; what an elevation *means* — which surface sits at which level — is not, and belongs with the components that use them.
- **Shadows and a rebrand.** `shadow/color/primary` is a literal, so a slot rebinding leaves every shadow behind. Either shadows follow the slot, or the system states that they do not participate in a rebrand ([color.md](color.md)).
- **Two names for one thing.** The variables say `Level 1`…`Level 6`; the styles say `Elevation 1`…`Elevation 6`. Both are Title Case, against [naming.md](naming.md) §4 — variable names are not component properties, so the rule does not strictly reach them, but nothing here is deliberate.

Border *colour* roles live in the semantic `color` collection, not here — see [color.md](color.md).

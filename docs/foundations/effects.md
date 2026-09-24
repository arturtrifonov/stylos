# Borders, radii, and effects

Status: Draft
Scope: Borders, radii, gradients, opacity and shadows; the layer order a shadow expresses is [elevation.md](elevation.md).

## Binding

### FND-EFFECTS-01 — Borders, radii and effects resolve to system variables and styles

**MUST.** A border, radius, gradient, opacity or shadow is bound to the system variable or style for it.

Why: these are the properties that people match to a mockup by eye. Each one given a local value no longer follows a token change, and nobody notices, because the screen still looks right on the day it is made.

### FND-EFFECTS-02 — A component's internal effects are not overridden

**MUST.** The effects inside a component are not overridden to make it look more like a mockup.

Why: this is the weakest point of the customization boundary. An override here does not show in the component's API, and it stops the next change to the component itself from taking effect.

Serves: PRN-06.

### FND-EFFECTS-03 — A new foundation token is a system decision

**MUST.** A new border, radius or effect token is created through an explicit system decision, never as a local exception.

Why: a token created to solve one screen changes the scale without anyone agreeing to it, and afterwards it cannot be told apart from the ones that were agreed.

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

## The shadow scale

Six levels, `Elevation 1`…`Elevation 6`. One layer at step *k* is always:

```
0  elevation(k)  elevation(k)  spread(k)  <colour>
```

X is always zero, and **blur equals the Y offset**. That is why there is no blur token, and none is missing. Only two number scales exist: `shadow/elevation/level-k`, which is both the Y offset and the blur, and `shadow/spread/level-k`.

**A level is a stack of layers, not one shadow.** `Elevation N` is layers 1…N in `shadow/color/base`, followed by layer N again in `shadow/color/primary` — N + 1 layers, so `Elevation 6` is seven. This composition and the two number scales reproduce all six styles exactly. That is why nothing about a shadow is exported from Figma: `npm run tokens:css` composes the six stacks from the two scales (SPEC 0007 §4.5) instead of reading them.

**Every level carries a brand tint.** `shadow/color/primary` appears in all six, so shadows are not neutral. The role it aliases, `color/shadow/primary`, references `indigo` and carries its opacity beside the reference (FND-COLOR-09), so a change to that palette step reaches all six shadows. Until 2026-09-15 the colour was stored flattened, and a change to the step reached none of them.

## Values

**Not copied here** (RUL-09). Run `npm run tokens:report`; the values live in `tokens/`.

## Open

- **When to use which level.** The scale is defined. What an elevation *means* — which surface sits at which level — is not, and that belongs with the components that use the levels.
- **Two names for one thing.** The variables say `level-1`…`level-6`; the styles say `Elevation 1`…`Elevation 6`. The Title Case on the variables was fixed on 2026-09-05. The two vocabularies remain, and the style names are the half still to settle. The CSS build reads neither — it composes the six stacks from the two number scales (SPEC 0007 §4.5) — so the mismatch costs nothing downstream and matters only in a Figma panel.

Border *colour* roles live in the semantic `color` collection, not here — see [color.md](color.md).

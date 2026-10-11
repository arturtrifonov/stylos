# Borders, radii, and effects

Status: Confirmed
Scope: Borders, radii, gradients, opacity and shadows, including shadow selection by Layers level; surface roles belong in Layers.

## Binding

### FND-EFFECTS-01 — Use the system token or style

**MUST.** When Stylos provides a token or style for a border, radius, gradient, opacity or shadow, a component uses it instead of a local value.

Why: these values are easy to copy from a mockup by eye. A local value will not follow a later system change, even though it may look right today.

### FND-EFFECTS-02 — A component's internal effects are not overridden

**MUST.** The effects inside a component are not overridden to make it look more like a mockup.

Why: this is the weakest point of the customization boundary. An override here does not show in the component's API, and it stops the next change to the component itself from taking effect.

Serves: PRN-06.

### FND-EFFECTS-03 — A new foundation token is a system decision

**MUST.** A new border, radius or effect token is created through an explicit system decision, never as a local exception.

Why: a token created to solve one screen changes the scale without anyone agreeing to it, and afterwards it cannot be told apart from the ones that were agreed.

Serves: PRN-01.

## Structure

The token families below define the structure. Their Figma collections are documented in [figma/foundations.md](../../figma/foundations.md#effect-collections).

| Token family | Shape |
| --- | --- |
| `radius` | seven steps — `zero`, the five full-word sizes, and `round` |
| `border` | `width/normal`, `width/thick` |
| `effect` | `shadow/elevation/level-1`…`level-6`, `shadow/spread/level-1`…`level-6`, `shadow/color/base`, `shadow/color/primary` |

Radius step names are already the full-word canonical size values required by [naming.md](naming.md) §4, so there is nothing to normalise.

`shadow/color/*` aliases `color/shadow/*`. That is where the colour is actually defined, as a palette step with an opacity beside it (FND-COLOR-09). The colour is defined in one place, and this collection points at it.

## The shadow scale

Six styles, `shadow/elevation 1`…`shadow/elevation 6`. One layer at step *k* is always:

```
0  elevation(k)  elevation(k)  spread(k)  <colour>
```

X is always zero, and **blur equals the Y offset**. That is why there is no blur token, and none is missing. Only two number scales exist: `shadow/elevation/level-k`, which is both the Y offset and the blur, and `shadow/spread/level-k`.

**`level-k` is a parameter of one layer, not a shadow style.** The same level parameters are reused across several styles. `shadow/elevation N` is a complete style: layers 1…N in `shadow/color/base`, followed by layer N again in `shadow/color/primary` — N + 1 layers, so `shadow/elevation 6` is seven. This composition and the two number scales reproduce all six styles exactly. The generation process is documented in [tools/README.md](../../tools/README.md#the-token-pipeline).

**Every elevation style carries a brand tint.** `shadow/color/primary` appears in all six, so shadows are not neutral. The role it aliases, `color/shadow/primary`, references `indigo` and carries its opacity beside the reference (FND-COLOR-09), so a change to that palette step reaches all six shadows. Until 2026-09-15 the colour was stored flattened, and a change to the step reached none of them.

## Elevation

### FND-EFFECTS-04 — An elevation style matches a surface's relationship to the page

**RETIRED** 2026-10-11. Surface roles previously selected elevation directly in this document.

Why: FND-LAYERS-01 now owns the classification; FND-EFFECTS-05 maps that level to the existing shadow scale.

### FND-EFFECTS-05 — The shadow style follows the Layers level

**MUST.** Use `shadow/elevation N` for an elevated surface assigned level N under FND-LAYERS-01.

Why: the shadow expresses the same depth as the surface's motion profile.

Level 0 adds no elevation shadow. Focus treatments remain local state effects and do not reclassify the surface.

Serves: PRN-06.

Border *colour* roles live in the semantic `color` collection, not here — see [color.md](color.md).

## Focus

The Figma effect style `focus/base` is available as `--stylos-focus-base`.
It combines a 4px primary halo with the style's two shadow layers. Input Text
uses it on focus instead of its resting elevation. Because variable exports
omit effect styles, its source record lives in `tokens/_styles.yaml`, separately
from generated collections; see [tokens/README.md](../../tokens/README.md).

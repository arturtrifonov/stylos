# Borders, radii, and effects

Status: Confirmed
Scope: Borders, radii, gradients, opacity and shadows, including which elevation style a surface uses.

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

Three separate Figma collections, each with a single mode:

| Collection | Shape |
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

**`level-k` is a parameter of one layer, not a shadow style.** The same level parameters are reused across several styles. `shadow/elevation N` is a complete style: layers 1…N in `shadow/color/base`, followed by layer N again in `shadow/color/primary` — N + 1 layers, so `shadow/elevation 6` is seven. This composition and the two number scales reproduce all six styles exactly. That is why nothing about a shadow is exported from Figma: `npm run tokens:css` composes the six stacks from the two scales (SPEC 0007 §4.5) instead of reading them.

**Every elevation style carries a brand tint.** `shadow/color/primary` appears in all six, so shadows are not neutral. The role it aliases, `color/shadow/primary`, references `indigo` and carries its opacity beside the reference (FND-COLOR-09), so a change to that palette step reaches all six shadows. Until 2026-09-15 the colour was stored flattened, and a change to the step reached none of them.

## Elevation

### FND-EFFECTS-04 — An elevation style matches a surface's relationship to the page

**MUST.** An elevated surface uses the `shadow/elevation N` style that matches its relationship to the page in the table below.

Why: a shadow is not picked by how strong it looks. Its job is to tell a person how the surface relates to the page and to the thing that opened it. Without that shared order, two surfaces with the same role can look as though they sit at different depths.

| Style | Relationship to the page | Use for |
| --- | --- | --- |
| `shadow/elevation 1` | Raised within the page. It stays in the layout and never leaves it. | Buttons, input fields, cards |
| `shadow/elevation 2` | The smallest overlay. It appears next to the element it belongs to and disappears with it. | Tooltips |
| `shadow/elevation 3` | An overlay anchored to a control. It has its own content, is opened by an element and is positioned against it. | Dropdowns, popovers, date pickers, autocomplete |
| `shadow/elevation 4` | An overlay positioned against the screen, not against an element. It arrives on its own and does not block the page. | Alert popups, notifications, toasts |
| `shadow/elevation 5` | A large panel attached to an edge of the screen. It holds a task beside the page and leaves the page visible. | Drawers, side panels, bottom sheets |
| `shadow/elevation 6` | The surface takes over. It is centred, detached from every edge, and nothing behind it is reachable. | Modals |

Serves: PRN-06.

Border *colour* roles live in the semantic `color` collection, not here — see [color.md](color.md).

# Borders, radii, and effects

Status: **Radius and border confirmed; the shadow scale is open.**

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
| `effect` | `shadow/elevation/Level1`…`Level6`, `shadow/spread/Level1`…`Level6`, `shadow/color/*` |

Radius step names are already the full-word canonical size values required by [naming.md](naming.md) §4 — nothing to normalise there.

`shadow/color/*` aliases `color/shadow/*`, where the colour is actually defined — as a literal with alpha, because Figma cannot bind a variable and change its opacity. The colour lives in one place; this collection points at it. See [color.md](color.md), including what that literalness costs a rebrand.

**Radius and border are ratified.** Seven radius steps — `zero` 0, `extra small` 2, `small` 4, `medium` 6, `large` 8, `extra large` 10, `round` 1000 — and two border widths, `width/normal` 1 and `width/thick` 2. Both are deliberate as they stand; there is nothing here to decide.

## Values

**Not transcribed here** — except the radius and border steps above, which are recorded because ratifying them is the point. Run `npm run tokens:report` for everything else; the values live in `tokens/`. Documentation that carries copied token values goes stale the first time a variable is tweaked in Figma, and a stale value in a foundation document is worse than no value — it gets built against.

## Open

- **The shadow scale** ([`PLAN.md`](../../PLAN.md) 1.2). Elevation and spread are two parallel `Level1`…`Level6` scales that a consumer has to reassemble, and nothing says what a level means or when to use which. Whether shadows become composite tokens is part of the same question.
- `Level1`…`Level6` are Title Case, against [naming.md](naming.md) §4. They are variable names rather than component properties, so the rule does not strictly reach them — but the inconsistency is deliberate nowhere.

Border *colour* roles live in the semantic `color` collection, not here — see [color.md](color.md).

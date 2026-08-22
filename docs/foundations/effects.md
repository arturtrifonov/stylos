# Borders, radii, and effects

Status: **Structure confirmed, values not ratified.**

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
| `effect` | `shadow/elevation/Level 1…6`, `shadow/spread/Level 1…6`, `shadow/color/*` |

Radius step names are already the full-word canonical size values required by [naming.md](naming.md) §4 — nothing to normalise there.

`shadow/color/*` values are alpha derivatives of palette colours and do not resolve to a palette entry by value matching. The token pipeline must declare them explicitly rather than infer them.

## Values

**Not transcribed here.** Run:

```bash
npm run report:tokens
```

It renders the current values from the newest snapshot under [`figma/variables/exports/`](../../figma/variables/exports/README.md). Documentation that carries copied token values goes stale the first time a variable is tweaked in Figma, and a stale value in a foundation document is worse than no value — it gets built against.

## Open

- Ratification of the radius and border scales: which steps earn their place, and whether the mapping from size name to value is deliberate or accumulated. [`PLAN.md`](../../PLAN.md) 1.7.
- Whether `effect` should express shadows as composite tokens rather than as separate elevation, spread, and colour scales that a consumer has to reassemble.
- Border *colour* roles live in the semantic `color` collection, not here — see [color.md](color.md).

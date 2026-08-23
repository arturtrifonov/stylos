# Color

Status: **Structure confirmed, values live in `tokens/`, theme contract open.**

## Confirmed

- The core palette uses stable hue groups with numbered steps `25`–`975`, plus `base/black` and `base/white`.
- Interface decisions bind to **semantic roles** — primary/secondary/destructive actions; base/raised/overlay surfaces; primary/secondary/muted/disabled/inverted foregrounds; default/subtle/strong/focus borders; focus/selection; info/success/warning/error/danger; hover/active/selected/disabled states. Never to a primitive directly when a semantic variable exists.
- No sampling colours from references. No per-reconstruction one-off variables. No recolouring nested layers outside the component API. No theme names encoded in variable names.

## Two layers, and why

| Layer | Collection | What it is |
| --- | --- | --- |
| Primitive | `palette` | hue groups × steps, one value per mode |
| Semantic | `color` | roles — `surface`, `text`, `background`, `border`, `shadow` — each pointing at a palette step |

Both palettes carry **identical step names**; the values differ per mode. So a semantic role names a step, and the step resolves differently in light and dark. The mode switch lives in the palette layer.

That is what makes rebranding possible at all: a client overrides the palette, not every semantic role in every mode. Break the indirection — bind a role straight to a hex — and the system loses the only mechanism it has for changing colour without touching components.

**Roles that invert deliberately** point at *different* steps per mode: `text/static-light`, `text/static-dark`, `background/base`, `shadow/base`. Every one of them is declared in [`tokens/_naming.yaml`](../../tokens/_naming.yaml); a role that diverges across modes without being declared is a defect, and the check fails on it.

**Shadow colours** reuse a palette colour at reduced opacity rather than being their own values, so they stay linked to the palette and follow a rebrand.

## Values

**Not written here.** Run `npm run tokens:report` — the values live in [`tokens/palette.yaml`](../../tokens/) and `tokens/color.yaml`, imported from Figma and verified against their own references.

A value copied into this document is wrong the moment a variable is tweaked in Figma, and a stale value in a foundation document gets built against. That is why none appear here.

The same holds for palette files kept anywhere else. **Anything outside `tokens/` that claims to be the Stylos palette is not one** — it is an input someone used once, and it will drift.

## Open

- **The dark-context transformation rule.** The palette carries dark values, but nothing states the rule that produced them, so it cannot be reapplied to a new hue group or checked for consistency. A rule, not a table of values.
- **The light/dark/client-theme contract** — which semantic roles a client theme may override, and which are structural. This blocks CSS generation, not just documentation: how modes become custom-property scoping is that step's central question.
- Whether `shadow/*` belongs in the semantic colour collection or with [effects](effects.md), given it is also expressed there as elevation and spread.

Both are [`PLAN.md`](../../PLAN.md) Stage 1 work.

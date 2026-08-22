# Color

Status: **Structure confirmed, values not ratified, theme contract open.**

## Confirmed

- Core palette uses stable hue groups with numbered steps `25`–`975`, plus `base/black` and `base/white`.
- Interface decisions bind to semantic roles — primary/secondary/destructive actions; base/raised/overlay surfaces; primary/secondary/muted/disabled/inverted foregrounds; default/subtle/strong/focus borders; focus/selection; info/success/warning/error/danger; hover/active/selected/disabled states — never to a primitive directly when a semantic variable exists.
- No sampling colours from references. No per-reconstruction one-off variables. No recolouring nested layers outside the component API. No theme names encoded in variable names.

## Structure

Three collections, and the shape matters for the token pipeline:

| Collection | Modes | Contents |
| --- | --- | --- |
| `palette.light` | single | hue groups × steps |
| `palette.dark` | single | **the same step names**, dark-context values |
| `color` | Light Mode, Dark Mode | semantic roles — `surface`, `text`, `background`, `border`, `shadow` |

The two palettes carry identical name sets, and the semantic collection carries identical name sets across its two modes. The mode switch is therefore expressible in the palette layer: a semantic role points at a step name, and the step name resolves differently per mode.

Measured on the 2026-08-22 snapshot, all but three semantic roles hold the same step name in both modes. The three that do not — `text/static-light`, `text/static-dark`, `background/base` — invert deliberately and are declared as exceptions in `tools/tokens-report.mjs`. Two more (`shadow/base`, `shadow/primary`) are alpha derivatives that resolve to no palette entry at all.

This is what makes consumer-level rebranding possible: a client overrides the palette, not 110 semantic roles per mode ([ADR 0004](../decisions/0004-frontend-library-foundations.md)).

## Values

**Not transcribed here.** Run `npm run report:tokens`. See [effects.md](effects.md) for why.

## Open

- **The dark-context transformation rule.** The palette carries dark values; no record states the rule that produced them, so it cannot be reapplied to a new hue group or checked for consistency. [`PLAN.md`](../../PLAN.md) 1.4 → ADR 0010.
- **The light/dark/client-theme mode contract** — which semantic roles a client theme may override, and which are structural. [`PLAN.md`](../../PLAN.md) 1.5 → ADR 0011. This blocks the token pipeline, not just the documentation: how modes become CSS custom-property scoping is the pipeline's central design question.
- Whether `shadow/*` belongs in the semantic colour collection or with [effects](effects.md), given it is also expressed there as elevation and spread.

## A note on provenance

An earlier draft of this document referred to alternative dark palettes and cited a transform example (`#686CF8` → `#6E77D1`) taken from files of unestablished origin outside the repository. Both are withdrawn. The export from Stylos / Styles carries **one** dark palette, and that is the only dark palette this project recognises. If other palette files exist elsewhere, they are inputs someone may have used once — not records of the system.

# Color

Status: **Partially confirmed.** See master doc [§10](../master-document.md#10-color-system) for the normative rules; this document exists to hold detail (actual palette values, per-role tables) once they're pulled from the current Figma variables rather than restated from memory.

## Confirmed

- Core palette uses stable hue groups with numbered steps `25`–`975` (master doc [§10.1](../master-document.md#101-core-palette)).
- A dark-context palette exists as an alternative **mode** in the same core collection — not the light palette shown on a dark surface. It preserves hue groups and step structure, keeps comparable perceptual lightness, and reduces chroma.
- Interface decisions bind to semantic roles (primary/secondary/destructive actions; base/raised/overlay surfaces; primary/secondary/muted/disabled/inverted foregrounds; default/subtle/strong/focus borders; focus/selection; info/success/warning/error/danger; hover/active/selected/disabled states) — never to a primitive directly when a semantic variable exists.
- Constraints from master doc [§10.4](../master-document.md#104-color-constraints) apply: no sampling from references, no per-reconstruction one-off variables, no recoloring nested layers outside the component API, no theme names encoded in variable names.

## Open

- Canonical palette values and which core-palette transformation is authoritative (master doc [§27, items 9](../master-document.md#27-open-decisions)). One recorded example: Indigo 600 `#686CF8` → `#6E77D1` in the dark-context transform — illustrative only, not yet confirmed as canonical.
- Light/dark/client-theme mode contract — which semantic roles a client theme is allowed to override (master doc [§27, item 8](../master-document.md#27-open-decisions)).

## Pending import

`stylos-core-palette-light.json`, `stylos-core-palette-dark.json`, and `stylos-core-palette-dark-reversed.json` exist locally but weren't imported into `figma/variables/exports/` yet — their provenance (native Figma export vs. Tokens Studio vs. hand-authored) needs confirming first. See [CHANGELOG.md](../../CHANGELOG.md).

## TODO

- [ ] Pull the actual current palette from `figma/variables/exports/2026-02-22.json` (or a newer snapshot) and table it here per hue group and step.
- [ ] Confirm and document the dark-context transformation rule precisely (not just the one example).
- [ ] Resolve the light/dark/client-theme contract as a decision record.

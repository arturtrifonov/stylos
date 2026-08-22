# Typography

Status: **Rules confirmed; typeface bound in Figma but not ratified; naming inconsistencies to reconcile.**

## Confirmed

- Canonical component size values are full words: `extra small`, `small`, `medium`, `large`, `extra large`. `XS`/`S`/`M`/`L`/`XL` are shorthand in conversation only, never canonical Figma variant values ([naming.md](naming.md) §4, resolved by `stylos-naming-cleanup` v0.7 — see [ADR 0002](../decisions/0002-skill-version-supersession.md)).
- Font size and line height must always use the **same measure**. A size bound to one measure with a line height from another is a defect.
- Line height comes from the family matching the content: **string** for single-line content (labels, buttons, tabs, menu items, badges, compact values), **text** for wrapping content (body copy, descriptions, messages).
- Default size→measure profiles exist for two architectural levels — **Element** and **Object**. A documented component-specific mapping overrides its level's default profile.
- Component-wide text sizing targets exactly one **primary text role**, identified via the public text property, semantic layer name, and cross-variant consistency — not every text layer on the component.
- **Element and Object are the only levels that will ever have a shared size/text profile.** Permanent design boundary, not an unfinished feature — see [ADR 0003](../decisions/0003-component-levels-and-size-grid-scope.md). Widget- and Layout-level components vary too much in size to encode a shared rule; their typography is documented per-component in `docs/components/`. Primitive-level components have preferred sizes but no skill-enforced grid.
- Measure names follow the same ratio-to-base convention as spacing — `1_000` is the base — consistent with [ADR 0006](../decisions/0006-proportional-logic.md).

## Structure

One `font` collection, single-mode, with six groups: `family`, `size`, `line height`, `weight`, `letter spacing`, `paragraph spacing`.

`line height` is subdivided into four families: `text`, `string`, `heading`, `code`.

## Values

**Not transcribed here.** Run `npm run report:tokens` — it renders current values from the newest snapshot. See [effects.md](effects.md) for why documentation does not carry copied token values.

## Typeface

The library currently binds a typeface in Figma; the [snapshot](../../figma/variables/exports/README.md) records which. It is **bound, not ratified** — no decision record has confirmed it, checked its Cyrillic coverage, its variable axes, or its license.

The master document's candidate list (Manrope leading, with Raleway, PT Root UI, Commissioner, IBM Plex Sans considered) predates whatever is bound now and should not be treated as the current state. Requirements stand: web-UI-suitable, sans serif with character, geometric/classical-compatible, variable where practical, free to use, strong Cyrillic support.

Ratification: [`PLAN.md`](../../PLAN.md) 1.3 → ADR 0009.

## Open

### Two naming inconsistencies to reconcile

Neither is a value question, so neither waits on a fresh export.

1. **`family` and `line height` do not use the same family vocabulary.** `family` has three entries; `line height` has four sub-families including `text` and `string`, which presumably share one font family. Either the families should align, or the document should state why line-height families are a finer division than font families.
2. **The variable names in this document do not match the export.** This document has described font size as binding to `Text Size / [measure]` and line height to `String Line Height / [measure]` / `Text Line Height / [measure]`. The export shows `size/[measure]` and `line height/string/[measure]` inside a `font` collection. One of the two is out of date; the export is more likely to be current, but this should be confirmed against Figma rather than assumed.

### Other

- Whether Primitive-level "preferred sizes" get written down as a soft reference table. Not a shared grid (see above) — just currently undocumented.
- Whether `weight` needs semantic roles rather than raw numeric names.

## TODO

- [ ] Ratify the typeface: license, Cyrillic coverage, variable axes.
- [ ] Reconcile the two naming inconsistencies above against Figma.
- [ ] Record the Element and Object size→measure profiles here rather than only in the archived master document.
- [ ] Optionally document Primitive-level preferred sizes as a non-normative reference table.

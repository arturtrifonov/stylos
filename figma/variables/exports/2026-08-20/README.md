# 2026-08-20 — Figma Variables snapshot (DTCG per-collection export)

Exported from Figma on **20 August 2026, 21:57 UTC**, found unimported in the owner's `Downloads/` and committed here on 22 August 2026. Filenames are preserved exactly as Figma and the owner produced them, including the parenthetical note on `effect (unresloved).json` — renaming them would hide provenance.

Immutable. A correction is a new, later-dated snapshot directory.

## Format

This snapshot is **not the same format** as [`../2026-02-22.json`](../2026-02-22.json), and the two are not interchangeable.

| | `2026-02-22.json` | this snapshot |
| --- | --- | --- |
| Shape | one file: `{variables, collections, exportedAt, pluginVersion}` | one file per collection, per mode |
| Standard | Figma plugin export, raw | DTCG (`$type`/`$value`) with `$extensions` |
| Aliases | preserved as `VARIABLE_ALIAS` references | resolved to values |
| Modes | all modes in `valuesByMode` | one mode per file, named in `$extensions."com.figma.modeName"` |
| Variable IDs | `id` on every variable | `$extensions."com.figma.variableId"` on every token |

**Both carry Figma variable IDs**, which is what makes either usable as an identity link back to the live file.

For the token pipeline ([`0004`](../../../docs/decisions/0004-frontend-library-foundations.md), Stage 3 of [`PLAN.md`](../../../PLAN.md)) the plugin-style export is the better basis, because it preserves the alias graph and the mode structure that CSS custom-property scoping has to reproduce. This DTCG snapshot resolves aliases away, so it can state what a value *is* but not what it *points at*.

## Contents

| File | Collection | Mode | Tokens |
| --- | --- | --- | ---: |
| `palette.light.json` | core palette | light | 22 hue groups × 13 steps |
| `palette.dark.json` | core palette | dark | 22 hue groups × 13 steps |
| `colors Light Mode.tokens.json` | semantic color | Light Mode | surface, text, background, border, Shadow |
| `colors Dark Mode.tokens.json` | semantic color | Dark Mode | surface, text, background, border, Shadow |
| `font.json` | typography | Mode 1 | 109 |
| `space.scale.json` | spacing primitives | Mode 1 | 33 |
| `space.json` | spacing semantics | Mode 1 | 45 — `size`, `gap`, `padding` |
| `radius.json` | radius | Mode 1 | 7 |
| `border.json` | border | Mode 1 | 2 |
| `effect (unresloved).json` | effects | Mode 1 | `Shadow` — marked unresolved at export time by the owner |

## What this snapshot records that the repository did not

Recorded here as observation, not as a decision. Each needs a decision record before it becomes normative — see [`PLAN.md`](../../../PLAN.md) Stage 1.

- **Typefaces are bound in Figma already.** `family/text` and `family/string` = **Manrope**, `family/heading` = **Geologica**, `family/code` = **JetBrains Mono**. `docs/foundations/typography.md` still treats the primary typeface as undecided and does not mention Geologica at all.
- **A complete spacing scale exists**, base 8, named as a ratio to that base: `s-1_000` = 8, `s-1_500` = 12, `s-0_125` = 1. Steps run 0,1,2,3,4,5,6,7,8,10,12…40, then 44,48,56,64,72,80,88,96.
- **The spacing scale is not Fibonacci.** Master doc §5.2 and §12.1 describe Fibonacci-derived spacing as the project's proportional logic. The implemented scale is a linear 8-base scale with decreasing resolution. One of the two statements is wrong; this is the sharpest open conflict in the system.
- **A naming model for spacing is already in use** — ratio-to-base (`s-1_500`), with semantic prefixes per role (`g-` gap, `p-` padding). Open decision #4 treats the naming model as unstarted.
- **Radius and border scales are settled in Figma:** radius `zero` 0, `extra small` 1, `small` 2, `medium` 4, `large` 6, `extra large` 8, `round` 1000; border width `normal` 1, `thick` 2. `docs/foundations/effects.md` lists both as TODO.
- **Size naming is already canonical** in the radius collection — full words, matching `stylos-naming-cleanup` v0.7 rather than the abbreviations the master document still cites.

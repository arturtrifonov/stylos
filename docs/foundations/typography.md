# Typography

Status: **Confirmed.**

## Confirmed

- Canonical component size values are full words: `extra small`, `small`, `medium`, `large`, `extra large`. `XS`/`S`/`M`/`L`/`XL` are shorthand in conversation only, never canonical Figma variant values ([naming.md](naming.md) §4; `stylos-naming-cleanup` flags the abbreviations as violations).
- Font size and line height must always use the **same measure**. A size bound to one measure with a line height from another is a defect.
- Line height comes from the family matching the content: **string** for single-line content (labels, buttons, tabs, menu items, badges, compact values), **text** for wrapping content (body copy, descriptions, messages).
- Default size→measure profiles exist for two architectural levels — **Element** and **Object**. A documented component-specific mapping overrides its level's default profile.
- Component-wide text sizing targets exactly one **primary text role**, identified via the public text property, semantic layer name, and cross-variant consistency — not every text layer on the component.
- **Element and Object are the only levels that will ever have a shared size/text profile.** Permanent design boundary, not an unfinished feature — see [sizing.md](sizing.md). Widget- and Layout-level components vary too much in size to encode a shared rule; their typography is documented per-component in `docs/components/`. Primitive-level components have preferred sizes but no skill-enforced grid.
- Measure names follow the same ratio-to-base convention as spacing — `1_000` is the base — consistent with [spacing.md](spacing.md).

## Structure

One `font` collection, single-mode, with six groups: `family`, `size`, `line height`, `weight`, `letter spacing`, `paragraph spacing`.

### `family` and `line height` divide differently, on purpose

`line height` has four families — `text`, `string`, `heading`, `code`. `family` has three — and neither `text` nor `string` is among them.

That asymmetry is deliberate, not an oversight. **Line height cares whether content is a string or wrapping text**, because those need different leading at the same size. **Font family does not** — string and text always resolve to the same typeface, so a separate entry for each would only be two names for one value. Family therefore distinguishes only what actually differs: display and code.

| line-height family | resolves to |
| --- | --- |
| `text` | `family/normal` |
| `string` | `family/normal` |
| `heading` | `family/display` |
| `code` | `family/code` |

Do not "fix" this by adding `text` and `string` to `family`.

## Values

**Not transcribed here.** Run `npm run tokens:report`. See [effects.md](effects.md) for why documentation does not carry copied token values.

## Weight

Three named roles: `weight/normal` 400, `weight/semibold` 450, `weight/bold` 700. The name carries the role, the value carries the number — there is no third layer, and none is wanted.

**The typeface is variable, and off-scale weights are allowed.** 450 exists only because the weight axis is continuous; so does 437 if a design genuinely calls for it. This is a deliberate exception to the usual rule that a value off the scale is not a value — the variable axis is the point of choosing a variable font, and refusing to use it would be ceremony.

The exception is specific to weight. It does not extend to size, line height or spacing.

If the family is ever swapped for static instances, this breaks quietly: 450 resolves to whatever is nearest and the distinction between `normal` and `semibold` disappears without an error. Check the weights when changing the family, not after.

## Typeface

Georama for `family/normal` and `family/display`, JetBrains Mono for `family/code`. Both under the SIL Open Font License, which permits embedding and redistribution including in a commercial product.

Georama covers the Google Fonts Latin Plus glyph set: Latin, Western European and Vietnamese. That is the supported range.

## Stale variable names elsewhere

Figma holds the variable names, and they are currently `font/size/[measure]` and `font/line height/[family]/[measure]`.

`stylos-text-sizing` *bound* to that dead path, which is one of the reasons it was removed. `component-integrity-check` showed it in example messages and has been corrected. Nothing in the repository now refers to the old scheme.

## Default size→measure profiles

A component-specific mapping, where one is documented, always overrides its level's default.

### Element

| Size | Measure |
| --- | --- |
| `extra small` | `0_750` |
| `small` | `0_875` |
| `medium` | `1_000` |
| `large` | `1_250` |
| `extra large` | `1_500` |

### Object

| Size | Measure |
| --- | --- |
| `extra small` | `0_875` |
| `small` | `1_125` |
| `medium` | `1_375` |
| `large` | `1_625` |
| `extra large` | `1_875` |

These are authored rules, not exported values, which is why they are written here rather than left to `npm run tokens:report`. This is now the only copy — `stylos-text-sizing` restated them and has been removed.

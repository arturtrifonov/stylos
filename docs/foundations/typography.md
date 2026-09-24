# Typography

Status: Draft
Scope: Type sizes, measures, line heights, weight and the typeface; what the words say is [content/](../content/README.md).

Canonical component size values are full words — that rule is [naming.md](naming.md) FND-NAMING-19, and it is not restated here.

## Size and measure

### FND-TYPOGRAPHY-01 — Font size and line height come from one measure

**MUST.** Where a font size is bound to a measure, the line height comes from that same measure.

Why: a size from one measure with a line height from another is a defect. The size and line height of a measure were authored together as a pair, and mixing two pairs produces leading that belongs to neither.

### FND-TYPOGRAPHY-02 — The line-height family follows the content

**MUST.** Line height comes from the family matching what the text is: **string** for single-line content (labels, buttons, tabs, menu items, badges, compact values), **text** for wrapping content (body copy, descriptions, messages).

Why: the same size needs different leading depending on whether the text wraps. A single line with paragraph leading sits wrong in a control, and a paragraph with string leading is hard to read.

### FND-TYPOGRAPHY-03 — Measure names are ratios to the base

**MUST.** A measure is named as a ratio to the base — `1_000` is the base — the same convention spacing uses.

Why: one convention across the two scales means a name can be read without knowing which collection it came from (FND-SPACING-01).

Serves: PRN-02.

### FND-TYPOGRAPHY-04 — A component's size property sizes one primary text role

**MUST.** A component's size property controls exactly one **primary text role**, not every text layer on the component, and that role is identified by the public text property, the semantic layer name and consistency across variants.

Why: a component's text layers have different roles. Resizing all of them together destroys the internal hierarchy the component was drawn with. The size property is only about the layer that carries the component's meaning.

## Structure

One `font` collection, single-mode, with six groups: `family`, `size`, `line height`, `weight`, `letter spacing`, `paragraph spacing`.

### FND-TYPOGRAPHY-05 — `family` distinguishes only what actually differs

**MUST.** `family` holds the three entries that differ (normal, display and code), and `text` and `string` are not added to it.

Why: `line height` has four families because leading depends on whether content is a string or wrapping text. Font family does not: string and text always resolve to the same typeface, so an entry for each would give one value two names.

| line-height family | resolves to |
| --- | --- |
| `text` | `family/normal` |
| `string` | `family/normal` |
| `heading` | `family/display` |
| `code` | `family/code` |

The asymmetry is deliberate, not an oversight. Do not "fix" it.

## Values

**Not copied here** (RUL-09). Run `npm run tokens:report`.

## Weight

### FND-TYPOGRAPHY-06 — Three weight roles, named for the accent they carry

**MUST.** Weight is taken from `weight/base`, `weight/emphasis` or `weight/strong` — the name carries the role, the value carries the number, and there is no third layer.

Why: the roles were renamed from `normal`/`semibold`/`bold` on 2026-09-06. Those words are the names of typeface weights, and in that vocabulary two of the three meant a different weight from ours: CSS `bold` means 700 and, across the industry, `semibold` means 600, and neither is what `weight/strong` and `weight/emphasis` hold. The role is a level of accent, not a weight name: `base` for running text, `emphasis` for what stands out in it, `strong` for what leads it. `emphasis` and `strong` also carry the order every HTML author already knows from `em` and `strong`. This section once gave the strongest weight the CSS `bold` value; the value in Figma is the decision.

Exception: **off-scale weights are allowed**, because the typeface is variable. `weight/emphasis` falls between the standard weights only because the weight axis is continuous, and a weight such as 437 may exist for the same reason if a design really calls for it. This departs on purpose from the usual rule that a value off the scale is not a value: the variable axis is the reason to choose a variable font, and refusing to use it would be formality with no purpose. The exception covers weight only; it does not extend to size, line height or spacing.

If the family is ever replaced by static instances, this breaks without warning: `weight/emphasis` resolves to the nearest available weight, and the difference between `base` and `emphasis` disappears with no error. Check the weights when changing the family, not after.

## Typeface

### FND-TYPOGRAPHY-07 — Georama for text and display, JetBrains Mono for code

**MUST.** `family/normal` and `family/display` are Georama; `family/code` is JetBrains Mono.

Why: both are under the SIL Open Font License, which permits embedding and redistribution, including in a commercial product. Nothing is decided about distributing Stylos, and the typeface must not be what rules it out, as a face whose licence forbids commercial redistribution would.

Georama covers the Google Fonts Latin Plus glyph set: Latin, Western European and Vietnamese. That is the supported range.

## Text styles

The Figma text styles are the 32 named combinations of values from this collection (`text/*`, `label/*`, `heading/*`, `code/*`). They are recorded in [`figma/text-styles.yaml`](../../figma/text-styles.yaml). `tools/import-styles.mjs` writes that file from a Plugin API read, because Styles have no Variables export. The record stores aliases into `tokens/`, never values (RUL-09). `@stylos/ui/text.css` maps each style to a class (`.stylos-heading-h2`, `.stylos-text-normal-medium`, …), and `npm run ui:generate` rebuilds it.

## Stale variable names elsewhere

Figma holds the variable names, and they are currently `font/size/[measure]` and `font/line height/[family]/[measure]`.

`stylos-text-sizing` *bound* to the older scheme, `Text Size / [measure]`, which no longer exists; that is one of the reasons it was removed. `component-integrity-check` showed the older scheme in example messages and has been corrected. Nothing in the repository now refers to the old scheme.

## Default size→measure profiles

### FND-TYPOGRAPHY-08 — Element and Object have default profiles, and a contract may override

**MUST.** A component takes the default size→measure profile of its architectural level, unless its own contract documents a mapping, and then the contract's mapping always wins.

Why: without a default, every component decides its own type scale, and the library no longer has one. Without the override, the components whose text really sits differently would have to change the default for everyone.

#### Element

| Size | Measure |
| --- | --- |
| `extra small` | `0_750` |
| `small` | `0_875` |
| `medium` | `1_000` |
| `large` | `1_250` |
| `extra large` | `1_500` |

#### Object

| Size | Measure |
| --- | --- |
| `extra small` | `0_875` |
| `small` | `1_125` |
| `medium` | `1_375` |
| `large` | `1_625` |
| `extra large` | `1_875` |

These are authored rules, not exported values, so they are written here and not left to `npm run tokens:report`. This is now the only copy: `stylos-text-sizing` restated them and has been removed.

### FND-TYPOGRAPHY-09 — Only Element and Object will ever share a profile

**MUST.** No architectural level other than Element and Object gains a shared size/text profile.

Why: it is the boundary FND-SIZING-08 draws for sizing, for the same reason. The typography of every other level is documented per component in `docs/components/`.

## Open

- **The display width axis, in two halves.** The heading styles in Figma set Georama's width axis to 110, and `text.css` already says `font-stretch: 110%`. But the committed woff2 subsets under `assets/fonts/` were built without the `wdth` axis, so a browser renders headings at normal width and gives no warning. Two decisions are pending, in this order: first *whether* display keeps the 110 width at all (Artur is reviewing examples, 2026-09-06), and only then a re-subset of Georama with the axis. Nothing is blocked by it: everything else about a heading (size, leading, `weight/strong`, the family itself) renders as the contract says; only the extra width is missing. If 110 is withdrawn, the fix is made in Figma and followed by a new read of the styles, and the `font-stretch` line disappears on the next build.

# Typography

Status: Confirmed
Scope: Type sizes, measures, line heights, weight and the typeface; what the words say is [content/](../content/README.md).

Canonical component size values are full words — that rule is [naming.md](naming.md) FND-NAMING-17, and it is not restated here.

## Size and measure

### FND-TYPOGRAPHY-01 — Font size and line height come from one measure

**MUST.** A size bound to one measure carries the line height of that same measure.

Why: a size from one measure with a line height from another is a defect — the pair was authored together, and mixing two of them produces leading that belongs to neither.

### FND-TYPOGRAPHY-02 — The line-height family follows the content

**MUST.** Line height comes from the family matching what the text is: **string** for single-line content (labels, buttons, tabs, menu items, badges, compact values), **text** for wrapping content (body copy, descriptions, messages).

Why: the same size needs different leading depending on whether the text wraps — a single line with paragraph leading sits wrong in a control, and a paragraph with string leading is hard to read.

### FND-TYPOGRAPHY-03 — Measure names are ratios to the base

**MUST.** A measure is named as a ratio to the base — `1_000` is the base — the same convention spacing uses.

Why: one convention across the two scales means a name can be read without knowing which collection it came from (FND-SPACING-01).

Serves: PRN-02.

### FND-TYPOGRAPHY-04 — Component-wide text sizing targets one primary text role

**MUST.** A component's size property drives exactly one **primary text role**, identified via the public text property, the semantic layer name and cross-variant consistency — not every text layer on the component.

Why: a component's text layers are not one thing. Resizing all of them together destroys the internal hierarchy the component was drawn with, and the layer that carries the component's meaning is the only one the size property is about.

## Structure

One `font` collection, single-mode, with six groups: `family`, `size`, `line height`, `weight`, `letter spacing`, `paragraph spacing`.

### FND-TYPOGRAPHY-05 — `family` distinguishes only what actually differs

**MUST.** `family` carries the three entries that differ — normal, display, code — and `text` and `string` are not added to it.

Why: `line height` has four families because leading cares whether content is a string or wrapping text. Font family does not: string and text always resolve to the same typeface, so an entry for each would be two names for one value.

| line-height family | resolves to |
| --- | --- |
| `text` | `family/normal` |
| `string` | `family/normal` |
| `heading` | `family/display` |
| `code` | `family/code` |

The asymmetry is deliberate, not an oversight. Do not "fix" it.

## Values

**Not transcribed here.** Run `npm run tokens:report`. See [effects.md](effects.md) for why documentation does not carry copied token values, and RUL-09 for the rule.

## Weight

### FND-TYPOGRAPHY-06 — Three weight roles, named for the accent they carry

**MUST.** Weight is taken from `weight/base` 400, `weight/emphasis` 450 or `weight/strong` 600 — the name carries the role, the value carries the number, and there is no third layer.

Why: the roles were renamed from `normal`/`semibold`/`bold` on 2026-09-06, because those words are typeface-weight vocabulary and two of the three lied in it: CSS `bold` means 700 (ours is 600) and the industry's `semibold` means 600 (ours is 450). The role is a level of accent, not a weight name — `base` for running text, `emphasis` for what stands out in it, `strong` for what leads it — and `emphasis`/`strong` carry the ordering every HTML author already knows from `em`/`strong`. This section previously said bold was 700; the record and Figma say 600, and 600 is the decision.

Exception: **off-scale weights are allowed**, because the typeface is variable. 450 exists only because the weight axis is continuous; so does 437 if a design genuinely calls for it. This is a deliberate departure from the usual rule that a value off the scale is not a value — the variable axis is the point of choosing a variable font, and refusing to use it would be ceremony. The exception is specific to weight and does not extend to size, line height or spacing.

If the family is ever swapped for static instances, this breaks quietly: 450 resolves to whatever is nearest and the distinction between `base` and `emphasis` disappears without an error. Check the weights when changing the family, not after.

## Typeface

### FND-TYPOGRAPHY-07 — Georama for text and display, JetBrains Mono for code

**MUST.** `family/normal` and `family/display` are Georama; `family/code` is JetBrains Mono.

Why: both are under the SIL Open Font License, which permits embedding and redistribution including in a commercial product — the charter's distribution intent rules out a face that does not.

Georama covers the Google Fonts Latin Plus glyph set: Latin, Western European and Vietnamese. That is the supported range.

## Text styles

The Figma text styles — the 32 named compositions over this collection (`text/*`, `label/*`, `heading/*`, `code/*`) — are recorded in [`figma/text-styles.yaml`](../../figma/text-styles.yaml), written by `tools/import-styles.mjs` from a Plugin API read, since Styles have no Variables export. The record stores aliases into `tokens/`, never values (RUL-09). `@stylos/ui/text.css` projects each onto a class (`.stylos-heading-h2`, `.stylos-text-normal-medium`, …), rebuilt by `npm run ui:generate`.

## Stale variable names elsewhere

Figma holds the variable names, and they are currently `font/size/[measure]` and `font/line height/[family]/[measure]`.

`stylos-text-sizing` *bound* to that dead path, which is one of the reasons it was removed. `component-integrity-check` showed it in example messages and has been corrected. Nothing in the repository now refers to the old scheme.

## Default size→measure profiles

### FND-TYPOGRAPHY-08 — Element and Object have default profiles, and a contract may override

**MUST.** A component takes the default size→measure profile of its architectural level, unless its own contract documents a mapping — which then always wins.

Why: without a default, every component decides its own type scale and the library stops having one; without the override, the components whose text genuinely sits differently would have to bend the default for everyone.

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

These are authored rules, not exported values, which is why they are written here rather than left to `npm run tokens:report`. This is now the only copy — `stylos-text-sizing` restated them and has been removed.

### FND-TYPOGRAPHY-09 — Only Element and Object will ever share a profile

**MUST.** No architectural level other than Element and Object gains a shared size/text profile.

Why: a permanent design boundary, not an unfinished feature — see [sizing.md](sizing.md). Widget- and Layout-level components vary too much in size to encode a shared rule; their typography is documented per component in `docs/components/`. Primitive-level components have preferred sizes but no skill-enforced grid.

## Open

- **The display width axis, in two halves.** The heading styles in Figma set Georama's width axis to 110, and `text.css` already says `font-stretch: 110%` — but the committed woff2 subsets under `assets/fonts/` were built without the `wdth` axis, so a browser renders headings at normal width and says nothing. Two decisions pending, in order: *whether* display keeps the 110 width at all (Artur is reviewing examples, 2026-09-06), and only then a re-subset of Georama with the axis. Nothing blocks on it: everything else about a heading — size, leading, `weight/strong`, the family itself — renders to contract; only the widening is missing. If 110 is withdrawn, the fix is in Figma and a style re-read, and the `font-stretch` line disappears on the next build.
